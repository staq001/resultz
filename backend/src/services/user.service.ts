import { randomUUID } from "crypto";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import { encodeBase64 } from "hono/utils/encode";

import { createHash, verifyHash } from "../utils/index";
import { db } from "../db/mysql";
import { users, validateCredentials } from "../db/schema/user";
import { logger } from "../utils/logger";
import type {
  loginOptions,
  userOptions,
  UserService as US,
  Table,
  NewUser,
  Values,
  NewOtp,
} from "../types";
import { hashPassword } from "../utils/argon";
import { generateAuthToken, generateOTP, verifyToken } from "../utils";
import { deleteSession, setSession } from "../redis/session";
import {
  Conflict,
  InternalServerError,
  NotFound,
  throwAppError,
  Unauthorized,
} from "../utils/error";
import { otps } from "../db/schema/otp";
import { isAccountLocked, recordFailure, recordSuccess } from "../redis/lockup";

export class UserService implements US {
  async createUser(payload: userOptions) {
    try {
      const { id, matricNo, email } = getTableColumns(users);
      const findExistingMatricNo = await db
        .select({ id, matricNo })
        .from(users)
        .where(eq(users.matricNo, matricNo));

      if (findExistingMatricNo)
        throw new Conflict("A User with this email already exists");

      const findExistingEmail = await db
        .select({ id, email })
        .from(users)
        .where(eq(users.matricNo, matricNo));

      if (findExistingEmail)
        throw new Conflict("A User with this email already exists");

      const { values } = await this.insertWithContext(users, {
        ...payload,
        password: hashPassword(payload.password),
      });

      logger.info("User created...");
      return this.formatNewUserObject(values as NewUser);
    } catch (e: any) {
      if (e instanceof Conflict) throw e;
      logger.error("Error creating user");
      throw new InternalServerError(`Error creating user`);
    }
  }

  async login(payload: loginOptions) {
    try {
      const { email, password } = payload;
      const user = await validateCredentials(email, password);

      const sessionId = randomUUID();
      const token = await generateAuthToken({
        email: user.email,
        matricNo: user.matricNo,
        sessionId,
      });
      await setSession(sessionId, String(user.matricNo));

      logger.info("User successfully logged in...");
      return { user: this.formatNewUserObject(user), token };
    } catch (e: any) {
      if (e instanceof NotFound) throw e;
      if (e instanceof Unauthorized) throw e;
      logger.error("Error logging user in...", e);
      throw new InternalServerError(`Error logging user in.`);
    }
  }

  async logout(req: any) {
    try {
      const auth = req.headers.authorization;
      if (!auth) throw new Unauthorized("Unauthorized");

      const token = auth.replace("Bearer ", "");
      const payload = await verifyToken(token);

      await deleteSession(payload.sessionId);

      logger.info("User successfully logged out...");
    } catch (e: any) {
      logger.error("Error logging user out...");
      throw new InternalServerError(`Error logging user out`);
    }
  }

  async updateUserName(id: string, name: string) {
    try {
      const [result] = await db
        .update(users)
        .set({ name })
        .where(eq(users.id, id));
      if (!result || result.affectedRows === 0)
        throw new NotFound("User not found");

      logger.info("User info updated...");
      return result;
    } catch (e) {
      if (e instanceof NotFound) throw e;

      logger.error(`Error updating fields...`);
      throw new InternalServerError(`Error updating fields`);
    }
  }

  async updatePassword(id: string, password: string) {
    try {
      const [result] = await db
        .update(users)
        .set({ password: hashPassword(password) })
        .where(eq(users.id, id));
      if (!result || result.affectedRows === 0)
        throw new NotFound(`User doesn't exist`);

      logger.info("User password updated...");
      return result;
    } catch (e) {
      if (e instanceof NotFound) throw e;

      logger.error(`Error updating password...`);
      throw new InternalServerError(`Error updating password`);
    }
  }

  async deleteUser(id: string) {
    try {
      const [result] = await db
        .update(users)
        .set({ softDeleted: true })
        .where(eq(users.id, id));
      if (!result) throw new NotFound(`User doesn't exist`);

      logger.info("User successfully deleted");
      return result;
    } catch (e) {
      if (e instanceof NotFound) throw e;
      logger.error(`Error deleting user...`);
      throw new InternalServerError(`Error deleting user`);
    }
  }

  async uploadAvatar(id: string, file: File) {
    try {
      const user = await this.getUserById(id);

      const { secure_url, publicId } = await this.upload(file, user.publicId);

      const [result] = await db
        .update(users)
        .set({ avatar: secure_url, publicId })
        .where(eq(users.id, id));

      if (!result || result.affectedRows === 0) {
        throw new NotFound("User not found!");
      }

      return { newUrl: secure_url };
    } catch (e) {
      if (e instanceof NotFound) throw e;
      logger.error(`Error uploading user image`);
      throw new InternalServerError(`Error uploading user image`);
    }
  }

  private async upload(file: File, oldImage?: string | null) {
    const byteArrayBuffer = await file.arrayBuffer();
    const base64 = encodeBase64(byteArrayBuffer);
    try {
      if (oldImage) {
        await cloudinary.uploader.destroy(oldImage);
      }
      const results = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64}`,
      );

      return { secure_url: results.secure_url, publicId: results.public_id };
    } catch (e) {
      throw e;
    }
  }

  private async createOTP(userId: string) {
    const token = generateOTP();
    const { hash, salt } = createHash(token.toString());

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

      const values = {
        userId,
        otpHash: hash,
        salt,
        expiresAt,
      } as NewOtp;

      await this.insertWithContext(otps, values);
      return token;
    } catch (e) {
      logger.error("Error creating OTP", e);
      throw new Error("Error creating OTP");
    }
  }

  async sendOTP(userId: string) {
    try {
      await this.createOTP(userId);
    } catch (e) {
      throw e;
    }
  }

  async verifyOTP(userId: string, otp: number) {
    try {
      const { otpHash, isUsed, salt, expiresAt } = getTableColumns(otps);

      if (await isAccountLocked(userId)) {
        throw new throwAppError("Tries Exceeeded. Request a new OTP", 429);
      }

      const [latestOtp] = await db
        .select({ otpHash, isUsed, salt, expiresAt })
        .from(otps)
        .where(eq(otps.userId, userId))
        .orderBy(desc(otps.createdAt))
        .limit(1);

      if (latestOtp) {
        const now = new Date();
        if (now > latestOtp.expiresAt) {
          throw new throwAppError("OTP expired", 422);
        }

        if (latestOtp.isUsed) {
          throw new throwAppError("OTP used", 422);
        }

        const hash = latestOtp.otpHash;
        const salt = latestOtp.salt;

        const isMatch = verifyHash(otp.toString(), salt, hash);
        if (!isMatch) {
          await recordFailure(userId, 5, "otp");
          throw new throwAppError("OTP verification failed", 401);
        }
        await db
          .update(otps)
          .set({ isUsed: true })
          .where(eq(otps.userId, userId));

        recordSuccess(userId);
        return true;
      }
      return false;
    } catch (e) {
      logger.error("Error verifying OTP", e);
      throw e;
    }
  }

  private async getUserById(userId: string) {
    const { id, name, matricNo, email, avatar, publicId } =
      getTableColumns(users);

    const [user] = await db
      .select({ id, name, matricNo, email, avatar, publicId })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) throw new NotFound("User not found");
    return user;
  }

  private formatNewUserObject(user: NewUser): Partial<NewUser> {
    const { password, softDeleted, isVerified, ...rest } = user;
    return rest;
  }

  private async insertWithContext(table: Table, values: Values) {
    try {
      const [result] = await db.insert(table).values(values);

      if (!result || result.affectedRows !== 1)
        throw new InternalServerError("Insert failed: no rows were inserted");

      return { values };
    } catch (err) {
      throw err;
    }
  }
}
