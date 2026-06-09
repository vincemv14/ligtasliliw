// ============================================================
//  authQueries.js
//  Database queries for login and registration.
// ============================================================

import { db } from './db';
import { sql } from 'drizzle-orm';
import { hashPassword, verifyPassword } from './authUtils';

// ------------------------------------------------------------
//  registerUser
// ------------------------------------------------------------
export async function registerUser({ name, email, password }) {
  const existing = await db.execute(sql`
    SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}
  `);

  if (existing.rows.length > 0) {
    throw new Error('EMAIL_TAKEN');
  }

  const hash = await hashPassword(password);

  const result = await db.execute(sql`
    INSERT INTO users (name, email, password, role)
    VALUES (
      ${name.trim()},
      ${email.toLowerCase().trim()},
      ${hash},
      'member'
    )
    RETURNING id, name, email, role
  `);

  return result.rows[0];
}

// ------------------------------------------------------------
//  loginUser — Updated with Debugging Logs
// ------------------------------------------------------------
export async function loginUser({ email, password }) {
  const result = await db.execute(sql`
    SELECT id, name, email, password, role
    FROM   users
    WHERE  email = ${email.toLowerCase().trim()}
  `);

  if (result.rows.length === 0) {
    throw new Error('USER_NOT_FOUND');
  }

  const user = result.rows[0];
  
  // Debugging logs to see exactly what is being compared
  console.log("--- Login Debug ---");
  console.log("Input Email:", email);
  console.log("Password Length:", password.length);
  console.log("Database Hash retrieved:", user.password);

  const passwordOk = await verifyPassword(password, user.password);
  
  console.log("Password Verification Result (true/false):", passwordOk);
  console.log("-------------------");

  if (!passwordOk) {
    throw new Error('WRONG_PASSWORD');
  }

  const { password: _removed, ...safeUser } = user;
  return safeUser;
}