import { program } from "commander";
import { write } from "bun";
import { logger } from "@mng/logger/logger";

import { fetchChannelVideos } from "../youtube-summary/channel-feed.parser";
import { generateFeed } from "../youtube-summary/feed.generator";

program
	.requiredOption("-c, --channel <string>", "YouTube channel ID")
	.requiredOption("-o, --output <string>", "Output file name");

program.parse(process.argv);

const options = program.opts<{
	channel: string;
	output: string;
}>();

logger.info(`Channel: ${options.channel}`);

const videos = await fetchChannelVideos(options.channel);
logger.info(`Found ${videos.length} videos`);

if (videos.length === 0) {
	logger.info("No videos found, skipping feed generation");
	process.exit(0);
}

const rssXml = await generateFeed(videos[0].channelName, videos);
await write(`out/${options.output}`, rssXml);

logger.info(`Generated feed: out/${options.output}`);
