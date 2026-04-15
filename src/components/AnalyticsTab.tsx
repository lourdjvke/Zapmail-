import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, MoreHorizontal, ChevronDown, Filter } from "lucide-react";
import { useFirebaseData, EmailJob, useAuth } from "../lib/store";

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
  const { user } = useAuth();
  const [period, setPeriod] = useState("This Year");
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"History" | "Running">("History");

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

    return months.map((m, i) => {
      const monthJobs = filteredJobs.filter(j => new Date(j.lastUpdated || 0).getMonth() === i);
      const success = monthJobs.reduce((acc, j) => acc + (j.sent || 0), 0);
      const failed = monthJobs.reduce((acc, j) => acc + (j.failed || 0), 0);
      return { name: m, success, failed };
    });
  }, [jobs, period]);

  const stats = useMemo(() => {
    const totalSent = jobs.reduce((acc, j) => acc + (j.sent || 0), 0);
    const totalFailed = jobs.reduce((acc, j) => acc + (j.failed || 0), 0);
    const successRate = totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) : "0";
    
    return [
      { label: "Success Rate", value: `${successRate}%`, trend: "2%", icon: "💬" },
      { label: "Total Sent", value: totalSent.toLocaleString(), trend: "2%", icon: "📩" },
      { label: "Total Failed", value: totalFailed.toLocaleString(), trend: "2%", icon: "❤️" },
      { label: "Active Jobs", value: jobs.filter(j => j.status !== 'done').length.toString(), trend: "2%", icon: "⭐" },
    ];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (filter === "Success") return jobs.filter(j => j.status === 'done');
    if (filter === "Ongoing") return jobs.filter(j => j.status !== 'done');
    return jobs;
  }, [jobs, filter]);

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
            <div className="flex items-center gap-1 text-sm">
              <span className="text-emerald-500 font-medium flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                {stat.trend}
              </span>
              <span className="text-gray-500">From last quarter</span>
            </div>
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
                {activeTab === "Running" && <th className="px-4 py-3 w-20">Action</th>}
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
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{job.sent || 0} / {job.total || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{job.failed || 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {job.lastUpdated ? new Date(job.lastUpdated).toLocaleDateString() : 'N/A'}
                    </td>
                    {activeTab === "Running" && (
                      <td className="px-4 py-3">
                        {['pending', 'processing', 'scheduled', 'retrying batch...'].includes(job.status) && (
                          <button 
                            onClick={() => cancelJob(job.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium underline underline-offset-2"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
