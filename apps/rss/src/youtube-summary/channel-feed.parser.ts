import { logger } from "@mng/logger/logger";

type VideoEntry = {
	videoId: string;
	title: string;
	channelName: string;
	videoUrl: string;
	thumbnailUrl: string;
	publishedAt: Date;
};

const parseAtomFeed = (xml: string): VideoEntry[] => {
	const entries: VideoEntry[] = [];
	const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
	let entryMatch: RegExpExecArray | null = null;

	while ((entryMatch = entryRegex.exec(xml)) !== null) {
		const entry = entryMatch[1];
		const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? "";
		const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
		const channelName = entry.match(/<name>(.*?)<\/name>/)?.[1] ?? "";
		const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? "";

		if (videoId) {
			entries.push({
				videoId,
				title,
				channelName,
				videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
				thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
				publishedAt: new Date(published),
			});
		}
	}

	return entries;
};

export const fetchChannelVideos = async (channelId: string): Promise<VideoEntry[]> => {
	const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
	const response = await fetch(feedUrl);

	if (!response.ok) {
		logger.error(`Failed to fetch feed: ${feedUrl} (${response.status})`);
		return [];
	}

	const xml = await response.text();
	const videos = parseAtomFeed(xml);

	videos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

	return videos;
};

export type { VideoEntry };
