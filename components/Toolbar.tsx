import React from 'react';
import { IconUndo, IconRedo, IconDownload, IconRefresh } from './Icons';

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isProcessing: boolean;
}

const ToolbarButton: React.FC<React.PropsWithChildren<{ onClick: () => void; disabled: boolean; label: string }>> = ({ onClick, disabled, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="flex items-center gap-2 rounded-md bg-gray-700/50 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
  >
    {children}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export const Toolbar: React.FC<ToolbarProps> = ({ onUndo, onRedo, onDownload, onReset, canUndo, canRedo, isProcessing }) => {
  return (
    <div className="mb-4 bg-gray-800/50 rounded-lg p-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <ToolbarButton onClick={onUndo} disabled={!canUndo || isProcessing} label="Ongedaan maken">
          <IconUndo className="w-5 h-5" />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo || isProcessing} label="Opnieuw">
          <IconRedo className="w-5 h-5" />
        </ToolbarButton>
      </div>
      <div className="flex items-center gap-2">
        <ToolbarButton onClick={onDownload} disabled={isProcessing} label="Downloaden">
           <IconDownload className="w-5 h-5" />
        </ToolbarButton>
        <button
          type="button"
          onClick={onReset}
          disabled={isProcessing}
          className="flex items-center gap-2 rounded-md bg-red-800/50 px-3 py-2 text-sm font-semibold text-red-200 shadow-sm hover:bg-red-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50 transition-all"
        >
          <IconRefresh className="w-5 h-5" />
          <span className="hidden sm:inline">Opnieuw Beginnen</span>
        </button>
      </div>
    </div>
  );
};
