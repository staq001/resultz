import { describe, it, expect, vi } from "bun:test";

// Mock filesystem and dependent modules before importing the service module
vi.mock("fs", () => ({
  readdirSync: (dir: string) => ["welcome.hbs", "reset.hbs"],
}));
vi.mock("../../src/mails/renderTemplate", () => ({
  default: (templateId: string, vars: any) => `<html>${templateId}</html>`,
}));
const mockAddMail = vi.fn(async () => {});
vi.mock("../../src/utils/queue", () => ({ addMailToQueue: mockAddMail }));
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

import { EmailService } from "../../src/services/emails.service";

describe("EmailService", () => {
  it("getEmailTemplates returns available templates", async () => {
    const svc = new EmailService();

    const templates = await svc.getEmailTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty("templateId");
  });

  it("queueEmail enqueues and calls addMailToQueue", async () => {
    const svc = new EmailService();
    await svc.queueEmail({
      templateId: "welcome",
      recipient: "a@b.com",
      variables: { title: "Hi" },
    } as any);
    expect(mockAddMail.mock.calls.length).toBeGreaterThan(0);
  });
});
