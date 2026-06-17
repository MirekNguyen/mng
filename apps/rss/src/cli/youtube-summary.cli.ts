import { program } from "commander";
import { write } from "bun";
import { logger } from "@mng/logger/logger";

import { generateFeed } from "../youtube-summary/feed.generator";
import { YoutubeRepository } from "../youtube-summary/youtube.repository";

program
	.requiredOption("-p, --playlistId <string>", "Query using Playlist ID")
	.requiredOption("-o, --output <string>", "Output file name");

program.parse(process.argv);

const options = program.opts<{
	playlistId: string;
	output: string;
}>();

const FETCH_LIMIT = 10;
const SHORT_THRESHOLD_SECONDS = 60;
const VOD_THRESHOLD_SECONDS = 3 * 60 * 60;

const allVideos = await YoutubeRepository.getPlaylistVideos(options.playlistId, FETCH_LIMIT);

if (allVideos.length === 0) {
	logger.error(`Failed to fetch playlist: ${options.playlistId}`);
	process.exit(1);
}

const videos = allVideos.filter((video) => {
	if (video.isLive) return false;
	if (video.durationSeconds <= SHORT_THRESHOLD_SECONDS) return false;
	if (video.durationSeconds >= VOD_THRESHOLD_SECONDS) return false;
	return true;
});

logger.info(`Found ${allVideos.length} videos, ${videos.length} after filtering`);

if (videos.length === 0) {
	logger.info("No videos found, skipping feed generation");
	process.exit(0);
}

const channelName = videos[0].channelName;
const feedVideos = videos.map((video) => ({
	videoId: video.videoId,
	title: video.title,
	channelName: video.channelName,
	videoUrl: video.videoUrl,
	thumbnailUrl: video.thumbnailUrl,
}));

const rssXml = await generateFeed(channelName, feedVideos, undefined);
await write(`out/${options.output}`, rssXml);

logger.info(`Generated feed: out/${options.output}`);
