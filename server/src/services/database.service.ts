import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL?.trim();
}

export function getDatabaseClient(): PrismaClient | null {
  if (!isDatabaseConfigured()) return null;
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (!prisma) return;
  await prisma.$disconnect();
  prisma = null;
}
