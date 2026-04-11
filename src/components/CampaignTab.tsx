import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Download, Share2, Search, Filter, ChevronDown, X } from "lucide-react";
import { useFirebaseData, useAuth, EmailJob } from "../lib/store";

export function CampaignTab() {
  const { user } = useAuth();
  const { data: campaigns, addItem: addCampaign } = useFirebaseData<any[]>('campaigns', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");

  const handleCreateCampaign = async () => {
    if (!name.trim()) return;
    await addCampaign({
      name,
      status: "Pending",
      audience: "All",
      leads: "0",
      budget: "$0",
      roi: "0%",
      progress: 0,
      isActive: true,
      createdAt: Date.now()
    });
    setName("");
    setIsModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 relative"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Organize campaigns and track their progress effectively here</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="relative overflow-hidden bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 group whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> New Campaigns
            <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">Name</th>
                <th className="px-4 py-3 min-w-[120px]">Status</th>
                <th className="px-4 py-3 min-w-[150px]">Leads Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50/50 group transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{campaign.name}</td>
                  <td className="px-4 py-3 text-gray-600">{campaign.status}</td>
                  <td className="px-4 py-3 text-gray-600">{campaign.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-0 sm:inset-4 sm:top-20 sm:bottom-20 sm:left-auto sm:right-auto sm:mx-auto sm:max-w-md w-full bg-white sm:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Campaign</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Campaign name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Enter campaign name"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateCampaign}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
