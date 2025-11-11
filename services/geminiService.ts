import { GoogleGenAI, Modality, Part, GenerateContentResponse, Type } from "@google/genai";

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

const getApiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API-sleutel niet geconfigureerd. Stel de API_KEY omgevingsvariabele in.");
    }
    return new GoogleGenAI({ apiKey });
};

export const editImage = async (
    file: File, 
    prompt: string,
    maskBase64?: string | null,
    referenceImageFile?: File | null
): Promise<string> => {
  const ai = getApiClient();

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

export const selectObject = async (
    file: File,
    coords: { x: number; y: number } // Normalized coordinates
): Promise<string> => {
    const ai = getApiClient();

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.src = objectUrl;
    await new Promise((resolve, reject) => { 
        image.onload = resolve;
        image.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Kon geen canvas context krijgen");
    
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(objectUrl);

    // Teken een duidelijke stip op de kliklocatie
    const dotX = coords.x * image.naturalWidth;
    const dotY = coords.y * image.naturalHeight;
    ctx.beginPath();
    ctx.arc(dotX, dotY, Math.max(5, image.naturalWidth * 0.005), 0, 2 * Math.PI, false);
    ctx.fillStyle = 'magenta';
    ctx.fill();

    const imageWithDotBase64 = canvas.toDataURL(file.type).split(',')[1];

    const parts: Part[] = [
        {
            inlineData: {
                data: imageWithDotBase64,
                mimeType: file.type,
            },
        },
        {
            text: "Genereer een precieze, witte-op-zwarte segmentatiemasker voor het object dat wordt aangegeven door de heldere stip. Het gemaskeerde object moet wit zijn en de achtergrond zwart.",
        },
    ];
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const candidate = response.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("Het verzoek is geblokkeerd vanwege veiligheidsinstellingen. Probeer op een andere plek te klikken.");
    }
    
    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
                return part.inlineData.data;
            }
            if (part.text) {
                throw new Error(`Het model retourneerde tekst in plaats van een masker: "${part.text}"`);
            }
        }
    }
    
    throw new Error("Objectselectie mislukt. Het model heeft geen masker geretourneerd.");
};

export const generateUiCode = async (
    file: File,
    prompt: string
): Promise<{html: string, css: string}> => {
    const ai = getApiClient();
    const imageBase64 = await fileToBase64(file);

    const parts: Part[] = [
        {
            inlineData: {
                data: imageBase64,
                mimeType: file.type,
            },
        },
        {
            text: `Je bent een deskundige webontwikkelaar. Analyseer de meegeleverde afbeelding. Genereer op basis van het verzoek van de gebruiker schone, moderne en responsieve HTML- en CSS-code voor een webcomponent. Het verzoek van de gebruiker is: '${prompt}'. De gegenereerde code moet esthetisch aantrekkelijk zijn en de afbeelding op de juiste manier gebruiken (bijv. als achtergrond, als onderdeel van de inhoud). Gebruik geen externe bibliotheken of frameworks. Retourneer uw antwoord als een enkel JSON-object met twee sleutels: 'html' en 'css'.`,
        },
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    html: { type: Type.STRING, description: 'De gegenereerde HTML-code.' },
                    css: { type: Type.STRING, description: 'De bijbehorende CSS-code.' }
                },
                required: ['html', 'css']
            }
        }
    });

    const jsonString = response.text.trim();
    try {
        const result = JSON.parse(jsonString);
        if (result.html && result.css) {
            return result;
        } else {
            throw new Error("Ongeldig JSON-formaat ontvangen van de API.");
        }
    } catch (e) {
        console.error("Fout bij het parsen van JSON:", jsonString);
        throw new Error("Kon de JSON-reactie van de API niet parsen.");
    }
};
