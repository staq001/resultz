import {
  TransactionalEmailsApi,
  SendSmtpEmail,
  TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";

import { logger } from "../utils/logger";
import type { EmailPayload } from "../types";

export class Email {
  private emailAPI;

  constructor() {
    const apiKey = Bun.env.BREVO_API_KEY as string;

    this.emailAPI = new TransactionalEmailsApi();
    this.emailAPI.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }
  async sendMail(sendEmail: EmailPayload) {
    const { from, toEmail, subject, html } = sendEmail;
    const message = new SendSmtpEmail();

    message.subject = subject;
    message.sender = { name: "Resultz", email: from };
    message.to = [{ email: toEmail }];
    message.htmlContent = html;

    try {
      await this.emailAPI.sendTransacEmail(message);
    } catch (e) {
      if (e && typeof e === "object") {
        const error = e as {
          statusCode?: number;
          body?: unknown;
          message?: string;
        };
        logger.error(
          {
            statusCode: error.statusCode,
            body: error.body,
            message: error.message,
          },
          "Brevo email send failed",
        );
      } else {
        logger.error({ error: e }, "Brevo email send failed");
      }
      throw e;
    }
  }
}
