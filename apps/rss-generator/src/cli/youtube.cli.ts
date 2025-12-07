import { program } from "commander";
import YouTube from "youtube-sr";
import { Feed } from "feed";
import { write } from "bun";
import { logger } from "../logger";

program
  .requiredOption("-p, --playlistId <string>", "Query using Playlist ID")
  .requiredOption("-o, --output <string>", "Output file path");

program.parse(process.argv);
const options = program.opts();

const getPlaylist = async (playlistId: string) => {
  try {
    return await YouTube.getPlaylist(playlistId, {
      limit: 3,
    });
  } catch (error) {
    logger.error("Error fetching channel videos.");
    if (error instanceof Error) logger.error(`Error message: ${error.message}`);
    process.exit(1);
  }
};

const playlist = await getPlaylist(options.playlistId);
const videos = playlist.videos;

const feed = new Feed({
  title: options.channel
    ? `Channel Uploads: ${options.query}`
    : "Youtube Search Feed",
  description: "Youtube subscriptions feed",
  id: `https://mirekng.com/rss/${options.output}`,
  link: "https://mirekng.com",
  language: "en",
  updated: new Date(),
  generator: "Bun RSS Generator",
  copyright: "",
});

videos.forEach((video) => {
  feed.addItem({
    title: `${video.title}`,
    id: video.url,
    link: video.url,
    description: `
        <img src="${video.thumbnail?.url || ""}" /><br>
        ${video.url}<br>
        Published: ${video.uploadedAt}<br>
        Duration: ${video.durationFormatted}
      `,
    date: new Date(video.uploadedAt ?? ""),
  });
});

await write(`out/${options.output}`, feed.rss2());

logger.info(`Successfully generated RSS feed at: ${options.output}`);
logger.info(`Total videos found: ${videos.length}`);
