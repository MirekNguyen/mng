import { Rss } from "@feed/feed";
import { parseArgs } from "jsr:@std/cli/parse-args";

const flags = ["file", "title", "link", "description"];
const args = parseArgs(Deno.args, {
  string: flags,
});

const missing = flags.filter((flag) => !args[flag]);

if (missing.length > 0) {
  console.error(`Missing required flags: ${missing.map((f) => `--${f}`).join(", ")}`);
  Deno.exit(1);
}

const rssFeed = new Rss({
  title: "MNG RSS notifications",
  description: "Notification feed",
  link: "https://mirekng.com",
  updated: new Date(),
  id: "https://mirekng.com",
  authors: [
    {
      name: "Mirek Nguyen",
      email: "xngum019@seznam.cz",
    },
  ],
});

rssFeed.addItem({
  title: args.title,
  link: args.link,
  id: args.link, // using itemLink as id
  updated: new Date(),
  description: args.description,
});


Deno.writeTextFileSync("rss/" + args.file, rssFeed.build());
