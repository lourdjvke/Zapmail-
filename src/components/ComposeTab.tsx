import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, Send, Paperclip, Image as ImageIcon, Type, FileText, Users, ChevronDown, Eye, Layout, Edit3, Palette, Trash2, Link as LinkIcon, AlertTriangle, Check, Calendar, Repeat, Lock } from "lucide-react";
import { useFirebaseData, useAuth, BroadcastList, EmailTemplate, EmailJob, Draft, Lead } from "../lib/store";
import { fetchEmailsFromRTDB } from "../services/rtdbService";
import { sanitizeHtml } from "../lib/utils";

interface ComposeTabProps {
  initialHtml?: string | null;
  initialTemplateId?: string | null;
  onHtmlUsed?: () => void;
}

export function ComposeTab({ initialHtml, initialTemplateId, onHtmlUsed }: ComposeTabProps) {
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
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showDraftSaveSuccess, setShowDraftSaveSuccess] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const startLongPress = () => {
    if (!subject.trim() && !content.trim()) {
      showNotification("Add a subject or content to continue...");
      return;
    }
    longPressTimer.current = setTimeout(() => {
      setIsTestModalOpen(true);
    }, 500);
  };

  const endLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const [recurrence, setRecurrence] = useState("none");
  const { data: leads } = useFirebaseData<Lead[]>('leads', []);

  const leadMap = useMemo(() => {
    const map = new Map<string, string>();
    leads.forEach(lead => {
      if (lead.email && lead.name) {
        map.set(lead.email.toLowerCase(), lead.name);
      }
    });
    return map;
  }, [leads]);

  const handleTestSend = async () => {
    if (!user || !testEmail) return;
    
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyiJGmhgbmu3sXdloDT4QndnYwArdjYm3F1GmPIkZhbf-gB_mA8_VTP41WPJuCQifG1/exec";
    const payload = { 
      action: "create",
      userId: user.uid, 
      recipients: [{ name: "Test User", email: testEmail }], 
      sub: `Test: ${subject}`, 
      msg: sanitizeHtml(composeType === "plain" ? content : htmlContent), 
      isHtml: composeType === "custom",
      scheduledFor: 0,
      recurrence: "none"
    };
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = SCRIPT_URL;
    form.target = 'ZapMailAuth';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = JSON.stringify(payload);
    form.appendChild(input);
    window.open('', 'ZapMailAuth', 'width=500,height=550');
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    
    setIsTestModalOpen(false);
    setTestEmail("");
    setIsBottomSheetOpen(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: broadcastLists } = useFirebaseData<BroadcastList[]>('broadcast_lists', []);
  const { data: templates, addItem: addTemplate, updateItem: updateTemplate } = useFirebaseData<EmailTemplate[]>('templates', []);
  const { addItem: addDraft } = useFirebaseData<Draft[]>('drafts', []);
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { data: outgoingJobs } = useFirebaseData<any[]>('outgoing_emails', []);
  const [isInteractive, setIsInteractive] = useState(false);
  const [editingElement, setEditingElement] = useState<any | null>(null);

  const handleSaveDraft = async () => {
    const finalHtml = composeType === "plain" ? content : htmlContent;
    if (!subject.trim() && !finalHtml.trim()) return;

    await addDraft({
      subject,
      content,
      htmlContent: finalHtml,
      composeType,
      updatedAt: new Date().toISOString(),
    });
    setShowDraftSaveSuccess(true);
    setTimeout(() => setShowDraftSaveSuccess(false), 3000);
  };

  const { data: currentTier } = useFirebaseData<string>('tier', 'tier_1');
  const { data: jobs } = useFirebaseData<EmailJob[]>('outgoing_emails', []);

  const getTierLimits = () => {
    if (currentTier === 'tier_3') return { maxRecipients: 1000, canSchedule: true, canRecur: true, dailyLimit: 1500 };
    if (currentTier === 'tier_2') return { maxRecipients: 250, canSchedule: true, canRecur: false, dailyLimit: 800 };
    return { maxRecipients: 20, canSchedule: false, canRecur: false, dailyLimit: 100 };
  };

  const limits = getTierLimits();

  const getEmailsSentToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return jobs.reduce((acc, job) => {
      const jobDate = new Date(job.lastUpdated || 0);
      if (jobDate >= today) {
        return acc + (job.total || 0);
      }
      return acc;
    }, 0);
  };

  const handleSendEmail = async () => {
    if (!user) return;
    if (emails.length === 0 || !subject || (!content && !htmlContent)) {
      alert("Please fill all fields and add at least one recipient.");
      return;
    }

    if (emails.length > limits.maxRecipients) {
      showNotification(`Upgrade for more recipients (Limit: ${limits.maxRecipients})`);
      return;
    }

    const sentToday = getEmailsSentToday();
    if (sentToday + emails.length > limits.dailyLimit) {
      showNotification(`Daily limit exceeded. You can send ${Math.max(0, limits.dailyLimit - sentToday)} more emails today.`);
      return;
    }

    setIsSending(true);
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyiJGmhgbmu3sXdloDT4QndnYwArdjYm3F1GmPIkZhbf-gB_mA8_VTP41WPJuCQifG1/exec";
    
    try {
      // Prepare recipients with names from leads
      const recipientsArray = emails.map(email => ({
        name: leadMap.get(email.toLowerCase()) || "",
        email: email
      }));

      let scheduledForTime = 0;
      if (scheduledFor) {
        const dateObj = new Date(scheduledFor);
        if (dateObj > new Date()) scheduledForTime = dateObj.getTime();
      }

      // Create an invisible form element
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = SCRIPT_URL;
      form.target = 'ZapMailAuth'; // Names the window so we don't open multiple tabs

      // Bundle all data into a single string to bypass URL length limits
      const payload = { 
        action: "create",
        userId: user.uid, 
        recipients: recipientsArray, 
        sub: subject, 
        msg: sanitizeHtml(composeType === "plain" ? content : htmlContent), 
        isHtml: composeType === "custom",
        scheduledFor: scheduledForTime,
        recurrence: recurrence
      };
      
      // Create a hidden input to hold our JSON string
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'payload';
      input.value = JSON.stringify(payload);
      form.appendChild(input);

      // Open the auth window first (important to prevent popup blockers)
      window.open('', 'ZapMailAuth', 'width=500,height=550');
      
      // Add form to page, fire it, then delete it
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      setIsBottomSheetOpen(false);
      alert("Batch process initiated. Monitoring progress...");
    } catch (error) {
      console.error("Error launching batch:", error);
      alert("Failed to initiate email sending.");
      setIsSending(false);
    }
  };

  const activeJob = useMemo(() => {
    if (!outgoingJobs || outgoingJobs.length === 0) return null;
    return [...outgoingJobs].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))[0];
  }, [outgoingJobs]);

  useEffect(() => {
    if (activeJob && activeJob.status === 'done') {
      setIsSending(false);
    }
  }, [activeJob]);

  useEffect(() => {
    if (initialHtml) {
      setComposeType("custom");
      setHtmlContent(initialHtml);
      if (initialTemplateId) {
        setEditingTemplateId(initialTemplateId);
        const existingTemplate = templates.find(t => t.id === initialTemplateId);
        if (existingTemplate) {
          setTemplateName(existingTemplate.name);
        }
      }
      onHtmlUsed?.();
    }
  }, [initialHtml, initialTemplateId, onHtmlUsed, templates]);

  const extractEmails = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  };

  const addEmails = (newEmails: string[]) => {
    const currentCount = emails.length;
    const canAddCount = Math.max(0, limits.maxRecipients - currentCount);
    if (canAddCount <= 0) {
      showNotification(`Upgrade for more recipients (Limit: ${limits.maxRecipients})`);
      return;
    }
    const emailsToAdd = newEmails.slice(0, canAddCount);
    setEmails(prev => [...new Set([...prev, ...emailsToAdd])]);
    if (newEmails.length > canAddCount) {
      showNotification(`Upgrade for more recipients (Limit: ${limits.maxRecipients})`);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const newEmails = extractEmails(pastedText);
    if (newEmails.length > 0) {
      addEmails(newEmails);
    } else {
      setInputValue(prev => prev + pastedText);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",") || val.includes(" ")) {
      const newEmails = extractEmails(val);
      if (newEmails.length > 0) {
        addEmails(newEmails);
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
        addEmails(newEmails);
      } else if (inputValue.trim() && inputValue.includes("@")) {
        addEmails([inputValue.trim()]);
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
        addEmails(newEmails);
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
      addEmails(list.emails);
    }
    setIsBroadcastOpen(false);
  };

  const handleSaveTemplate = async () => {
    const finalHtml = composeType === "plain" ? content : htmlContent;
    if (!finalHtml.trim() || !templateName.trim()) return;

    if (editingTemplateId) {
      await updateTemplate(editingTemplateId, {
        name: templateName,
        html: sanitizeHtml(finalHtml),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      const newTemplate = {
        name: templateName,
        html: sanitizeHtml(finalHtml),
        created: new Date().toISOString(),
      };
      await addTemplate(newTemplate);
    }

    setIsSaveModalOpen(false);
    setTemplateName("");
    setEditingTemplateId(null);
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
                body { margin: 0; font-family: sans-serif; cursor: default; }
                body.interactive { user-select: none; }
                .editable-hover { outline: 2px dashed #10b981 !important; outline-offset: 2px; }
              </style>
            </head>
            <body class="${isInteractive ? 'interactive' : ''}">
              ${htmlContent || '<p style="color: #9ca3af; text-align: center; margin-top: 40px;">No HTML content to preview.</p>'}
              <script>
                window.isInteractive = ${isInteractive};
                
                // Prevent all link clicks from navigating
                document.body.addEventListener('click', (e) => {
                  const target = e.target;
                  if (target.tagName === 'A' || target.closest('a')) {
                    e.preventDefault();
                  }
                }, true);

                document.body.addEventListener('mouseover', (e) => {
                  if (!window.isInteractive) return;
                  const target = e.target;
                  if (target === document.body) return;
                  target.classList.add('editable-hover');
                });

                document.body.addEventListener('mouseout', (e) => {
                  const target = e.target;
                  target.classList.remove('editable-hover');
                });

                document.body.addEventListener('dblclick', (e) => {
                  if (!window.isInteractive) return;
                  e.preventDefault();
                  const target = e.target;
                  
                  // 1. Handle Images
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

                  // 2. Handle Links
                  const link = target.closest('a');
                  if (link) {
                    if (!link.id) link.id = 'el-' + Math.random().toString(36).substr(2, 9);
                    window.parent.postMessage({
                      type: 'EDIT_ELEMENT',
                      elementType: 'link',
                      id: link.id,
                      value: link.getAttribute('href') || '',
                      linkText: link.innerText
                    }, '*');
                    return;
                  }

                  // 3. Handle Text-specific elements (p, h1-h6, span, etc.)
                  const textEl = target.closest('p, h1, h2, h3, h4, h5, h6, span, b, i, strong, em, label');
                  if (textEl) {
                    if (!textEl.id) textEl.id = 'el-' + Math.random().toString(36).substr(2, 9);
                    window.parent.postMessage({
                      type: 'EDIT_ELEMENT',
                      elementType: 'text',
                      id: textEl.id,
                      value: textEl.innerText
                    }, '*');
                    return;
                  }

                  // 4. Handle Backgrounds (Target or Parent)
                  const getBgEl = (el) => {
                    if (!el || el === document.body) return null;
                    const style = window.getComputedStyle(el);
                    const hasBg = style.backgroundImage !== 'none' || (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent');
                    if (hasBg) return el;
                    return getBgEl(el.parentElement);
                  };
                  const bgEl = getBgEl(target);
                  if (bgEl) {
                    if (!bgEl.id) bgEl.id = 'el-' + Math.random().toString(36).substr(2, 9);
                    const style = window.getComputedStyle(bgEl);
                    window.parent.postMessage({
                      type: 'EDIT_ELEMENT',
                      elementType: 'background',
                      id: bgEl.id,
                      value: style.backgroundColor,
                      bgValue: style.backgroundImage
                    }, '*');
                    return;
                  }

                  // 5. Fallback for generic containers (div, section, etc.)
                  const containerEl = target.closest('div, section, article, td, th, li');
                  if (containerEl) {
                    if (!containerEl.id) containerEl.id = 'el-' + Math.random().toString(36).substr(2, 9);
                    window.parent.postMessage({
                      type: 'EDIT_ELEMENT',
                      elementType: 'text',
                      id: containerEl.id,
                      value: containerEl.innerText
                    }, '*');
                    return;
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
                        if (e.data.value !== undefined) el.setAttribute('href', e.data.value);
                        if (e.data.linkText !== undefined) {
                          let targetEl = el;
                          while (targetEl.children.length === 1 && !['IMG', 'BR', 'SVG'].includes(targetEl.firstElementChild.tagName)) {
                            targetEl = targetEl.firstElementChild;
                          }
                          targetEl.innerText = e.data.linkText;
                        }
                      } else if (e.data.elementType === 'text') {
                        if (e.data.value !== undefined) {
                          let targetEl = el;
                          while (targetEl.children.length === 1 && !['IMG', 'BR', 'SVG'].includes(targetEl.firstElementChild.tagName)) {
                            targetEl = targetEl.firstElementChild;
                          }
                          targetEl.innerText = e.data.value;
                        }
                      }
                      
                      // Send back the updated HTML to the parent
                      const clone = document.body.cloneNode(true);
                      const scripts = clone.querySelectorAll('script');
                      scripts.forEach(s => s.remove());
                      const hovers = clone.querySelectorAll('.editable-hover');
                      hovers.forEach(h => h.classList.remove('editable-hover'));
                      
                      window.parent.postMessage({
                        type: 'UPDATE_HTML',
                        html: clone.innerHTML.trim()
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
  }, [isPreviewOpen, htmlContent, isInteractive]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'EDIT_ELEMENT') {
        if (isInteractive) {
          setEditingElement({
            type: e.data.elementType,
            id: e.data.id,
            value: e.data.value,
            bgValue: e.data.bgValue,
            linkText: e.data.linkText
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-gray-900">
        <div>
          <h1 className="text-2xl font-semibold">Compose Email</h1>
          <p className="text-gray-500 text-sm mt-1">Create and send your campaigns to multiple recipients</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[80vh]">
        {/* To / Recipients */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start gap-4">
          <label className="text-gray-500 font-medium w-16 pt-2">To:</label>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 min-h-[48px] max-h-[120px] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all overflow-y-auto">
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
                    {broadcastList !== "None" ? broadcastList : "Broadcast List"} 
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
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full p-6 outline-none text-gray-700 font-sans overflow-y-auto resize-none"
              style={{ minHeight: "400px" }}
              placeholder="Write your email here..."
            />
          ) : (
            <>
              <div className="bg-gray-50 border-b border-gray-100 p-2 flex items-center justify-end text-gray-500">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSaveModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-emerald-600 font-medium"
                  >
                    <Layout className="w-4 h-4" /> {editingTemplateId ? "Update Template" : "Save as Template"}
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
            <button 
              onClick={handleSaveDraft}
              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            >
              <FileText className="w-5 h-5" />
            </button>
            {showDraftSaveSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1 text-emerald-600 text-sm font-medium"
              >
                <Check className="w-4 h-4" /> Draft Saved!
              </motion.div>
            )}
          </div>
          <button 
            onClick={() => {
              if (!subject.trim() && !content.trim() && !htmlContent.trim()) {
                showNotification("Add a subject or content to continue...");
                return;
              }
              setIsBottomSheetOpen(true);
            }}
            disabled={isSending && activeJob?.status !== 'completed'}
            className="relative overflow-hidden bg-brand-dark hover:bg-brand-dark/90 text-white px-8 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 group disabled:opacity-50"
          >
            Continue
            <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-20" />
          </button>
        </div>
      </div>

      {/* Bottom Sheet / Popup */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px] p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              className="w-full sm:max-w-lg bg-white rounded-t-[12px] sm:rounded-[12px] overflow-hidden border border-emerald-200/50"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-emerald-900">Send Options</h3>
                  <button onClick={() => setIsBottomSheetOpen(false)} className="text-emerald-400 hover:text-emerald-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleSendEmail}
                    className="flex items-center gap-3 w-full p-3 rounded-[8px] border border-emerald-100/50 hover:bg-emerald-50/30 transition-all group"
                  >
                    <div className="text-emerald-700">
                      <Send className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-emerald-900">Send Now</span>
                  </button>

                  <button 
                    onClick={() => setIsTestModalOpen(true)}
                    className="flex items-center gap-3 w-full p-3 rounded-[8px] border border-emerald-100/50 hover:bg-emerald-50/30 transition-all group"
                  >
                    <div className="text-emerald-700">
                      <Eye className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-emerald-900">Send Test</span>
                  </button>

                  <div className={`flex items-center justify-between w-full p-3 rounded-[8px] border border-emerald-100/50 ${!limits.canSchedule ? 'bg-gray-50 opacity-60' : 'bg-transparent'}`}>
                    <div className="flex items-center gap-3">
                      {!limits.canSchedule ? <Lock className="w-4 h-4 text-gray-400" /> : <Calendar className="w-4 h-4 text-emerald-700" />}
                      <label className={`text-[13px] font-semibold ${!limits.canSchedule ? 'text-gray-500' : 'text-emerald-900'}`}>Schedule</label>
                    </div>
                    <input 
                      type="datetime-local" 
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      disabled={!limits.canSchedule}
                      className="bg-transparent text-[11px] text-emerald-900 outline-none font-medium text-right disabled:text-gray-400"
                    />
                  </div>

                  <div className={`flex items-center justify-between w-full p-3 rounded-[8px] border border-emerald-100/50 ${!limits.canRecur ? 'bg-gray-50 opacity-60' : 'bg-transparent'}`}>
                    <div className="flex items-center gap-3">
                      {!limits.canRecur ? <Lock className="w-4 h-4 text-gray-400" /> : <Repeat className="w-4 h-4 text-emerald-700" />}
                      <label className={`text-[13px] font-semibold ${!limits.canRecur ? 'text-gray-500' : 'text-emerald-900'}`}>Recurrence</label>
                    </div>
                    <select 
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      disabled={!limits.canRecur}
                      className="bg-transparent text-[11px] text-emerald-900 outline-none appearance-none font-medium cursor-pointer text-right disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="none">None</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleSendEmail}
                    className="w-full py-3 bg-emerald-600 text-white rounded-[8px] font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Confirm & Launch
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-[120] whitespace-nowrap"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

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
                  <h3 className="text-lg font-semibold text-gray-900">{editingTemplateId ? "Update Template" : "Save as Template"}</h3>
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
                    {editingTemplateId ? "Update Template" : "Save Template"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Test Email Modal */}
      <AnimatePresence>
        {isTestModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Send Test Email</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Test Email Address</label>
                  <input 
                    autoFocus
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="e.g. test@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsTestModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleTestSend}
                    disabled={!testEmail.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-dark text-white font-medium hover:bg-brand-dark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Test
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
                    setHtmlContent(sanitizeHtml(htmlContent));
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
                        <div className="flex-1 flex flex-col gap-2">
                          <span className="text-xs text-gray-400">Content:</span>
                          <textarea 
                            value={editingElement.value}
                            onChange={(e) => updateEditingElement({ value: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[80px]"
                            placeholder="Enter text or HTML..."
                          />
                        </div>
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

