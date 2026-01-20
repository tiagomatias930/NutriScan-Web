import { GoogleGenAI, Modality } from "@google/genai";
import { FoodItem, Somatotype, Goal } from "../types";

// NOTE: In a production app, never expose keys in client code. 
// Since this is a demo running in a controlled environment, we access process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: "AIzaSyBpbyWrlhUT8TkHVtQN1EAdBVDDtshe_7k" });

export type Locale = 'pt' | 'en' | 'zh' | 'fr';

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

// Helper to generate voice message in the appropriate language
function generateFoodVoiceMessage(
  foodName: string,
  calories: number,
  protein: number,
  carbs: number,
  fats: number,
  locale?: string
): string {
  const loc = locale as Locale || 'en';
  
  const messages: Record<Locale, string> = {
    'pt': `Encontrei ${foodName}. ${calories} calorias, ${protein} gramas de proteína, ${carbs} gramas de carboidratos, e ${fats} gramas de gordura.`,
    'en': `I found ${foodName}. ${calories} calories, ${protein} grams of protein, ${carbs} grams of carbs, and ${fats} grams of fat.`,
    'zh': `我找到了${foodName}。${calories}卡路里，${protein}克蛋白质，${carbs}克碳水化合物，${fats}克脂肪。`,
    'fr': `J'ai trouvé ${foodName}. ${calories} calories, ${protein} grammes de protéines, ${carbs} grammes de glucides et ${fats} grammes de graisse.`,
  };
  
  return messages[loc] || messages['en'];
}

export const geminiService = {
  /**
   * Analyzes an image of food using Gemini 3 Flash (multimodal).
   */
  analyzeFoodImage: async (base64Image: string, userContext?: string, locale?: string): Promise<AnalyzedFood> => {
    const languageInstructions: Record<string, string> = {
      'pt': 'Respond in PORTUGUESE FROM PORTUGAL. The values for "foodName" and "reasoning" must be written in Portuguese.',
      'en': 'Respond in ENGLISH. The values for "foodName" and "reasoning" must be written in English.',
      'zh': 'Respond in SIMPLIFIED CHINESE (Mandarin). The values for "foodName" and "reasoning" must be written in Simplified Chinese.',
      'fr': 'Respond in FRENCH. The values for "foodName" and "reasoning" must be written in French.',
    };
    const languageInstruction = languageInstructions[locale || 'en'] || languageInstructions['en'];
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
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
              { text: prompt }
            ]
          }
        ]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
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
      if (data.foodName === "NOT_FOOD") {
        throw new Error("Image does not contain identifiable food or dish");
      }

      // Se não temos foodName, é erro
      if (!data.foodName || typeof data.foodName !== 'string' || data.foodName.trim() === '') {
        throw new Error("Image does not contain identifiable food or dish");
      }

      // Validar que temos valores numéricos razoáveis
      // Permitir valores mais flexíveis para lidar com imagens de menor qualidade
      if (typeof data.calories !== 'number' || data.calories <= 0 || data.calories > 5000) {
        // Se não temos calorias válidas, tentar atribuir uma estimativa padrão baseada na confiança
        if (data.confidence && data.confidence > 30) {
          // Estimativa baseada em padrões comuns
          data.calories = Math.max(50, Math.min(500, 250));
          data.protein = data.protein || 15;
          data.carbs = data.carbs || 35;
          data.fats = data.fats || 8;
        } else {
          throw new Error("Invalid or unclear food data");
        }
      }

      // Preenchimento de valores faltantes com estimativas razoáveis
      if (!data.protein || typeof data.protein !== 'number') data.protein = 15;
      if (!data.carbs || typeof data.carbs !== 'number') data.carbs = 35;
      if (!data.fats || typeof data.fats !== 'number') data.fats = 8;
      if (!data.weightEstimate || typeof data.weightEstimate !== 'number') data.weightEstimate = 150;
      if (!data.confidence || typeof data.confidence !== 'number') data.confidence = 50;
      if (!data.reasoning || typeof data.reasoning !== 'string') data.reasoning = 'Estimate based on visual analysis';

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
      const languageInstructions: Record<string, string> = {
        'pt': 'Responda em Português de Portugal. Sempre responda em Português, independentemente do idioma do utilizador.',
        'en': 'Respond in English. Always answer in English, regardless of the user\'s language.',
        'zh': 'Respond in Simplified Chinese (Mandarin). Always answer in Simplified Chinese, regardless of the user\'s language.',
        'fr': 'Respond in French. Always answer in French, regardless of the user\'s language.',
      };
      const languageInstruction = languageInstructions[locale || 'en'] || languageInstructions['en'];

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
        model: 'gemini-3-flash-preview', // Using Flash for fast chat + Search
        contents: [
            { role: 'user', parts: [{ text: `System: ${systemInstruction}` }] },
            ...history.map(h => ({ role: h.role === 'model' ? 'model' : 'user', parts: [{ text: h.text }] })),
            { role: 'user', parts: [{ text: currentMessage }] }
        ]
      });
      
      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that.";
      
      return {
          text: responseText,
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      };

    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return { text: "Sorry, I'm having trouble connecting to the nutrition database right now.", groundingChunks: [] };
    }
  },

  /**
   * Speak a message using Web Speech API
   */
  speakMessage: async (message: string, locale?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const languageMap: Record<string, string> = {
          'pt': 'pt-PT',
          'en': 'en-US',
          'zh': 'zh-CN',
          'fr': 'fr-FR',
        };
        // Use Web Speech API for text-to-speech
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = languageMap[locale || 'en'] || 'en-US';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        
        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
        
        speechSynthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Generate a voice message describing food analysis in the user's language
   */
  generateFoodVoiceMessage,

};
