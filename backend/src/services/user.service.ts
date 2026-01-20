import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

import { db } from "../db/mysql";
import { users, validateCredentials } from "../db/schema/user";
import { logger } from "../utils/logger";
import type { loginOptions, userOptions, UserService as US } from "../types"
import { hashPassword } from "../utils/argon";
import { generateAuthToken, verifyToken } from "../utils";
import { deleteSession, setSession } from "../redis/session";
import {
  Conflict,
  InternalServerError,
  NotFound,
  Unauthorized,
} from "../utils/error";

export class UserService implements US {
  async createUser(payload: userOptions) {
    const { name, email, matricNo, password, } =
      payload;

    try {
      const findExistingMatricNo = await db.select().from(users).where(eq(users.matricNo, matricNo));
      
      if (findExistingMatricNo)
        throw new Conflict("A User with this email already exists")

      const findExistingEmail = await db.select().from(users).where(eq(users.matricNo, matricNo));

      if (findExistingEmail)
        throw new Conflict("A User with this email already exists");

      const user = await db.insert(users).values({
        name, 
        matricNo,
        password: hashPassword(password),
        email
      });

      logger.info("User created...");
      return user;
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
      const token = await generateAuthToken({email:user.email, matricNo: user.matricNo, sessionId});
      await setSession(sessionId, String(user.matricNo));

      logger.info("User successfully logged in...");
      return { user, token };
    } catch (e: any) {
      if (e instanceof NotFound) throw e;
      if (e instanceof Unauthorized) throw e;
      logger.error("Error logging user in...", e);
      throw new InternalServerError(`Error logging user in.`);
    }
  }

  async logout(req:any) {
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

  async updateUserInfo(id: ObjectId, payload: userUpdateFields) {
    try {
      const user = await this.userRepository.findOneAndUpdate(
        { _id: id },
        payload,
        {
          new: true,
          runValidators: true,
        }
      );
      if (!user) throw new NotFound(`User doesn't exist`);

      logger.info("User info updated...");
      return user;
    } catch (e) {
      if (e instanceof NotFound) throw e;

      logger.error(`Error updating fields...`);
      throw new InternalServerError(`Error updating fields`);
    }
  }

  async updatePassword(id: ObjectId, password: string) {
    try {
      const user = await this.userRepository.findOneAndUpdate(
        { _id: id },
        { password },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!user) throw new NotFound(`User doesn't exist`);

      logger.info("User password updated...");
      return user;
    } catch (e) {
      if (e instanceof NotFound) throw e;

      logger.error(`Error updating password...`);
      throw new InternalServerError(`Error updating password`);
    }
  }

  async deleteUser(id: ObjectId) {
    try {
      const user = await this.userRepository.findByIdAndUpdate(
        { _id: id },
        { softDeleted: true },
        { runValidators: true, new: true }
      );
      if (!user) throw new NotFound(`User doesn't exist`);
      user.tokens = [];
      user.save();

      logger.info("User successfully deleted");
      return user;
    } catch (e) {
      if (e instanceof NotFound) throw e;
      logger.error(`Error deleting user...`);
      throw new InternalServerError(`Error deleting user`);
    }
  }

  async uploadAvatar(id: ObjectId, file: Express.Multer.File) {
    try {
      const user = await this.getSpecificUser(id);

      let publicId;

      if (user.avatar) {
        const oldImage = user.avatar;
        publicId = oldImage.split("/").pop()?.split(".")[0] as string;
      }

      const newUrl = await this.upload(file, publicId);

      await user.updateOne(
        {
          avatar: newUrl,
        },
        { new: true, runValidators: true }
      );
      return { user, newUrl };
    } catch (e) {
      if (e instanceof NotFound) throw e;
      logger.error(`Error uploading user image`);
      throw new InternalServerError(`Error uploading user image`);
    }
  }

  private async upload(file: Express.Multer.File, oldImage?: string | null) {
    try {
      const { cloudinary } = uploadMiddleware();

      if (oldImage) {
        await cloudinary.uploader.destroy(oldImage);
      }
      const { path } = file;
      const result = await cloudinary.uploader.upload(path);

      return result.secure_url;
    } catch (e) {
      throw e;
    }
  }

  async getSpecificUser(id: ObjectId) {
    try {
      const user = await this.userRepository.findOne({ _id: id });
      if (!user) throw new NotFound("User does not exist");
      return user;
    } catch (e) {
      throw e;
    }
  }
  async createOTP() {
    return "";
  }

  async verifyOTP() {
    return true;
  }

  private async getUserByEmail(email:string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) throw new NotFound("User not found");
    return user;
  }

  private async getUserById(id:string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));

    if (!user) throw new NotFound("User not found");
    return user;
  }
}
