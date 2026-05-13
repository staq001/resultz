import { jwtVerify, SignJWT } from "jose";
import type { JWTPayload } from "../types";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function generateAuthToken(payload: JWTPayload): Promise<string> {
  const { email, sessionId, id } = payload;

  const token = await new SignJWT({
    email,
    id,
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

export function createActivationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyHash(data: string, salt: string, originalHash: string) {
  const hash = crypto
    .pbkdf2Sync(data, salt, 100000, 64, "sha256")
    .toString("hex");

  return hash === originalHash;
}

export function grading(examScore: number, testScore: number) {
  const totalScore = examScore + testScore;

  if (totalScore >= 70) return "A";
  if (totalScore >= 60 && totalScore < 70) return "B";
  if (totalScore >= 50 && totalScore < 60) return "C";
  if (totalScore >= 45 && totalScore < 50) return "D";
  if (totalScore >= 40 && totalScore < 45) return "E";
  return "F";
}
