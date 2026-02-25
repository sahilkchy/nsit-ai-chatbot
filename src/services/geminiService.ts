import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const NSIT_URL = "https://www.nsit.in/";

export interface Message {
  role: "user" | "model";
  text: string;
}

export async function chatWithNSIT(history: Message[], userInput: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const systemInstruction = `
    You are the NSIT Bihta Support Assistant. 
    Your goal is to help students, parents, and staff with queries about Netaji Subhash Institute of Technology (NSIT), Bihta.
    
    CRITICAL RULES:
    1. Only answer based on information from ${NSIT_URL}.
    2. Keep answers user-friendly, concise, and short.
    3. If you don't know the answer or it's not on the website, politely direct them to contact the college administration.
    4. Provide direct links for logins (Student/Teacher) if available on the site.
    5. No sugar-coating. Be professional yet helpful.
  `;

  try {
    const response = await ai.models.generateContent({
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

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
