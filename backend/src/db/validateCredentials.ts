import { eq, or } from "drizzle-orm";
import { db } from "./mysql";
import { NotFound, Unauthorized } from "@/utils/error";
import { isAccountLocked, recordFailure, recordSuccess } from "@/redis/lockup";
import verifyPassword from "@/utils/argon";
import { users } from "./schema";

export async function validateCredentials(
  inputIdentifier: {
    email?: string;
    matricNo?: string;
  },
  loginType: "user" | "admin" | "staff" = "user",
  inputPassword: string,
) {
  try {
    const normalizedEmail = inputIdentifier.email?.trim();
    const normalizedMatricNo = inputIdentifier.matricNo?.trim();
    const lookupKey = normalizedEmail || normalizedMatricNo;

    if (!lookupKey) {
      throw new NotFound("Wrong email/matric number or password combination");
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        matricNo: users.matricNo,
        department: users.department,
        entryYear: users.entryYear,
        avatar: users.avatar,
        softDeleted: users.softDeleted,
        isVerified: users.isVerified,
        password: users.password,
        isAdmin: users.isAdmin,
        isStaff: users.isStaff,
        isRusticated: users.isRusticated,
        isGraduated: users.isGraduated,
      })
      .from(users)
      .where(
        or(
          normalizedEmail ? eq(users.email, normalizedEmail) : undefined,
          normalizedMatricNo
            ? eq(users.matricNo, normalizedMatricNo)
            : undefined,
        )!,
      );

    if (loginType === "admin" && (!user || !user.isAdmin)) {
      throw new NotFound("Wrong email/matric number or password combination");
    }

    if (loginType === "staff" && (!user || !user.isStaff)) {
      throw new NotFound("Wrong email/matric number or password combination");
    }

    if (!user || user.softDeleted)
      throw new NotFound("Wrong email/matric number or password combination");

    // if (!user || !user.isVerified)
    //   throw new Unauthorized("Please verify your account");

    if (await isAccountLocked(lookupKey))
      throw new Unauthorized("Account locked. Try again in 10 minutes");

    if (user && user.password) {
      const isMatch = await verifyPassword(user.password, inputPassword);
      if (!isMatch) {
        await recordFailure(
          lookupKey,
          parseInt(Bun.env.LOOKUP_MAX_ATTEMPTS as string),
        );
        throw new NotFound("Wrong email/matric number or password combination");
      }
      await recordSuccess(lookupKey);
    }

    const { password, softDeleted, isVerified, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (e) {
    throw e;
  }
}
