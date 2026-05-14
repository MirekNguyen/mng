import { GoogleGenAI, MediaResolution } from "@google/genai";
import { logger } from "@mng/logger/logger";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? "";

const SYSTEM_INSTRUCTION = `You are summarizing YouTube videos. Replicate the exact style of Google Gemini chat video summaries. Output valid HTML for use in an RSS feed.

Format rules:
1. Opening: Start with a <p> containing: "Here is a summary of the video" followed by the actual video title in quotes and the actual channel name. Use the real title and channel from the video, never placeholders.
2. Body: Use a series of <p> tags. Each paragraph covers one distinct topic, story beat, or argument. Start each paragraph with a <strong> descriptive topic title followed by a colon:</strong> then the explanation. The topic title should be specific and descriptive (e.g. "The Parking Ticket Gambit:", "Why Bitcoin Doesn't Produce Yield:", "Team Hitchhike Wins:"). Never use generic labels like "Section Header" or "Topic 1".
3. Timestamps: Include timestamps as clickable HTML links. Format: <a href="VIDEO_URL&t=XXs">[MM:SS]</a> where VIDEO_URL is the YouTube URL of the video and XX is the total seconds. Place at the end of relevant sentences. Use single timestamps only, never ranges.
4. Depth: Be thorough. Cover all major points, arguments, stories, and conclusions. Do not over-summarize — each section should have enough detail to understand the point without watching.
5. Tone: Conversational, objective, highly readable. Use quotes from the video where impactful.

Output only HTML tags (<p>, <strong>, <a>). No markdown, no headers, no lists, no divs.`;

const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const generateSummary = async (videoUrl: string): Promise<string | undefined> => {
	try {
		const response = await client.models.generateContent({
			model: GOOGLE_GEMINI_MODEL,
			contents: [
				{
					fileData: {
						fileUri: videoUrl,
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

		return response.text ?? undefined;
	} catch (error) {
		logger.error(`Failed to summarize ${videoUrl}: ${error instanceof Error ? error.message : String(error)}`);
		return undefined;
	}
};
