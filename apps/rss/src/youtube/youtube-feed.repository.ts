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
		const channelName =
			entry.match(/<name>(.*?)<\/name>/)?.[1] ?? "";
		const published =
			entry.match(/<published>(.*?)<\/published>/)?.[1] ?? "";
		const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
		const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

		if (videoId) {
			entries.push({
				videoId,
				title,
				channelName,
				videoUrl,
				thumbnailUrl,
				publishedAt: new Date(published),
			});
		}
	}

	return entries;
};

export const fetchChannelVideos = async (
	feedUrl: string,
): Promise<VideoEntry[]> => {
	const response = await fetch(feedUrl);

	if (!response.ok) {
		logger.error(`Failed to fetch feed: ${feedUrl} (${response.status})`);
		return [];
	}

	const xml = await response.text();
	return parseAtomFeed(xml);
};

export const fetchAllChannelVideos = async (
	feedUrls: string[],
): Promise<VideoEntry[]> => {
	const results = await Promise.all(feedUrls.map(fetchChannelVideos));
	const allVideos = results.flat();

	allVideos.sort(
		(a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
	);

	return allVideos;
};

export type { VideoEntry };
