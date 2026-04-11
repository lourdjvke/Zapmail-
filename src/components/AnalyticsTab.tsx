import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, MoreHorizontal, ChevronDown, Filter } from "lucide-react";
import { useFirebaseData, EmailJob } from "../lib/store";

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
            className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1"
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

export function AnalyticsTab() {
  const { data: jobs } = useFirebaseData<EmailJob[]>('jobs', []);

  const performanceData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((m, i) => {
      const monthJobs = jobs.filter(j => new Date(j.created).getMonth() === i);
      const success = monthJobs.reduce((acc, j) => acc + (j.sent || 0), 0);
      const failed = monthJobs.reduce((acc, j) => acc + (j.failed || 0), 0);
      return { name: m, success, failed };
    });
  }, [jobs]);

  const stats = useMemo(() => {
    const totalSent = jobs.reduce((acc, j) => acc + (j.sent || 0), 0);
    const totalFailed = jobs.reduce((acc, j) => acc + (j.failed || 0), 0);
    const successRate = totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) : "0";
    
    return [
      { label: "Success Rate", value: `${successRate}%`, trend: "2%", icon: "💬" },
      { label: "Total Sent", value: totalSent.toLocaleString(), trend: "2%", icon: "📩" },
      { label: "Total Failed", value: totalFailed.toLocaleString(), trend: "2%", icon: "❤️" },
      { label: "Active Jobs", value: jobs.filter(j => j.status === 'pending').length.toString(), trend: "2%", icon: "⭐" },
    ];
  }, [jobs]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Organize analytics and track their progress effectively here</p>
        </div>
        <button className="relative overflow-hidden bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 group w-fit whitespace-nowrap">
          <Plus className="w-4 h-4" /> Create Report
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
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
                <input type="checkbox" defaultChecked className="rounded text-emerald-500 focus:ring-emerald-500" />
                <span className="text-gray-600">Succes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-amber-500 focus:ring-amber-500" />
                <span className="text-gray-600">On-going</span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button className="px-3 py-1 rounded-md text-gray-500 hover:text-gray-900 font-medium">All</button>
              <button className="px-3 py-1 bg-white rounded-md text-gray-900 shadow-sm font-medium">Campaigns</button>
              <button className="px-3 py-1 rounded-md text-gray-500 hover:text-gray-900 font-medium">Email</button>
            </div>
            <FilterDropdown label="Period" options={["Last 7 days", "Last 30 days", "This Year"]} />
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
          <h3 className="text-lg font-semibold text-gray-900">Recent Email Jobs</h3>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No email jobs found.</td>
                </tr>
              ) : (
                jobs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()).map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 group transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{job.subject}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        job.status === "pending" ? "border-blue-200 text-blue-600 bg-blue-50" :
                        job.status === "completed" ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                        "border-red-200 text-red-600 bg-red-50"
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${(job.sent / job.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{Math.round((job.sent / job.total) * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{job.sent} / {job.total}</td>
                    <td className="px-4 py-3 text-gray-600">{job.failed}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(job.created).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
