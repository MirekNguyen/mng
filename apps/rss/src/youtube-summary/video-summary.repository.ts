import { db, eq } from "@mng/database/db";
import { videoSummaries } from "@mng/database/schema/rss.schema";
import { logger } from "@mng/logger/logger";

import type { FeedVideo } from "./feed.generator";
import { generateSummary } from "./video.summarizer";

const replaceVideoUrl = (summary: string, videoUrl: string): string =>
	summary.replace(/VIDEO_URL/g, videoUrl);

export const getOrCreateSummary = async (video: FeedVideo): Promise<string | undefined> => {
	const existing = await db
		.select()
		.from(videoSummaries)
		.where(eq(videoSummaries.videoId, video.videoId))
		.limit(1);

	if (existing.length > 0) {
		logger.info(`Cache hit: ${video.title}`);
		return replaceVideoUrl(existing[0].summary, video.videoUrl);
	}

	logger.info(`Generating summary: ${video.title}`);
	const summary = await generateSummary(video.videoUrl);

	if (!summary) {
		logger.warn(`Skipping: ${video.title} (summary generation failed)`);
		return undefined;
	}

	await db.insert(videoSummaries).values({
		videoId: video.videoId,
		videoUrl: video.videoUrl,
		title: video.title,
		channelName: video.channelName,
		thumbnailUrl: video.thumbnailUrl,
		summary,
	});

	return replaceVideoUrl(summary, video.videoUrl);
};
