import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layout, Check, Trash2, Heart, Filter, Share2 } from "lucide-react";
import { useFirebaseData, useAllUsersTemplates, EmailTemplate, useAuth } from "../lib/store";
import { TemplatePreview } from "./TemplatePreview";

interface TemplatesTabProps {
  onUseTemplate: (template: EmailTemplate) => void;
}

interface TemplateCardProps {
  template: EmailTemplate; 
  onUse: (template: EmailTemplate) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (template: EmailTemplate) => void;
  onShare?: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  isGlobal?: boolean;
  canShare?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse, onDelete, onToggleFavorite, onShare, onPreview, isGlobal, canShare }) => {
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
      <div className="flex-1 relative bg-gray-50 overflow-hidden cursor-pointer" onClick={() => onPreview(template)}>
        <iframe 
          ref={iframeRef}
          className="w-full h-full border-none pointer-events-none select-none"
          title="Template Preview"
          style={{ zoom: 0.5, transform: 'scale(0.5)', transformOrigin: '0 0', width: '200%', height: '200%' }}
        />
        <div className="absolute inset-0 z-10 bg-transparent" />
        
        {isGlobal && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-brand-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-sm z-20">
            Community
          </div>
        )}

        {!isGlobal && onToggleFavorite && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(template); }}
            className={`absolute top-3 left-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl transition-all shadow-sm z-20 ${template.favorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          >
            <Heart className={`w-4 h-4 ${template.favorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {!isGlobal && onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 shadow-sm z-20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {!isGlobal && canShare && onShare && (
          <button 
            onClick={(e) => { e.stopPropagation(); onShare(template); }}
            className="absolute top-14 right-3 p-2 bg-white/90 backdrop-blur-sm text-emerald-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-50 shadow-sm z-20"
            title="Share to Community"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-50">
        <button 
          onClick={() => onUse(template)}
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
  const { user } = useAuth();
  const { data: currentTier } = useFirebaseData<string>('tier', 'tier_1');
  const { data: myTemplates, removeItem, updateItem, loading: loadingMy } = useFirebaseData<EmailTemplate[]>('templates', []);
  const { data: allUsersTemplates, loading: loadingAll } = useAllUsersTemplates();
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [filter, setFilter] = useState<'All' | 'By me' | 'Saved'>('All');
  const [visibleCount, setVisibleCount] = useState(8);

  const isPremium = currentTier === 'tier_2' || currentTier === 'tier_3';

  const handleDeleteTemplate = async () => {
    if (!deleteConfirmId) return;
    await removeItem(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleToggleFavorite = async (template: EmailTemplate) => {
    await updateItem(template.id, { favorite: !template.favorite });
  };

  const filteredTemplates = useMemo(() => {
    // If premium, "All" includes everyone's templates from their private folders
    // If Tier 1, "All" is just their own templates
    let base = isPremium ? allUsersTemplates : myTemplates.map(t => ({ ...t, uid: user?.uid }));

    let filtered = [...base];

    if (filter === 'Saved') {
      filtered = filtered.filter(t => t.favorite && t.uid === user?.uid);
    } else if (filter === 'By me') {
      filtered = filtered.filter(t => t.uid === user?.uid);
    }

    return filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }, [allUsersTemplates, myTemplates, filter, isPremium, user?.uid]);

  const displayedTemplates = filteredTemplates.slice(0, visibleCount);

  if (loadingMy || (isPremium && loadingAll)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const filters = ['All', 'By me', 'Saved'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-gray-900">
        <div>
          <h1 className="text-2xl font-semibold">Explore Templates</h1>
          <p className="text-gray-500 text-sm mt-1">Browse and reuse your custom email designs</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto hide-scrollbar">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === f ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedTemplates.map(template => (
          <TemplateCard 
            key={template.id} 
            template={template} 
            onUse={onUseTemplate}
            onDelete={template.uid === user?.uid ? (id) => setDeleteConfirmId(id) : undefined}
            onToggleFavorite={template.uid === user?.uid ? handleToggleFavorite : undefined}
            onPreview={() => setPreviewTemplate(template)}
            isGlobal={template.uid !== user?.uid}
          />
        ))}
      </div>

      {visibleCount < filteredTemplates.length && (
        <div className="flex justify-center">
          <button 
            onClick={() => setVisibleCount(prev => prev + 8)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
          >
            Load More
          </button>
        </div>
      )}
      
      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <TemplatePreview 
            template={previewTemplate} 
            onClose={() => setPreviewTemplate(null)} 
          />
        )}
      </AnimatePresence>
      
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
