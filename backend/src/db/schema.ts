/**
 * Drizzle ORM Schema
 * TEC Voting System - Backend
 */

import { pgTable, serial, varchar, boolean, integer, timestamp, text, json } from 'drizzle-orm/pg-core';

export const voters = pgTable('voters', {
  no: serial('no').primaryKey(),
  nim: varchar('nim', { length: 9 }).notNull().unique(),
  vote: boolean('vote').default(false),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  nim: varchar('nim', { length: 9 }).notNull(),
  major: varchar('major', { length: 255 }).notNull(),
  batch: integer('batch').notNull(),
  vision: text('vision'),
  mission: text('mission'),
  photo: varchar('photo', { length: 255 }),
  votes: integer('votes').default(0),
});

export const admin = pgTable('admin', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin').notNull(),
});

export const voting = pgTable('voting', {
  id: integer('id').primaryKey().default(1),
  voting_title: varchar('voting_title', { length: 255 }),
  vot_start_date: timestamp('vot_start_date'),
  vot_end_date: timestamp('vot_end_date'),
  last_reset: timestamp('last_reset'),
  is_live_score_enabled: boolean('is_live_score_enabled').default(false),
});

export const election_history = pgTable('election_history', {
  id: serial('id').primaryKey(),
  election_title: varchar('election_title', { length: 255 }),
  winner_name: varchar('winner_name', { length: 255 }),
  winner_nim: varchar('winner_nim', { length: 9 }),
  winner_major: varchar('winner_major', { length: 255 }),
  winner_batch: integer('winner_batch'),
  winner_votes: integer('winner_votes'),
  winner_photo: varchar('winner_photo', { length: 255 }),
  total_votes: integer('total_votes'),
  total_voters: integer('total_voters'),
  voters_participated: integer('voters_participated'),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  candidates_data: json('candidates_data'),
  saved_at: timestamp('saved_at').defaultNow(),
});

export const device_votes = pgTable('device_votes', {
  id: serial('id').primaryKey(),
  fingerprint: varchar('fingerprint', { length: 64 }).notNull().unique(),
  ip_address: varchar('ip_address', { length: 45 }),
  asn: integer('asn'),
  bot_score: integer('bot_score'),
  tls_cipher: varchar('tls_cipher', { length: 255 }),
  user_agent: text('user_agent'),
  device_data: json('device_data'),
  voted_at: timestamp('voted_at').defaultNow(),
});
