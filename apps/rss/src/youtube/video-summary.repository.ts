import { db, eq } from "@mng/database/db";
import { videoSummaries } from "@mng/database/schema/rss.schema";
import { logger } from "@mng/logger/logger";

import type { VideoEntry } from "./youtube-feed.repository";
import { generateVideoSummary } from "./video-summary.calculator";

export const getOrCreateSummary = async (
	video: VideoEntry,
): Promise<string> => {
	const existing = await db
		.select()
		.from(videoSummaries)
		.where(eq(videoSummaries.videoId, video.videoId))
		.limit(1);

	if (existing.length > 0) {
		logger.info(`Cache hit for: ${video.title}`);
		return existing[0].summary;
	}

	logger.info(`Generating summary for: ${video.title}`);
	const summary = await generateVideoSummary(video);

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
