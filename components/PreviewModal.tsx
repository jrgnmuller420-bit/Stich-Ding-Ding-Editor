import React, { useState } from 'react';
import { IconSparkles, IconCross } from './Icons';

interface PreviewModalProps {
    previews: string[];
    onApply: (selectedSrc: string) => void;
    onCancel: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ previews, onApply, onCancel }) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const handleApplyClick = () => {
        if (selectedIndex >= 0 && selectedIndex < previews.length) {
            onApply(previews[selectedIndex]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl p-6 border border-gray-700 m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Kies een variant</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700">
                        <IconCross className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-grow overflow-y-auto">
                    {previews.map((src, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                                selectedIndex === index ? 'ring-4 ring-indigo-500 shadow-lg' : 'ring-2 ring-gray-700 hover:ring-indigo-600'
                            }`}
                        >
                            <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-contain aspect-square bg-gray-900/50" />
                            {selectedIndex === index && (
                                <div className="absolute inset-0 bg-indigo-500/20 pointer-events-none" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-4 flex-shrink-0">
                    <button 
                        onClick={onCancel}
                        className="px-5 py-2.5 text-sm font-medium rounded-md transition-colors bg-gray-600 text-gray-200 hover:bg-gray-500"
                    >
                        Annuleren
                    </button>
                    <button 
                        onClick={handleApplyClick}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                        <IconSparkles className="w-5 h-5" />
                        Geselecteerde Toepassen
                    </button>
                </div>
            </div>
        </div>
    );
};
