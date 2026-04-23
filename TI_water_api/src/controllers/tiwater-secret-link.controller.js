import crypto from 'crypto';
import RoleModel from '../models/postgres/role.model.js';
import TiwaterSecretLinkModel from '../models/postgres/tiwater-secret-link.model.js';
import { encryptSecretPayload, decryptSecretPayload } from '../utils/secret-link-crypto.js';

const MAX_CONTENT_LEN = 256 * 1024; // 256 KiB
const MIN_PASSWORD_LEN = 8;
const SLUG_LEN = 12;

function randomSlug() {
  return crypto.randomBytes(SLUG_LEN).toString('base64url').slice(0, SLUG_LEN);
}

async function isSecretLinkManager(user) {
  if (!user?.role) return false;
  const role = await RoleModel.findById(user.role);
  if (!role) return false;
  const name = String(role.name || '').toLowerCase();
  if (name === 'admin') return true;
  const perms = Array.isArray(role.permissions) ? role.permissions.map((p) => String(p).toLowerCase()) : [];
  if (perms.includes('/tiwater-catalog') || perms.includes('/tiwater-quotes') || perms.includes('/usuarios')) {
    return true;
  }
  return false;
}

function parseExpiresAt(body) {
  if (body == null || body === '') return { value: null };
  const d = new Date(String(body));
  if (Number.isNaN(d.getTime())) return { error: 'Fecha de expiración no válida' };
  return { value: d.toISOString() };
}

/**
 * POST /api/v1.0/tiwater/secret-links
 */
export const createSecretLink = async (req, res) => {
  try {
    const { content, title, password, expiresAt: expiresAtRaw } = req.body || {};
    const text = typeof content === 'string' ? content : '';
    if (text.length < 1) {
      return res.status(400).json({ message: 'El contenido es requerido' });
    }
    if (text.length > MAX_CONTENT_LEN) {
      return res.status(400).json({ message: `El contenido no puede exceder ${MAX_CONTENT_LEN} caracteres` });
    }
    const pw = typeof password === 'string' ? password : '';
    if (pw.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({ message: `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres` });
    }
    const ex = parseExpiresAt(expiresAtRaw);
    if (ex.error) return res.status(400).json({ message: ex.error });
    const expiresAt = ex.value;

    let slug = randomSlug();
    for (let attempt = 0; attempt < 5; attempt++) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await TiwaterSecretLinkModel.findBySlug(slug);
      if (!existing) break;
      slug = randomSlug();
    }

    const enc = await encryptSecretPayload(text, pw);
    const created = await TiwaterSecretLinkModel.create({
      slug,
      title: typeof title === 'string' ? title.slice(0, 500) : null,
      passwordHash: enc.passwordHash,
      kdfSalt: enc.kdfSalt,
      iv: enc.iv,
      ciphertext: enc.ciphertext,
      authTag: enc.authTag,
      createdBy: req.user?.id != null ? Number(req.user.id) : null,
      expiresAt: expiresAt || null,
    });

    if (!created) {
      return res.status(500).json({ message: 'No se pudo crear el enlace' });
    }

    return res.status(201).json({
      id: created.id,
      slug: created.slug,
      title: created.title,
      path: `/e/${created.slug}`,
    });
  } catch (error) {
    console.error('createSecretLink', error);
    return res.status(500).json({ message: 'Error al crear enlace' });
  }
};

/**
 * GET /api/v1.0/tiwater/secret-links
 */
export const listSecretLinks = async (req, res) => {
  try {
    const isManager = await isSecretLinkManager(req.user);
    const { rows } = await TiwaterSecretLinkModel.listForUser({
      userId: req.user?.id,
      isManager,
    });
    return res.json({ items: rows });
  } catch (error) {
    console.error('listSecretLinks', error);
    return res.status(500).json({ message: 'Error al listar enlaces' });
  }
};

/**
 * DELETE /api/v1.0/tiwater/secret-links/:id
 */
export const deleteSecretLink = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const row = await TiwaterSecretLinkModel.findById(id);
    if (!row) return res.status(404).json({ message: 'Enlace no encontrado' });
    const isManager = await isSecretLinkManager(req.user);
    if (!isManager && row.createdBy !== req.user?.id) {
      return res.status(403).json({ message: 'No tiene permiso para eliminar este enlace' });
    }
    await TiwaterSecretLinkModel.deleteById(id);
    return res.status(204).send();
  } catch (error) {
    console.error('deleteSecretLink', error);
    return res.status(500).json({ message: 'Error al eliminar' });
  }
};

function isExpired(row) {
  if (!row?.expiresAt) return false;
  return new Date(row.expiresAt).getTime() < Date.now();
}

/**
 * GET /api/v1.0/tiwater/secret-links/public/:slug
 */
export const getPublicMeta = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug || String(slug).length > 80) {
      return res.status(400).json({ message: 'Enlace no válido' });
    }
    const row = await TiwaterSecretLinkModel.findBySlug(String(slug));
    if (!row) {
      return res.status(404).json({ message: 'Enlace no encontrado' });
    }
    if (isExpired(row)) {
      return res.status(410).json({ message: 'Este enlace ha expirado' });
    }
    return res.json({
      title: row.title,
      expiresAt: row.expiresAt,
    });
  } catch (error) {
    console.error('getPublicMeta', error);
    return res.status(500).json({ message: 'Error' });
  }
};

/**
 * POST /api/v1.0/tiwater/secret-links/public/:slug/unlock
 */
export const unlockSecretLink = async (req, res) => {
  try {
    const { slug } = req.params;
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!slug || String(slug).length > 80) {
      return res.status(400).json({ message: 'Enlace no válido' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Contraseña requerida' });
    }
    const row = await TiwaterSecretLinkModel.findBySlug(String(slug));
    if (!row) {
      return res.status(404).json({ message: 'Enlace no encontrado' });
    }
    if (isExpired(row)) {
      return res.status(410).json({ message: 'Este enlace ha expirado' });
    }
    const plain = await decryptSecretPayload(password, row);
    return res.json({ content: plain });
  } catch (error) {
    if (error?.code === 'INVALID_PASSWORD' || error?.message === 'INVALID_PASSWORD') {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    if (error?.name === 'TypeError' || error?.code === 'ERR_OSSL_BAD_DECRYPT' || error?.message?.includes('auth')) {
      return res.status(401).json({ message: 'No se pudo abrir el contenido. Verifique la contraseña.' });
    }
    console.error('unlockSecretLink', error);
    return res.status(500).json({ message: 'Error al desbloquear' });
  }
};
