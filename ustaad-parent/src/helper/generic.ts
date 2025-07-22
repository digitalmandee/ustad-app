import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;


export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) {
    throw new Error('Password must not be empty');
  }

  return bcrypt.hash(plainText, SALT_ROUNDS);
}


export async function comparePassword(plainText: string, hashedPassword: string): Promise<boolean> {
  if (!plainText || !hashedPassword) {
    throw new Error('Both plain text and hashed password must be provided');
  }

  return bcrypt.compare(plainText, hashedPassword);
}


export  function generateOtp(length: number = 4): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  }