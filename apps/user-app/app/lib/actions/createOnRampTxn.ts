"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function createOnRampTxn(amount: string, provider: string) {
  const session = await getServerSession(authOptions);
  const token = Math.random().toString();
  const userId = session.user.id;

  if (!userId) {
    return {
      message: "User not logged in",
    };
  }

  await prisma.onRampTransaction.create({
    data: {
      userId: Number(userId),
      amount: Number(amount),
      status: "Processing",
      startTime: new Date(),
      provider,
      token,
    },
  });

  return {
    message: "On Ramp Transaction added",
  };
}
