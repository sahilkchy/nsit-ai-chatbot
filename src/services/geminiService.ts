const NSIT_URL = "https://www.nsit.in/";

export interface Message {
  role: "user" | "model";
  text: string;
}

export async function* chatWithNSITStream(history: Message[], userInput: string) {
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
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, userInput, systemInstruction }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorStr = JSON.stringify(errorData).toUpperCase();
      
      if (errorStr.includes("API_KEY_INVALID") || errorStr.includes("INVALID_ARGUMENT")) {
        throw new Error("API_KEY_INVALID: Your Gemini API Key is incorrect. Please check your Vercel/Environment settings.");
      }
      if (errorStr.includes("API KEY MISSING")) {
        throw new Error("API_KEY_MISSING: Please set GEMINI_API_KEY in your Vercel Environment Variables.");
      }
      throw new Error(errorData.error || "Failed to connect to server");
    }

    const data = await response.json();
    
    // Since we switched to a non-streaming server endpoint for simplicity and reliability,
    // we yield the full text at once.
    if (data.text) {
      yield data.text;
    }
  } catch (error: any) {
    console.error("Chat Error:", error);
    const errorStr = error.message.toUpperCase();
    if (errorStr.includes("429") || errorStr.includes("QUOTA") || errorStr.includes("LIMIT")) {
      yield "⚠️ AI ki limit khatam ho gayi hai. Kripya 20 second ruk kar fir se try karein. 🙏";
    } else if (errorStr.includes("API KEY MISSING")) {
      yield "❌ Server par API Key nahi mili! Kripya Vercel settings mein GEMINI_API_KEY set karein.";
    } else {
      yield `❌ Error: ${error.message.slice(0, 100)}...`;
    }
  }
}
