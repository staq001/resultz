import { UserService } from "../services/user.service";
import { BadRequest, InternalServerError } from "../utils/error";

import type {
  AppEnv,
  GetUserContext,
  LoginContext,
  SignupContext,
  UpdateContext,
  UpdatePasswordContext,
  VerifyOTPContext,
} from "../types";
import type { Context } from "hono";
import { TokenActivation } from "@/services/tokenActivation.service";
import { EmailService } from "@/services/emails.service";
import { logger } from "@/utils/logger";

export class UserController {
  private userService: UserService;
  private tokenActivate;
  private emailService: EmailService;

  constructor() {
    this.userService = new UserService();
    this.tokenActivate = new TokenActivation();
    this.emailService = new EmailService();
  }

  signup = async (c: SignupContext) => {
    const data = c.req.valid("json");

    try {
      const user = await this.userService.createUser(data);

      try {
        const activationUri = await this.tokenActivate.createActivationUri(
          user.id as string,
        );
        await this.emailService.queueEmail({
          templateId: "account-activation-request",
          recipient: (user as any).email,
          variables: {
            userName: (user as any).name,
            title: "Activate your account",
            activationLinkUrl: activationUri,
          },
        });
      } catch (e) {
        logger.error(`Failed to send activation email: ${e}`);
      }

      return c.json(
        {
          status: 201,
          message: "User successully signed up",
          data: { user },
        },
        201,
      );
    } catch (e: any) {
      return c.json(
        { message: e.message || InternalServerError },
        e.status || 500,
      );
    }
  };

  resendActivation = async (c: Context) => {
    try {
      const body = await c.req.json();
      const email = body?.email;
      if (!email) throw new BadRequest("Email is required");

      const user = await this.userService.getUserByEmail(email as string);

      if (user.isVerified) {
        return c.json(
          { status: 400, message: "Account already verified" },
          400,
        );
      }

      const activationUri = await this.tokenActivate.createActivationUri(
        user.id,
      );

      await this.emailService.queueEmail({
        templateId: "account-activation-request",
        recipient: user.email,
        variables: {
          userName: user.name,
          title: "Activate your account",
          activationLinkUrl: activationUri,
        },
      });

      return c.json({ status: 200, message: "Activation link resent" }, 200);
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  login = async (c: LoginContext) => {
    const data = c.req.valid("json");

    try {
      const { user, token } = await this.userService.login(data);

      return c.json(
        {
          status: 200,
          message: "User logged in successfully!",
          data: { user, token },
        },
        200,
      );
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  getUser = async (c: GetUserContext) => {
    try {
      const user = c.get("user");
      return c.json(
        {
          status: 200,
          message: "User fetched successfully!",
          data: { user },
        },
        200,
      );
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  logout = async (c: Context) => {
    try {
      await this.userService.logout(c.req);

      return c.json(
        {
          status: 200,
          message: "User logged out successfully!",
        },
        200,
      );
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  updateUserName = async (c: UpdateContext) => {
    const { name } = c.req.valid("json");
    const { id } = c.get("user");

    try {
      await this.userService.updateUserName(id, name);

      return c.json(
        { status: 200, message: "User name updated sucessfully" },
        200,
      );
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  updateUserPassword = async (c: UpdatePasswordContext) => {
    const { password } = c.req.valid("json");
    const { id } = c.get("user");

    try {
      await this.userService.updateUserName(id, password);

      return c.json(
        { status: 200, message: "User password updated sucessfully" },
        200,
      );
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  deleteUser = async (c: Context<AppEnv>) => {
    const { id } = c.get("user");
    try {
      await this.userService.deleteUser(id);

      return c.json({ status: 200, message: "User deleted sucessfully" }, 200);
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  uploadAvatar = async (c: Context<AppEnv>) => {
    const body = await c.req.parseBody();
    const file = body.image;

    const { id } = c.get("user");
    try {
      const { newUrl } = await this.userService.uploadAvatar(id, file as File);

      return c.json({
        status: 200,
        message: "Avatar uplaoded successfully!",
        data: {
          avatarUrl: newUrl,
        },
      });
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  createOtp = async (c: Context) => {
    const userId = c.req.param("userId");

    try {
      await this.userService.sendOTP(userId);

      return c.json({
        status: 200,
        message: "OTP successfully sent",
      });
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  verifyOtp = async (c: VerifyOTPContext) => {
    const { otp } = c.req.valid("json");
    const userId = c.req.param("userId");

    try {
      const result = await this.userService.verifyOTP(userId, otp);

      return c.json({
        status: 200,
        message: "OTP verification successful",
        data: {
          result,
        },
      });
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  verifyActivationToken = async (c: Context) => {
    try {
      const token = c.req.query("token");
      const userId = c.req.query("rUsId");

      if (!token) throw new BadRequest("Invalid activation link");

      const result = await this.tokenActivate.verifyToken(
        token,
        userId as string,
      );

      if (!result) throw new BadRequest("Invalid or expired token.");

      return c.redirect(`${Bun.env.APP_URL}/login`);
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };
}
