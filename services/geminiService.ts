import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PageContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const simulatePageLoad = async (url: string, query?: string): Promise<PageContent> => {
  const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  
  const prompt = `
    SYSTEM IDENTITY: YOU ARE THE CHROMIUM V130 RENDERING ENGINE.
    TASK: GENERATE A NATIVE CHROMIUM RENDER FOR: "${url}".
    
    ENGINE PARAMETERS:
    - UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36
    - Engine: Blink/Chromium
    
    REQUIREMENTS:
    1. ARCHITECTURE: Return a complete, production-grade HTML5/CSS3/JS document. 
    2. FIDELITY: Every pixel must reflect the brand of ${domain}. Use real assets, CDNs (Tailwind, Google Fonts), and modern layouts (Flex/Grid).
    3. ENGINE INTERACTIVITY:
       - Implement navigation link interception: Use <a href="..."> but add a global click listener to send 'window.parent.postMessage({type: "navigate", url: this.href }, "*")'.
       - Handle form submissions similarly.
    4. CHROMIUM FEATURES:
       - Implement Chromium-style custom scrollbars via CSS.
       - Include realistic console logs for "DevTools" to pick up.
    5. DATA GROUNDING: Use Google Search to find current data, pricing, news, and status for this specific site at this exact moment.
    
    OUTPUT: A JSON object with "title", "favicon", and "htmlContent".
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 12000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          favicon: { type: Type.STRING },
          htmlContent: { type: Type.STRING, description: "The full Chromium-compliant HTML document." }
        },
        required: ["title", "favicon", "htmlContent"]
      }
    }
  });

  const rawJson = response.text.trim();
  const content = JSON.parse(rawJson) as PageContent;
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Source',
    uri: chunk.web?.uri || '#'
  })) || [];

  content.metadata = {
    sources
  };

  return content;
};

/**
 * Fetches Chromium-style Omnibox suggestions based on partial input.
 */
export const fetchOmniboxSuggestions = async (input: string): Promise<string[]> => {
  if (!input.trim()) return [];
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Predict Chromium Omnibox suggestions for user input: "${input}". Provide a list of 5 likely URLs or search queries.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch {
    return [];
  }
};
