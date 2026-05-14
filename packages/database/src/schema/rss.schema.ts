import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const videoSummaries = pgTable("video_summaries", {
	id: serial("id").primaryKey(),
	videoId: varchar("video_id", { length: 50 }).notNull().unique(),
	videoUrl: varchar("video_url", { length: 500 }).notNull(),
	title: varchar("title", { length: 500 }).notNull(),
	channelName: varchar("channel_name", { length: 255 }).notNull(),
	thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
	summary: text("summary").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const selectVideoSummarySchema = createSelectSchema(videoSummaries);
export type VideoSummary = z.infer<typeof selectVideoSummarySchema>;

export const rssSchema = {
	videoSummaries,
};
