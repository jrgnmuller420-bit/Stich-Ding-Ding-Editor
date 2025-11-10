import React from 'react';
import { IconLogo } from './Icons';

export const SplashScreen: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-gray-900 animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <IconLogo className="w-14 h-14 text-indigo-400" />
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Artisan AI
        </h1>
      </div>
      <p className="mt-4 text-lg leading-8 text-gray-400 max-w-2xl">
        De AI-aangedreven creatieve suite voor uw afbeeldingen. Bewerk, transformeer en creëer met de kracht van generatieve AI.
      </p>
       <p className="mt-2 text-sm text-gray-500">A JwP Creation</p>
      <div className="mt-10 w-full">
        {children}
      </div>
    </div>
  );
};
