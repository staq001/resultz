import { SessionService } from "../services/session.service";
import type { SessionContext } from "@/types";

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
}
