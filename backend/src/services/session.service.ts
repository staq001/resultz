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
import { currentSession } from "@/db/schema/currentSession";

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
      });

      logger.info("Session created...");
    } catch (e: any) {
      logger.error(`Error creating session, ${e}`);
      if (e instanceof Conflict) throw e;
      throw new InternalServerError(`Error creating session`);
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

  async persistSession(sessionName: string) {
    try {
      const [schSession] = await db
        .select()
        .from(session)
        .where(eq(session.schoolSession, sessionName));

      if (!schSession) throw new NotFound("Session not found");

      const [currentSchSession] = await db
        .select()
        .from(currentSession)
        .limit(1);

      if (!currentSchSession) {
        await db.insert(currentSession).values({
          currentSession: schSession.schoolSession,
        });
        return;
      }

      await db
        .update(currentSession)
        .set({ currentSession: schSession.schoolSession })
        .limit(1);
    } catch (e) {
      logger.error(`Error persisting session, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError(`Error persisting session`);
    }
  }

  async getCurrentSession() {
    try {
      const [schSession] = await db.select().from(currentSession);

      return schSession?.currentSession;
    } catch (e) {
      logger.error(`Error fetching current session, ${e}`);
      throw new InternalServerError(`Error fetching current session`);
    }
  }

  async getAllSessions() {
    try {
      const schSessions = await db
        .select()
        .from(session)
        .orderBy(session.schoolSession);

      return schSessions;
    } catch (e) {
      logger.error(`Error fetching sessions, ${e}`);
      throw new InternalServerError(`Error fetching sessions`);
    }
  }
}
