import { GoogleGenAI, MediaResolution } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL ?? "";

const SYSTEM_INSTRUCTION = `You are summarizing a YouTube video for an RSS feed reader. Write a concise, informative summary (3-5 sentences) that captures the main topic and key points. Do not include timestamps, URLs, or formatting like bold/headers. Write in plain text, conversational tone. Focus on what the viewer will learn or find interesting.`;

const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const generateSummary = async (videoUrl: string): Promise<string> => {
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

	return response.text ?? "Summary unavailable.";
};
