import { GoogleGenAI, MediaResolution } from "@google/genai";
import { logger } from "@mng/logger/logger";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? "";

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
				mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
			},
		});

		return response.text ?? undefined;
	} catch (error) {
		logger.error(`Failed to summarize ${videoUrl}: ${error instanceof Error ? error.message : String(error)}`);
		return undefined;
	}
};
