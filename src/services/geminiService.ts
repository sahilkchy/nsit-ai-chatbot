import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { KNOWLEDGE_BASE } from "../constants";

const NSIT_URL = "https://www.nsit.in/";

export interface Message {
  role: "user" | "model";
  text: string;
}

// Persistent cache using localStorage
const CACHE_KEY = "nsit_chat_cache_v1";

function getPersistentCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function setPersistentCache(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    const cache = getPersistentCache();
    cache[key] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Cache storage failed", e);
  }
}

function searchKnowledgeBase(userInput: string): string | null {
  // Clean input: remove punctuation and extra spaces
  const cleanInput = userInput.toLowerCase().replace(/[^\w\s]/g, " ");
  const inputWords = cleanInput.split(/\s+/).filter(w => w.length > 1);
  
  const matches: { score: number; value: string }[] = [];

  for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
    const keyWords = key.toLowerCase().split(/\s+/);
    let matchCount = 0;

    for (const kw of keyWords) {
      // Check for exact word, plural/singular, or partial overlap
      if (inputWords.some(iw => 
        iw === kw || 
        iw === kw + 's' || 
        iw + 's' === kw ||
        (kw.length > 3 && iw.includes(kw)) ||
        (iw.length > 3 && kw.includes(iw))
      )) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      // Calculate score based on how many keywords matched
      const score = (matchCount / keyWords.length) * 100;
      matches.push({ score, value });
    }
  }

  if (matches.length > 0) {
    const bestMatch = matches.sort((a, b) => b.score - a.score)[0];
    // If we have a decent match (at least 30% keywords), return it
    if (bestMatch.score >= 30) {
      return bestMatch.value;
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

  // Step 2: Check Persistent Cache (Instant & Free)
  const cache = getPersistentCache();
  if (cache[userInput]) {
    yield cache[userInput];
    return;
  }

  // Step 3: Gemini Fallback (AI Response)
  const keys = [
    (import.meta as any).env?.VITE_GEMINI_API_KEY,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_1,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_2,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_3,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_4,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_5,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_6,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_7,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_8,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_9,
    (import.meta as any).env?.VITE_GEMINI_API_KEY_10,
  ].filter(k => k && k !== "MY_GEMINI_API_KEY");

  if (keys.length === 0) {
    yield "⚠️ API Key missing! Please set VITE_GEMINI_API_KEY in your Vercel Environment Variables.";
    return;
  }

  // Randomly select a key to rotate limits
  const apiKey = keys[Math.floor(Math.random() * keys.length)];
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are the **Official AI Support Assistant for Netaji Subhas Institute of Technology (NSIT) and Netaji Subhas Institute of Polytechnic (NSIP), Bihta**. 
  Your primary mission is to provide **highly professional, exhaustive, and authoritative** information to students, parents, and visitors.

  ### INSTITUTIONAL CONTEXT:
    - **NSIT (B.Tech):** 4-Year degree affiliated with Aryabhatta Knowledge University (AKU).
    - **NSIP (Diploma/School):** 3-Year Diploma affiliated with SBTE Bihar. Schooling (Nursery to 12th) affiliated with CBSE/Bihar Board.
    - **Location:** Amhara, Bihta, Patna, Bihar - 801103.
    - **Official Website:** ${NSIT_URL}
    - **Virtual Tour:** https://www.nsit.in/tour
    - **Contact:** Email: info@nsit.in | Admission Hotline: 7781020364 / 7781020346

  ### RESPONSE QUALITY STANDARDS (MANDATORY):
    1. **Depth & Detail:** Never give one-line answers. Even for simple questions, provide context. If asked about a specific course, explain the labs, faculty focus, and placement trends.
    2. **Professional Formatting:** Use Markdown religiously. Use **bold text** for emphasis, ### headings for sections, and bullet points for lists.
    3. **Tone:** You are a senior administrative representative. Be welcoming, respectful, and extremely helpful.
    4. **Language:** Use a sophisticated blend of English and Hindi (Hinglish) to ensure the user feels understood, but maintain a high standard of vocabulary.
    5. **Structure:** 
       - Start with a polite greeting or acknowledgment.
       - Provide the main answer in detail.
       - Add a "Pro-Tip" or "Additional Info" section if relevant.
       - End with a call to action (e.g., "Visit the campus for a personal tour" or "Call our admission cell").

  ### KNOWLEDGE DOMAINS:
    - **Admissions:** Explain JEE Main/BCECE/DCECE requirements. Mention the enquiry form and required documents.
    - **Infrastructure:** Highlight the Wi-Fi campus, modern hostels, advanced labs, and central library.
    - **Placements:** Mention top recruiters like TCS, Infosys, and Wipro.
    - **Schooling (NSIP):** Cover Nursery to 12th, safety features (female guards, lady attendants), and smart classes.
    - **Fees & Finance:** Mention Bihar Student Credit Card, scholarships, and installment options.`;

  let fullResponse = "";

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
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

    // Save successful response to persistent cache
    setPersistentCache(userInput, fullResponse);

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
      yield "❌ API Key galat hai ya request mein koi error hai! Kripya Vercel settings check karein.";
    } else if (errorStr.includes("SAFETY")) {
      yield "🛡️ Maaf kijiyega, AI ne is sawal ka jawab dene se mana kar diya hai (Safety Filter). Kripya dusre tarike se puchein.";
    } else {
      // Try to extract a cleaner message if it's JSON
      let cleanMsg = errorMessage;
      try {
        if (errorMessage.includes("{")) {
          const jsonStart = errorMessage.indexOf("{");
          const jsonEnd = errorMessage.lastIndexOf("}") + 1;
          const jsonStr = errorMessage.substring(jsonStart, jsonEnd);
          const parsed = JSON.parse(jsonStr);
          cleanMsg = parsed.error?.message || parsed.message || errorMessage;
        }
      } catch (e) {}
      
      yield `❌ Connection Error: ${cleanMsg.slice(0, 100)}... Try again.`;
    }
  }
}

