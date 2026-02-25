import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const NSIT_URL = "https://www.nsit.in/";

export interface Message {
  role: "user" | "model";
  text: string;
}

/**
 * ULTRA-FAST SOLUTION (< 1s):
 * 1. ThinkingLevel.LOW: Minimizes reasoning latency.
 * 2. Compact Prompt: Reduces token processing time.
 * 3. Streaming: First word appears almost instantly.
 */
export async function* chatWithNSITStream(history: Message[], userInput: string) {
  // Robust API Key selection for different platforms (Vite/Vercel/Local)
  const apiKey = 
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) || 
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "");

  if (!apiKey) {
    yield "⚠️ API Key missing! Please set GEMINI_API_KEY in your environment settings.";
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `NSIT Bihta Assistant. Use info below ONLY.
    - Site: ${NSIT_URL}
    - Gallery: ${NSIT_URL}gallery
    - Contact: ${NSIT_URL}contactdetails | info@nsit.in | 7781020364
    - Anti-Ragging: ${NSIT_URL}anti-ragging
    - Virtual Tour: ${NSIT_URL}nsit-virtual-tour
    - AICTE Approval: ${NSIT_URL}approval/aicte_approval
    - NAAC: ${NSIT_URL}naac
    - DVV: ${NSIT_URL}dvv
    - Enquiry/Form: ${NSIT_URL}enquiry
    - About Us: ${NSIT_URL}about-us
    - Toppers: ${NSIT_URL}topper
    - NSIT vs NSIP Comparison:
        * NSIT: Netaji Subhas Institute of Technology | B.Tech (Degree) | 4 Years | Eligibility: 12th (PCM) | Affiliation: AKU.
        * NSIP: Netaji Subhas Institute of Polytechnic | Diploma | 3 Years | Eligibility: 10th Pass | Affiliation: SBTE Bihar.
    - Courses: B.Tech (CSE, ECE, ME, CE, EEE)
    - Admission: JEE Main/BCECE
    - Logins: ${NSIT_URL}student-login
    - Facilities: Hostel, Wi-Fi, Library, Transport, Labs
    - Formatting: Use emojis, bold text, bullets. Be concise but attractive.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.slice(-4).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: "user", parts: [{ text: userInput }] }
      ],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorStr = JSON.stringify(error).toUpperCase();
    const isQuotaError = 
      errorStr.includes("429") || 
      errorStr.includes("QUOTA") || 
      errorStr.includes("EXHAUSTED") ||
      error?.message?.toUpperCase().includes("429") ||
      error?.message?.toUpperCase().includes("QUOTA");

    if (isQuotaError) {
      yield "⚠️ AI ki limit khatam ho gayi hai (Rate Limit Reached). Kripya 15-20 second ruk kar fir se try karein. 🙏";
    } else {
      yield "Error connecting. Try again.";
    }
  }
}
