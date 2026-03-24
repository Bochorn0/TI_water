import UserModel from '../models/postgres/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { body, validationResult } from 'express-validator';

const SECRET_KEY = config.SECRET_KEY;

function toUserResponse(user) {
  if (!user) return null;
  const u = typeof user.role_id !== 'undefined' ? user : UserModel.parseRow(user);
  const { password, ...rest } = u;
  return {
    ...rest,
    role: {
      _id: u.role_id,
      name: u.roleName,
      permissions: u.permissions || [],
      dashboardVersion: u.dashboardVersion || 'v1',
    },
    cliente: u.client_id ? { _id: u.client_id, name: '' } : null,
    postgresClientId: u.postgresClientId || null,
  };
}

async function getClienteRoleId() {
  const { query } = await import('../config/postgres.config.js');
  const r = await query('SELECT id FROM roles WHERE LOWER(name) = $1 LIMIT 1', ['cliente']);
  return r.rows?.[0]?.id ?? null;
}

async function getDefaultClientId() {
  const { query } = await import('../config/postgres.config.js');
  const r = await query('SELECT id FROM clients ORDER BY id LIMIT 1');
  return r.rows?.[0]?.id ?? null;
}

export const registerUser = [
  body('email').isEmail().withMessage('Email must be a valid email address'),
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
  body('nombre').optional().isString(),
  body('puesto').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, nombre, puesto } = req.body;

    try {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) return res.status(400).json({ message: 'Usuario ya registrado' });

      const hash = await bcrypt.hash(password, 10);
      const clienteRoleId = await getClienteRoleId();
      const defaultClientId = await getDefaultClientId();
      if (!clienteRoleId || !defaultClientId) {
        return res.status(500).json({ message: 'Configuracion de roles/clientes incompleta' });
      }

      await UserModel.create({
        email,
        password: hash,
        role_id: clienteRoleId,
        client_id: defaultClientId,
        postgres_client_id: defaultClientId,
        nombre: nombre || '',
        puesto: puesto || 'Consultor',
      });

      res.status(201).json({ message: 'Usuario registrado, pendiente de activacion' });
    } catch (error) {
      console.error('Registration Error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  },
];

export const loginUser = [
  body('email').isEmail().withMessage('Correo electronico debe ser una direccion valida'),
  body('password').isLength({ min: 5 }).withMessage('La contrasena debe tener al menos 5 caracteres'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await UserModel.findByEmail(email);
      if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });
      if (user.status === 'pending') return res.status(400).json({ message: 'Usuario pendiente de activacion' });

      const isMatch = await bcrypt.compare(password.trim(), user.password);
      if (!isMatch) return res.status(401).json({ message: 'Credenciales invalidas' });

      const token = jwt.sign({ id: user.id, role: user.role_id }, SECRET_KEY, { expiresIn: '8h' });
      res.json({ token, user: toUserResponse({ ...user, role_id: user.role_id }) });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  },
];

/**
 * Update current user profile (JWT). No /usuarios permission required.
 * Body: nombre?, puesto?, avatar?, password? (requires currentPassword)
 */
export async function updateMyProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    const { nombre, puesto, avatar, password, currentPassword } = req.body || {};

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const data = {};

    if (nombre !== undefined) data.nombre = String(nombre);
    if (puesto !== undefined) data.puesto = String(puesto);

    if (avatar !== undefined && avatar !== null) {
      if (typeof avatar === 'string' && avatar.startsWith('data:image/')) {
        const base64Data = avatar.split(',')[1];
        const bufferLength = Buffer.byteLength(base64Data, 'base64');
        if (bufferLength > 2048 * 1024) {
          return res.status(400).json({ message: 'La imagen de perfil es demasiado grande' });
        }
      }
      data.avatar = avatar;
    }

    if (password !== undefined && password !== null && String(password).trim() !== '') {
      if (!currentPassword || String(currentPassword).trim() === '') {
        return res.status(400).json({ message: 'Indica la contraseña actual para cambiarla' });
      }
      const ok = await bcrypt.compare(String(currentPassword).trim(), user.password);
      if (!ok) return res.status(401).json({ message: 'Contraseña actual incorrecta' });
      data.password = await bcrypt.hash(String(password).trim(), 10);
    }

    if (Object.keys(data).length === 0) {
      return res.json({ user: toUserResponse({ ...user, role_id: user.role_id }) });
    }

    const updated = await UserModel.update(userId, data);
    if (!updated) return res.status(500).json({ message: 'Error al actualizar' });

    const fresh = await UserModel.findById(userId);
    res.json({ user: toUserResponse({ ...fresh, role_id: fresh.role_id }) });
  } catch (error) {
    console.error('updateMyProfile Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}
