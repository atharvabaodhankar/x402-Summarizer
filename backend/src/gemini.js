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
    // Return a demo summary instead of throwing an error
    return `📝 **Demo Summary** (No API Key Configured)

• This is a demonstration summary showing how the AI would respond
• The actual Gemini AI summarization requires an API key
• Visit https://makersuite.google.com/app/apikey to get your free API key
• Add it to backend/.env as GEMINI_API_KEY=your_key_here

**Your original text was ${text.length} characters long.**`;
  }

  // Using gemini-1.5-flash-latest (correct model name for the API)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
