import { Rss } from "@feed/feed";

const rssFeed = new Rss({
  title: "RSS Feed Example",
  description: "A simple RSS feed example",
  link: "http://example.com/rss-feed",
  updated: new Date("2024-10-19T15:12:56Z"),
  id: "http://example.com/rss-feed",
  authors: [
    {
      name: "John Doe",
      email: "test@example.org",
    },
  ],
});

rssFeed.addItem({
  title: "First RSS Item",
  link: "http://example.com/rss1",
  id: "http://example.com/rss1",
  updated: new Date("2024-10-19T15:12:56Z"),
  description: "Description for RSS item 1",
  content: {
    body: "Content for RSS item 1",
    type: "html",
  },
});

Deno.mkdirSync("rss", { recursive: true });
Deno.writeTextFileSync("rss/example.xml", rssFeed.build());
