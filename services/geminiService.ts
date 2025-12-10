import { GoogleGenAI } from "@google/genai";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateGuitarDetails = async (guitarName: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      // Modified prompt to explicitly ask for a song list
      contents: `Please write a engaging description in Chinese (中文) for the ${guitarName}. 
      Structure:
      1. Brief History & Tone (approx 50 words).
      2. Tonal characteristics (keywords like bright, warm, fat, twangy).
      3. A list of 3 "Classic Songs" (经典曲目) where this guitar's tone is iconic. format as: "- Song Name by Artist".
      Keep the whole response under 200 words.`,
    });
    return response.text || "暂无描述 (No description available).";
  } catch (error) {
    console.error("Text generation failed", error);
    return "描述生成失败，请检查API Key。";
  }
};

export const generateGuitarImage = async (guitarName: string): Promise<string | undefined> => {
  const ai = getClient();
  try {
    // Modified prompt for Vertical Full Body shots
    const basePrompt = "A professional product photography shot of a single electric guitar, VERTICAL orientation, FULL BODY completely visible from headstock to strap button. UNPROPPED, floating in center. Isolated on a clean dark grey studio background. High resolution, 4k.";
    
    let specificDetails = "";
    const lowerName = guitarName.toLowerCase();

    if (lowerName.includes('jazzmaster')) {
      specificDetails = `Fender Jazzmaster. Offset waist body, soapbar pickups, complex switch controls on upper horn and lower bout, tremolo arm.`;
    } else if (lowerName.includes('stratocaster')) {
        specificDetails = `Fender Stratocaster. Double cutaway, 3 single coil pickups, 3 knobs, tremolo bridge.`;
    } else if (lowerName.includes('telecaster')) {
        specificDetails = `Fender Telecaster. Single cutaway, 2 pickups (lipstick neck, slanted bridge), metal control plate with 2 knobs.`;
    } else if (lowerName.includes('les paul')) {
        specificDetails = `Gibson Les Paul. Single cutaway, arch top, 2 humbuckers, 4 knobs, sunburst or goldtop finish.`;
    } else if (lowerName.includes('sg')) {
        specificDetails = `Gibson SG. Thin body, double 'horn' cutaway, cherry red, 2 humbuckers.`;
    } else if (lowerName.includes('335')) {
        specificDetails = `Gibson ES-335. Semi-hollow, f-holes, double cutaway, large body size.`;
    } else {
       specificDetails = `${guitarName} electric guitar.`;
    }

    const fullPrompt = `${basePrompt} ${specificDetails}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: fullPrompt,
      config: {
        // Asking for a square 1:1, but the prompt emphasizes vertical composition within it
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed", error);
  }
  return undefined;
};
