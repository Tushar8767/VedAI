import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-16 border-t border-[#E8E1D5] dark:border-[#383127] bg-[#F5F2EB]/60 dark:bg-[#191715]/80 py-8 px-4 text-center text-xs text-stone-600 dark:text-stone-400 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-3">
        <p className="font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
          “AI suggests. Evidence explains. The user decides.”
        </p>
        <p className="max-w-2xl mx-auto text-stone-600 dark:text-stone-400 leading-relaxed font-normal">
          <strong className="text-stone-800 dark:text-stone-200">Important Notice:</strong> VedAI is an educational and personal self-reflection workspace. 
          It does not diagnose mental health conditions, provide psychiatric therapy, or act as an emergency service. 
          If you are in distress, please connect with trusted friends, counselors, or national crisis helplines.
        </p>
        <div className="pt-2 text-stone-500 dark:text-stone-500 font-medium">
          VedAI 2.0 &bull; Private & Encrypted &bull; No Raw Video Stored
        </div>
      </div>
    </footer>
  );
};
