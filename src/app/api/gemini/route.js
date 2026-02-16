import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: Set the GEMINI_API_KEY environment variable in a .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL,
    });
    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error in Gemini API route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
