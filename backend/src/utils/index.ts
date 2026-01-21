import { jwtVerify, SignJWT } from "jose";
import type { JWTPayload } from "../types";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function generateAuthToken(payload: JWTPayload): Promise<string> {
  const { email, sessionId, matricNo } = payload;

  const token = await new SignJWT({
    email,
    matricNo,
    sessionId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_AT as string)
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as JWTPayload;
}

export function generateOTP() {
  return crypto.randomInt(100000, 1000000);
}

export function createHash(data: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(data, salt, 100000, 64, "sha256")
    .toString("hex");

  return { hash, salt };
}

export function verifyHash(data: string, salt: string, originalHash: string) {
  const hash = crypto
    .pbkdf2Sync(data, salt, 100000, 64, "sha256")
    .toString("hex");

  return hash === originalHash;
}
