import { program } from "commander";
import { write } from "bun";
import { logger } from "@mng/logger/logger";
import { type Video, YouTube } from "youtube-sr";

import { generateFeed } from "../youtube-summary/feed.generator";

program
	.requiredOption("-p, --playlistId <string>", "Query using Playlist ID")
	.requiredOption("-o, --output <string>", "Output file name");

program.parse(process.argv);

const options = program.opts<{
	playlistId: string;
	output: string;
}>();

const playlist = await YouTube.getPlaylist(options.playlistId, { limit: 3 });

if (!playlist?.videos) {
	logger.error(`Failed to fetch playlist: ${options.playlistId}`);
	process.exit(1);
}

const getMinutes = (duration: number): number => duration / 1000 / 60;
const isShort = (duration: number): boolean => getMinutes(duration) <= 1;
const isVod = (duration: number): boolean => getMinutes(duration) >= 180;

const videos = playlist.videos.filter((video: Video) => {
	if (video.live) return false;
	if (isShort(video.duration)) return false;
	if (isVod(video.duration)) return false;
	return true;
});

logger.info(`Found ${playlist.videos.length} videos, ${videos.length} after filtering`);

if (videos.length === 0) {
	logger.info("No videos found, skipping feed generation");
	process.exit(0);
}

const channelName = videos[0].channel?.name ?? options.playlistId;
const channelIcon = videos[0].channel?.iconURL() ?? undefined;
const feedVideos = videos.map((video: Video) => ({
	videoId: video.id ?? "",
	title: video.title ?? "",
	channelName: video.channel?.name ?? channelName,
	videoUrl: video.url,
	thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
}));

const rssXml = await generateFeed(channelName, feedVideos, channelIcon);
await write(`out/${options.output}`, rssXml);

logger.info(`Generated feed: out/${options.output}`);
