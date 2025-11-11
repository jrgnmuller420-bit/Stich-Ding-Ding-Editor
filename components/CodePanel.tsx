import React, { useState, useEffect } from 'react';
import { IconCode, IconCopy, IconCheck } from './Icons';

interface CodePanelProps {
    onGenerate: (prompt: string) => void;
    html: string | null;
    css: string | null;
    isProcessing: boolean;
}

const CodeBlock: React.FC<{ title: string; code: string | null }> = ({ title, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
                <button 
                    onClick={handleCopy} 
                    disabled={!code}
                    className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
                >
                    {copied ? <IconCheck className="w-4 h-4 text-green-400" /> : <IconCopy className="w-4 h-4" />}
                    {copied ? 'Gekopieerd!' : 'Kopieer'}
                </button>
            </div>
            <pre className="bg-gray-900/50 border border-gray-700 rounded-md p-3 text-xs text-gray-300 font-mono overflow-x-auto h-32">
                <code>{code || `// ${title} verschijnt hier...`}</code>
            </pre>
        </div>
    );
};


export const CodePanel: React.FC<CodePanelProps> = ({ onGenerate, html, css, isProcessing }) => {
    const [uiPrompt, setUiPrompt] = useState('');
    const [previewContent, setPreviewContent] = useState('');

    useEffect(() => {
        if (html !== null && css !== null) {
            const doc = `
                <html>
                    <head>
                        <style>
                            /* Basic Resets */
                            body, html { margin: 0; padding: 0; font-family: sans-serif; background-color: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                            *, *::before, *::after { box-sizing: border-box; }
                            /* Generated CSS */
                            ${css}
                        </style>
                    </head>
                    <body>
                        ${html}
                    </body>
                </html>
            `;
            setPreviewContent(doc);
        } else {
            setPreviewContent('<html><body style="background-color: #1f2937;"></body></html>');
        }
    }, [html, css]);

    const handleGenerateClick = () => {
        onGenerate(uiPrompt);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genereer UI van Afbeelding
                </label>
                <textarea
                    rows={3}
                    className="block w-full rounded-md border-0 bg-gray-700 text-gray-200 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 p-3 transition-colors"
                    placeholder="bv. 'een hero sectie met een titel en een knop'"
                    value={uiPrompt}
                    onChange={(e) => setUiPrompt(e.target.value)}
                    disabled={isProcessing}
                />
                <button 
                    type="button" 
                    onClick={handleGenerateClick}
                    disabled={isProcessing || !uiPrompt} 
                    className="w-full mt-3 flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-600 disabled:text-gray-400 transition-all"
                >
                    <IconCode className="w-5 h-5" />
                    Genereer UI Code
                </button>
            </div>
            
            <div className="space-y-4">
                <CodeBlock title="HTML" code={html} />
                <CodeBlock title="CSS" code={css} />
            </div>

            <div>
                 <h3 className="text-sm font-semibold text-gray-300 mb-1">Live Preview</h3>
                 <iframe
                    srcDoc={previewContent}
                    title="Live Preview"
                    sandbox="allow-same-origin"
                    className="w-full h-64 border-2 border-gray-700 rounded-md bg-gray-800"
                 />
            </div>
        </div>
    );
};
