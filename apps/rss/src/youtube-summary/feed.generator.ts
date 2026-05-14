import { Feed } from "feed";
import { logger } from "@mng/logger/logger";

import { getOrCreateSummary } from "./video-summary.repository";

type FeedVideo = {
	videoId: string;
	title: string;
	channelName: string;
	videoUrl: string;
	thumbnailUrl: string;
};

export const generateFeed = async (
	channelName: string,
	videos: FeedVideo[],
): Promise<string> => {
	const feed = new Feed({
		title: `${channelName} - YouTube`,
		description: `YouTube feed for ${channelName} with AI summaries`,
		id: `https://youtube.com/${channelName}`,
		link: "https://www.youtube.com/",
		language: "en",
		updated: new Date(),
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
			date: new Date(),
		});
	}

	return feed.rss2();
};

export type { FeedVideo };
