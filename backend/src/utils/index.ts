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

export const gradePoints: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

export function classOfDegree(cgpa: number) {
  if (cgpa >= 4.5) return "FIRST CLASS";
  if (cgpa >= 3.5) return "SECOND CLASS HONOURS (UPPER DIVISION)";
  if (cgpa >= 2.4) return "SECOND CLASS HONOURS (LOWER DIVISION)";
  if (cgpa >= 1.5) return "THIRD CLASS";
  return "PASS";
}
export function getSemesterLabel(term: string) {
  if (term === "Harmattan") return "First Semester";
  if (term === "Rain") return "Second Semester";
  return term;
}

export function getSessionStartYear(sessionName: string) {
  const match = sessionName.match(/\d{4}/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

export function getSemesterOrder(term: string) {
  if (term === "Harmattan") return 1;
  if (term === "Rain") return 2;
  return 99;
}
