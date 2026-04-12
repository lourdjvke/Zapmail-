import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Monitor } from 'lucide-react';
import { EmailTemplate } from '../lib/store';

interface TemplatePreviewProps {
  template: EmailTemplate;
  onClose: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose }) => {
  const [view, setView] = useState<'mobile' | 'desktop'>('desktop');

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-brand-dark/60 backdrop-blur-sm p-0 sm:p-4">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full h-[90vh] sm:h-[80vh] sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView('mobile')}
              className={`p-2 rounded-lg ${view === 'mobile' ? 'bg-gray-100 text-brand-dark' : 'text-gray-400'}`}
            >
              <Smartphone className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('desktop')}
              className={`p-2 rounded-lg ${view === 'desktop' ? 'bg-gray-100 text-brand-dark' : 'text-gray-400'}`}
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 p-4 flex justify-center overflow-auto">
          <div className={`${view === 'mobile' ? 'w-[375px]' : 'w-full'} bg-white shadow-lg transition-all duration-300`}>
            <iframe 
              className="w-full h-full border-none"
              title="Template Preview"
              srcDoc={`<!DOCTYPE html><html><body>${template.html}</body></html>`}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
