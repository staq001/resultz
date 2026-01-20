const argon2 = require("argon2");

const argonConfig = {
  type: argon2.argon2id,
  memoryCost: Number(process.env.ARGON_MEMORY_COST),
  timeCost: Number(process.env.ARGON_TIME_COST),
  parallelism: Number(process.env.ARGON_PARALLELISM),
};

export function hashPassword(password: string):string {
  return argon2.hash(password, argonConfig);
}

export default function verifyPassword(
  hashedPassword: string,
  password: string
):boolean {
  return argon2.verify(hashedPassword, password);
}
