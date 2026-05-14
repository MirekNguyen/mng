import { program } from "commander";
import { write } from "bun";
import { logger } from "@mng/logger/logger";

import { fetchAllChannelVideos } from "../youtube/youtube-feed.repository";
import { generateFeed } from "../youtube/feed-generator.calculator";

const youtubeRssFeedUrl = (channelId: string): string =>
	`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

program
	.requiredOption("-n, --name <string>", "Youtuber name")
	.requiredOption(
		"-c, --channel <ids...>",
		"YouTube channel ID(s), can be specified multiple times",
	)
	.requiredOption("-o, --output <string>", "Output file name")
	.option("-d, --days <number>", "Only include videos from the last N days", "1");

program.parse(process.argv);

const options = program.opts<{
	name: string;
	channel: string[];
	output: string;
	days: string;
}>();

const feedUrls = options.channel.map(youtubeRssFeedUrl);
const maxAgeDays = Number.parseInt(options.days, 10);
const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

logger.info(`Generating feed for: ${options.name}`);
logger.info(`Channels: ${options.channel.join(", ")}`);
logger.info(`Including videos from the last ${maxAgeDays} day(s)`);

const allVideos = await fetchAllChannelVideos(feedUrls);
const videos = allVideos.filter((video) => video.publishedAt >= cutoff);
logger.info(`Found ${allVideos.length} videos, ${videos.length} within date range`);

if (videos.length === 0) {
	logger.info("No new videos found, skipping feed generation");
	process.exit(0);
}

const rssXml = await generateFeed({ name: options.name, videos });
await write(`out/${options.output}`, rssXml);

logger.info(`Generated feed: out/${options.output}`);
