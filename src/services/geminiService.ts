import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { KNOWLEDGE_BASE } from "../constants";

const NSIT_URL = "https://www.nsit.in/";

export interface Message {
  role: "user" | "model";
  text: string;
}

// Simple session-based cache
const sessionCache: Record<string, string> = {};

function searchKnowledgeBase(userInput: string): string | null {
  const input = userInput.toLowerCase();
  
  // Check for keywords in the Knowledge Base
  for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
    if (input.includes(key)) {
      return value;
    }
  }
  
  return null;
}

export async function* chatWithNSITStream(history: Message[], userInput: string) {
  // Step 1: Check Knowledge Base first (Instant & Free)
  const localAnswer = searchKnowledgeBase(userInput);
  if (localAnswer) {
    yield localAnswer;
    return;
  }

  // Step 2: Check Session Cache (Instant & Free)
  if (sessionCache[userInput]) {
    yield sessionCache[userInput];
    return;
  }

  // Step 3: Gemini Fallback (AI Response)
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    yield "⚠️ API Key missing! Please set VITE_GEMINI_API_KEY in your Vercel Environment Variables.";
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are the **Official AI Support Assistant for Netaji Subhas Institute of Technology (NSIT), Bihta**. 
  Your primary mission is to provide **highly professional, exhaustive, and authoritative** information to students, parents, and visitors.

  ### CORE INSTITUTIONAL DATA:
    - **Official Website:** ${NSIT_URL}
    - **Location:** Amhara, Bihta, Patna, Bihar - 801103.
    - **Contact:** Email: info@nsit.in | Admission Hotline: 7781020364 / 7781020346
    - **Affiliation:** B.Tech is affiliated with Aryabhatta Knowledge University (AKU). Diploma is affiliated with SBTE Bihar.
    - **Approvals:** AICTE Approved, NAAC Accredited.

  ### RESPONSE QUALITY STANDARDS (MANDATORY):
    1. **Depth & Detail:** Never give one-line answers. Even for simple questions, provide context. For example, if asked about CSE, explain the labs, the faculty's focus, and the placement trends.
    2. **Professional Formatting:** Use Markdown religiously. Use **bold text** for emphasis, ### headings for sections, and bullet points for lists. This makes the response look "crafted" and professional.
    3. **Tone:** You are a senior administrative representative. Be welcoming, respectful, and extremely helpful.
    4. **Language:** Use a sophisticated blend of English and Hindi (Hinglish) to ensure the user feels understood, but maintain a high standard of vocabulary.
    5. **Structure:** 
       - Start with a polite greeting or acknowledgment.
       - Provide the main answer in detail.
       - Add a "Pro-Tip" or "Additional Info" section if relevant.
       - End with a call to action (e.g., "You can visit the campus for a personal tour" or "Feel free to call our admission cell").

  ### KNOWLEDGE DOMAINS:
    - **Admissions:** Explain JEE Main/BCECE requirements. Mention the enquiry form.
    - **Infrastructure:** Highlight the Wi-Fi campus, modern hostels, and advanced labs.
    - **Placements:** Mention top recruiters like TCS, Infosys, and Wipro.
    - **NSIT vs NSIP:** Clearly distinguish between the 4-year B.Tech (NSIT) and the 3-year Diploma (NSIP).`;

  let fullResponse = "";

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-flash-latest",
      contents: [
        ...history.slice(-6).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: "user", parts: [{ text: userInput }] }
      ],
      config: {
        systemInstruction,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        yield text;
      }
    }

    // Save successful response to cache
    sessionCache[userInput] = fullResponse;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error?.message || String(error);
    const errorStr = (JSON.stringify(error) + errorMessage).toUpperCase();
    
    const isQuotaError = 
      errorStr.includes("429") || 
      errorStr.includes("QUOTA") || 
      errorStr.includes("EXHAUSTED") ||
      errorStr.includes("LIMIT");

    if (isQuotaError) {
      yield "⚠️ AI ki limit khatam ho gayi hai (Rate Limit). Kripya 20 second ruk kar fir se try karein. 🙏";
    } else if (errorStr.includes("API_KEY_INVALID") || errorStr.includes("INVALID_ARGUMENT")) {
      yield "❌ API Key galat hai! Kripya Vercel settings mein sahi VITE_GEMINI_API_KEY check karein.";
    } else {
      yield `❌ Connection Error: ${errorMessage.slice(0, 50)}... Try again.`;
    }
  }
}
