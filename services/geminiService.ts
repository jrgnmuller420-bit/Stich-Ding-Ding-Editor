import { GoogleGenAI, Modality, Part, GenerateContentResponse } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the data:image/*;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const editImage = async (
    file: File, 
    prompt: string,
    maskBase64?: string | null,
    referenceImageFile?: File | null
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY omgevingsvariabele niet ingesteld.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const originalImageBase64 = await fileToBase64(file);

  const parts: Part[] = [
    {
      inlineData: {
        data: originalImageBase64,
        mimeType: file.type,
      },
    },
    {
      text: prompt,
    },
  ];

  if (maskBase64) {
    parts.push({
      inlineData: {
        data: maskBase64,
        mimeType: 'image/png',
      }
    });
  }
  
  if (referenceImageFile) {
     const referenceImageBase64 = await fileToBase64(referenceImageFile);
     parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: referenceImageFile.type,
      }
    });
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  
  const candidate = response.candidates?.[0];

  if (candidate?.finishReason === 'SAFETY') {
    throw new Error("Het verzoek is geblokkeerd vanwege veiligheidsinstellingen. Pas uw prompt, afbeelding of masker aan.");
  }
  
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
      if (part.text) {
        // Model returned text instead of an image, which is an error condition for this app.
        throw new Error(`Het model retourneerde een tekstreactie in plaats van een afbeelding: "${part.text}"`);
      }
    }
  }

  throw new Error("Het bewerken van de afbeelding is mislukt of er is geen afbeelding geretourneerd. De API-respons was leeg of had een onverwacht formaat.");
};

export const generateMotionPhoto = async (file: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY omgevingsvariabele niet ingesteld.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imageBase64 = await fileToBase64(file);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'Breng deze foto subtiel tot leven met zachte, realistische beweging. Behoud de originele stijl en sfeer.',
        image: {
            imageBytes: imageBase64,
            mimeType: file.type,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            // We laten de aspect ratio over aan het model om de originele verhouding te behouden
        }
    });

    while (!operation.done) {
        // Wacht 5 seconden tussen de polls
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Videogeneratie mislukt. Geen downloadlink ontvangen van de API.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Kon de video niet downloaden. Status: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};
