import { Feed } from "feed";
import { logger } from "@mng/logger/logger";

import type { VideoEntry } from "./channel-feed.parser";
import { getOrCreateSummary } from "./video-summary.repository";

export const generateFeed = async (
	channelName: string,
	videos: VideoEntry[],
): Promise<string> => {
	const feed = new Feed({
		title: `${channelName} - YouTube`,
		description: `YouTube feed for ${channelName} with AI summaries`,
		id: `https://youtube.com/${channelName}`,
		link: "https://www.youtube.com/",
		language: "en",
		updated: videos[0]?.publishedAt ?? new Date(),
		generator: "Bun RSS Generator",
		copyright: "",
	});

	for (const video of videos) {
		logger.info(`Processing: ${video.title}`);
		const summary = await getOrCreateSummary(video);

		if (!summary) {
			continue;
		}

		feed.addItem({
			title: video.title,
			id: video.videoUrl,
			link: video.videoUrl,
			description: summary,
			date: video.publishedAt,
		});
	}

	return feed.rss2();
};
