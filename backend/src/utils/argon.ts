const argon2 = require("argon2");

const argonConfig = {
  type: argon2.argon2id,
  memoryCost: Number(process.env.ARGON_MEMORY_COST),
  timeCost: Number(process.env.ARGON_TIME_COST),
  parallelism: Number(process.env.ARGON_PARALLELISM),
};

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, argonConfig);
}

export default async function verifyPassword(
  hashedPassword: string,
  password: string,
): Promise<boolean> {
  return await argon2.verify(hashedPassword, password);
}
