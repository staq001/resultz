import { eq, getTableColumns, or } from "drizzle-orm";
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
  inputPassword: string,
) {
  try {
    const { id, name, email, softDeleted, isVerified, password, matricNo } =
      getTableColumns(users);

    const normalizedEmail = inputIdentifier.email?.trim();
    const normalizedMatricNo = inputIdentifier.matricNo?.trim();
    const lookupKey = normalizedEmail || normalizedMatricNo;

    if (!lookupKey) {
      throw new NotFound("Wrong email/matric number or password combination");
    }

    const [user] = await db
      .select({ id, name, email, softDeleted, isVerified, password, matricNo })
      .from(users)
      .where(
        or(
          normalizedEmail ? eq(users.email, normalizedEmail) : undefined,
          normalizedMatricNo ? eq(users.matricNo, normalizedMatricNo) : undefined,
        )!,
      );

    if (!user || user.softDeleted)
      throw new NotFound("Wrong email/matric number or password combination");

    // if (!user || !user.isVerified)
    //   throw new Unauthorized("Please verify your account");

    if (await isAccountLocked(lookupKey))
      throw new Unauthorized("Account locked. Try again in 10 minutes");

    if (user && user.password) {
      const isMatch = await verifyPassword(user.password, inputPassword);
      if (!isMatch) {
        await recordFailure(lookupKey, 7); // lock account after 7 failed attempts.
        throw new NotFound("Wrong email/matric number or password combination");
      }
      await recordSuccess(lookupKey);
    }
    return user;
  } catch (e) {
    throw e;
  }
}
