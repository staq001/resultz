import {
  TransactionalEmailsApi,
  SendSmtpEmail,
  TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";

import { logger } from "../utils/logger";
import type { EmailPayload } from "../types";

export class Email {
  private emailAPI;
  private message;

  constructor() {
    this.emailAPI = new TransactionalEmailsApi();
    this.emailAPI.setApiKey(
      TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY as string,
    );
    this.message = new SendSmtpEmail();
  }
  async sendMail(sendEmail: EmailPayload) {
    const { from, toEmail, subject, html } = sendEmail;

    this.message.subject = subject;
    this.message.sender = { name: "Resultz", email: from };
    this.message.to = [{ email: toEmail }];
    this.message.htmlContent = html;

    try {
      await this.emailAPI.sendTransacEmail(this.message);
    } catch (e) {
      logger.info(e);
      throw e;
    }
  }
}
