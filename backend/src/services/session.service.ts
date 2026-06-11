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
import { users } from "@/db/schema/user";

const normalizeCurrentSessionName = (sessionName?: string | null) => {
  const normalized = sessionName?.trim() ?? "";
  return normalized && normalized !== "false" ? normalized : null;
};

export class SessionService {
  async createSession(sessionName: string) {
    try {
      const [schSession] = await db
        .select({ id: session.id, schoolSession: session.schoolSession })
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

      const [currentSchSession] = await db
        .select()
        .from(currentSession)
        .limit(1);

      if (currentSchSession?.currentSession === sessionName) {
        await db
          .update(currentSession)
          .set({ currentSession: newSessionName })
          .limit(1);
      }
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

      if (currentSchSession.currentSession === sessionName)
        throw new BadRequest("Invalid Operation. This is the current semester");

      await db
        .update(currentSession)
        .set({ currentSession: schSession.schoolSession })
        .limit(1);
    } catch (e) {
      logger.error(`Error persisting session, ${e}`);
      if (e instanceof NotFound) throw e;
      if (e instanceof BadRequest) throw e;
      throw new InternalServerError(`Error persisting session`);
    }
  }

  async lockRegistration(sessionName: string, userId: string) {
    try {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) throw new NotFound("User not found");

      const [schSession] = await db
        .select({ id: session.id, schoolSession: session.schoolSession })
        .from(session)
        .where(eq(session.schoolSession, sessionName));

      if (!schSession) throw new NotFound("Session not found");

      await db
        .update(session)
        .set({
          registration_status: "Locked",
          lockedBy: userId,
          lockedAt: new Date(),
        })
        .where(eq(session.schoolSession, sessionName));
    } catch (e) {
      logger.error(`Error locking registration, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError(`Error locking registration`);
    }
  }

  async unlockRegistration(sessionName: string) {
    try {
      const [schSession] = await db
        .select({ id: session.id, schoolSession: session.schoolSession })
        .from(session)
        .where(eq(session.schoolSession, sessionName));

      if (!schSession) throw new NotFound("Session not found");

      await db
        .update(session)
        .set({
          registration_status: "Open",
        })
        .where(eq(session.schoolSession, sessionName));
    } catch (e) {
      logger.error(`Error locking registration, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError(`Error locking registration`);
    }
  }

  async getCurrentSession() {
    try {
      const [activeSession] = await db.select().from(currentSession);
      const activeSessionName = normalizeCurrentSessionName(
        activeSession?.currentSession,
      );

      if (!activeSessionName) return null;

      const [schSession] = await db
        .select({
          id: session.id,
          schoolSession: session.schoolSession,
        })
        .from(session)
        .where(eq(session.schoolSession, activeSessionName));

      if (!schSession) throw new NotFound("Current session was not found");
      return schSession;
    } catch (e) {
      logger.error(`Error fetching current session, ${e}`);
      if (e instanceof NotFound) throw e;
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
