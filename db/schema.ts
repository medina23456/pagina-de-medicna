import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const content = sqliteTable('content', {id:text('id').primaryKey(),value:text('value').notNull(),revision:integer('revision').notNull().default(1)});
export const admins = sqliteTable('admins', {username:text('username').primaryKey(),hash:text('hash').notNull(),salt:text('salt').notNull(),version:integer('version').notNull().default(1),mustChange:integer('must_change').notNull().default(1)});
export const sessions = sqliteTable('sessions', {token:text('token').primaryKey(),username:text('username').notNull(),version:integer('version').notNull(),expires:integer('expires').notNull()});
export const attempts = sqliteTable('login_attempts', {key:text('key').primaryKey(),count:integer('count').notNull(),reset:integer('reset').notNull()});
