import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, Send, Paperclip, Image as ImageIcon, Type, FileText, Users, ChevronDown, Eye, Layout, Edit3, Palette, Trash2, Link as LinkIcon, AlertTriangle, Check } from "lucide-react";
import { useFirebaseData, useAuth, BroadcastList, EmailTemplate, EmailJob } from "../lib/store";

interface ComposeTabProps {
  initialHtml?: string | null;
  onHtmlUsed?: () => void;
}

export function ComposeTab({ initialHtml, onHtmlUsed }: ComposeTabProps) {
  const [composeType, setComposeType] = useState<"plain" | "custom">("plain");
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [broadcastList, setBroadcastList] = useState("None");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isInteractive, setIsInteractive] = useState(false);
  const [editingElement, setEditingElement] = useState<{
    type: 'text' | 'image' | 'background' | 'link';
    id: string;
    value: string;
    bgValue?: string;
    linkText?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: broadcastLists } = useFirebaseData<BroadcastList[]>('broadcast_lists', []);
  const { data: templates, addItem: addTemplate } = useFirebaseData<EmailTemplate[]>('templates', []);
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { data: jobs, addItem: addJob } = useFirebaseData<EmailJob[]>('jobs', []);

  const handleSendEmail = async () => {
    if (!user) return;
    if (emails.length === 0 || !subject || (!content && !htmlContent)) {
      alert("Please fill all fields and add at least one recipient.");
      return;
    }

    setIsSending(true);
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxyf_2Q-JEHEFmdpLvpTwTM63dQXaU8neWBu7-1jCQbTZpjm9RfsN7FrvF5HYUX59pCyA/exec";
    
    const payload = {
      action: "launchBatch",
      userId: user.uid,
      recipients: emails.join(","),
      subject: subject,
      body: composeType === "plain" ? content : htmlContent,
      isHtml: composeType === "custom"
    };

    try {
      // Create a job record in Firebase first
      const jobId = Math.random().toString(36).substr(2, 9);
      await addJob({
        id: jobId,
        status: 'pending',
        total: emails.length,
        sent: 0,
        failed: 0,
        subject: subject,
        created: new Date().toISOString()
      });
      setActiveJobId(jobId);

      // Trigger the Google Apps Script
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      alert("Batch process initiated. Monitoring progress...");
    } catch (error) {
      console.error("Error launching batch:", error);
      alert("Failed to initiate email sending.");
      setIsSending(false);
    }
  };

  const activeJob = jobs.find(j => j.id === activeJobId);

  useEffect(() => {
    if (initialHtml) {
      setComposeType("custom");
      setHtmlContent(initialHtml);
      onHtmlUsed?.();
    }
  }, [initialHtml, onHtmlUsed]);

  const extractEmails = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const newEmails = extractEmails(pastedText);
    if (newEmails.length > 0) {
      setEmails(prev => [...new Set([...prev, ...newEmails])]);
    } else {
      setInputValue(prev => prev + pastedText);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",") || val.includes(" ")) {
      const newEmails = extractEmails(val);
      if (newEmails.length > 0) {
        setEmails(prev => [...new Set([...prev, ...newEmails])]);
        setInputValue("");
      } else {
        setInputValue(val.replace(/[, ]/g, ""));
      }
    } else {
      setInputValue(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newEmails = extractEmails(inputValue);
      if (newEmails.length > 0) {
        setEmails(prev => [...new Set([...prev, ...newEmails])]);
      } else if (inputValue.trim() && inputValue.includes("@")) {
        setEmails(prev => [...new Set([...prev, inputValue.trim()])]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      setEmails(prev => prev.slice(0, -1));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const newEmails = extractEmails(text);
        setEmails(prev => [...new Set([...prev, ...newEmails])]);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url && editorRef.current) {
      const img = `<br/><img src="${url}" alt="inserted image" style="max-width: 100%; border-radius: 8px; margin: 8px 0;" /><br/>`;
      document.execCommand("insertHTML", false, img);
    }
  };

  const handleSelectBroadcastList = (list: BroadcastList | "None") => {
    if (list === "None") {
      setBroadcastList("None");
    } else {
      setBroadcastList(list.name);
      setEmails(prev => [...new Set([...prev, ...list.emails])]);
    }
    setIsBroadcastOpen(false);
  };

  const handleSaveTemplate = async () => {
    const finalHtml = composeType === "plain" ? content : htmlContent;
    if (!finalHtml.trim() || !templateName.trim()) return;

    const newTemplate = {
      name: templateName,
      html: finalHtml,
      created: new Date().toISOString(),
    };

    await addTemplate(newTemplate);
    setIsSaveModalOpen(false);
    setTemplateName("");
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  useEffect(() => {
    if (isPreviewOpen && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; font-family: sans-serif; }
                body.interactive { user-select: none; }
                body.interactive [contenteditable="true"] { user-select: text; }
                [contenteditable="true"] { outline: 2px dashed #10b981; padding: 2px; }
              </style>
            </head>
            <body class="${isInteractive ? 'interactive' : ''}">
              ${htmlContent || '<p style="color: #9ca3af; text-align: center; margin-top: 40px;">No HTML content to preview.</p>'}
              <script>
                // Prevent all link clicks from navigating
                document.body.addEventListener('click', (e) => {
                  const target = e.target;
                  if (target.tagName === 'A' || target.closest('a')) {
                    e.preventDefault();
                  }
                }, true);

                document.body.addEventListener('dblclick', (e) => {
                  e.preventDefault();
                  const target = e.target;
                  
                  if (target.tagName === 'P' || target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'H3' || target.tagName === 'SPAN' || target.tagName === 'DIV') {
                    if (target.closest('a')) return; // Let link handler take over
                    if (target.children.length === 0 || (target.children.length > 0 && target.innerText.trim().length > 0)) {
                      if (!target.id) target.id = 'el-' + Math.random().toString(36).substr(2, 9);
                      window.parent.postMessage({
                        type: 'EDIT_ELEMENT',
                        elementType: 'text',
                        id: target.id,
                        value: target.innerHTML
                      }, '*');
                      
                      if (window.isInteractive) {
                        target.contentEditable = true;
                        target.focus();
                        target.addEventListener('blur', () => {
                          target.contentEditable = false;
                          window.parent.postMessage({
                            type: 'UPDATE_HTML',
                            html: document.body.innerHTML
                          }, '*');
                        }, { once: true });
                      }
                      return;
                    }
                  }

                  if (target.tagName === 'A' || target.closest('a')) {
                    const link = target.tagName === 'A' ? target : target.closest('a');
                    if (!link.id) link.id = 'el-' + Math.random().toString(36).substr(2, 9);
                    window.parent.postMessage({
                      type: 'EDIT_ELEMENT',
                      elementType: 'link',
                      id: link.id,
                      value: link.href,
                      linkText: link.innerText
                    }, '*');
                    return;
                  }

                  if (target.tagName === 'IMG') {
                    if (!target.id) target.id = 'el-' + Math.random().toString(36).substr(2, 9);
                    window.parent.postMessage({
                      type: 'EDIT_ELEMENT',
                      elementType: 'image',
                      id: target.id,
                      value: target.src
                    }, '*');
                    return;
                  }

                  const bgImage = window.getComputedStyle(target).backgroundImage;
                  const bgColor = window.getComputedStyle(target).backgroundColor;
                  if (bgImage !== 'none' || bgColor !== 'rgba(0, 0, 0, 0)') {
                    if (!target.id) target.id = 'el-' + Math.random().toString(36).substr(2, 9);
                    window.parent.postMessage({
                      type: 'EDIT_ELEMENT',
                      elementType: 'background',
                      id: target.id,
                      value: bgColor,
                      bgValue: bgImage
                    }, '*');
                  }
                });

                window.addEventListener('message', (e) => {
                  if (e.data.type === 'SET_INTERACTIVE') {
                    window.isInteractive = e.data.value;
                    if (e.data.value) document.body.classList.add('interactive');
                    else document.body.classList.remove('interactive');
                  }
                  if (e.data.type === 'UPDATE_ELEMENT') {
                    const el = document.getElementById(e.data.id);
                    if (el) {
                      if (e.data.elementType === 'image') {
                        if (e.data.action === 'delete') el.remove();
                        else el.src = e.data.value;
                      } else if (e.data.elementType === 'background') {
                        if (e.data.bgValue) el.style.backgroundImage = e.data.bgValue;
                        if (e.data.value) el.style.backgroundColor = e.data.value;
                      } else if (e.data.elementType === 'link') {
                        if (e.data.value) el.href = e.data.value;
                        if (e.data.linkText) el.innerText = e.data.linkText;
                      }
                      window.parent.postMessage({
                        type: 'UPDATE_HTML',
                        html: document.body.innerHTML
                      }, '*');
                    }
                  }
                });
              </script>
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [isPreviewOpen, htmlContent]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'EDIT_ELEMENT') {
        if (isInteractive) {
          setEditingElement({
            type: e.data.elementType,
            id: e.data.id,
            value: e.data.value,
            bgValue: e.data.bgValue
          });
        }
      }
      if (e.data.type === 'UPDATE_HTML') {
        setHtmlContent(e.data.html);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isInteractive]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'SET_INTERACTIVE', value: isInteractive }, '*');
  }, [isInteractive]);

  const updateEditingElement = (updates: Partial<typeof editingElement>) => {
    if (!editingElement) return;
    const updated = { ...editingElement, ...updates };
    setEditingElement(updated as any);
    
    iframeRef.current?.contentWindow?.postMessage({
      ...updated,
      type: 'UPDATE_ELEMENT',
      elementType: updated.type
    }, '*');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateEditingElement({ value: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h1 className="text-2xl font-semibold">Compose Email</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Create and send your campaigns to multiple recipients</p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-lg backdrop-blur-sm">
          <button 
            onClick={() => setComposeType("plain")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${composeType === "plain" ? "bg-white text-brand-dark" : "text-white hover:bg-white/10"}`}
          >
            Visual Editor
          </button>
          <button 
            onClick={() => setComposeType("custom")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${composeType === "custom" ? "bg-white text-brand-dark" : "text-white hover:bg-white/10"}`}
          >
            Custom HTML
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[80vh]">
        {/* To / Recipients */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start gap-4">
          <label className="text-gray-500 font-medium w-16 pt-2">To:</label>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 min-h-[48px] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all overflow-hidden">
              <div className="flex flex-wrap gap-2 w-full items-center pb-1">
                <AnimatePresence>
                  {emails.map(email => (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key={email} 
                      className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full text-sm shadow-sm whitespace-nowrap shrink-0"
                    >
                      {email}
                      <button onClick={() => removeEmail(email)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={emails.length === 0 ? "Paste emails, type and press space/comma, or upload CSV..." : ""}
                  className="flex-1 min-w-[200px] bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 py-1 shrink-0"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" /> Extract from CSV
                </button>
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <span className="text-gray-300">|</span>
                <div className="relative">
                  <button 
                    onClick={() => setIsBroadcastOpen(!isBroadcastOpen)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4" /> 
                    {broadcastList !== "None" ? broadcastList : "Select Broadcast List"} 
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {isBroadcastOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto"
                      >
                        <button 
                          onClick={() => handleSelectBroadcastList("None")}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          None
                        </button>
                        {broadcastLists.map(list => (
                          <button 
                            key={list.id}
                            onClick={() => handleSelectBroadcastList(list)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                          >
                            {list.name} ({list.emails.length})
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {emails.length} recipient{emails.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="flex-1 outline-none text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal"
          />
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col relative bg-white">
          {composeType === "plain" ? (
            <>
              <div className="bg-gray-50 border-b border-gray-100 p-2 flex items-center justify-between text-gray-500 overflow-x-auto hide-scrollbar">
                <div className="flex items-center gap-1">
                  <button onClick={() => document.execCommand('bold')} className="p-1.5 hover:bg-gray-200 rounded font-bold transition-colors">B</button>
                  <button onClick={() => document.execCommand('italic')} className="p-1.5 hover:bg-gray-200 rounded italic transition-colors">I</button>
                  <button onClick={() => document.execCommand('underline')} className="p-1.5 hover:bg-gray-200 rounded underline transition-colors">U</button>
                  <div className="w-px h-4 bg-gray-300 mx-2" />
                  <button onClick={insertImage} className="p-1.5 hover:bg-gray-200 rounded transition-colors" title="Insert Image"><ImageIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSaveModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-emerald-600 font-medium whitespace-nowrap"
                  >
                    <Layout className="w-4 h-4" /> Save as Template
                  </button>
                </div>
              </div>
              <div 
                ref={editorRef}
                contentEditable
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                className="flex-1 w-full p-6 outline-none text-gray-700 font-sans overflow-y-auto"
                style={{ minHeight: "400px" }}
                placeholder="Write your email here..."
              />
            </>
          ) : (
            <>
              <div className="bg-gray-50 border-b border-gray-100 p-2 flex items-center justify-end text-gray-500">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSaveModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-emerald-600 font-medium"
                  >
                    <Layout className="w-4 h-4" /> Save as Template
                  </button>
                  <button 
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                </div>
                {showSaveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"
                  >
                    <Check className="w-4 h-4" /> Template Saved!
                  </motion.div>
                )}
              </div>
              <textarea 
                placeholder="Paste your HTML code here..."
                value={htmlContent}
                onChange={e => setHtmlContent(e.target.value)}
                className="w-full p-6 outline-none resize-none text-gray-700 font-mono text-sm bg-gray-50/50 h-[80vh]"
              />
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            {activeJob && (
              <div className="flex items-center gap-3 ml-4">
                <div className="text-xs font-medium text-gray-500">
                  Sending: {activeJob.sent} / {activeJob.total}
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${(activeJob.sent / activeJob.total) * 100}%` }}
                  />
                </div>
                {activeJob.status === 'completed' && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={handleSendEmail}
            disabled={isSending && activeJob?.status !== 'completed'}
            className="relative overflow-hidden bg-brand-dark hover:bg-brand-dark/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 group disabled:opacity-50"
          >
            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            {isSending && activeJob?.status !== 'completed' ? 'Sending...' : 'Send Email'}
            <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
          </button>
        </div>
      </div>

      {/* Save Template Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Save as Template</h3>
                  <button onClick={() => setIsSaveModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Template Name</label>
                  <input 
                    autoFocus
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Welcome Email, Monthly Newsletter..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsSaveModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-dark text-white font-medium hover:bg-brand-dark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HTML Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-100">
            <motion.div 
              initial={{ opacity: 0, scale: 1, y: 0 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 1, y: 0 }} 
              className="absolute inset-0 bg-white overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-lg">
                    <button 
                      onClick={() => setIsInteractive(false)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${!isInteractive ? "bg-brand-dark text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button 
                      onClick={() => setIsInteractive(true)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${isInteractive ? "bg-brand-dark text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Interactive Edit
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setIsInteractive(false);
                    setEditingElement(null);
                  }} 
                  className="text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-white relative">
                <iframe 
                  ref={iframeRef}
                  className="w-full h-full border-none"
                  title="HTML Preview"
                />

                {/* Interactive Edit Popup */}
                <AnimatePresence>
                  {isInteractive && editingElement && (
                    <motion.div 
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      exit={{ y: 100 }}
                      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-4 z-50 flex flex-wrap items-center gap-4"
                    >
                      <div className="flex items-center gap-2 text-gray-500 mr-2">
                        {editingElement.type === 'text' && <Type className="w-4 h-4" />}
                        {editingElement.type === 'image' && <ImageIcon className="w-4 h-4" />}
                        {editingElement.type === 'background' && <Palette className="w-4 h-4" />}
                        {editingElement.type === 'link' && <LinkIcon className="w-4 h-4" />}
                        <span className="text-xs font-bold uppercase tracking-wider">Editing {editingElement.type}</span>
                      </div>

                      {editingElement.type === 'image' && (
                        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-2 rounded-lg max-w-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <p className="text-[10px] text-amber-800 leading-tight">
                              <span className="font-bold">Warning:</span> Base64 injection may make templates too large.
                            </p>
                          </div>
                          <div className="flex-1 flex items-center gap-2 w-full">
                            <span className="text-xs text-gray-400">URL:</span>
                            <input 
                              type="text" 
                              value={editingElement.value}
                              onChange={(e) => updateEditingElement({ value: e.target.value })}
                              placeholder="Image URL"
                              className="flex-1 min-w-[150px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload}
                              className="hidden" 
                              id="interactive-image-upload"
                            />
                            <label 
                              htmlFor="interactive-image-upload"
                              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Upload className="w-4 h-4" /> Upload
                            </label>
                            <button 
                              onClick={() => updateEditingElement({ action: 'delete' as any })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      )}

                      {editingElement.type === 'link' && (
                        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
                          <div className="flex-1 flex items-center gap-2 w-full">
                            <span className="text-xs text-gray-400 whitespace-nowrap">URL:</span>
                            <input 
                              type="text" 
                              value={editingElement.value}
                              onChange={(e) => updateEditingElement({ value: e.target.value })}
                              placeholder="https://..."
                              className="flex-1 min-w-[150px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                          <div className="flex-1 flex items-center gap-2 w-full">
                            <span className="text-xs text-gray-400 whitespace-nowrap">Text:</span>
                            <input 
                              type="text" 
                              value={editingElement.linkText}
                              onChange={(e) => updateEditingElement({ linkText: e.target.value })}
                              placeholder="Link text"
                              className="flex-1 min-w-[150px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>
                      )}

                      {editingElement.type === 'background' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Color:</span>
                            <input 
                              type="color" 
                              value={editingElement.value.startsWith('rgb') ? '#ffffff' : editingElement.value}
                              onChange={(e) => updateEditingElement({ value: e.target.value })}
                              className="w-8 h-8 rounded cursor-pointer border-none p-0"
                            />
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs text-gray-400">Image URL:</span>
                            <input 
                              type="text" 
                              value={editingElement.bgValue?.replace(/url\(['"]?|['"]?\)/g, '') || ''}
                              onChange={(e) => updateEditingElement({ bgValue: `url("${e.target.value}")` })}
                              placeholder="Background Image URL"
                              className="flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        </>
                      )}

                      {editingElement.type === 'text' && (
                        <p className="text-sm text-gray-500 flex-1 italic">
                          Double-click text in the preview to edit directly.
                        </p>
                      )}

                      <button 
                        onClick={() => setEditingElement(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-auto"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

