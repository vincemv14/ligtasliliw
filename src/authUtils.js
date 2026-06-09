import bcrypt from 'bcryptjs';

export async function hashPassword(password) {
  // Use a fixed salt round of 10
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  // bcrypt.compare automatically handles the salt extraction from the hash
  return await bcrypt.compare(password, hash);
}