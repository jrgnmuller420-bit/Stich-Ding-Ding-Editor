import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ImageCanvas } from './components/ImageCanvas';
import { EditPanel } from './components/EditPanel';
import { Toolbar } from './components/Toolbar';
import { ToolsSidebar } from './components/ToolsSidebar';
import { SplashScreen } from './components/SplashScreen';
import { editImage, selectObject } from './services/geminiService';
import type { Adjustments } from './types';
import { IconLogo } from './components/Icons';

export type AspectRatio = 'original' | '1:1' | '4:5' | '16:9';
export type ActiveTool = 'brush' | 'select';

function App() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectingObject, setIsSelectingObject] = useState(false);
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
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateHistory = (newSrc: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSrc);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

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
      setActiveTool('brush');
    };
    reader.readAsDataURL(file);
  };
  
  const handleEdit = useCallback(async (editPrompt: string, customMask?: string | null) => {
    onResetAdjustments();

    if (!currentImageSrc || !originalFile) return;
    const currentFileToEdit = await (await fetch(history[historyIndex])).blob();
    const fileToEdit = new File([currentFileToEdit], originalFile.name, { type: originalFile.type });


    setIsLoading(true);
    setLoadingMessage('AI-magie toepassen...');
    setError(null);
    
    const finalMask = customMask === undefined ? mask : customMask;

    try {
      const resultBase64 = await editImage(fileToEdit, editPrompt, finalMask, referenceImage);
      const newSrc = `data:image/png;base64,${resultBase64}`;
      setCurrentImageSrc(newSrc);
      updateHistory(newSrc);
    } catch (e: any) {
      setError(e.message || 'Er is een onbekende fout opgetreden.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setPrompt('');
      onClearMask();
      setReferenceImage(null);
    }
  }, [originalFile, mask, referenceImage, history, historyIndex, currentImageSrc]);
  
  const handleObjectSelect = useCallback(async (coords: { x: number, y: number }) => {
    if (!originalFile) return;

    setIsSelectingObject(true);
    setError(null);
    onClearMask();

    const currentFileForSelection = await(await fetch(history[historyIndex])).blob();
    const fileToSelectFrom = new File([currentFileForSelection], originalFile.name, { type: originalFile.type });

    try {
        const maskBase64 = await selectObject(fileToSelectFrom, coords);
        setMask(maskBase64);
        setActiveTool('brush');
    } catch (e: any) {
        setError(e.message || 'Er is een onbekende fout opgetreden.');
    } finally {
        setIsSelectingObject(false);
        setLoadingMessage('');
    }
  }, [originalFile, history, historyIndex]);

  const onApply = () => handleEdit(prompt);
  const onEnhance = () => handleEdit('Verbeter de kwaliteit van deze afbeelding subtiel, verbeter de helderheid, belichting en kleurbalans zonder dramatische wijzigingen aan te brengen. Laat het eruitzien als een professionele foto.');
  const onUpscale = () => handleEdit('Verbeter de resolutie en scherpte van deze afbeelding aanzienlijk. Genereer fijne details en texturen opnieuw om een high-definition resultaat te creëren, terwijl de originele compositie en onderwerpen behouden blijven.');
  const onRelight = (lightPrompt: string) => handleEdit(`Pas de belichting van de afbeelding aan volgens deze beschrijving: ${lightPrompt}. Behoud de originele inhoud en compositie, verander alleen de lichtomstandigheden, schaduwen en highlights.`);
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
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentImageSrc(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      onResetAdjustments();
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentImageSrc(history[newIndex]);
    }
  };
  
  const handleDownload = async () => {
    const link = document.createElement('a');

    if (currentImageSrc) {
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
                onUpscale={onUpscale}
                onRelight={onRelight}
                onMagicErase={onMagicErase}
                onMagicExpand={onMagicExpand}
                onApplyFilter={onApplyFilter}
                isProcessing={isLoading || isSelectingObject}
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
                isProcessing={isLoading || isSelectingObject}
              />
              <div className="flex-grow flex items-center justify-center min-h-0 relative gap-4">
                 <ToolsSidebar activeTool={activeTool} setActiveTool={setActiveTool} />
                 <div className="flex-grow h-full relative">
                    <ImageCanvas
                        imageSrc={currentImageSrc}
                        onMaskChange={setMask}
                        isLoading={isLoading}
                        isSelectingObject={isSelectingObject}
                        loadingMessage={loadingMessage}
                        aspectRatio={aspectRatio}
                        adjustments={adjustments}
                        activeTool={activeTool}
                        brushSize={brushSize}
                        onCanvasResize={setCanvasSize}
                        maskVersion={maskVersion}
                        onObjectSelect={handleObjectSelect}
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