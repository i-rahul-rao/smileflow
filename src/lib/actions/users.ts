"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "../drizzle";
import { users } from "../schema";
import { eq } from "drizzle-orm";

export async function syncUser() {
  try {
    const user = await currentUser();
    if (!user) return;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (existingUser) return existingUser;

    const [dbUser] = await db
      .insert(users)
      .values({
        clerkId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0].emailAddress,
        phone: user.phoneNumbers[0]?.phoneNumber,
      })
      .returning();

    return dbUser;
  } catch (error) {
    console.log("Error in syncUser server action", error);
  }
}
