import React from 'react';
import type { ActiveTool } from '../App';
import { IconBrush, IconSelect } from './Icons';

interface ToolsSidebarProps {
    activeTool: ActiveTool;
    setActiveTool: (tool: ActiveTool) => void;
}

const ToolButton: React.FC<React.PropsWithChildren<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}>> = ({ label, isActive, onClick, children }) => (
    <button
        onClick={onClick}
        aria-label={label}
        className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors
            ${isActive 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`
        }
    >
        {children}
    </button>
)

export const ToolsSidebar: React.FC<ToolsSidebarProps> = ({ activeTool, setActiveTool }) => {
    return (
        <div className="bg-gray-800/50 rounded-lg p-2 flex flex-col items-center space-y-3">
            <ToolButton label="Penseel" isActive={activeTool === 'brush'} onClick={() => setActiveTool('brush')}>
                <IconBrush className="w-6 h-6" />
            </ToolButton>
            {/* Hiding select tool for now as brush is superior */}
            {/* <ToolButton label="Select Tool" isActive={activeTool === 'select'} onClick={() => setActiveTool('select')}>
                <IconSelect className="w-6 h-6" />
            </ToolButton> */}
        </div>
    )
}
