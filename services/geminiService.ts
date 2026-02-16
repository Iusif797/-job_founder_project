import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

// Safely access environment variable to prevent "process is not defined" crash in browser
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.error("Error accessing API key environment variable", e);
  }
  return "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

// Validation Helpers
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

const isValidTelegram = (tg: string) => {
  // Checks for @username or t.me/username patterns
  return /@?[a-zA-Z0-9_]{4,}/.test(tg) || /t\.me\/[a-zA-Z0-9_]{4,}/.test(tg);
};

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const findLeads = async (
  mode: 'freelance' | 'vacancy',
  keyword: string,
  location: string,
  category: string,
  startDate: string,
  endDate: string
): Promise<Lead[]> => {
  const modelId = "gemini-3-flash-preview";

  let locationQuery = location;
  if (location === 'Worldwide') {
    locationQuery = 'Worldwide (focus on USA, Europe, Israel, UK, UAE, CIS, Russia, Asia)';
  } else if (location === 'Israel') {
    locationQuery = 'Israel (Tel Aviv, Jerusalem, Haifa). Focus on Facebook Groups and LinkedIn.';
  }
  
  const categoryQuery = category === 'All' ? 'Web Development, Mobile App Development, UI/UX Design' : `${category} Development`;
  
  // -- MODE SWITCHING LOGIC --
  let socialOperators = "";
  let roleInstruction = "";

  if (mode === 'freelance') {
    // FREELANCE OPERATORS
    socialOperators = [
      `site:t.me "${keyword}" ("vacancy" OR "hiring" OR "нужен" OR "ищу" OR "требуется" OR "order" OR "project")`,
      `site:facebook.com/groups "${keyword}" "hiring"`,
      `site:facebook.com/groups "${keyword}" "looking for developer"`,
      `site:reddit.com/r/forhire "${keyword}"`,
      `intitle:"hiring" "${keyword}" freelance ${location !== 'Worldwide' ? location : ''}`
    ].join(' OR ');

    roleInstruction = "Your mission is to find high-value FREELANCE ORDERS, one-off projects, and short-term gigs.";
  } else {
    // VACANCY / JOB SEARCH OPERATORS
    socialOperators = [
      `site:linkedin.com/jobs "${keyword}" ${location !== 'Worldwide' ? location : ''}`,
      `site:linkedin.com/posts "${keyword}" "hiring"`,
      `site:facebook.com/groups "Jobs in Israel" "${keyword}"`,
      `site:facebook.com/groups "Israel High Tech" "${keyword}"`,
      `site:t.me/s/ "${keyword}" (vacancy OR job OR fulltime)`,
      `site:glassdoor.com "hiring" "${keyword}"`,
      `intitle:"Career" "${keyword}" ${location !== 'Worldwide' ? location : ''}`
    ].join(' OR ');

    roleInstruction = "Your mission is to find LONG-TERM JOB OFFERS, VACANCIES, and EMPLOYMENT opportunities (Full-time/Part-time). If the keyword is 'Vibe Coder' or similar, look for modern, AI-assisted development roles.";
  }

  const prompt = `
    ROLE: You are an Elite Global Lead Hunter. ${roleInstruction}
    
    TASK:
    Find at least 15-20 REAL ${mode === 'freelance' ? 'freelance projects' : 'job vacancies'}.
    
    SEARCH PARAMETERS:
    1. KEYWORDS: "${keyword}" (and related tech synonyms).
    2. DEEP SEARCH QUERY: ${socialOperators}
    3. DATE RANGE: Strictly between ${startDate} and ${endDate}.
    4. LOCATION: ${locationQuery}.
    5. CATEGORY: ${categoryQuery}.
    
    PRIORITY SOURCES (DIG DEEP HERE):
    - **FACEBOOK (CRITICAL for Israel/Europe)**: ${mode === 'vacancy' ? 'Search specifically in "Jobs in Israel", "Secret Tel Aviv" and professional groups.' : 'Search for "looking for developer" posts.'}
    - **LINKEDIN**: ${mode === 'vacancy' ? 'Prioritize Company Pages and Job Posts.' : 'Recent posts from founders.'}
    - **TELEGRAM**: Search for public channel posts.
    
    CRITICAL INSTRUCTIONS:
    1. **CONTACT ACCURACY (IMPORTANT)**: 
       - **NEVER INVENT USERNAMES**. Do NOT append "_hr", "_bot", or company names to create a username.
       - EXTRACT EXACTLY AS WRITTEN in the post (e.g., if it says "@alex", return "@alex").
    2. **NO HALLUCINATIONS**: Only return contacts that are explicitly visible.
    
    EXTRACT DATA:
    1. Title & Detailed Description.
    2. Date (YYYY-MM-DD).
    3. Platform (e.g., "Facebook Group", "LinkedIn", "Glassdoor").
    4. URL (Direct link).
    5. Country.
    6. CONTACTS (Extract ALL available):
       - Email
       - Telegram (EXACTLY as written).
       - WhatsApp
       - LinkedIn
       - Facebook (Profile link)
       - Phone
    
    Return JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              date: { type: Type.STRING },
              platform: { type: Type.STRING },
              url: { type: Type.STRING },
              country: { type: Type.STRING, nullable: true },
              contacts: {
                type: Type.OBJECT,
                properties: {
                  email: { type: Type.STRING, nullable: true },
                  phone: { type: Type.STRING, nullable: true },
                  telegram: { type: Type.STRING, nullable: true },
                  whatsapp: { type: Type.STRING, nullable: true },
                  linkedin: { type: Type.STRING, nullable: true },
                  facebook: { type: Type.STRING, nullable: true },
                  instagram: { type: Type.STRING, nullable: true },
                  vk: { type: Type.STRING, nullable: true },
                  contactName: { type: Type.STRING, nullable: true }
                }
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "description", "platform", "url"]
          }
        }
      },
    });

    const rawText = response.text;
    if (!rawText) return [];

    const leads: Omit<Lead, 'id'>[] = JSON.parse(rawText);
    
    // Strict Validation Logic
    const validatedLeads = leads.map(lead => {
      // Validate contacts
      const c = lead.contacts;
      
      const validatedContacts = {
        ...c,
        email: (c.email && isValidEmail(c.email)) ? c.email : undefined,
        phone: (c.phone && isValidPhone(c.phone)) ? c.phone : undefined,
        telegram: (c.telegram && isValidTelegram(c.telegram)) ? c.telegram : undefined,
        whatsapp: (c.whatsapp && isValidPhone(c.whatsapp)) ? c.whatsapp : undefined,
        linkedin: (c.linkedin && isValidUrl(c.linkedin)) ? c.linkedin : undefined,
        facebook: (c.facebook && isValidUrl(c.facebook)) ? c.facebook : undefined,
        instagram: (c.instagram && isValidUrl(c.instagram)) ? c.instagram : undefined,
        vk: (c.vk && isValidUrl(c.vk)) ? c.vk : undefined,
      };

      return {
        ...lead,
        contacts: validatedContacts
      };
    });

    // Filter Logic:
    const actionableLeads = validatedLeads
      .filter(lead => {
        return lead.title && lead.url && lead.url.startsWith('http');
      })
      .map((lead, index) => ({
        ...lead,
        id: `lead-${Date.now()}-${index}`,
        url: lead.url || '#'
      }));

    return actionableLeads;

  } catch (error) {
    console.error("Error fetching leads:", error);
    throw error;
  }
};

export const generateCoverLetter = async (lead: Lead, userSkills: string = "Full Stack Development, React, Node.js"): Promise<string> => {
  const modelId = "gemini-3-flash-preview";
  
  const prompt = `
    Task: Write a short, punchy, and professional freelance cover letter (message) to a potential client.
    
    Client Context:
    - Project Title: "${lead.title}"
    - Description: "${lead.description}"
    - Platform: ${lead.platform}
    - Client Name: ${lead.contacts.contactName || "Client"}
    
    My Profile:
    - Skills: ${userSkills}
    
    Requirements for the message:
    1. Language: ${/[а-яА-Я]/.test(lead.title) ? "Russian" : "English"}.
    2. Tone: Professional but conversational. Not robotic.
    3. Structure: 
       - Brief greeting.
       - Acknowledge their specific problem/need mentioned in description.
       - Briefly state why I can solve it (referencing my skills).
       - Call to action (e.g., "Let's discuss details").
    4. Length: Short! Suitable for a Telegram DM or a quick Email. Max 100-150 words.
    5. Do not include placeholders like [Your Name], just sign off as "Developer".
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating proposal:", error);
    return "Error generating proposal. Please try again.";
  }
};