declare var puter: any;

const NSIT_URL = "https://www.nsit.in/";

export interface Message {
  role: "user" | "model";
  text: string;
}

export async function* chatWithNSITStream(history: Message[], userInput: string) {
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
    // Construct the prompt with history and system instruction
    const fullPrompt = `${systemInstruction}\n\nRecent History:\n${history.slice(-4).map(m => `${m.role}: ${m.text}`).join('\n')}\n\nUser: ${userInput}`;

    // Use Puter.js to chat
    const response = await puter.ai.chat(fullPrompt, {
      model: 'google/gemini-2.5-flash'
    });

    // Puter returns the full text. We yield it to match the existing generator interface.
    if (response) {
      // Yield in small chunks to simulate streaming if possible, 
      // or just yield the whole thing if it's already there.
      yield response.toString();
    }
  } catch (error: any) {
    console.error("Puter AI Error:", error);
    yield `❌ Error: ${error?.message || "Could not connect to Puter AI."}`;
  }
}
