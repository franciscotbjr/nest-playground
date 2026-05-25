import { integer, pgTable, varchar, boolean, uuid } from 'drizzle-orm/pg-core';
import {} from 'drizzle-orm/pg-core';

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({length: 255}).notNull(),
    age: integer().notNull(),
    email: varchar({length: 255}).notNull().unique(),
    emailUnverified: boolean().default(false),
});

export const postTable = pgTable("post", {
    id: uuid().primaryKey().defaultRandom(),
    createdBy: uuid().references(() => usersTable.id),
});

export const postReadTable = pgTable("postRead", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().references(() => usersTable.id),
    postId: uuid().references(() => postTable.id),
});