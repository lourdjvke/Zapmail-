import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Download, Share2, Search, Filter, ChevronDown, X } from "lucide-react";

const initialCampaignsData = [
  { id: 1, name: "Summer Holiday Sale", status: "On-going", audience: "Mature Woman 20-50", leads: "1.289", budget: "$3000", roi: "89%", progress: 89 },
  { id: 2, name: "Black Market", status: "Completed", audience: "Active Gamers 16-30", leads: "4.838", budget: "$4200", roi: "120%", progress: 100 },
  { id: 3, name: "12.12 Birthday Sale", status: "On-going", audience: "All Apps User", leads: "8.266", budget: "$6100", roi: "92%", progress: 90 },
  { id: 4, name: "Valentine's Day Super", status: "Pending", audience: "Adults 20-46", leads: "1.277", budget: "$570", roi: "32%", progress: 12 },
  { id: 5, name: "Happy Mother Day", status: "Completed", audience: "Teenagers and adults", leads: "2.083", budget: "$200", roi: "150%", progress: 100 },
  { id: 6, name: "Labour Day Fast Sale", status: "On-going", audience: "All Apps User", leads: "1.379", budget: "$750", roi: "86%", progress: 36 },
  { id: 7, name: "Back to School", status: "On-going", audience: "School Children", leads: "6.278", budget: "$3.838", roi: "95%", progress: 60 },
  { id: 8, name: "Tech Fest 2024", status: "Failed", audience: "Tech Enthusiast", leads: "2.300", budget: "$1500", roi: "-12%", progress: 89 },
  { id: 9, name: "Ramadhan Crazy Sale", status: "Completed", audience: "Muslim & Muslimah", leads: "7.500", budget: "$5600", roi: "240%", progress: 100 },
  { id: 10, name: "New Year Spectacular", status: "Completed", audience: "All Categories", leads: "2.600", budget: "$2.700", roi: "140%", progress: 100 },
  { id: 11, name: "Smart Fest Music", status: "Pending", audience: "Music Enthusiast", leads: "4.500", budget: "$5.200", roi: "170%", progress: 90 },
];

function FilterDropdown({ label, options, badge }: { label: string, options: string[], badge?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("All");
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-1 text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap transition-colors"
      >
        {label}: {selected} 
        {badge && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">{badge}</span>}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1"
          >
            {options.map(opt => (
              <button 
                key={opt}
                onClick={() => { setSelected(opt); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selected === opt ? 'text-emerald-600 font-medium bg-emerald-50/50' : 'text-gray-700'}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CampaignTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState(initialCampaignsData.map(c => ({...c, isActive: c.status !== "Failed"})));

  const toggleCampaign = (id: number) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
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
          <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or email address" 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <FilterDropdown label="Status" options={["All", "On-going", "Completed", "Pending", "Failed"]} />
            <FilterDropdown label="Senders" options={["All", "Marketing Team", "Sales Team", "Support"]} badge={2} />
            <FilterDropdown label="Tags" options={["All", "Holiday", "Promo", "Newsletter"]} />
            <FilterDropdown label="Creators" options={["All", "John Doe", "Jane Smith", "System"]} />
            <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 font-medium whitespace-nowrap transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                </th>
                <th className="px-4 py-3 min-w-[200px]">Name</th>
                <th className="px-4 py-3 min-w-[120px]">Status</th>
                <th className="px-4 py-3 min-w-[180px]">Target Audience</th>
                <th className="px-4 py-3 min-w-[150px]">Leads Generated</th>
                <th className="px-4 py-3 min-w-[100px]">Budget</th>
                <th className="px-4 py-3 min-w-[80px]">ROI</th>
                <th className="px-4 py-3 min-w-[150px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50/50 group transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleCampaign(campaign.id)}
                        className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${
                          campaign.isActive ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      >
                        <motion.div 
                          layout
                          className="w-4 h-4 bg-white rounded-full shadow-sm"
                          animate={{ x: campaign.isActive ? 16 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                      <span className="font-medium text-gray-900">{campaign.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      campaign.status === "On-going" ? "border-blue-200 text-blue-600 bg-blue-50" :
                      campaign.status === "Completed" ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                      campaign.status === "Pending" ? "border-amber-200 text-amber-600 bg-amber-50" :
                      "border-red-200 text-red-600 bg-red-50"
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{campaign.audience}</td>
                  <td className="px-4 py-3 text-gray-600">{campaign.leads}</td>
                  <td className="px-4 py-3 text-gray-600">{campaign.budget}</td>
                  <td className="px-4 py-3 text-gray-600">{campaign.roi}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            campaign.status === "Failed" ? "bg-red-500" :
                            campaign.status === "Pending" ? "bg-amber-500" :
                            "bg-emerald-500"
                          }`}
                          style={{ width: `${campaign.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{campaign.progress}%</span>
                    </div>
                  </td>
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-4 bottom-4 right-4 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create campaigns</h2>
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
                    defaultValue="Crazy July Sale!"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start date</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="text" 
                      placeholder="DD / MM / YYYY"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Start Now</span>
                      <button className="w-10 h-6 bg-emerald-500 rounded-full relative transition-colors">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <div className="relative">
                    <select className="w-full px-4 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                      <option>Product Selling</option>
                      <option>Newsletter</option>
                      <option>Announcement</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Goals</label>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg min-h-[42px]">
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      Best Sales <X className="w-3 h-3 cursor-pointer" />
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      Leading Product <X className="w-3 h-3 cursor-pointer" />
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      Get Attention <X className="w-3 h-3 cursor-pointer" />
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-2 text-gray-500">
                      <button className="p-1 hover:bg-gray-200 rounded font-bold">B</button>
                      <button className="p-1 hover:bg-gray-200 rounded italic">I</button>
                      <button className="p-1 hover:bg-gray-200 rounded underline">U</button>
                      <div className="w-px h-4 bg-gray-300 mx-1" />
                      <button className="p-1 hover:bg-gray-200 rounded">🔗</button>
                      <button className="p-1 hover:bg-gray-200 rounded">🖼️</button>
                      <button className="p-1 hover:bg-gray-200 rounded">📝</button>
                      <div className="flex-1" />
                      <button className="p-1 hover:bg-gray-200 rounded">↩️</button>
                      <button className="p-1 hover:bg-gray-200 rounded">↪️</button>
                    </div>
                    <textarea 
                      placeholder="Placeholder text..."
                      className="w-full h-32 p-4 resize-none focus:outline-none"
                    />
                    <div className="bg-gray-50 border-t border-gray-200 p-2 text-right text-xs text-gray-400">
                      0/200
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button className="relative overflow-hidden bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors group">
                  Create Campaigns
                  <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
