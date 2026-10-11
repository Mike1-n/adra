import React, { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { ModuleFeedbackModal } from './ModuleFeedbackModal';

export function FloatingFeedbackButton({ currentModule = 'Field Operations' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Give Module Feedback"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-lg hover:shadow-xl border border-emerald-500/40 transition-all duration-200 hover:scale-105 active:scale-95 no-print cursor-pointer"
        title={`Give feedback on ${currentModule}`}
      >
        <MessageSquarePlus className="w-4 h-4 text-white" />
        <span className="hidden sm:inline font-bold">Feedback</span>
      </button>

      <ModuleFeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultModule={currentModule}
      />
    </>
  );
}
