import { Feed } from "feed";
import { logger } from "@mng/logger/logger";

import type { VideoEntry } from "./youtube-feed.repository";
import { getOrCreateSummary } from "./video-summary.repository";

type GenerateFeedOptions = {
	name: string;
	videos: VideoEntry[];
};

export const generateFeed = async ({
	name,
	videos,
}: GenerateFeedOptions): Promise<string> => {
	const feed = new Feed({
		title: `${name} - YouTube`,
		description: `Aggregated YouTube feed for ${name} with AI summaries`,
		id: `https://youtube.com/${name}`,
		link: "https://www.youtube.com/",
		language: "en",
		updated: new Date(),
		generator: "Bun RSS Generator",
		copyright: "",
	});

	for (const video of videos) {
		logger.info(`Processing video: ${video.title}`);
		const summary = await getOrCreateSummary(video);

		feed.addItem({
			title: video.title,
			id: video.videoUrl,
			link: video.videoUrl,
			description: `
				<img src="${video.thumbnailUrl}" alt="${video.title}" /><br/>
				<p>${summary}</p>
			`,
			date: video.publishedAt,
			author: [{ name: video.channelName }],
		});
	}

	return feed.rss2();
};
