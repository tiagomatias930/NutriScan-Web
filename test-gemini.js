import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBpbyWrlhUT8TkHVtQN1EAdBVDDtshe_7k" });

async function test() {
  try {
    console.log("Testing Gemini API...");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Hello, respond with JSON: {"test": "value"}' }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    console.log("Full response:", JSON.stringify(response, null, 2));
    console.log("\n\nResponse structure:");
    console.log("- response.text:", response.text);
    console.log("- response.candidates:", response.candidates ? 'exists' : 'missing');
    if (response.candidates?.[0]) {
      console.log("  - candidates[0].content:", response.candidates[0].content ? 'exists' : 'missing');
      console.log("  - candidates[0].content.parts:", response.candidates[0].content?.parts ? 'exists' : 'missing');
      console.log("  - candidates[0].content.parts[0]:", response.candidates[0].content?.parts?.[0]);
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);
  }
}

test();
