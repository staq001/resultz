import path from "path";
import fs from "fs";

import { emails } from "../db/schema/email";
import renderTemplate from "../mails/renderTemplate";
import { addMailToQueue } from "../utils/queue";
import type { EmailQueuePayload, Table, User, Values } from "../types";
import { db } from "../db/mysql";

export class EmailService {
  async getEmailTemplates(): Promise<{}[]> {
    const templatesDir = path.join(__dirname, "../mails/templates");
    const templates = fs.readdirSync(templatesDir);
    const availableTemplate = templates.map((template) => {
      return { templateId: template.split(".")[0] };
    });

    return availableTemplate;
  }

  async queueEmail(payload: EmailQueuePayload) {
    const newMail = await this.insertWithContext(emails, payload);

    const data = {
      title: payload.variables?.title,
      logoUrl: payload.variables?.logoUrl || "https://example.com/logo.png",
      imageUrl:
        payload.variables?.imageUrl ||
        "https://exampleImg.com/reset-password.png",
      userName: payload.variables?.userName || "User",
      activationLinkUrl: payload.variables?.activationLink,
      resetUrl: payload.variables?.resetUrl,
      body: payload.variables?.body,
      companyName: payload.variables?.companyName || "Boilerplate",
      supportUrl:
        payload.variables?.supportUrl || "https://example.com/support",
      socialIcons: payload.variables?.socialIcons || [
        {
          url: "https://facebook.com",
          imgSrc:
            "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/tiktok@2x.png",
          alt: "Facebook",
        },
        {
          url: "https://twitter.com",
          imgSrc:
            "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/twitter@2x.png",
          alt: "Twitter",
        },
        {
          url: "https://instagram.com",
          imgSrc:
            "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/instagram@2x.png",
          alt: "Instagram",
        },
      ],
      companyWebsite:
        payload.variables?.companyWebsite || "https://example.com",
      preferencesUrl:
        payload.variables?.preferencesUrl || "https://example.com/preferences",
      unsubscribeUrl:
        payload.variables?.unsubscribeUrl || "https://example.com/unsubscribe",
    };

    const variables = {
      userName: payload.variables?.userName || "User",
      title: payload.variables?.title,
    };

    const emailContent = {
      from: process.env.SMTP_USER as string,
      toEmail: payload.recipient,
      subject: data.title,
      html: renderTemplate(payload.templateId, variables),
    };

    await addMailToQueue(emailContent);
    return newMail;
  }

  private async insertWithContext(table: Table, values: Values) {
    try {
      const result = await db.insert(table).values(values);
      return { result, values };
    } catch (e) {
      throw e;
    }
  }
}
