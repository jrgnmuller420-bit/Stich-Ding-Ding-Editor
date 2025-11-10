import React from 'react';

interface AdjustSliderProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
}

export const AdjustSlider: React.FC<AdjustSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 200,
  step = 1,
  defaultValue,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const isDefault = value === defaultValue;

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-300 w-24 capitalize">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
        style={{ 
            background: `linear-gradient(to right, #4f46e5 ${percentage}%, #4b5563 ${percentage}%)`
        }}
      />
      <span className={`text-sm font-mono w-10 text-center rounded-md px-1 ${isDefault ? 'text-gray-500' : 'text-indigo-300'}`}>
        {value}
      </span>
    </div>
  );
};
