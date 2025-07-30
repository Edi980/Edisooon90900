import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  twelveDataApiKey: text("twelve_data_api_key"),

  telegramChatId: text("telegram_chat_id"),
  minProbability: integer("min_probability").default(75),
  activeStrategies: jsonb("active_strategies").default(['ICT', 'SMC', 'FUSION']),
  activeSessions: jsonb("active_sessions").default(['LONDON', 'NY']),
  notificationPrefs: jsonb("notification_prefs").default({
    entries: true,
    exits: true,
    alerts: false,
    summaries: false
  }),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const signals = pgTable("signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull(), // BUY or SELL
  entryPrice: decimal("entry_price", { precision: 10, scale: 5 }).notNull(),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }).notNull(),
  takeProfit: decimal("take_profit", { precision: 10, scale: 5 }).notNull(),
  probability: integer("probability").notNull(),
  strategies: jsonb("strategies").notNull(),
  confluences: jsonb("confluences").notNull(),
  timeframe: text("timeframe").notNull(),
  session: text("session").notNull(),
  sentToTelegram: boolean("sent_to_telegram").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const priceData = pgTable("price_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  open: decimal("open", { precision: 10, scale: 5 }).notNull(),
  high: decimal("high", { precision: 10, scale: 5 }).notNull(),
  low: decimal("low", { precision: 10, scale: 5 }).notNull(),
  close: decimal("close", { precision: 10, scale: 5 }).notNull(),
  volume: decimal("volume", { precision: 15, scale: 2 }),
  timestamp: timestamp("timestamp").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSignalSchema = createInsertSchema(signals).omit({
  id: true,
  createdAt: true,
});

export const insertPriceDataSchema = createInsertSchema(priceData).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signals.$inferSelect;

export type InsertPriceData = z.infer<typeof insertPriceDataSchema>;
export type PriceData = typeof priceData.$inferSelect;
