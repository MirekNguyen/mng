import { program } from "commander";
import { Feed } from "feed";
import { write } from "bun";
import { logger } from "@mng/logger/logger";

program
  .requiredOption("-n, --notification <string>", "Notification title")
  .requiredOption("-l, --link <string>", "Notification link")
  .requiredOption("-o, --output <string>", "Output file path");

program.parse(process.argv);
const options = program.opts();

const feed = new Feed({
  title: options.notification,
  description: "",
  id: options.link,
  link: options.link,
  language: "en",
  updated: new Date(),
  generator: "Bun RSS Generator",
  copyright: "",
});

feed.addItem({
  title: `${options.notification}`,
  id: options.link + (new Date().toISOString()),
  link: options.link,
  description: ``,
  date: new Date(),
});

await write(`out/${options.output}`, feed.rss2());

logger.info(`Successfully generated RSS feed at: ${options.output}`);
