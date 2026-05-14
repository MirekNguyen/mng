import { db, eq } from "@mng/database/db";
import { videoSummaries } from "@mng/database/schema/rss.schema";
import { logger } from "@mng/logger/logger";

import type { VideoEntry } from "./channel-feed.parser";
import { generateSummary } from "./video.summarizer";

export const getOrCreateSummary = async (video: VideoEntry): Promise<string | undefined> => {
	const existing = await db
		.select()
		.from(videoSummaries)
		.where(eq(videoSummaries.videoId, video.videoId))
		.limit(1);

	if (existing.length > 0) {
		logger.info(`Cache hit: ${video.title}`);
		return existing[0].summary;
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

	return summary;
};
