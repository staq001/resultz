import { client } from "./client";

const TTL_SECONDS = 60 * 60;

export async function setSession(sessionId: string, id: string):Promise<void> {
  await client.set(`sessionId:${sessionId}`, id, "EX", TTL_SECONDS);
}


export async function verifySession(sessionId: string):Promise<boolean> {
  return (await client.exists(`session:${sessionId}`));
}

export async function deleteSession(sessionId: string):Promise<void> {
  await client.del(`session:${sessionId}`);
}