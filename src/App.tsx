import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Search, Menu, X, Globe, LayoutDashboard, Users, Megaphone, BarChart3, Edit, Layout, LogOut } from "lucide-react";
import { DashboardTab } from "./components/DashboardTab";
import { LeadsTab } from "./components/LeadsTab";
import { CampaignTab } from "./components/CampaignTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { ComposeTab } from "./components/ComposeTab";
import { TemplatesTab } from "./components/TemplatesTab";
import { Loader } from "./components/Loader";
import { AuthScreen } from "./components/AuthScreen";
import { useAuth } from "./lib/store";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "./lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

type TabType = "Dashboard" | "Leads" | "Campaign" | "Analytics" | "Compose" | "Templates";

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [composeInitialHtml, setComposeInitialHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

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
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setIsLoading(true);
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  const tabs: { id: TabType; icon: ReactNode }[] = [
    { id: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "Leads", icon: <Users className="w-4 h-4" /> },
    { id: "Campaign", icon: <Megaphone className="w-4 h-4" /> },
    { id: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "Templates", icon: <Layout className="w-4 h-4" /> },
    { id: "Compose", icon: <Edit className="w-4 h-4" /> },
  ];

  const handleUseTemplate = (html: string) => {
    setComposeInitialHtml(html);
    handleTabChange("Compose");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} onEmailLogin={handleEmailLogin} onEmailSignUp={handleEmailSignUp} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Header */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-brand-dark z-0" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between mb-8 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center font-bold text-brand-dark">
              Z
            </div>
            <span className="text-xl font-semibold tracking-tight">ZapMail</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-full backdrop-blur-sm border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-white text-brand-dark shadow-sm"
                    : "text-emerald-50 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="opacity-70">{tab.icon}</span>
                {tab.id}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-1 text-sm text-emerald-50 hover:text-white transition-colors">
              <Globe className="w-4 h-4" /> ENG <ChevronDownIcon className="w-3 h-3" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-emerald-50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-colors">
              <img src={user.photoURL || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} alt="User" className="w-full h-full object-cover" />
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-emerald-50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
              className="md:hidden bg-brand-dark/95 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden mb-6"
            >
              <div className="p-2 flex flex-col gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                      activeTab === tab.id
                        ? "bg-white text-brand-dark"
                        : "text-emerald-50 hover:bg-white/10"
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
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Loader />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "Dashboard" && <DashboardTab onNavigate={handleTabChange} />}
                {activeTab === "Leads" && <LeadsTab />}
                {activeTab === "Campaign" && <CampaignTab />}
                {activeTab === "Analytics" && <AnalyticsTab />}
                {activeTab === "Templates" && <TemplatesTab onUseTemplate={handleUseTemplate} />}
                {activeTab === "Compose" && (
                  <ComposeTab 
                    initialHtml={composeInitialHtml} 
                    onHtmlUsed={() => setComposeInitialHtml(null)} 
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
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
