import { GoogleGenAI, MediaResolution } from "@google/genai";
import { systemInstruction } from "./system-instructions";

const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const generateText = async (): Promise<string | undefined> => {
  const client = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });

  const prompt = 'Summarize this video';

  const ytVideo = {
    fileData: {
      fileUri: 'https://www.youtube.com/watch?v=-Gtbsi51sts',
      mimeType: 'video/mp4',
    },
  };

  const response = await client.models.generateContent({
    model: GOOGLE_GEMINI_MODEL,
    contents: [ytVideo, prompt],
    config: {
      systemInstruction: systemInstruction,
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    },
  });

  console.log(response.text);
  return response.text;
}


generateText();
