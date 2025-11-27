import { GoogleGenAI, Modality } from "@google/genai";
import { FoodItem, Somatotype, Goal } from "../types";

// NOTE: In a production app, never expose keys in client code. 
// Since this is a demo running in a controlled environment, we access process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: "AIzaSyC0IVuu5GNzTxsdgYHGkhcFR_Wd3tp8-tM" });

export interface AnalyzedFood {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weightEstimate: number; // in grams
  reasoning: string;
}

// Helper to decode base64 audio
async function decodeAudioData(
    base64: string,
    ctx: AudioContext,
  ): Promise<AudioBuffer> {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return ctx.decodeAudioData(bytes.buffer);
  }

export const geminiService = {
  /**
   * Analyzes an image of food using Gemini 3 Pro Preview (multimodal).
   */
  analyzeFoodImage: async (base64Image: string, userContext?: string): Promise<AnalyzedFood> => {
    const prompt = `
      Carefully and efficiently analyze this image only if it depicts food. Identify the main dish and ingredients.
      Estimate the serving size (in grams) realistically..
      Estimate Calories, Protein (g), Carbs (g), and Fats (g).
      
      ${userContext ? `Context: The user is a ${userContext}.` : ''}

      IMPORTANT: Respond IN PORTUGUESE. The values for "foodName" and "reasoning" must be written in Portuguese. Numeric fields should remain numbers.

      Return ONLY a valid JSON object with this structure (keys must be exactly as shown):
      {
        "foodName": "Nome detalhado do prato (em Português)",
        "weightEstimate": number (grams),
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "reasoning": "Breve explicação de como estimou (1 frase, em Português)"
      }
      Do not include markdown formatting like \`\`\`json. Return raw JSON only.
    `;

    try {
      // Using gemini-3-pro-preview for high reasoning capabilities on images
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt }
          ]
        },
        config: {
            responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");

      // Clean up markdown if present (just in case)
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr) as AnalyzedFood;
      return data;

    } catch (error) {
      console.error("Gemini Vision Error:", error);
      throw error;
    }
  },

  /**
   * Chat with AI Coach using Gemini 3 Pro Preview.
   */
  chatWithCoach: async (
    history: { role: 'user' | 'model'; text: string }[], 
    currentMessage: string, 
    userProfileStr: string
  ) => {
    try {
      const systemInstruction = `
        You are NutriScan Coach, an expert sports nutritionist.
        User Profile: ${userProfileStr}.
        Keep answers concise, motivating, and fact-based.
        If the user asks about recent nutritional news or specific food facts, use the Google Search tool.
      `;

      // Construct parts from history for context (simplification for single-turn API usage or manual chat history management)
      // For this implementation, we will use a fresh generateContent with history context in prompt or use chat session if persistent.
      // Let's use a stateless approach where we pass relevant context in the prompt for simplicity in this architecture, 
      // but properly formatted for the model.
      
      // Ideally use ai.chats.create, but to mix search grounding dynamically, we'll use generateContent with tools.
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using Flash for fast chat + Search
        contents: [
            { role: 'user', parts: [{ text: `System: ${systemInstruction}` }] },
            ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
            { role: 'user', parts: [{ text: currentMessage }] }
        ],
        config: {
            tools: [{ googleSearch: {} }]
        }
      });
      
      return {
          text: response.text || "I couldn't process that.",
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      };

    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return { text: "Sorry, I'm having trouble connecting to the nutrition database right now.", groundingChunks: [] };
    }
  },

  /**
   * Generates spoken audio for a motivational message.
   */
  speakMessage: async (text: string): Promise<void> => {
      try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
              },
            },
          });

          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!base64Audio) return;

          const AudioContextPolyfill = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextPolyfill();
          
          const audioBuffer = await decodeAudioData(base64Audio, audioContext);
          
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start();

      } catch (e) {
          console.error("TTS Error", e);
      }
  }
};
