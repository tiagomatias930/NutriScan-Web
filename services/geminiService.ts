import { GoogleGenAI, Modality } from "@google/genai";
import { FoodItem, Somatotype, Goal } from "../types";

// NOTE: In a production app, never expose keys in client code. 
// Since this is a demo running in a controlled environment, we access process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: "AIzaSyCAbxH6qH2e_z2QxCxB7_9BPXKTAyvCcqA" });

export interface AnalyzedFood {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weightEstimate: number; // in grams
  reasoning: string;
  confidence?: number; // 0-100 percent confidence in the visual estimate
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
   * Analyzes an image of food using Gemini 3 Flash (multimodal).
   */
  analyzeFoodImage: async (base64Image: string, userContext?: string, locale?: string): Promise<AnalyzedFood> => {
    const languageInstruction = locale === 'en' 
      ? 'Respond in ENGLISH. The values for "foodName" and "reasoning" must be written in English.'
      : 'Respond IN PORTUGUESE FROM PORTUGAL. The values for "foodName" and "reasoning" must be written in Portuguese.';
    const prompt = `
      You are a nutritional analyst specializing in computer vision. Analyze the provided image and extract nutritional information.

IMPORTANT INSTRUCTIONS:
- You MUST respond with ONLY a valid JSON object, nothing else.
- If the image contains food/drink (prepared meals, ingredients, beverages, etc.), analyze it and provide nutritional estimates.
- If the image does NOT contain any food, drink, or edible items (e.g., people, animals, landscapes, objects, text), return this JSON:
  {"foodName": "NOT_FOOD", "calories": 0, "protein": 0, "carbs": 0, "fats": 0, "weightEstimate": 0, "confidence": 0, "reasoning": "Image does not contain identifiable food or drink"}

ANALYSIS FORMAT (for valid food images):
- Identify the main dish/items visible
- Estimate portion size based on visual comparison
- Provide realistic nutritional values for Portuguese/European portions
- Include visible ingredients and preparations
- Be honest about uncertainty in estimates

${userContext ? `User Context: ${userContext}` : ''}

${languageInstruction}

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "foodName": "string - precise name or description of the dish",
  "weightEstimate": number (grams),
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fats": number (grams),
  "confidence": number (0-100, how certain is the estimate),
  "reasoning": "string - brief explanation of estimation method"
}
    `;

    try {
      // Using Gemini 3 Flash for high reasoning capabilities on images
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

      const text = response.text?.toString();
      if (!text) throw new Error("No response from Gemini");

      // Clean up markdown if present (just in case)
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Validate JSON structure
      let data: AnalyzedFood;
      try {
        data = JSON.parse(jsonStr) as AnalyzedFood;
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", jsonStr);
        throw new Error(`Invalid JSON response from Gemini: ${parseError}`);
      }

      // Check if the model detected it's not food (foodName = "NOT_FOOD")
      if (data.foodName === "NOT_FOOD" || !data.foodName || data.confidence === 0) {
        throw new Error("Image does not contain identifiable food or dish");
      }

      // Validate that we got actual food data with reasonable values
      if (typeof data.calories !== 'number' || data.calories <= 0 || data.calories > 5000) {
        throw new Error("Invalid calorie estimate");
      }

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
    userProfileStr: string,
    locale?: string
  ) => {
    try {
      const languageInstruction = locale === 'en'
        ? 'Respond in English. Always answer in English, regardless of the user\'s language.'
        : 'Responda em Português de Portugal. Sempre responda em Português, independentemente do idioma do utilizador.';

      const systemInstruction = `
        You are NutriScan Coach, an expert sports nutritionist.
        User Profile: ${userProfileStr}.
        Keep answers concise, motivating, and fact-based.
        If the user asks about recent nutritional news or specific food facts, use the Google Search tool.
        ${languageInstruction}
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
   * Generates spoken audio for a message using Gemini 3 TTS.
   * Returns a Promise that resolves when playback starts.
   */
  speakMessage: async (text: string, locale?: string): Promise<void> => {
      try {
        // Use Gemini 3 Flash TTS with native Web Audio API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: {
                    // Use Portuguese-friendly voice
                    prebuiltVoiceConfig: { 
                      voiceName: locale === 'pt' ? 'Jacinto' : 'Kore'
                    },
                  },
              },
            },
          });

          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!base64Audio) {
            console.warn('No audio data from TTS response');
            return;
          }

          // Use native Web Audio API for better compatibility
          const AudioContextPolyfill = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextPolyfill();
          
          const audioBuffer = await decodeAudioData(base64Audio, audioContext);
          
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start(0);

      } catch (e) {
          console.error("TTS Error:", e);
          // Fallback: use Web Speech API if Gemini TTS fails
          try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = locale === 'pt' ? 'pt-PT' : 'en-US';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
          } catch (fallbackError) {
            console.error("Speech synthesis fallback also failed:", fallbackError);
          }
      }
  }
};
