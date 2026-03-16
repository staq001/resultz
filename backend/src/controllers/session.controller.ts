import type { Context } from "hono";
import { SessionService } from "../services/session.service";
import type { AppEnv, SessionContext } from "@/types";

export class SessionController {
  private sessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  createSession = async (c: SessionContext) => {
    const { sessionName } = c.req.valid("json");

    try {
      await this.sessionService.createSession(sessionName);
      return c.json({ message: "Session created successfully" }, 201);
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  setSession = async (c: SessionContext) => {
    const { sessionName } = c.req.valid("json");

    try {
      await this.sessionService.persistSession(sessionName);
      return c.json({ message: "Session set successfully" }, 200);
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  updateSession = async (c: SessionContext) => {
    const { sessionName, newSessionName } = c.req.valid("json");

    try {
      await this.sessionService.updateSession(sessionName, newSessionName);
      return c.json({ message: "Session updated successfully" }, 200);
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  getCurrentSession = async (c: Context<AppEnv>) => {
    try {
      const currentSession = await this.sessionService.getCurrentSession();
      return c.json({ data: currentSession }, 200);
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  getSessions = async (c: Context<AppEnv>) => {
    try {
      const sessions = await this.sessionService.getAllSessions();
      return c.json({ data: sessions }, 200);
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };
}
