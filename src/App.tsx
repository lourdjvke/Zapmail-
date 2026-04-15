import { useState, useEffect, ReactNode, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Search, Menu, X, Globe, LayoutDashboard, Users, Megaphone, BarChart3, Edit, Layout, LogOut, Zap } from "lucide-react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { DashboardTab } from "./components/DashboardTab";
import { LeadsTab } from "./components/LeadsTab";
import { CampaignTab } from "./components/CampaignTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { ComposeTab } from "./components/ComposeTab";
import { TemplatesTab } from "./components/TemplatesTab";
import { DraftsTab } from "./components/DraftsTab";
import { PricingTab } from "./components/PricingTab";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";
import { Loader } from "./components/Loader";
import { AuthScreen } from "./components/AuthScreen";
import { useAuth, EmailTemplate } from "./lib/store";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "./lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

type TabType = "Dashboard" | "Leads" | "Drafts" | "Analytics" | "Compose" | "Templates" | "Upgrade";

const TABS: { id: TabType; icon: ReactNode }[] = [
  { id: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "Leads", icon: <Users className="w-4 h-4" /> },
  { id: "Drafts", icon: <Layout className="w-4 h-4" /> },
  { id: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "Templates", icon: <Layout className="w-4 h-4" /> },
  { id: "Compose", icon: <Edit className="w-4 h-4" /> },
  { id: "Upgrade", icon: <Zap className="w-4 h-4 text-amber-400" /> },
];

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [composeInitialHtml, setComposeInitialHtml] = useState<string | null>(null);
  const [composeInitialTemplateId, setComposeInitialTemplateId] = useState<string | null>(null);

  // Map path to tab
  const activeTab = useMemo(() => {
    const path = location.pathname.substring(1).toLowerCase();
    if (!path || path === "") return "Dashboard";
    const tab = TABS.find(t => t.id.toLowerCase() === path);
    return tab ? tab.id : "Dashboard";
  }, [location.pathname]);

  const handleUseTemplate = (template: EmailTemplate) => {
    setComposeInitialHtml(template.html);
    setComposeInitialTemplateId(template.id);
    handleTabChange("Compose");
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email login failed:", error);
      alert("Login failed: " + (error as Error).message);
    }
  };

  const handleEmailSignUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
    } catch (error) {
      console.error("Sign up failed:", error);
      alert("Sign up failed: " + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleTabChange = (tab: TabType) => {
    navigate(`/${tab.toLowerCase()}`);
    setIsMobileMenuOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Public route for Privacy Policy
  if (location.pathname === "/privacy") {
    return <PrivacyPolicy />;
  }
  // Public route for Terms of Service
  if (location.pathname === "/terms") {
    return <TermsOfService />;
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} onEmailLogin={handleEmailLogin} onEmailSignUp={handleEmailSignUp} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between mb-8 text-gray-900">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleTabChange("Dashboard")}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">
              Z
            </div>
            <span className="text-xl font-semibold tracking-tight">ZapMail</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-brand-dark text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="opacity-70">{tab.icon}</span>
                {tab.id}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <Globe className="w-4 h-4" /> ENG <ChevronDownIcon className="w-3 h-3" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 hover:border-brand-dark transition-colors">
              <img src={user.photoURL || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} alt="User" className="w-full h-full object-cover" />
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden mb-6"
            >
              <div className="p-2 flex flex-col gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                      activeTab === tab.id
                        ? "bg-brand-dark text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.id}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="relative min-h-[600px]">
          <Routes>
            <Route path="/" element={<DashboardTab onNavigate={handleTabChange} />} />
            <Route path="/dashboard" element={<DashboardTab onNavigate={handleTabChange} />} />
            <Route path="/leads" element={<LeadsTab />} />
            <Route path="/drafts" element={<DraftsTab />} />
            <Route path="/analytics" element={<AnalyticsTab />} />
            <Route path="/templates" element={<TemplatesTab onUseTemplate={handleUseTemplate} />} />
            <Route path="/upgrade" element={<PricingTab />} />
            <Route path="/compose" element={
              <ComposeTab 
                initialHtml={composeInitialHtml} 
                initialTemplateId={composeInitialTemplateId}
                onHtmlUsed={() => {
                  setComposeInitialHtml(null);
                  setComposeInitialTemplateId(null);
                }} 
              />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <button onClick={() => navigate("/privacy")} className="hover:text-emerald-600 transition-colors">Privacy Policy</button>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <button onClick={() => navigate("/terms")} className="hover:text-emerald-600 transition-colors">Terms of Service</button>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>© {new Date().getFullYear()} Zapmail</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function ChevronDownIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
