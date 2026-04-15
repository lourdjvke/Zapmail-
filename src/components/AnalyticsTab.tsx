import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, MoreHorizontal, ChevronDown, Filter, ArrowRight, Users, Mail, X } from "lucide-react";
import { useFirebaseData, EmailJob, useAuth, Lead, BroadcastList, TrackingEvent } from "../lib/store";

function FilterDropdown({ label, options, badge, onSelect }: { label: string, options: string[], badge?: number, onSelect?: (opt: string) => void }) {
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
            className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1"
          >
            {options.map(opt => (
              <button 
                key={opt}
                onClick={() => { setSelected(opt); setIsOpen(false); if (onSelect) onSelect(opt); }}
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

export function AnalyticsTab() {
  const { data: jobs, updateItem, loading } = useFirebaseData<EmailJob[]>('outgoing_emails', []);
  const { data: leads } = useFirebaseData<Lead[]>('leads', []);
  const { data: tier } = useFirebaseData<string>('tier', 'tier_1');
  const { addItem: addBroadcast } = useFirebaseData<BroadcastList[]>('broadcasts', []);
  const { user } = useAuth();
  const [period, setPeriod] = useState("This Year");
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"History" | "Running">("History");
  const [trackingJob, setTrackingJob] = useState<EmailJob | null>(null);
  const [isBroadcastPopupOpen, setIsBroadcastPopupOpen] = useState(false);
  const [newBroadcastName, setNewBroadcastName] = useState("");

  // Body scroll lock
  useEffect(() => {
    if (trackingJob) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [trackingJob]);

  const cancelJob = async (jobId: string) => {
    if (!user) return;
    
    try {
      await updateItem(jobId, { status: 'cancelled' });
      alert("Job cancelled successfully.");
    } catch (error) {
      console.error("Cancel Error:", error);
      alert("Failed to cancel job.");
    }
  };

  const performanceData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let filteredJobs = jobs;
    
    if (period === "Last 7 days") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      filteredJobs = jobs.filter(j => (j.lastUpdated || 0) >= weekAgo);
    } else if (period === "Last 30 days") {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      filteredJobs = jobs.filter(j => (j.lastUpdated || 0) >= monthAgo);
    }

    if (filter === "Success") {
      filteredJobs = filteredJobs.filter(j => j.status === 'done');
    } else if (filter === "Ongoing") {
      filteredJobs = filteredJobs.filter(j => j.status !== 'done' && j.status !== 'cancelled');
    }

    return months.map((m, i) => {
      const monthJobs = filteredJobs.filter(j => new Date(j.lastUpdated || 0).getMonth() === i);
      const success = monthJobs.reduce((acc, j) => acc + (j.sent || 0), 0);
      const failed = monthJobs.reduce((acc, j) => acc + (j.failed || 0), 0);
      return { name: m, success, failed };
    });
  }, [jobs, period, filter]);

  const stats = useMemo(() => {
    const totalSent = jobs.reduce((acc, j) => acc + (j.sent || 0), 0);
    const totalFailed = jobs.reduce((acc, j) => acc + (j.failed || 0), 0);
    const successRate = totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) : "0";
    
    return [
      { label: "Success Rate", value: `${successRate}%`, icon: "💬" },
      { label: "Total Sent", value: totalSent.toLocaleString(), icon: "📩" },
      { label: "Total Failed", value: totalFailed.toLocaleString(), icon: "❤️" },
      { label: "Active Jobs", value: jobs.filter(j => j.status !== 'done' && j.status !== 'cancelled').length.toString(), icon: "⭐" },
    ];
  }, [jobs]);

  const decodeEmail = (encoded: string) => {
    try {
      // Base64 web-safe decoding
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      return atob(base64);
    } catch (e) {
      return encoded;
    }
  };

  const trackingList = useMemo(() => {
    if (!trackingJob?.tracking) return [];
    return (Object.values(trackingJob.tracking) as TrackingEvent[]).sort((a, b) => b.at - a.at);
  }, [trackingJob]);

  const handleCreateBroadcast = async () => {
    if (!newBroadcastName || !trackingJob?.tracking) return;
    
    const openerEmails = trackingList.map(t => decodeEmail(t.reader).toLowerCase());
    const uniqueEmails = Array.from(new Set(openerEmails));
    
    await addBroadcast({
      name: newBroadcastName,
      emails: uniqueEmails,
      created: new Date().toISOString()
    });
    
    setIsBroadcastPopupOpen(false);
    setNewBroadcastName("");
    alert("Broadcast list created successfully!");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-gray-500 animate-pulse">Loading analytics...</p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-gray-900">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Organize analytics and track their progress effectively here</p>
        </div>
        <button className="relative overflow-hidden bg-brand-dark hover:bg-brand-dark/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 group w-fit whitespace-nowrap">
          <Plus className="w-4 h-4" /> Create Report
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-lg">{stat.icon}</div>
                <span className="font-medium text-gray-900">{stat.label}</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall performance</h3>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filter === "All" || filter === "Success"} onChange={() => setFilter(prev => prev === "Success" ? "All" : "Success")} className="rounded text-emerald-500 focus:ring-emerald-500" />
                <span className="text-gray-600">Success</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filter === "All" || filter === "Ongoing"} onChange={() => setFilter(prev => prev === "Ongoing" ? "All" : "Ongoing")} className="rounded text-amber-500 focus:ring-amber-500" />
                <span className="text-gray-600">On-going</span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FilterDropdown label="Period" options={["Last 7 days", "Last 30 days", "This Year"]} onSelect={setPeriod} />
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
              />
              <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="failed" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Email Jobs</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab("History")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "History" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                History
              </button>
              <button 
                onClick={() => setActiveTab("Running")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "Running" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Running
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">Subject</th>
                <th className="px-4 py-3 min-w-[120px]">Status</th>
                <th className="px-4 py-3 min-w-[150px]">Progress</th>
                <th className="px-4 py-3 min-w-[100px]">Sent</th>
                <th className="px-4 py-3 min-w-[100px]">Failed</th>
                <th className="px-4 py-3 min-w-[150px]">Date</th>
                <th className="px-4 py-3 w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(() => {
                const filtered = jobs.filter(job => {
                  const isRunning = ['pending', 'processing', 'scheduled', 'retrying batch...'].includes(job.status);
                  return activeTab === "Running" ? isRunning : !isRunning;
                });

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={activeTab === "Running" ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                        No {activeTab === "Running" ? "running" : "history"} jobs found.
                      </td>
                    </tr>
                  );
                }

                return filtered.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0)).map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 group transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{job.subject || 'No Subject'}</span>
                        {job.recurrence && job.recurrence !== 'none' && (
                          <span className="text-[10px] text-emerald-600 font-medium">🔁 {job.recurrence}</span>
                        )}
                        {job.scheduledFor && job.scheduledFor > Date.now() && (
                          <span className="text-[10px] text-blue-600 font-medium">⏰ {new Date(job.scheduledFor).toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        job.status === "pending" || job.status === "processing" || job.status === "scheduled" ? "border-blue-200 text-blue-600 bg-blue-50" :
                        job.status === "done" || job.status === "completed" ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                        job.status === "cancelled" ? "border-gray-200 text-gray-600 bg-gray-50" :
                        "border-red-200 text-red-600 bg-red-50"
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${((job.sent || 0) / (job.total || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{Math.round(((job.sent || 0) / (job.total || 1)) * 100)}%</span>
                        {tier === 'tier_3' && job.isHtml && (
                          <button 
                            onClick={() => setTrackingJob(job)}
                            className="p-1 text-dodgerblue hover:bg-blue-50 rounded-md transition-colors"
                            title="Track Opens"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{job.sent || 0} / {job.total || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{job.failed || 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {job.lastUpdated ? new Date(job.lastUpdated).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {activeTab === "Running" && ['pending', 'processing', 'scheduled', 'retrying batch...'].includes(job.status) && (
                        <button 
                          onClick={() => cancelJob(job.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium underline underline-offset-2"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking Bottom Sheet / Modal */}
      <AnimatePresence>
        {trackingJob && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTrackingJob(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg z-[70] overflow-hidden flex flex-col h-[75vh] sm:h-auto sm:max-h-[85vh] sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:w-[500px] sm:shadow-2xl"
              style={{ height: '75vh' }}
            >
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-medium text-gray-900">Email Tracking</h2>
                  <button onClick={() => setTrackingJob(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="text-4xl font-light text-gray-900 mb-2">{trackingList.length}</div>
                    <div className="text-sm text-gray-500">Total Unique Opens</div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-dodgerblue rounded-full transition-all duration-1000" 
                        style={{ width: `${(trackingList.length / (trackingJob.sent || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Sent: {trackingJob.sent || 0}</span>
                      <span>Opened: {trackingList.length}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
                      <button 
                        onClick={() => setIsBroadcastPopupOpen(true)}
                        className="text-xs text-dodgerblue hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> broadcast
                      </button>
                    </div>

                    <div className="space-y-3">
                      {trackingList.length > 0 ? trackingList.map((event, i) => {
                        const email = decodeEmail(event.reader);
                        const lead = leads.find(l => l.email.toLowerCase() === email.toLowerCase());
                        const isMobile = /iPhone|Android|iPad/i.test(event.ua);
                        
                        return (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/30">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="text-sm text-gray-900">{lead?.name || email}</div>
                                <div className="text-[10px] text-gray-400">{new Date(event.at).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">{email}</div>
                          </div>
                        );
                      }) : (
                        <div className="text-center py-8 text-gray-400 text-sm">No opens tracked yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Broadcast Creation Popup */}
      <AnimatePresence>
        {isBroadcastPopupOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[80] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBroadcastPopupOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Broadcast</h3>
              <p className="text-sm text-gray-500 mb-6">Create a new list from the {new Set(trackingList.map(t => t.reader)).size} people who opened this email.</p>
              
              <input 
                type="text"
                placeholder="Broadcast Name (e.g. Interested Leads)"
                value={newBroadcastName}
                onChange={(e) => setNewBroadcastName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dodgerblue/20 focus:border-dodgerblue outline-none transition-all mb-6"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsBroadcastPopupOpen(false)}
                  className="flex-1 py-2 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateBroadcast}
                  disabled={!newBroadcastName}
                  className="flex-1 py-2 rounded-xl bg-dodgerblue text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Create List
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .text-dodgerblue { color: #1e90ff; }
        .bg-dodgerblue { background-color: #1e90ff; }
        .focus\\\\:ring-dodgerblue\\\\/20:focus { --tw-ring-color: rgba(30, 144, 255, 0.2); }
        .focus\\\\:border-dodgerblue:focus { border-color: #1e90ff; }
      `}</style>
    </motion.div>
  );
}
