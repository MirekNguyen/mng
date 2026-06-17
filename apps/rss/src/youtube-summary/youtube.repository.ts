import { logger } from "@mng/logger/logger";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

type PlaylistItemSnippet = {
	title: string;
	resourceId: { videoId: string };
	channelTitle: string;
	thumbnails: { high?: { url: string }; default?: { url: string } };
	videoOwnerChannelTitle: string;
};

type PlaylistItemContentDetails = {
	videoId: string;
	videoPublishedAt: string;
};

type PlaylistItem = {
	snippet: PlaylistItemSnippet;
	contentDetails: PlaylistItemContentDetails;
};

type PlaylistItemsResponse = {
	items: PlaylistItem[];
};

type VideoDetails = {
	id: string;
	contentDetails: { duration: string };
	liveStreamingDetails?: { actualStartTime?: string };
	snippet: { channelTitle: string; thumbnails: { high?: { url: string }; default?: { url: string } } };
};

type VideosResponse = {
	items: VideoDetails[];
};

export type YoutubeVideo = {
	videoId: string;
	title: string;
	channelName: string;
	videoUrl: string;
	thumbnailUrl: string;
	durationSeconds: number;
	isLive: boolean;
};

const parseDurationSeconds = (isoDuration: string): number => {
	const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;
	const hours = parseInt(match[1] ?? "0", 10);
	const minutes = parseInt(match[2] ?? "0", 10);
	const seconds = parseInt(match[3] ?? "0", 10);
	return hours * 3600 + minutes * 60 + seconds;
};

const fetchPlaylistItems = async (playlistId: string, limit: number): Promise<PlaylistItem[]> => {
	const apiKey = process.env.YOUTUBE_API_KEY;
	const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
	url.searchParams.set("part", "snippet,contentDetails");
	url.searchParams.set("playlistId", playlistId);
	url.searchParams.set("maxResults", String(limit));
	url.searchParams.set("key", apiKey ?? "");

	const response = await fetch(url.toString());

	if (!response.ok) {
		const body = await response.text();
		logger.error(`YouTube API error ${response.status}: ${body}`);
		return [];
	}

	const data = (await response.json()) as PlaylistItemsResponse;
	return data.items ?? [];
};

const fetchVideoDetails = async (videoIds: string[]): Promise<VideoDetails[]> => {
	const apiKey = process.env.YOUTUBE_API_KEY;
	const url = new URL(`${YOUTUBE_API_BASE}/videos`);
	url.searchParams.set("part", "contentDetails,liveStreamingDetails,snippet");
	url.searchParams.set("id", videoIds.join(","));
	url.searchParams.set("key", apiKey ?? "");

	const response = await fetch(url.toString());

	if (!response.ok) {
		const body = await response.text();
		logger.error(`YouTube API error ${response.status}: ${body}`);
		return [];
	}

	const data = (await response.json()) as VideosResponse;
	return data.items ?? [];
};

export const YoutubeRepository = {
	getPlaylistVideos: async (playlistId: string, limit: number): Promise<YoutubeVideo[]> => {
		const items = await fetchPlaylistItems(playlistId, limit);

		if (items.length === 0) return [];

		const videoIds = items.map((item) => item.contentDetails.videoId);
		const details = await fetchVideoDetails(videoIds);

		const detailsById = new Map(details.map((d) => [d.id, d]));

		return items.map((item) => {
			const videoId = item.contentDetails.videoId;
			const detail = detailsById.get(videoId);
			const thumbnail =
				item.snippet.thumbnails.high?.url ??
				item.snippet.thumbnails.default?.url ??
				`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

			return {
				videoId,
				title: item.snippet.title,
				channelName: item.snippet.videoOwnerChannelTitle ?? item.snippet.channelTitle,
				videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
				thumbnailUrl: thumbnail,
				durationSeconds: detail ? parseDurationSeconds(detail.contentDetails.duration) : 0,
				isLive: detail?.liveStreamingDetails?.actualStartTime !== undefined,
			};
		});
	},
};
