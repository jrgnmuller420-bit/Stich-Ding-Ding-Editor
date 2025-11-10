import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Adjustments } from '../types';
import type { ActiveTool, AspectRatio } from '../App';
import { Spinner } from './Spinner';

interface ImageCanvasProps {
  imageSrc: string;
  onMaskChange: (mask: string | null) => void;
  isLoading: boolean;
  loadingMessage: string;
  aspectRatio: AspectRatio;
  adjustments: Adjustments;
  activeTool: ActiveTool;
  brushSize: number;
  onCanvasResize: (size: {width: number, height: number}) => void;
  maskVersion: number;
  videoSrc: string | null;
}

const getAspectRatioValue = (ratio: AspectRatio): number | null => {
    switch (ratio) {
        case '1:1': return 1;
        case '4:5': return 4 / 5;
        case '16:9': return 16 / 9;
        default: return null;
    }
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({ 
    imageSrc, onMaskChange, isLoading, loadingMessage,
    aspectRatio, adjustments, activeTool, brushSize, onCanvasResize,
    maskVersion, videoSrc
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastReportedSize = useRef<{width: number, height: number} | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number, y: number } | null>(null);
  const [canvasDims, setCanvasDims] = useState({width: 0, height: 0});
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0});

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const image = imageRef.current;
    if (!canvas || !container || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
    
    const baseAspectRatio = image.naturalWidth / image.naturalHeight;
    const targetAspectRatio = getAspectRatioValue(aspectRatio) ?? baseAspectRatio;

    let canvasWidth, canvasHeight;

    if (containerWidth / containerHeight > targetAspectRatio) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * targetAspectRatio;
    } else {
        canvasWidth = containerWidth;
        canvasHeight = canvasWidth / targetAspectRatio;
    }
   
    setCanvasDims({width: canvasWidth, height: canvasHeight});

    const originalW = image.naturalWidth;
    const originalH = image.naturalHeight;
    let targetOutputWidth = originalW;
    let targetOutputHeight = originalH;

    if (targetAspectRatio && aspectRatio !== 'original') {
        const originalAR = originalW / originalH;
        if (targetAspectRatio > originalAR) {
            targetOutputWidth = Math.round(originalH * targetAspectRatio);
        } else {
            targetOutputHeight = Math.round(originalW / targetAspectRatio);
        }
    }
    
    if (
        !lastReportedSize.current || 
        lastReportedSize.current.width !== targetOutputWidth || 
        lastReportedSize.current.height !== targetOutputHeight
    ) {
        const newSize = { width: targetOutputWidth, height: targetOutputHeight };
        onCanvasResize(newSize);
        lastReportedSize.current = newSize;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const maskCanvas = maskCanvasRef.current;
    if(maskCanvas) {
        maskCanvas.width = canvasWidth;
        maskCanvas.height = canvasHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let imageDrawWidth, imageDrawHeight, imageOffsetX, imageOffsetY;
    const imageAR = image.naturalWidth / image.naturalHeight;
    const canvasAR = canvas.width / canvas.height;

    if (imageAR > canvasAR) {
        imageDrawWidth = canvas.width;
        imageDrawHeight = imageDrawWidth / imageAR;
        imageOffsetX = 0;
        imageOffsetY = (canvas.height - imageDrawHeight) / 2;
    } else {
        imageDrawHeight = canvas.height;
        imageDrawWidth = imageDrawHeight * imageAR;
        imageOffsetY = 0;
        imageOffsetX = (canvas.width - imageDrawWidth) / 2;
    }
    
    if (aspectRatio !== 'original') {
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d')!;
        patternCanvas.width = 20;
        patternCanvas.height = 20;
        patternCtx.fillStyle = '#4a5568'; // gray-700
        patternCtx.fillRect(0, 0, 20, 20);
        patternCtx.fillStyle = '#2d3748'; // gray-800
        patternCtx.fillRect(0, 0, 10, 10);
        patternCtx.fillRect(10, 10, 10, 10);
        const pattern = ctx.createPattern(patternCanvas, 'repeat')!;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    setImageLayout({ x: imageOffsetX, y: imageOffsetY, width: imageDrawWidth, height: imageDrawHeight });
    
    ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
    ctx.drawImage(image, imageOffsetX, imageOffsetY, imageDrawWidth, imageDrawHeight);
    ctx.filter = 'none';

  }, [aspectRatio, adjustments, onCanvasResize]);

  useEffect(() => {
    const canvas = maskCanvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [maskVersion]);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      imageRef.current = image;
      draw();
    };
  }, [imageSrc, draw]);

  useEffect(() => {
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);
  
  useEffect(draw, [draw, aspectRatio, adjustments]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLoading || videoSrc) return;
    const coords = getCanvasCoords(e);
    
    if (activeTool === 'brush') {
        const maskCtx = maskCanvasRef.current?.getContext('2d');
        if (!maskCtx) return;
        setIsDrawing(true);
        setLastPoint(coords);
        maskCtx.beginPath();
        maskCtx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        maskCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        maskCtx.fill();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || videoSrc) return;
    const coords = getCanvasCoords(e);

    if (activeTool === 'brush' && lastPoint) {
       const maskCtx = maskCanvasRef.current?.getContext('2d');
       if (!maskCtx) return;
       maskCtx.beginPath();
       maskCtx.moveTo(lastPoint.x, lastPoint.y);
       maskCtx.lineTo(coords.x, coords.y);
       maskCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
       maskCtx.lineWidth = brushSize;
       maskCtx.lineCap = 'round';
       maskCtx.lineJoin = 'round';
       maskCtx.stroke();
       setLastPoint(coords);
    }
  };

  const handleMouseUp = () => {
    if (videoSrc) return;
    if (isDrawing && activeTool === 'brush') {
        const maskCanvas = maskCanvasRef.current;
        if(maskCanvas) {
            const finalMaskCanvas = document.createElement('canvas');
            const targetOutputSize = lastReportedSize.current ?? {width: imageRef.current!.naturalWidth, height: imageRef.current!.naturalHeight};
            finalMaskCanvas.width = targetOutputSize.width;
            finalMaskCanvas.height = targetOutputSize.height;

            const finalCtx = finalMaskCanvas.getContext('2d')!;
            
            finalCtx.fillStyle = 'black';
            finalCtx.fillRect(0,0,finalMaskCanvas.width, finalMaskCanvas.height);

            finalCtx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, 0, 0, finalMaskCanvas.width, finalMaskCanvas.height);

            onMaskChange(finalMaskCanvas.toDataURL().split(',')[1]);
        }
    }
    setIsDrawing(false);
    setLastPoint(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
      <div 
        className="relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: canvasDims.width, height: canvasDims.height, cursor: activeTool === 'brush' && !videoSrc ? 'none' : 'crosshair' }}
      >
        {videoSrc ? (
            <video
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-contain rounded-lg"
            />
        ) : (
            <>
                <canvas ref={canvasRef} className="absolute top-0 left-0 rounded-lg" />
                <canvas ref={maskCanvasRef} className="absolute top-0 left-0 pointer-events-none opacity-80" />
            </>
        )}
        
        {activeTool === 'brush' && !videoSrc && (
            <div 
                className="absolute rounded-full border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: lastPoint?.x, 
                    top: lastPoint?.y, 
                    width: brushSize, 
                    height: brushSize,
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}
            />
        )}
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 rounded-lg z-10">
          <Spinner />
          <p className="text-lg text-indigo-300 font-medium text-center px-4">{loadingMessage || 'Even geduld...'}</p>
        </div>
      )}
    </div>
  );
};
