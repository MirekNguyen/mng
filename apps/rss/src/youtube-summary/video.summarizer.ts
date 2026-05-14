import { GoogleGenAI, MediaResolution } from "@google/genai";
import { logger } from "@mng/logger/logger";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? "";

const SYSTEM_INSTRUCTION = `You are summarizing YouTube videos. Replicate the exact style of Google Gemini chat video summaries.

Format rules:
1. Opening line: "Here is a summary of the video "[Video Title]" from the channel [Channel Name]:" followed by the video URL in parentheses.
2. Body: Use a series of indented, bolded section headers followed by a colon and the explanation. Each section should cover one distinct topic, story beat, or argument from the video.
3. Timestamps: Include timestamps in [MM:SS] or [HH:MM:SS] format at the end of relevant sentences. Use single timestamps only, never ranges.
4. Depth: Be thorough. Cover all major points, arguments, stories, and conclusions. Do not over-summarize — each section should have enough detail to understand the point without watching.
5. Tone: Conversational, objective, highly readable. Use quotes from the video where impactful.
6. Closing: End with the video title and channel name on a separate line, formatted as: "[Video Title]\\n[Channel Name] · [view count if known]"

Do NOT use markdown headers (#), horizontal rules, or bullet points with dashes. Use indented bold text followed by colons for each section.`;

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
