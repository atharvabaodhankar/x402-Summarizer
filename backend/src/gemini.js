import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function summarizeText(text) {
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  // Using gemini-1.5-flash as it is a stable and fast model.
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Summarize the following text in 3-5 concise bullet points:\n\n${text}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary");
  }
}
