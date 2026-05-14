import { GoogleGenAI, MediaResolution } from "@google/genai";
import { logger } from "@mng/logger/logger";

import type { VideoEntry } from "./youtube-feed.repository";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? "";

const SYSTEM_INSTRUCTION = `You are summarizing a YouTube video for an RSS feed reader. Write a concise, informative summary (3-5 sentences) that captures the main topic and key points. Do not include timestamps, URLs, or formatting like bold/headers. Write in plain text, conversational tone. Focus on what the viewer will learn or find interesting.`;

const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const generateVideoSummary = async (
	video: VideoEntry,
): Promise<string> => {
	try {
		const response = await client.models.generateContent({
			model: GOOGLE_GEMINI_MODEL,
			contents: [
				{
					fileData: {
						fileUri: video.videoUrl,
						mimeType: "video/mp4",
					},
				},
				"Summarize this video",
			],
			config: {
				systemInstruction: SYSTEM_INSTRUCTION,
				mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
			},
		});

		return response.text ?? "Summary unavailable.";
	} catch (error) {
		logger.error(
			`Failed to generate summary for: ${video.title} (${video.videoId})`,
		);
		if (error instanceof Error) {
			logger.error(error.message);
		}
		return "Summary unavailable.";
	}
};
