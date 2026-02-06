import { db } from "@/db/mysql";
import { users } from "@/db/schema";
import { activationTokens } from "@/db/schema/activationToken";
import { createActivationToken } from "@/utils";
import { throwAppError } from "@/utils/error";
import { and, desc, eq } from "drizzle-orm";

export class TokenActivation {
  async createActivationUri(userId: string) {
    const token = await this.createToken(userId);

    return `${Bun.env.APP_URL}/api/v1/activate/?token=${token}&rUsId=${userId}`;
  }

  async verifyToken(incomingToken: string, rUserId: string) {
    try {
      const [latestToken] = await db
        .select()
        .from(activationTokens)
        .where(eq(activationTokens.userId, rUserId))
        .orderBy(desc(activationTokens.createdAt))
        .limit(1);

      if (latestToken) {
        const now = new Date();
        if (now > latestToken.expiresAt) {
          throw new throwAppError("Token expired.", 422);
        }

        if (latestToken.isUsed) {
          throw new throwAppError("Token Used.", 422);
        }

        const match = this.isMatch(incomingToken, latestToken.token);

        if (match) {
          await this.updateToken(incomingToken, rUserId);
          await this.verifyUser(latestToken.userId);
          await this.deleteToken(latestToken.userId);
          return true;
        }
      }
      return false;
    } catch (e) {
      throw e;
    }
  }

  private async createToken(userId: string) {
    const token = createActivationToken();

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await this.insertWithContext(token, userId, expiresAt);
    return token;
  }

  private isMatch(incomingToken: string, storedToken: string) {
    return incomingToken === storedToken;
  }

  private async deleteToken(userId: string) {
    await db
      .delete(activationTokens)
      .where(eq(activationTokens.userId, userId));
  }
  private async verifyUser(userId: string) {
    try {
      await db
        .update(users)
        .set({
          isVerified: true,
        })
        .where(eq(users.id, userId));
    } catch (e) {
      throw e;
    }
  }

  private async updateToken(token: string, userId: string) {
    try {
      await db
        .update(activationTokens)
        .set({
          isUsed: true,
        })
        .where(
          and(
            eq(activationTokens.userId, userId),
            eq(activationTokens.token, token),
          ),
        );
    } catch (e) {
      throw e;
    }
  }
  private async insertWithContext(
    userId: string,
    token: string,
    expiresAt: Date,
  ) {
    try {
      await db.transaction(async (tx) => {
        tx.insert(activationTokens).values({ userId, token, expiresAt });
      });
    } catch (e) {
      throw e;
    }
  }
}
