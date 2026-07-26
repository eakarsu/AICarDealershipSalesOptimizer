'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const bcrypt = require('bcryptjs');
const pool = require('../config/database');

function demoCredentials() {
  const prefixes = [
    'PROVISION_ADMIN',
    'BOOTSTRAP_ADMIN',
    'SEED_ADMIN',
    'SEED_USER',
    'DEMO',
    'ADMIN',
    'DEFAULT',
  ];
  for (const prefix of prefixes) {
    const email = process.env[`${prefix}_EMAIL`];
    const password = process.env[`${prefix}_PASSWORD`];
    if (email && password) return { email, password };
  }
  throw new Error('A demo email and password must be configured');
}

async function provision() {
  if (process.env.NODE_ENV === 'production') return;
  if (String(process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL || 'true') !== 'true') return;

  const { email, password } = demoCredentials();
  if (password.length < 12) throw new Error('Demo password must contain at least 12 characters');
  const passwordHash = await bcrypt.hash(password, 10);
  const columns = await pool.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users'`,
  );
  const hasLegacyPassword = columns.rows.some((row) => row.column_name === 'password');
  if (hasLegacyPassword) {
    await pool.query(
      `INSERT INTO users (email, password, password_hash, name, role)
       VALUES ($1, $2, $2, 'Runtime Dealership Admin', 'admin')
       ON CONFLICT (email) DO UPDATE
         SET password=EXCLUDED.password,
             password_hash=EXCLUDED.password_hash,
             name=EXCLUDED.name,
             role=EXCLUDED.role,
             updated_at=NOW()`,
      [email, passwordHash],
    );
  } else {
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, 'Runtime Dealership Admin', 'admin')
       ON CONFLICT (email) DO UPDATE
         SET password_hash=EXCLUDED.password_hash,
             name=EXCLUDED.name,
             role=EXCLUDED.role,
             updated_at=NOW()`,
      [email, passwordHash],
    );
  }
  console.log('Provisioned the local demo dealership account.');
}

provision()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(`Demo account provisioning failed: ${error.message}`);
    await pool.end().catch(() => {});
    process.exitCode = 1;
  });
