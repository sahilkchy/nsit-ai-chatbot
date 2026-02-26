import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const NSIT_URL = "https://www.nsit.in/";

export interface Message {
  role: "user" | "model";
  text: string;
}

export async function* chatWithNSITStream(history: Message[], userInput: string) {
  // Robust API Key selection for client-side
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    yield "⚠️ API Key missing! Please set VITE_GEMINI_API_KEY in your Vercel Environment Variables.";
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are the Official AI Support Assistant for Netaji Subhas Institute of Technology (NSIT), Bihta. 
  Your goal is to provide highly professional, detailed, and helpful information to students, parents, and visitors.
  
  CORE INFORMATION:
    - Official Website: ${NSIT_URL}
    - Photo Gallery: ${NSIT_URL}gallery
    - Contact Details: ${NSIT_URL}contactdetails | Email: info@nsit.in | Phone: 7781020364
    - Anti-Ragging Policy: ${NSIT_URL}anti-ragging
    - Virtual Campus Tour: ${NSIT_URL}nsit-virtual-tour
    - AICTE Approval: ${NSIT_URL}approval/aicte_approval
    - NAAC Accreditation: ${NSIT_URL}naac
    - DVV: ${NSIT_URL}dvv
    - Admission Enquiry Form: ${NSIT_URL}enquiry
    - About the Institution: ${NSIT_URL}about-us
    - Academic Toppers: ${NSIT_URL}topper
    
    - NSIT vs NSIP (Comparison):
        * NSIT (Netaji Subhas Institute of Technology): Offers B.Tech (Degree) | Duration: 4 Years | Eligibility: 12th Pass (PCM) | Affiliated with Aryabhatta Knowledge University (AKU).
        * NSIP (Netaji Subhas Institute of Polytechnic): Offers Diploma | Duration: 3 Years | Eligibility: 10th Pass | Affiliated with SBTE Bihar.
        
    - Available B.Tech Courses: Computer Science & Engineering (CSE), Electronics & Communication Engineering (ECE), Mechanical Engineering (ME), Civil Engineering (CE), Electrical & Electronics Engineering (EEE).
    - Admission Process: Based on JEE Main or BCECE entrance exams.
    - Student Portal: ${NSIT_URL}student-login
    - Campus Facilities: Modern Hostels, High-speed Wi-Fi, Central Library, College Transport, Advanced Labs, and Sports Complex.

  RESPONSE GUIDELINES:
    - Tone: Professional, welcoming, and authoritative.
    - Detail: Provide comprehensive answers. Don't just give a link; explain what the user is asking about first.
    - Structure: Use clear headings, bold text for emphasis, and bullet points for readability.
    - Language: Use a mix of English and Hindi (Hinglish) if appropriate to be more helpful, but keep the core information professional.
    - Formatting: Use relevant emojis to make the conversation engaging.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.slice(-6).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
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
