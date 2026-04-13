import React from "react";
import { motion } from "motion/react";
import { FileText, Trash2 } from "lucide-react";
import { useFirebaseData, Draft } from "../lib/store";

export function DraftsTab() {
  const { data: drafts, removeItem, loading } = useFirebaseData<Draft[]>('drafts', []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-gray-500 animate-pulse">Loading drafts...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-gray-900">
        <h1 className="text-2xl font-semibold">Drafts</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and continue your saved email drafts</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {drafts.map((draft) => (
                <tr key={draft.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{draft.subject || "(No Subject)"}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(draft.updatedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => removeItem(draft.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
