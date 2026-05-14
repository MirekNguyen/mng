import { logger } from "@mng/logger/logger";

import { getOrCreateSummary } from "./video-summary.repository";

type FeedVideo = {
	videoId: string;
	title: string;
	channelName: string;
	videoUrl: string;
	thumbnailUrl: string;
};

const escapeXml = (str: string): string =>
	str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

export const generateFeed = async (
	channelName: string,
	videos: FeedVideo[],
): Promise<string> => {
	const now = new Date().toUTCString();
	const items: string[] = [];

	for (const video of videos) {
		logger.info(`Processing: ${video.title}`);
		const summary = await getOrCreateSummary(video);

		if (!summary) {
			continue;
		}

		items.push(`  <item>
    <title>${escapeXml(video.title)}</title>
    <link>${video.videoUrl}</link>
    <guid isPermaLink="false">${video.videoUrl}</guid>
    <pubDate>${now}</pubDate>
    <description><![CDATA[<img src="${video.thumbnailUrl}" alt="${escapeXml(video.title)}" />]]></description>
    <content:encoded><![CDATA[<p><img src="${video.thumbnailUrl}" alt="${escapeXml(video.title)}" /></p>${summary}]]></content:encoded>
    <media:thumbnail url="${video.thumbnailUrl}" />
    <enclosure url="${video.thumbnailUrl}" length="0" type="image/jpeg"/>
  </item>`);
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>${escapeXml(channelName)} - YouTube</title>
  <link>https://www.youtube.com/</link>
  <description>YouTube feed for ${escapeXml(channelName)} with AI summaries</description>
  <lastBuildDate>${now}</lastBuildDate>
  <generator>Bun RSS Generator</generator>
  <language>en</language>
${items.join("\n")}
</channel>
</rss>`;
};

export type { FeedVideo };
