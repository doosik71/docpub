// src/lib/gemini.js

/**
 * Calls our backend API to get a streaming response from Gemini.
 *
 * @param {string} prompt - The full prompt to send to the API.
 * @param {function(string): void} onChunk - A callback function that receives each chunk of the response.
 * @param {function(): void} onComplete - A callback function called when the stream is complete.
 */
export async function streamGeminiResponse(prompt, onChunk, onComplete) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      onChunk(decoder.decode(value));
    }

    onComplete();
  } catch (error) {
    console.error("Failed to fetch Gemini stream:", error);
    onChunk("\n--- ERROR: Failed to get response from Gemini. ---");
    onComplete();
  }
}
