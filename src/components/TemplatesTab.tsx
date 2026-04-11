import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layout, Check, Trash2 } from "lucide-react";
import { useFirebaseData, EmailTemplate } from "../lib/store";
import { sanitizeHtml } from "../lib/utils";

interface TemplatesTabProps {
  onUseTemplate: (html: string) => void;
}

interface TemplateCardProps {
  template: EmailTemplate; 
  onUse: (html: string) => void;
  onDelete: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse, onDelete }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; font-family: sans-serif; pointer-events: none; overflow: hidden; }
                * { pointer-events: none !important; }
              </style>
            </head>
            <body>
              ${template.html}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [template.html]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-[450px]"
    >
      <div className="flex-1 relative bg-gray-50 overflow-hidden">
        <iframe 
          ref={iframeRef}
          className="w-full h-full border-none pointer-events-none select-none"
          title="Template Preview"
          style={{ zoom: 0.5, transform: 'scale(0.5)', transformOrigin: '0 0', width: '200%', height: '200%' }}
        />
        <div className="absolute inset-0 z-10 bg-transparent cursor-default" />
        
        <button 
          onClick={() => onDelete(template.id)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 shadow-sm z-20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 bg-white border-t border-gray-50">
        <button 
          onClick={() => onUse(template.html)}
          className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group"
        >
          <Check className="w-4 h-4" />
          Use Template
        </button>
      </div>
    </motion.div>
  );
}

export function TemplatesTab({ onUseTemplate }: TemplatesTabProps) {
  const { data: templates, removeItem, loading } = useFirebaseData<EmailTemplate[]>('templates', []);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteTemplate = async () => {
    if (!deleteConfirmId) return;
    await removeItem(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white text-center p-8">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
          <Layout className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-white">No Templates Found</h2>
        <p className="text-gray-400 max-w-md">
          Create custom emails in the Compose tab and save them as templates to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h1 className="text-2xl font-semibold">Explore Templates</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Browse and reuse your custom email designs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map(template => (
          <TemplateCard 
            key={template.id} 
            template={template} 
            onUse={(html) => onUseTemplate(sanitizeHtml(html))}
            onDelete={(id) => setDeleteConfirmId(id)}
          />
        ))}
      </div>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Delete Template?</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this template? This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteTemplate}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
