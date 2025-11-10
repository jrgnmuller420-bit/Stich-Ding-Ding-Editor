import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ImageCanvas } from './components/ImageCanvas';
import { EditPanel } from './components/EditPanel';
import { Toolbar } from './components/Toolbar';
import { ToolsSidebar } from './components/ToolsSidebar';
import { SplashScreen } from './components/SplashScreen';
import { editImage, generateMotionPhoto } from './services/geminiService';
import type { Adjustments } from './types';
import { IconLogo } from './components/Icons';

export type AspectRatio = 'original' | '1:1' | '4:5' | '16:9';
export type ActiveTool = 'brush';

function App() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  
  const [mask, setMask] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<{width: number, height: number} | null>(null);
  const [maskVersion, setMaskVersion] = useState(0);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 100, contrast: 100, saturation: 100, sharpness: 0 
  });
  const [activeTool, setActiveTool] = useState<ActiveTool>('brush');
  const [brushSize, setBrushSize] = useState(30);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);
  
  useEffect(() => {
    // Check for API key on initial load
    window.aistudio?.hasSelectedApiKey().then(setIsApiKeySelected);
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateHistory = (newSrc: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSrc);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const resetToImageState = () => {
    setVideoSrc(null);
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setOriginalFile(file);
      setCurrentImageSrc(src);
      setHistory([src]);
      setHistoryIndex(0);
      setError(null);
      setPrompt('');
      setMask(null);
      setAspectRatio('original');
      setReferenceImage(null);
      onResetAdjustments();
      resetToImageState();
    };
    reader.readAsDataURL(file);
  };
  
  const handleEdit = useCallback(async (editPrompt: string, customMask?: string | null) => {
    try {
       const keySelected = await window.aistudio.hasSelectedApiKey();
       if (!keySelected) {
         await window.aistudio.openSelectKey();
         setIsApiKeySelected(true); // Assume success to avoid race conditions
       }
     } catch (e) {
        console.error("AISTUDIO_API_KEY_ERROR", e);
        setError("Kan API-sleutel selectie niet openen. Zorg ervoor dat u in de juiste omgeving draait.");
        return;
     }
      
    onResetAdjustments();
    resetToImageState();

    if (!currentImageSrc || !originalFile) return;
    const currentFileToEdit = await (await fetch(history[historyIndex])).blob();

    setIsLoading(true);
    setLoadingMessage('AI-magie toepassen...');
    setError(null);
    
    const finalMask = customMask === undefined ? mask : customMask;

    try {
      const resultBase64 = await editImage(new File([currentFileToEdit], originalFile.name, { type: originalFile.type }), editPrompt, finalMask, referenceImage);
      const newSrc = `data:image/png;base64,${resultBase64}`;
      setCurrentImageSrc(newSrc);
      updateHistory(newSrc);
    } catch (e: any) {
      let errorMessage = e.message || 'Er is een onbekende fout opgetreden.';
      if (typeof errorMessage === 'string' && (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota'))) {
          errorMessage = 'Uw API-sleutel heeft de gratis gebruikslimiet overschreden. Om door te gaan, dient u facturering in te schakelen voor uw project of een andere API-sleutel te selecteren. Zie ai.google.dev/gemini-api/docs/billing voor meer informatie.';
          setIsApiKeySelected(false); // Reset key state to allow re-selection
      } else if (typeof errorMessage === 'string' && errorMessage.includes('Requested entity was not found.')) {
          errorMessage = 'API-sleutel niet gevonden of ongeldig. Selecteer alstublieft opnieuw uw API-sleutel.';
          setIsApiKeySelected(false); // Reset key state
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setPrompt('');
      onClearMask();
      setReferenceImage(null);
    }
  }, [originalFile, mask, referenceImage, history, historyIndex, currentImageSrc]);
  
  const handleGenerateMotionPhoto = async () => {
     if (!currentImageSrc || !originalFile) return;

     try {
       const keySelected = await window.aistudio.hasSelectedApiKey();
       if (!keySelected) {
         await window.aistudio.openSelectKey();
         // Assume the user selected a key. We'll proceed and let the API call fail if they didn't.
         setIsApiKeySelected(true);
       }
     } catch (e) {
        console.error("AISTUDIO_API_KEY_ERROR", e);
        setError("Kan API-sleutel selectie niet openen. Zorg ervoor dat u in de juiste omgeving draait.");
        return;
     }

    resetToImageState();
    onResetAdjustments();
    const currentFileToEdit = await (await fetch(history[historyIndex])).blob();
    
    setIsLoading(true);
    setLoadingMessage('Bewegend beeld genereren... Dit kan enkele minuten duren.');
    setError(null);
    
    try {
        const videoObjectUrl = await generateMotionPhoto(new File([currentFileToEdit], originalFile.name, {type: originalFile.type}));
        setVideoSrc(videoObjectUrl);
    } catch(e: any) {
        let errorMessage = e.message || 'Er is een onbekende fout opgetreden.';
        if (typeof errorMessage === 'string' && (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota'))) {
            errorMessage = 'Uw API-sleutel heeft de gratis gebruikslimiet overschreden. Om door te gaan, dient u facturering in te schakelen voor uw project of een andere API-sleutel te selecteren. Zie ai.google.dev/gemini-api/docs/billing voor meer informatie.';
            setIsApiKeySelected(false); // Reset key state to allow re-selection
        } else if (typeof errorMessage === 'string' && errorMessage.includes('Requested entity was not found.')) {
            errorMessage = 'API-sleutel niet gevonden of ongeldig. Selecteer alstublieft opnieuw uw API-sleutel.';
            setIsApiKeySelected(false); // Reset key state
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const onApply = () => handleEdit(prompt);
  const onEnhance = () => handleEdit('Verbeter de kwaliteit van deze afbeelding subtiel, verbeter de helderheid, belichting en kleurbalans zonder dramatische wijzigingen aan te brengen. Laat het eruitzien als een professionele foto.');
  const onMagicErase = () => handleEdit('Verwijder het geselecteerde object naadloos.', null);
  const onRemoveBackground = () => handleEdit('Verwijder de achtergrond, laat alleen het hoofdonderwerp achter met een transparante achtergrond.');
  const onReplaceBackground = (bgPrompt: string) => handleEdit(`Vervang de achtergrond met: ${bgPrompt}`);
  const onApplyFilter = (filterPrompt: string) => handleEdit(filterPrompt);
  
  const onMagicExpand = () => {
    if (!canvasSize) return;
    const { width, height } = canvasSize;
    handleEdit(`Breid de afbeelding uit om een canvas van ${width}x${height} te vullen. Genereer op intelligente wijze nieuwe inhoud aan de randen die naadloos overvloeit in de originele afbeelding.`);
  };

  const onResetAdjustments = () => {
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100, sharpness: 0 });
  };
  
  const onClearMask = () => {
    setMask(null);
    setMaskVersion(v => v + 1);
  };

  const handleUndo = () => {
    if (canUndo) {
      onResetAdjustments();
      resetToImageState();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentImageSrc(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      onResetAdjustments();
      resetToImageState();
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentImageSrc(history[newIndex]);
    }
  };
  
  const handleDownload = async () => {
    const link = document.createElement('a');

    if (videoSrc) {
       link.href = videoSrc;
       link.download = `artisan-ai-video-${Date.now()}.mp4`;
    } else if (currentImageSrc) {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = currentImageSrc;
        await new Promise(resolve => { image.onload = resolve });
        
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
        ctx.drawImage(image, 0, 0);
        
        link.href = canvas.toDataURL('image/png');
        link.download = `artisan-ai-${Date.now()}.png`;
    } else {
        return;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleReset = () => {
      setOriginalFile(null);
      setCurrentImageSrc(null);
      setHistory([]);
      setHistoryIndex(-1);
      resetToImageState();
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <IconLogo className="w-8 h-8 text-indigo-400"/>
          <h1 className="text-xl font-bold text-gray-100">Artisan AI</h1>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col min-h-0">
        {!currentImageSrc ? (
          <SplashScreen>
            <FileUpload onFileUpload={handleFileUpload} />
          </SplashScreen>
        ) : (
          <div className="flex-grow flex p-4 gap-4 min-h-0">
            <div className="w-4/12 lg:w-3/12 flex-shrink-0 h-full overflow-y-auto pr-2 -mr-2">
              <EditPanel 
                prompt={prompt}
                setPrompt={setPrompt}
                onApply={onApply}
                onRemoveBackground={onRemoveBackground}
                onReplaceBackground={onReplaceBackground}
                onEnhance={onEnhance}
                onMagicErase={onMagicErase}
                onMagicExpand={onMagicExpand}
                onApplyFilter={onApplyFilter}
                onGenerateMotionPhoto={handleGenerateMotionPhoto}
                isProcessing={isLoading}
                hasImage={!!currentImageSrc}
                hasSelection={!!mask}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                adjustments={adjustments}
                setAdjustments={setAdjustments}
                onResetAdjustments={onResetAdjustments}
                activeTool={activeTool}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                referenceImage={referenceImage}
                setReferenceImage={setReferenceImage}
                onClearMask={onClearMask}
              />
            </div>
            
            <div className="flex-grow flex flex-col min-w-0">
              <Toolbar 
                onUndo={handleUndo}
                onRedo={handleRedo}
                onDownload={handleDownload}
                onReset={handleReset}
                canUndo={canUndo}
                canRedo={canRedo}
                isProcessing={isLoading}
              />
              <div className="flex-grow flex items-center justify-center min-h-0 relative gap-4">
                 <ToolsSidebar activeTool={activeTool} setActiveTool={setActiveTool} />
                 <div className="flex-grow h-full relative">
                    <ImageCanvas
                        imageSrc={currentImageSrc}
                        onMaskChange={setMask}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        aspectRatio={aspectRatio}
                        adjustments={adjustments}
                        activeTool={activeTool}
                        brushSize={brushSize}
                        onCanvasResize={setCanvasSize}
                        maskVersion={maskVersion}
                        videoSrc={videoSrc}
                    />
                 </div>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-800/50 border border-red-700 text-red-200 rounded-md text-sm">
                  <strong>Fout:</strong> {error}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

       {currentImageSrc && (
         <footer className="text-center p-3 text-xs text-gray-500 border-t border-gray-800/50 shrink-0">
          Powered by Gemini AI | A JwP Creation
        </footer>
      )}
    </div>
  );
}

export default App;