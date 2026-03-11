import { eq } from "drizzle-orm";

import { db } from "../db/mysql";
import { session } from "../db/schema/session";
import { logger } from "../utils/logger";
import {
  BadRequest,
  Conflict,
  InternalServerError,
  NotFound,
} from "../utils/error";

export class SessionService {
  async createSession(sessionName: string) {
    try {
      const [schSession] = await db
        .select()
        .from(session)
        .where(eq(session.schoolSession, sessionName));

      if (schSession?.schoolSession === sessionName)
        throw new Conflict("A session with this name already exists");

      await db.insert(session).values({
        schoolSession: sessionName,
        currentSession: sessionName,
      });

      logger.info("Session created...");
    } catch (e: any) {
      logger.error(`Error creating session, ${e}`);
      if (e instanceof Conflict) throw e;
      throw new InternalServerError(`Error creating user`);
    }
  }

  async persistSession(sessionName: string) {
    try {
      const [schSession] = await db
        .select()
        .from(session)
        .where(eq(session.schoolSession, sessionName));

      if (!schSession) throw new NotFound("Session not found");

      await db
        .update(session)
        .set({ currentSession: schSession.schoolSession })
        .where(eq(session.schoolSession, sessionName));
    } catch (e) {
      logger.error(`Error persisting session, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError(`Error persisting session`);
    }
  }

  async updateSession(sessionName: string, newSessionName?: string) {
    try {
      if (sessionName === newSessionName) return;
      if (!newSessionName) throw new BadRequest("New session name is required");

      const [schSession] = await db
        .select()
        .from(session)
        .where(eq(session.schoolSession, sessionName));

      if (!schSession) throw new NotFound("Session not found");

      await db
        .update(session)
        .set({ schoolSession: newSessionName })
        .where(eq(session.schoolSession, sessionName));
    } catch (e) {
      logger.error(`Error persisting session, ${e}`);
      if (e instanceof NotFound) throw e;
      if (e instanceof BadRequest) throw e;
      throw new InternalServerError(`Error persisting session`);
    }
  }
}
