import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const NSIT_URL = "https://www.nsit.in/";

export interface Message {
  role: "user" | "model";
  text: string;
}

export async function* chatWithNSITStream(history: Message[], userInput: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const systemInstruction = `
    You are the NSIT Bihta Support Assistant. 
    Help students/staff with queries about NSIT Bihta using ${NSIT_URL}.
    
    RULES:
    1. Only use info from ${NSIT_URL}.
    2. Be extremely concise and short.
    3. Direct to admin if info is missing.
    4. Provide direct login links.
    5. Professional tone, no fluff.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: "user", parts: [{ text: userInput }] }
      ],
      config: {
        systemInstruction,
        tools: [{ urlContext: {} }],
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield "I'm having trouble connecting right now. Please try again.";
  }
}

