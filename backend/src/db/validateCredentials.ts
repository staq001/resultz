import { eq, getTableColumns } from "drizzle-orm";
import { db } from "./mysql";
import { NotFound, Unauthorized } from "@/utils/error";
import { isAccountLocked, recordFailure, recordSuccess } from "@/redis/lockup";
import verifyPassword from "@/utils/argon";
import { users } from "./schema";

export async function validateCredentials(
  inputEmail: string,
  inputPassword: string,
) {
  try {
    const { id, name, email, softDeleted, isVerified, password, matricNo } =
      getTableColumns(users);

    const [user] = await db
      .select({ id, name, email, softDeleted, isVerified, password, matricNo })
      .from(users)
      .where(eq(users.email, inputEmail));

    if (!user || user.softDeleted)
      throw new NotFound("Wrong email/password combination");

    // if (!user || !user.isVerified)
    //   throw new Unauthorized("Please verify your account");

    if (await isAccountLocked(inputEmail))
      throw new Unauthorized("Account locked. Try again in 10 minutes");

    if (user && user.password) {
      const isMatch = await verifyPassword(user.password, inputPassword);
      if (!isMatch) {
        await recordFailure(inputEmail, 7); //lock account after 7 failed atmpts.
        throw new NotFound("Wrong email/password combination");
      }
      await recordSuccess(inputEmail);
    }
    return user;
  } catch (e) {
    throw e;
  }
}
