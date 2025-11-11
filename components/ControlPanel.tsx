import React, { useState } from 'react';
import { IconSparkles, IconWand, IconEnhance, IconEraser, IconExpand, IconReplace, IconImagePlus, IconCross, IconSelect, IconUpscale, IconLight, IconCode } from './Icons';
import { filters } from '../config/filters';
import type { Adjustments } from '../types';
import type { ActiveTool, AspectRatio } from '../App';
import { AdjustSlider } from './AdjustSlider';
import { CodePanel } from './CodePanel';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onApply: () => void;
  onRemoveBackground: () => void;
  onReplaceBackground: (prompt: string) => void;
  onEnhance: () => void;
  onUpscale: () => void;
  onRelight: (prompt: string) => void;
  onMagicErase: () => void;
  onMagicExpand: () => void;
  onApplyFilter: (prompt: string) => void;
  isProcessing: boolean;
  hasImage: boolean;
  hasSelection: boolean;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  adjustments: Adjustments;
  setAdjustments: (adjustments: Adjustments) => void;
  onResetAdjustments: () => void;
  activeTool: ActiveTool;
  brushSize: number;
  setBrushSize: (size: number) => void;
  referenceImage: File | null;
  setReferenceImage: (file: File | null) => void;
  onClearMask: () => void;
  onGenerateUi: (prompt: string) => void;
  generatedHtml: string | null;
  generatedCss: string | null;
}

type Tab = 'design' | 'code' | 'tools' | 'filters' | 'adjust';

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const {
    prompt, setPrompt, onApply, onMagicErase, isProcessing, hasImage,
    hasSelection, activeTool, brushSize, setBrushSize, referenceImage,
    setReferenceImage, onClearMask, onGenerateUi, generatedHtml, generatedCss
  } = props;

  const [activeTab, setActiveTab] = useState<Tab>('design');
  const [bgPrompt, setBgPrompt] = useState<string>('');
  const [lightPrompt, setLightPrompt] = useState<string>('');

  const isApplyDisabled = !prompt || isProcessing || !hasImage;

  const TabButton: React.FC<{ tabName: Tab; label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full ${
        activeTab === tabName
          ? 'bg-indigo-600 text-white'
          : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReferenceImage(e.target.files[0]);
    }
  };

  const renderDesignTab = () => {
    if (activeTool === 'select' && !hasSelection) {
      return (
        <div className="p-4 text-center rounded-lg bg-gray-700/50 border border-gray-600 animate-fade-in">
          <IconSelect className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
          <h3 className="font-semibold text-gray-200">Object Selecteren</h3>
          <p className="text-sm text-gray-400 mt-1">
            Klik op een object in de afbeelding om een precieze selectie te maken voor bewerking.
          </p>
        </div>
      );
    }
    
    if (activeTool === 'brush' && hasSelection) {
      return (
         <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600 animate-fade-in space-y-3">
          <div className="flex justify-between items-center">
             <label className="block text-sm font-medium text-gray-300">
              Penseel Bewerken
            </label>
            <button onClick={() => { onClearMask(); }} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <IconCross className="w-3 h-3"/> Masker Wissen
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-400">Penseelgrootte</label>
            <input
              type="range"
              min="5" max="100" value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <textarea
            rows={3}
            className="block w-full rounded-md border-0 bg-gray-700 text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 p-3 transition-colors"
            placeholder={"bv. 'voeg een gloeiende aura toe'"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
          />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onMagicErase} disabled={isProcessing} className="w-full flex justify-center items-center gap-2 rounded-md bg-gray-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-400 transition-all">
              <IconEraser className="w-5 h-5" />
              Magisch Gum
            </button>
            <button type="button" onClick={onApply} disabled={isApplyDisabled} className="w-full flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all">
              <IconSparkles className="w-5 h-5" />
              Genereer
            </button>
          </div>
        </div>
      )
    }
    
    // Default / Global Edit view
    return (
      <div className="animate-fade-in">
        <label htmlFor="prompt-global" className="block text-sm font-medium text-gray-300 mb-2">
          Globaal Bewerken
        </label>
        <textarea
          id="prompt-global"
          rows={4}
          className="block w-full rounded-md border-0 bg-gray-700 text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 p-3 transition-colors"
          placeholder={"bv. 'voeg een zonnebril toe aan de persoon'"}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isProcessing}
        />
        <div className="mt-3">
           <label className="block text-sm font-medium text-gray-300 mb-2">
            Afbeelding als Prompt (Optioneel)
          </label>
          {referenceImage ? (
             <div className="flex items-center gap-2 p-2 rounded-md bg-gray-700">
                <img src={URL.createObjectURL(referenceImage)} alt="Reference" className="w-12 h-12 rounded object-cover" />
                <p className="text-xs text-gray-300 flex-grow truncate">{referenceImage.name}</p>
                <button onClick={() => setReferenceImage(null)} className="p-1 text-gray-400 hover:text-white">
                    <IconCross className="w-4 h-4" />
                </button>
             </div>
          ) : (
             <label htmlFor="reference-img-upload" className="w-full flex justify-center items-center gap-2 rounded-md bg-gray-600/50 px-3.5 py-2.5 text-sm font-semibold text-gray-300 shadow-sm hover:bg-gray-600 transition-all cursor-pointer">
              <IconImagePlus className="w-5 h-5" />
              Upload Referentiebeeld
            </label>
          )}
          <input type="file" id="reference-img-upload" className="hidden" onChange={handleReferenceImageChange} accept="image/*" />
        </div>
        <button type="button" onClick={onApply} disabled={isApplyDisabled} className="w-full mt-3 flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all">
          <IconSparkles className="w-5 h-5" />
          Genereer Varianten
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-6">
         <div className="grid grid-cols-5 space-x-2 p-1 bg-gray-900/50 rounded-lg">
            <TabButton tabName="design" label="Design" />
            <TabButton tabName="code" label="Code" />
            <TabButton tabName="adjust" label="Aanpassen" />
            <TabButton tabName="tools" label="Tools" />
            <TabButton tabName="filters" label="Filters" />
         </div>
      </div>
      
      <div className="flex-grow flex flex-col space-y-6 overflow-y-auto pr-2 -mr-2">
        {activeTab === 'design' && renderDesignTab()}

        {activeTab === 'code' && (
          <CodePanel
            onGenerate={onGenerateUi}
            html={generatedHtml}
            css={generatedCss}
            isProcessing={isProcessing}
          />
        )}

        {activeTab === 'adjust' && (
          <div className="space-y-4 animate-fade-in">
             <div>
              <div className='flex justify-between items-center mb-2'>
                <label className="block text-sm font-medium text-gray-300">
                  Aanpassingen
                </label>
                <button onClick={props.onResetAdjustments} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">Reset</button>
              </div>
              <div className='space-y-4 p-4 rounded-lg bg-gray-900/50'>
                 <AdjustSlider
                    label="Helderheid"
                    value={props.adjustments.brightness}
                    onChange={(e) => props.setAdjustments({...props.adjustments, brightness: +e.target.value})}
                    min={50} max={150} defaultValue={100}
                />
                 <AdjustSlider
                    label="Contrast"
                    value={props.adjustments.contrast}
                    onChange={(e) => props.setAdjustments({...props.adjustments, contrast: +e.target.value})}
                    min={50} max={150} defaultValue={100}
                />
                 <AdjustSlider
                    label="Verzadiging"
                    value={props.adjustments.saturation}
                    onChange={(e) => props.setAdjustments({...props.adjustments, saturation: +e.target.value})}
                    min={0} max={200} defaultValue={100}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Snelle Acties
              </label>
              <div className="grid grid-cols-2 gap-3">
                 <button type="button" onClick={props.onEnhance} disabled={!hasImage || isProcessing} className="w-full flex justify-center items-center gap-2 rounded-md bg-sky-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all">
                  <IconEnhance className="w-5 h-5" />
                  Verbeter
                </button>
                <button type="button" onClick={props.onRemoveBackground} disabled={!hasImage || isProcessing} className="w-full flex justify-center items-center gap-2 rounded-md bg-purple-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all">
                  <IconWand className="w-5 h-5" />
                  Verwijder BG
                </button>
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vervang Achtergrond
              </label>
               <textarea
                    rows={2}
                    className="block w-full rounded-md border-0 bg-gray-700 text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 p-3 transition-colors"
                    placeholder={"bv. 'een rustig strand bij zonsondergang'"}
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                    disabled={isProcessing}
                />
              <button type="button" onClick={() => props.onReplaceBackground(bgPrompt)} disabled={isProcessing || !bgPrompt} className="w-full mt-2 flex justify-center items-center gap-2 rounded-md bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all">
                  <IconReplace className="w-5 h-5" />
                  Genereer
                </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Geavanceerde Gereedschappen
              </label>
              <div className="space-y-4 p-4 rounded-lg bg-gray-900/50">
                 <button type="button" onClick={props.onUpscale} disabled={isProcessing} className="w-full flex justify-center items-center gap-2 rounded-md bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all">
                  <IconUpscale className="w-5 h-5" />
                  AI Opschalen
                </button>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Licht Studio
                  </label>
                   <textarea
                        rows={2}
                        className="block w-full rounded-md border-0 bg-gray-700 text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 p-3 transition-colors"
                        placeholder={"bv. 'dramatisch studiolicht van linksboven'"}
                        value={lightPrompt}
                        onChange={(e) => setLightPrompt(e.target.value)}
                        disabled={isProcessing}
                    />
                  <button type="button" onClick={() => props.onRelight(lightPrompt)} disabled={isProcessing || !lightPrompt} className="w-full mt-2 flex justify-center items-center gap-2 rounded-md bg-amber-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all">
                      <IconLight className="w-5 h-5" />
                      Pas Belichting Toe
                    </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Magisch Uitbreiden
              </label>
              <p className="text-xs text-gray-400 mb-2">Kies een beeldverhouding om het canvas uit te breiden.</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {(['original', '1:1', '4:5', '16:9'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => props.setAspectRatio(r)}
                    className={`p-2 text-xs rounded-md transition-colors font-semibold ${
                      props.aspectRatio === r
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                    }`}
                  >
                    {r === 'original' ? 'Reset' : r}
                  </button>
                ))}
              </div>
                <button type="button" onClick={props.onMagicExpand} disabled={isProcessing || props.aspectRatio === 'original'} className="w-full flex justify-center items-center gap-2 rounded-md bg-teal-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all">
                  <IconExpand className="w-5 h-5" />
                  Genereer
                </button>
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="animate-fade-in">
             <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Filters
              </label>
              <div className="grid grid-cols-2 gap-3">
                {filters.map(filter => (
                  <button
                    key={filter.name}
                    onClick={() => props.onApplyFilter(filter.prompt)}
                    disabled={isProcessing}
                    className="aspect-square flex items-center justify-center p-2 rounded-md text-white font-semibold text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform"
                    style={{
                      background: filter.background,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                    }}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
