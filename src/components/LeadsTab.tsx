import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Filter, Eye, Edit2, MoreHorizontal, ChevronDown, X, Upload, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useFirebaseData, Lead } from "../lib/store";


function FilterDropdown({ label, options, onSelect }: { label: string, options: string[], onSelect: (opt: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(label);
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors"
      >
        {selected} 
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
                onClick={() => { setSelected(opt); setIsOpen(false); onSelect(opt); }}
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

export function LeadsTab() {
  const { data: leads, addItem, removeItem, loading } = useFirebaseData<Lead[]>('leads', []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTab, setAddTab] = useState<"manual" | "import">("manual");
  
  // Manual Form
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCompany, setManualCompany] = useState("");

  // Import Form
  const [importText, setImportText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const extractEmails = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  };

  const handleAddManual = async () => {
    if (!manualEmail || !manualName) return;
    const newLead = {
      name: manualName,
      email: manualEmail,
      company: manualCompany || "",
      created: new Date().toLocaleDateString(),
    };
    await addItem(newLead);
    setManualEmail("");
    setManualName("");
    setManualCompany("");
    setIsAddModalOpen(false);
  };

  const handleImport = async () => {
    const extractedEmails = extractEmails(importText);
    if (extractedEmails.length === 0) return;

    for (let i = 0; i < extractedEmails.length; i++) {
      const email = extractedEmails[i];
      await addItem({
        name: `Lead ${leads.length + i + 1}`,
        email,
        created: new Date().toLocaleDateString(),
      });
    }

    setImportText("");
    setIsAddModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportText(prev => prev + " " + text);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleActionSelect = async (action: string) => {
    if (action === "Delete Selected") {
      const idsToDelete = Array.from(selectedIds);
      for (const id of idsToDelete) {
        await removeItem(id as string);
      }
      setSelectedIds(new Set());
    } else if (action === "Export Selected") {
      const selectedLeads = leads.filter(l => selectedIds.has(l.id));
      const csv = "Name,Email,Company,Created\n" + selectedLeads.map(l => `${l.name},${l.email},${l.company || ''},${l.created}`).join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads.csv';
      a.click();
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedLeads.length && paginatedLeads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-gray-500 animate-pulse">Loading leads...</p>
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
          <h1 className="text-2xl font-semibold">Leads Management</h1>
          <p className="text-gray-500 text-sm mt-1">Organize leads and track their progress effectively here</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="relative overflow-hidden bg-brand-dark hover:bg-brand-dark/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 group w-fit"
        >
          <Plus className="w-4 h-4" /> New lead
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Total Leads</div>
          <div className="text-2xl font-bold text-gray-900">{leads.length.toLocaleString()}</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            <FilterDropdown label="Actions" options={["Export Selected", "Delete Selected", "Assign Tag"]} onSelect={handleActionSelect} />
            <span className="text-gray-900 font-medium">{filteredLeads.length} leads <span className="text-gray-500 font-normal">total</span></span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name or email address" 
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === paginatedLeads.length && paginatedLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                  />
                </th>
                <th className="px-4 py-3 min-w-[200px]">Name</th>
                <th className="px-4 py-3 min-w-[200px]">Email</th>
                <th className="px-4 py-3 min-w-[150px]">Company</th>
                <th className="px-4 py-3 min-w-[150px]">Created at</th>
                <th className="px-4 py-3 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No leads found.</td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 group transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{lead.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.company || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{lead.created}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-medium text-gray-900">
              {filteredLeads.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>
            <span>to</span>
            <span className="font-medium text-gray-900">
              {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
            </span>
            <span>of</span>
            <span className="font-medium text-gray-900">{filteredLeads.length}</span>
            <span>leads</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Page</span>
              <span className="font-medium text-gray-900">{currentPage}</span>
              <span className="text-gray-400">of</span>
              <span className="font-medium text-gray-900">{totalPages}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Lead</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
                  <button 
                    onClick={() => setAddTab("manual")}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${addTab === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Manual Entry
                  </button>
                  <button 
                    onClick={() => setAddTab("import")}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${addTab === "import" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Import / Paste
                  </button>
                </div>

                {addTab === "manual" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                      <input 
                        type="email" 
                        value={manualEmail}
                        onChange={e => setManualEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                      <input 
                        type="text" 
                        value={manualCompany}
                        onChange={e => setManualCompany(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paste Emails or CSV Content</label>
                      <textarea 
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[120px] resize-none"
                        placeholder="john@example.com, jane@example.com..."
                      />
                    </div>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-200 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 font-medium">Click to upload CSV</p>
                        </div>
                        <input type="file" className="hidden" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={addTab === "manual" ? handleAddManual : handleImport}
                  disabled={addTab === "manual" ? (!manualEmail || !manualName) : !importText}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {addTab === "manual" ? "Add Lead" : "Import Leads"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Need to add ChevronDown to imports
