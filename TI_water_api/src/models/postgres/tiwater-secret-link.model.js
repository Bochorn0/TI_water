import { query } from '../../config/postgres-tiwater.config.js';

function parseRow(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    slug: r.slug,
    title: r.title,
    createdBy: r.created_by != null ? Number(r.created_by) : null,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    // crypto + bcrypt (for unlock)
    password_hash: r.password_hash,
    kdf_salt: r.kdf_salt,
    iv: r.iv,
    ciphertext: r.ciphertext,
    auth_tag: r.auth_tag,
  };
}

class TiwaterSecretLinkModel {
  static async create({ slug, title, passwordHash, kdfSalt, iv, ciphertext, authTag, createdBy, expiresAt }) {
    const res = await query(
      `INSERT INTO tiwater_secret_links (
        slug, title, password_hash, kdf_salt, iv, ciphertext, auth_tag, created_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [slug, title || null, passwordHash, kdfSalt, iv, ciphertext, authTag, createdBy ?? null, expiresAt ?? null],
    );
    return parseRow(res.rows[0]);
  }

  static async findBySlug(slug) {
    const res = await query('SELECT * FROM tiwater_secret_links WHERE slug = $1 LIMIT 1', [slug]);
    return res.rows[0] ? parseRow(res.rows[0]) : null;
  }

  static async findById(id) {
    const res = await query('SELECT * FROM tiwater_secret_links WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0] ? parseRow(res.rows[0]) : null;
  }

  static async listForUser({ userId, isManager, limit = 200, offset = 0 }) {
    const lim = Math.min(Number(limit) || 200, 500);
    const off = Math.max(Number(offset) || 0, 0);
    const res = isManager
      ? await query(
          `SELECT id, slug, title, created_by, created_at, expires_at
           FROM tiwater_secret_links
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
          [lim, off],
        )
      : await query(
          `SELECT id, slug, title, created_by, created_at, expires_at
           FROM tiwater_secret_links
           WHERE created_by = $3
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
          [lim, off, userId],
        );
    return { rows: res.rows.map((r) => publicRow(r)) };
  }

  static async countForUser({ userId, isManager }) {
    const res = isManager
      ? await query('SELECT COUNT(*)::int AS c FROM tiwater_secret_links', [])
      : await query('SELECT COUNT(*)::int AS c FROM tiwater_secret_links WHERE created_by = $1', [userId]);
    return res.rows[0]?.c ?? 0;
  }

  static async deleteById(id) {
    const res = await query('DELETE FROM tiwater_secret_links WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  }
}

function publicRow(r) {
  return {
    id: Number(r.id),
    slug: r.slug,
    title: r.title,
    createdBy: r.created_by != null ? Number(r.created_by) : null,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  };
}

export default TiwaterSecretLinkModel;
