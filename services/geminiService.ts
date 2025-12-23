
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult, PropertyDetails } from "../types";

export const extractPropertyData = async (listingUrl: string): Promise<ExtractionResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    INSTRUCTION: You are a professional Real Estate Data Investigator.
    OBJECTIVE: Locate and return the MAXIMUM number of high-resolution property images for this listing: ${listingUrl}

    REASONING STEPS:
    1. EXTRACT ADDRESS: From the URL, determine the physical street address, city, and state.
    2. MULTI-SITE SEARCH: Do not rely solely on the provided URL. Search Google for "[Address] gallery", "[Address] listing photos", and "[Address] interior photos".
    3. CDN DISCOVERY: Look across Zillow, Redfin, Realtor.com, Trulia, Compass, and Estately. 
    4. FIND DIRECT ASSETS: Specifically look for image URLs hosted on CDNs (Content Delivery Networks). 
       Patterns to target:
       - photos.zillowstatic.com (look for filenames ending in _p_f.jpg or _p_h.jpg)
       - ssl.cdn-redfin.com/photo/
       - ar.rdcpix.com/ (Realtor.com)
       - images.kw.com
       - photos.estately.net
    5. IMAGE SET COMPLETION: Real estate listings often have 30-50 photos. Your goal is to find at least 20 unique high-quality links.
    6. FILTERING: Remove any links that lead to maps, street views, agent headshots, or platform logos.

    CRITICAL: Many platforms block direct bot access to the URL. Use Google Search grounding to find the "publicly accessible" versions of these images which are often indexed in Google Images or on secondary listing sites.

    RETURN JSON ONLY.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 32000 }, // Maximize reasoning for deep search
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          address: { type: Type.STRING },
          price: { type: Type.STRING },
          beds: { type: Type.STRING },
          baths: { type: Type.STRING },
          sqft: { type: Type.STRING },
          images: {
            type: Type.ARRAY,
            description: "A comprehensive list of high-res direct image file URLs.",
            items: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING, description: "Direct JPG/PNG link." },
                description: { type: Type.STRING, description: "Room or view description." }
              },
              required: ["url"]
            }
          }
        },
        required: ["address", "images"]
      }
    }
  });

  const rawJson = response.text || "{}";
  let parsedData: PropertyDetails;
  
  try {
    parsedData = JSON.parse(rawJson);
  } catch (e) {
    console.error("Critical JSON Parse Error:", rawJson);
    throw new Error("The search engine was unable to parse the gallery metadata. The listing may be too new or private.");
  }
  
  // Advanced sanitization and deduplication
  if (parsedData.images && Array.isArray(parsedData.images)) {
    const uniqueUrls = new Map<string, string>();
    
    parsedData.images.forEach(img => {
      if (!img.url || typeof img.url !== 'string' || !img.url.startsWith('http')) return;
      
      // Clean URL of tracking params to help deduplication
      const baseUrl = img.url.split('?')[0].split('#')[0];
      
      // Basic heuristic to prioritize high-res versions in common patterns
      if (baseUrl.includes('zillowstatic')) {
        // Prefer _p_f or _p_h versions if available in the URL string
        if (!uniqueUrls.has(baseUrl) || img.url.includes('_p_f') || img.url.includes('_p_h')) {
          uniqueUrls.set(baseUrl, img.url);
        }
      } else {
        if (!uniqueUrls.has(baseUrl)) {
          uniqueUrls.set(baseUrl, img.url);
        }
      }
    });

    parsedData.images = Array.from(uniqueUrls.entries()).map(([base, full]) => {
      const original = parsedData.images.find(i => i.url === full);
      return {
        url: full,
        description: original?.description || "Property View"
      };
    });

    // Final filter for valid image-like URLs
    parsedData.images = parsedData.images.filter(img => 
      /\.(jpg|jpeg|png|webp|avif)/i.test(img.url) || 
      img.url.includes('photo') || 
      img.url.includes('cdn') || 
      img.url.includes('zillowstatic')
    );
  }

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || "Search Result",
    uri: chunk.web?.uri || ""
  })).filter((s: any) => s.uri) || [];

  return {
    property: parsedData,
    sources
  };
};
