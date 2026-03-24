#!/usr/bin/env node
/**
 * Seed mock admin for tiwater.mx (default admin@tiwater.mx / admin)
 * Run after migrations 018, 019, 020 (same POSTGRES_* as App Service).
 *
 * Usage:
 *   npm run seed:admin
 *   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/seed-admin-user.js
 *   ADMIN_RESET_PASSWORD=1  → if user exists, update password only (no insert)
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { query } from '../src/config/postgres.config.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@tiwater.mx').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const RESET_PASSWORD = process.env.ADMIN_RESET_PASSWORD === '1' || process.env.ADMIN_RESET_PASSWORD === 'true';

async function seedAdminUser() {
  try {
    const host = process.env.POSTGRES_HOST || 'localhost';
    const db = process.env.POSTGRES_DB || '(default)';
    console.log(`→ DB ${host} / ${db} — user ${ADMIN_EMAIL}`);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const roleRes = await query('SELECT id FROM roles WHERE LOWER(name) = $1', ['admin']);
    const clientRes = await query('SELECT id FROM clients ORDER BY id LIMIT 1');

    const roleId = roleRes.rows[0]?.id;
    const clientId = clientRes.rows[0]?.id;

    if (!roleId) {
      console.error('❌ Admin role not found. Run migration 020 first.');
      process.exit(1);
    }
    if (!clientId) {
      console.error('❌ No client found. Run migration 020 first.');
      process.exit(1);
    }

    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [ADMIN_EMAIL]);
    if (existing.rows.length > 0) {
      if (RESET_PASSWORD) {
        await query(
          `UPDATE users SET password = $1, status = 'active', verified = TRUE, updatedat = CURRENT_TIMESTAMP
           WHERE LOWER(email) = $2`,
          [passwordHash, ADMIN_EMAIL],
        );
        console.log(`✅ Password updated for ${ADMIN_EMAIL} (log in with ADMIN_PASSWORD)`);
        process.exit(0);
      }
      console.log(`✅ User already exists: ${ADMIN_EMAIL} — use this exact email at /api/v1.0/auth/login`);
      process.exit(0);
    }

    await query(
      `INSERT INTO users (email, password, role_id, client_id, postgres_client_id, status, verified, nombre, puesto)
       VALUES ($1, $2, $3, $4, $5, 'active', TRUE, 'Admin', 'Administrator')`,
      [ADMIN_EMAIL, passwordHash, roleId, clientId, clientId],
    );

    console.log(`✅ Created ${ADMIN_EMAIL} — password from ADMIN_PASSWORD (default: admin)`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seedAdminUser();
