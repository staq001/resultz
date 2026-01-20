import { jwtVerify, SignJWT } from "jose";
import type { JWTPayload } from "../types";




const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function generateAuthToken(payload: JWTPayload): Promise<string> {
  const { email, sessionId, matricNo } = payload;

  const token = await new SignJWT({
    email, matricNo, sessionId
  }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setExpirationTime(process.env.JWT_EXPIRES_AT as string).sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token :string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as JWTPayload;
}