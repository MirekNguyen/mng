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
	.requiredOption("-o, --output <string>", "Output file name");

program.parse(process.argv);

const options = program.opts<{
	name: string;
	channel: string[];
	output: string;
}>();

const feedUrls = options.channel.map(youtubeRssFeedUrl);

logger.info(`Generating feed for: ${options.name}`);
logger.info(`Channels: ${options.channel.join(", ")}`);

const videos = await fetchAllChannelVideos(feedUrls);
logger.info(`Found ${videos.length} videos`);

const rssXml = await generateFeed({ name: options.name, videos });
await write(`out/${options.output}`, rssXml);

logger.info(`Generated feed: out/${options.output}`);
