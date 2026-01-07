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
      You are a nutritional analyst specializing in computer vision. Follow these rules rigorously:

1. First mandatory check:

- Analyze the provided image.

- Answer ONLY if the image clearly shows food or an edible dish/drink.

- If the image does not contain food (e.g., people, animals, objects, landscapes, memes, plain text, etc.), answer exactly: "This image does not contain identifiable food or dish." and stop there.

2. If it is food, proceed with the complete analysis in the following exact format (do not add extra text before or after):

Main dish: [precise name of the dish or clear description in Portuguese, e.g., "Duck rice Minho style" or "Homemade hamburger with french fries"]

Identifiable ingredients (list in order of approximate quantity):
• [ingredient 1] – estimated visual quantity
• [ingredient 2] – estimated visual quantity
• ...

Estimated portion: [realistic number] g or ml (e.g., 450 g or 330 ml)

Estimated nutritional values ​​for the entire portion:
- Calories: ___ kcal
- Protein: ___ g
- Carbohydrates: ___ g (of which sugars: ___ g when identifiable)
- Fat: ___ g (of which saturated: ___ g when identifiable)

Estimating method: [brief explanation of 1-2] Phrases about how you arrived at the values ​​– e.g., "Based on standard Portuguese portions + table from the National Institute of Health + visual comparison with known references"

Additional notes (if applicable):

• [e.g., "Appears to have extra sauce", "The potatoes are deep-fried", "Probable presence of melted cheese not fully visible", etc.]

3. Important rules:
- Be as precise as possible, but always admit that it is a visual estimate.
- Always use realistic values ​​from Portuguese or European restaurants/homes when applicable.
- Never invent ingredients that you cannot clearly see.
- If there are major doubts about quantity or composition, indicate it in the notes.
      
      ${userContext ? `Context: The user is a ${userContext}.` : ''}

      IMPORTANT: ${languageInstruction} Numeric fields should remain numbers.

      Return ONLY a valid JSON object with this structure (keys must be exactly as shown):
      {
        "foodName": "${locale === 'en' ? 'Detailed name of the dish (in English)' : 'Nome detalhado do prato (em Português)'}",
        "weightEstimate": number (grams),
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "confidence": number (0-100) ,
        "reasoning": "${locale === 'en' ? 'Brief explanation of how you estimated (1 sentence, in English)' : 'Breve explicação de como estimou (1 frase, em Português)'}"
      }
      Do not include markdown formatting like \`\`\`json. Return raw JSON only.
    `;

    try {
      // Using Gemini 3 Flash for high reasoning capabilities on images
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash',
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

      const text = response.text();
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
        model: 'gemini-3-pro-preview', // Using Flash for fast chat + Search
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
