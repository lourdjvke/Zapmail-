import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Brush } from "recharts";
import { ChevronDown, Plus, MoreHorizontal, X, Upload, Users, Save, Search, Edit3, RefreshCw, Trash2 } from "lucide-react";
import { useFirebaseData, useAuth, BroadcastList, Lead, EmailJob } from "../lib/store";
import { fetchEmailsFromRTDB } from "../services/rtdbService";

function FilterDropdown({ label, options, badge }: { label: string, options: string[], badge?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-1 text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap transition-colors"
      >
        {label ? `${label}: ` : ''}{selected} 
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

export function DashboardTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data: broadcastLists, addItem: addBroadcastList, removeItem: removeBroadcastList, updateItem: updateBroadcastList, loading: listsLoading } = useFirebaseData<BroadcastList[]>('broadcast_lists', []);
  const { data: leads, addItem: addLead, loading: leadsLoading } = useFirebaseData<Lead[]>('leads', []);
  const { data: jobs, loading: jobsLoading } = useFirebaseData<EmailJob[]>('outgoing_emails', []);
  const { user } = useAuth();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingListContacts, setViewingListContacts] = useState<BroadcastList | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [editingList, setEditingList] = useState<BroadcastList | null>(null);
  const [listName, setListName] = useState("");
  const [addTab, setAddTab] = useState<"smart" | "manual" | "select" | "rtdb">("smart");
  
  const totalSent = useMemo(() => jobs.reduce((acc, job) => acc + (job.sent || 0), 0), [jobs]);
  const totalFailed = useMemo(() => jobs.reduce((acc, job) => acc + (job.failed || 0), 0), [jobs]);

  const monthlySent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return jobs.reduce((acc, job) => {
      const date = new Date(job.lastUpdated || 0);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        return acc + (job.sent || 0);
      }
      return acc;
    }, 0);
  }, [jobs]);
  
  const vitalsStats = [
    { label: "AI usage", value: "84%", percent: "High" },
    { label: "Sent", value: monthlySent.toLocaleString(), percent: "This Month" },
    { label: "Failed", value: totalFailed.toLocaleString(), percent: "Total" },
    { label: "Contacts", value: leads.length.toLocaleString(), percent: "Total" },
  ];

  const emailData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Create array for all days in month up to today
    const data = [];
    for (let i = 1; i <= currentDay; i++) {
      data.push({ name: i.toString(), value: 0 });
    }
    
    jobs.forEach(job => {
      const date = new Date(job.lastUpdated || 0);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        if (day <= currentDay) {
          data[day - 1].value += (job.sent || 0);
        }
      }
    });
    
    return data;
  }, [jobs]);
  
  // Smart Import
  const [smartEmails, setSmartEmails] = useState<string[]>([]);
  const [smartInput, setSmartInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Entry
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [leadSearch, setLeadSearch] = useState("");
  const [rtdbUrl, setRtdbUrl] = useState("");
  const [rtdbFolder, setRtdbFolder] = useState("");
  const [rtdbSubfolders, setRtdbSubfolders] = useState<string[]>([]);
  const [rtdbExplore, setRtdbExplore] = useState(false);
  const [rtdbFieldName, setRtdbFieldName] = useState("email");
  const [rtdbNameFieldName, setRtdbNameFieldName] = useState("");
  const [showSubfolderInput, setShowSubfolderInput] = useState(false);
  const [isRtdbRunning, setIsRtdbRunning] = useState(false);
  const [rtdbResult, setRtdbResult] = useState<{count: number, error?: string} | null>(null);
  const { data: currentTier } = useFirebaseData<string>('tier', 'tier_1');

  const getTierLimits = () => {
    if (currentTier === 'tier_3') return { canExtract: true, maxExtraction: Infinity };
    if (currentTier === 'tier_2') return { canExtract: true, maxExtraction: 250 };
    return { canExtract: false, maxExtraction: 0 };
  };

  const limits = getTierLimits();

  const handleRunExtraction = async () => {
    if (!limits.canExtract) {
      alert("Firebase extraction is not available on your current tier. Please upgrade.");
      return;
    }

    setIsRtdbRunning(true);
    setRtdbResult(null);
    try {
      let results = await fetchEmailsFromRTDB({ 
        url: rtdbUrl, 
        folder: rtdbFolder, 
        subfolders: rtdbSubfolders, 
        explore: rtdbExplore, 
        fieldName: rtdbFieldName,
        nameFieldName: rtdbNameFieldName
      });

      if (results.length > limits.maxExtraction) {
        alert(`Extraction capped at ${limits.maxExtraction} contacts for your tier.`);
        results = results.slice(0, limits.maxExtraction);
      }

      const emails = results.map(r => r.email);
      setSmartEmails(prev => [...new Set([...prev, ...emails])]);
      
      // Add to leads
      for (const res of results) {
        if (!leads.some(l => l.email.toLowerCase() === res.email.toLowerCase())) {
          await addLead({
            name: res.name || res.email.split('@')[0],
            email: res.email,
            created: new Date().toISOString()
          });
        }
      }
      
      setRtdbResult({ count: emails.length });
    } catch (error: any) {
      setRtdbResult({ count: 0, error: error.message });
    } finally {
      setIsRtdbRunning(false);
    }
  };

  if (listsLoading || leadsLoading || jobsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-gray-500 animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  const extractEmails = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  };

  const handleSmartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",") || val.includes(" ")) {
      const newEmails = extractEmails(val);
      if (newEmails.length > 0) {
        setSmartEmails(prev => [...new Set([...prev, ...newEmails])]);
        setSmartInput("");
      } else {
        setSmartInput(val.replace(/[, ]/g, ""));
      }
    } else {
      setSmartInput(val);
    }
  };

  const handleSmartKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newEmails = extractEmails(smartInput);
      if (newEmails.length > 0) {
        setSmartEmails(prev => [...new Set([...prev, ...newEmails])]);
      } else if (smartInput.trim() && smartInput.includes("@")) {
        setSmartEmails(prev => [...new Set([...prev, smartInput.trim()])]);
      }
      setSmartInput("");
    } else if (e.key === "Backspace" && !smartInput && smartEmails.length > 0) {
      setSmartEmails(prev => prev.slice(0, -1));
    }
  };

  const handleSmartPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const newEmails = extractEmails(pastedText);
    if (newEmails.length > 0) {
      setSmartEmails(prev => [...new Set([...prev, ...newEmails])]);
    } else {
      setSmartInput(prev => prev + pastedText);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const newEmails = extractEmails(text);
        setSmartEmails(prev => [...new Set([...prev, ...newEmails])]);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSmartEmail = (emailToRemove: string) => {
    setSmartEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  const handleAddManual = () => {
    if (manualEmail && manualEmail.includes("@")) {
      setSmartEmails(prev => [...new Set([...prev, manualEmail.trim()])]);
      setManualEmail("");
      setManualName("");
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeadIds);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeadIds(newSelected);
  };

  const handleSaveList = async () => {
    let finalEmails = [...smartEmails];
    if (selectedLeadIds.size > 0) {
      const selectedEmails = leads.filter(l => selectedLeadIds.has(l.id)).map(l => l.email);
      finalEmails = [...new Set([...finalEmails, ...selectedEmails])];
    }

    if (!listName.trim() || (finalEmails.length === 0 && addTab !== "rtdb")) return;
    
    if (editingList) {
      await updateBroadcastList(editingList.id, {
        name: listName,
        emails: finalEmails,
        rtdbConfig: addTab === "rtdb" ? {
          url: rtdbUrl || "",
          folder: rtdbFolder || "",
          subfolders: rtdbSubfolders || [],
          explore: !!rtdbExplore,
          fieldName: rtdbFieldName || "email",
          nameFieldName: rtdbNameFieldName || ""
        } : null
      });
      setEditingList(null);
    } else {
      const newList: BroadcastList = {
        id: Date.now().toString(),
        name: listName,
        emails: finalEmails,
        rtdbConfig: addTab === "rtdb" ? {
          url: rtdbUrl || "",
          folder: rtdbFolder || "",
          subfolders: rtdbSubfolders || [],
          explore: !!rtdbExplore,
          fieldName: rtdbFieldName || "email",
          nameFieldName: rtdbNameFieldName || ""
        } : undefined
      };
      await addBroadcastList(newList);
    }
    
    setListName("");
    setSmartEmails([]);
    setSelectedLeadIds(new Set());
    setRtdbUrl("");
    setRtdbFolder("");
    setRtdbSubfolders([]);
    setRtdbExplore(false);
    setRtdbFieldName("email");
    setRtdbNameFieldName("");
    setIsAddModalOpen(false);
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(leadSearch.toLowerCase()) || 
    lead.email.toLowerCase().includes(leadSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="text-gray-900 space-y-4">
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            Hi, {user?.displayName?.split(' ')[0] || 'Anthony'} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-gray-500 max-w-md text-sm leading-relaxed">
            Create a campaign to promote your business more widely and reach potential markets throughout your contacts!
          </p>
          <button onClick={() => onNavigate("Compose")} className="relative overflow-hidden bg-brand-dark hover:bg-brand-dark/90 text-white px-6 py-2.5 rounded-full font-medium transition-colors flex items-center gap-2 group w-fit">
            Start Campaign
            <span className="group-hover:translate-x-1 transition-transform">→</span>
            <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
          </button>
        </div>
        <div className="hidden lg:flex justify-end relative h-48">
          {/* Decorative floating cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute right-0 top-0 bg-white rounded-xl p-4 shadow-xl w-72 z-10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">AW</div>
                  <span className="font-medium">Anthony willie</span>
                </div>
                <span className="text-gray-500">Campaign</span>
                <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Success</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium">JM</div>
                  <span className="font-medium">Jerome Mich</span>
                </div>
                <span className="text-gray-500">Private</span>
                <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Scheduled</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full w-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 w-3/4 rounded-full" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute right-64 top-12 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 z-20"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium">Leads</span>
          </motion.div>
 
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute right-60 top-24 bg-white rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2 z-20 scale-90"
          >
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-xs font-medium text-gray-500">Senders</span>
          </motion.div>
 
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute right-4 -bottom-4 bg-white rounded-xl p-3 shadow-xl z-30 flex flex-col items-center"
          >
            <span className="text-2xl font-bold text-gray-900">12x</span>
            <span className="text-[10px] text-gray-500 font-medium">More effective</span>
          </motion.div>
        </div>
      </div>
 
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Emails Sent Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <style>{`
            .recharts-wrapper:focus, .recharts-surface:focus, .recharts-brush:focus {
              outline: none !important;
            }
          `}</style>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900 font-semibold text-lg">Emails sent</h3>
              <div className="text-3xl font-bold mt-1">{monthlySent.toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Filter:</span>
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">This Month</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={emailData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                style={{ outline: 'none' }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  dy={10}
                  interval={Math.floor(emailData.length / 7)}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }} 
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1000}
                />
                <Brush 
                  dataKey="name" 
                  height={30} 
                  stroke="#10b981" 
                  fill="#f8fafc"
                  gap={1}
                  travellerWidth={10}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* Vitals */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900 font-semibold text-lg">Vitals</h3>
            <button className="flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
              Last 7 days <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-4">
            {vitalsStats.map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</span>
                  <span className="text-[10px] text-gray-400">({stat.percent})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Broadcast List Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-gray-900 font-semibold text-lg">Broadcast Lists</h3>
            <p className="text-gray-500 text-sm mt-1">Manage your recipient lists for targeted campaigns</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-fit"
          >
            <Plus className="w-4 h-4" /> Create List
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {broadcastLists.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
              No broadcast lists created yet. Click "Create List" to get started.
            </div>
          ) : (
            broadcastLists.map(list => (
              <div key={list.id} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-500/30 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{list.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-emerald-500 transition-colors" onClick={() => {
                      setViewingListContacts(list);
                      setContactSearch("");
                    }}>
                      <Users className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-emerald-500 transition-colors" onClick={() => {
                      setEditingList(list);
                      setListName(list.name);
                      setSmartEmails(list.emails);
                      if (list.rtdbConfig) {
                        setRtdbUrl(list.rtdbConfig.url);
                        setRtdbFolder(list.rtdbConfig.folder);
                        setRtdbSubfolders(list.rtdbConfig.subfolders || []);
                        setRtdbExplore(list.rtdbConfig.explore);
                        setRtdbFieldName(list.rtdbConfig.fieldName);
                        setRtdbNameFieldName(list.rtdbConfig.nameFieldName || "");
                        setAddTab("rtdb");
                      }
                      setIsAddModalOpen(true);
                    }}>
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {list.rtdbConfig && (
                      <button className="text-gray-400 hover:text-emerald-500 transition-colors" onClick={async () => {
                        if (!limits.canExtract) {
                          alert("Firebase extraction is not available on your current tier. Please upgrade.");
                          return;
                        }

                        if (list.rtdbConfig) {
                          let results = await fetchEmailsFromRTDB(list.rtdbConfig);
                          if (results.length > limits.maxExtraction) {
                            alert(`Extraction capped at ${limits.maxExtraction} contacts for your tier.`);
                            results = results.slice(0, limits.maxExtraction);
                          }

                          const newEmails = results.map(r => r.email);
                          const updatedEmails = [...new Set([...list.emails, ...newEmails])];
                          await updateBroadcastList(list.id, { emails: updatedEmails });
                          
                          // Add to leads
                          for (const res of results) {
                            if (!leads.some(l => l.email.toLowerCase() === res.email.toLowerCase())) {
                              await addLead({
                                name: res.name || res.email.split('@')[0],
                                email: res.email,
                                created: new Date().toISOString()
                              });
                            }
                          }
                          
                          alert(`Found ${newEmails.length - (list.emails.length - list.emails.filter(e => !newEmails.includes(e)).length)} new emails.`);
                        }
                      }}>
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => removeBroadcastList(list.id)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {list.emails.length} recipient{list.emails.length !== 1 ? 's' : ''}
                  {list.rtdbConfig && (
                    <div className="text-xs text-emerald-600 mt-1 truncate" title={list.rtdbConfig.url}>
                      Connected: {list.rtdbConfig.url}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Broadcast List Modal / Bottom Sheet */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: "100%" }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <h2 className="text-xl font-semibold text-gray-900">Create Broadcast List</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={listName}
                    onChange={e => setListName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="e.g., Q3 Newsletter Subscribers"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg overflow-x-auto flex-nowrap hide-scrollbar">
                    <button 
                      onClick={() => setAddTab("smart")}
                      className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${addTab === "smart" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Smart Import
                    </button>
                    <button 
                      onClick={() => setAddTab("manual")}
                      className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${addTab === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Manual Entry
                    </button>
                    <button 
                      onClick={() => setAddTab("select")}
                      className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${addTab === "select" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Select Contacts
                    </button>
                    <button 
                      onClick={() => setAddTab("rtdb")}
                      className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${addTab === "rtdb" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Firebase RTDB
                    </button>
                  </div>

                  {addTab === "smart" ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 min-h-[120px] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all overflow-hidden items-start">
                        <div className="flex flex-wrap gap-2 w-full items-center pb-1">
                          <AnimatePresence>
                            {smartEmails.map(email => (
                              <motion.span 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                key={email} 
                                className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full text-sm shadow-sm whitespace-nowrap shrink-0"
                              >
                                {email}
                                <button onClick={() => removeSmartEmail(email)} className="text-gray-400 hover:text-red-500 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </motion.span>
                            ))}
                          </AnimatePresence>
                          <input
                            type="text"
                            value={smartInput}
                            onChange={handleSmartInputChange}
                            onKeyDown={handleSmartKeyDown}
                            onPaste={handleSmartPaste}
                            placeholder={smartEmails.length === 0 ? "Paste emails, type and press space/comma..." : ""}
                            className="flex-1 min-w-[200px] bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 py-1 shrink-0"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-200 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">Click to upload CSV or TXT</p>
                          </div>
                          <input type="file" className="hidden" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileUpload} />
                        </label>
                      </div>
                    </div>
                  ) : addTab === "manual" ? (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Optional)</label>
                        <input 
                          type="text" 
                          value={manualName}
                          onChange={e => setManualName(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                        <input 
                          type="email" 
                          value={manualEmail}
                          onChange={e => setManualEmail(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddManual(); }}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                          placeholder="john@example.com"
                        />
                      </div>
                      <button 
                        onClick={handleAddManual}
                        disabled={!manualEmail || !manualEmail.includes('@')}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Add to List
                      </button>
                    </div>
                  ) : addTab === "select" ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          value={leadSearch}
                          onChange={e => setLeadSearch(e.target.value)}
                          placeholder="Search existing leads..."
                          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[240px] overflow-y-auto">
                        {filteredLeads.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 text-sm">No leads found.</div>
                        ) : (
                          filteredLeads.map(lead => (
                            <button key={lead.id} onClick={() => toggleLeadSelection(lead.id)} className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm ${selectedLeadIds.has(lead.id) ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'}`}>
                              <input type="checkbox" checked={selectedLeadIds.has(lead.id)} readOnly />
                              {lead.email}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input type="text" value={rtdbUrl} onChange={e => setRtdbUrl(e.target.value)} placeholder="RTDB URL" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
                      <input type="text" value={rtdbFolder} onChange={e => setRtdbFolder(e.target.value)} placeholder="Folder Name" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
                      
                      <button onClick={() => setShowSubfolderInput(!showSubfolderInput)} className="text-sm text-emerald-600 font-medium">+ Add Subfolder</button>
                      
                      {showSubfolderInput && (
                        <input type="text" placeholder="Subfolder Name" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" onKeyDown={e => {
                          if (e.key === 'Enter') {
                            setRtdbSubfolders([...rtdbSubfolders, e.currentTarget.value]);
                            e.currentTarget.value = '';
                          }
                        }} />
                      )}
                      
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={rtdbExplore} onChange={e => setRtdbExplore(e.target.checked)} />
                          <span className="text-sm text-gray-600">Enable Exploration</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Email Field</label>
                            <input type="text" value={rtdbFieldName} onChange={e => setRtdbFieldName(e.target.value)} placeholder="e.g. email" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Name Field (Optional)</label>
                            <input type="text" value={rtdbNameFieldName} onChange={e => setRtdbNameFieldName(e.target.value)} placeholder="e.g. fullName" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
                          </div>
                        </div>
                        
                        <button 
                          disabled={isRtdbRunning || !rtdbUrl || !rtdbFolder}
                          onClick={handleRunExtraction} 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {isRtdbRunning ? <><RefreshCw className="w-4 h-4 animate-spin" /> Extracting...</> : 'Run Extraction'}
                      </button>

                      {rtdbResult && (
                        <div className={`text-sm p-3 rounded-lg ${rtdbResult.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {rtdbResult.error ? `Error: ${rtdbResult.error}` : `Successfully extracted ${rtdbResult.count} unique emails.`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center sticky bottom-0">
                <div className="text-sm text-gray-500 font-medium">
                  {smartEmails.length + selectedLeadIds.size} contact{smartEmails.length + selectedLeadIds.size !== 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors hidden sm:block"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveList}
                    disabled={!listName.trim() || (smartEmails.length === 0 && selectedLeadIds.size === 0)}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save List
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Contacts Modal */}
      <AnimatePresence>
        {viewingListContacts && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setViewingListContacts(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: "100%" }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: "100%" }} 
              className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{viewingListContacts.name}</h2>
                    <p className="text-xs text-gray-500">{viewingListContacts.emails.length} contacts total</p>
                  </div>
                  <button onClick={() => setViewingListContacts(null)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search contacts by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
                <div className="space-y-3">
                  {viewingListContacts.emails
                    .filter(email => {
                      const lead = leads.find(l => l.email.toLowerCase() === email.toLowerCase());
                      const search = contactSearch.toLowerCase();
                      return email.toLowerCase().includes(search) || (lead?.name || "").toLowerCase().includes(search);
                    })
                    .map(email => {
                      const lead = leads.find(l => l.email.toLowerCase() === email.toLowerCase());
                      return (
                        <div key={email} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-emerald-200 transition-all">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold shrink-0 border border-emerald-100">
                              {(lead?.name || email)[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {lead?.name || <span className="text-gray-400 font-normal italic">Name: ----</span>}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={async () => {
                                const updatedEmails = viewingListContacts.emails.filter(e => e !== email);
                                await updateBroadcastList(viewingListContacts.id, { emails: updatedEmails });
                                setViewingListContacts({ ...viewingListContacts, emails: updatedEmails });
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Remove from list"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  
                  {viewingListContacts.emails.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-gray-900 font-medium">No contacts found</h3>
                      <p className="text-sm text-gray-500 mt-1">This broadcast list is currently empty.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
