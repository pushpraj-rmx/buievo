import { PrismaClient } from "@prisma/client";

/**
 * The Prisma client instance for interacting with the database.
 *
 * @example
 * ```ts
 * import { prisma } from '@repo/database';
 *
 * async function getUsers() {
 *   const users = await prisma.user.findMany();
 *   return users;
 * }
 * ```
 */
export const prisma = new PrismaClient();

/**
 * Re-exports all types and enums from the Prisma client.
 * This allows for using Prisma types in other parts of the application
 * without directly depending on `@prisma/client`.
 *
 * @example
 * ```ts
 * import type { User, Prisma } from '@repo/database';
 *
 * function createUser(data: Prisma.UserCreateInput): Promise<User> {
 *   return prisma.user.create({ data });
 * }
 * ```
 */
export * from "@prisma/client";
