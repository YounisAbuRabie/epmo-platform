// ============================================================
// APP - src/App.jsx
// ============================================================
// ARRC EPMO Intelligence Platform
// Azure AD authentication + demo account fallback
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { msalInstance, loginRequest, mapUserToRole } from "./auth/msalConfig";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ProjectList from "./components/ProjectList";
import StrategyAlignment from "./components/StrategyAlignment";
import KpiTracker from "./components/KpiTracker";
import Reports from "./components/Reports";
import UpdateStatus from "./components/UpdateStatus";
import AiAssistant from "./components/AiAssistant";
import UserManagement from "./components/UserManagement";
import { initialProjects, translations, users, stratGoals } from "./data/portfolioData";
import arrcLogo from "./assets/arrc-logo.png";

// ============================================================
// INNER APP (has access to MSAL context)
// ============================================================
function AppContent() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [lang, setLang] = useState("en");
  const [nav, setNav] = useState("dashboard");
  const [projects, setProjects] = useState(initialProjects);
  const [authMode, setAuthMode] = useState(null); // "azure" or "demo"

  const t = translations[lang];

  // ----- CHECK AZURE AD ON MOUNT -----
  useEffect(() => {
    if (isAuthenticated && accounts.length > 0 && !isLoggedIn) {
      const mapped = mapUserToRole(accounts[0]);
      if (mapped) {
        setCurrentUser(mapped);
        setIsLoggedIn(true);
        setAuthMode("azure");
      }
    }
  }, [isAuthenticated, accounts, isLoggedIn]);

  // ----- VISIBLE PROJECTS (filtered by role) -----
  const visibleProjects = useCallback(() => {
    if (!currentUser) return [];
    if (currentUser.role === "epmo") return projects;
    if (currentUser.role === "mgr") return projects.filter((p) => p.dept === currentUser.dept);
    return projects.filter((p) => p.owner === currentUser.name);
  }, [currentUser, projects])();

  // ----- PROJECT UPDATE HANDLER -----
  const handleProjectUpdate = (projectId, updates) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      ...updates,
      kpis: updates.kpis ? { ...p.kpis, ...updates.kpis } : p.kpis,
    } : p));
  };

  // ----- AZURE AD LOGIN -----
  const handleAzureLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  // ----- DEMO LOGIN -----
  const handleQuickLogin = (email) => {
    const user = users.find((u) => u.email === email);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setAuthMode("demo");
    }
  };

  // ----- LOGOUT -----
  const handleLogout = async () => {
    if (authMode === "azure") {
      try {
        await instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setNav("dashboard");
    setAuthMode(null);
  };

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // ----- LOADING STATE -----
  if (inProgress !== InteractionStatus.None && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a1a1a 0%, #1B3A3A 50%, #0a1a1a 100%)" }}>
        <div className="text-center">
          <div className="flex gap-1.5 justify-center mb-3">
            {[0, 1, 2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
          </div>
          <p className="text-slate-500 text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  // ----- LOGIN SCREEN -----
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a1a1a 0%, #1B3A3A 50%, #0a1a1a 100%)" }}>
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-8">
            <img src={arrcLogo} alt="ARRC" className="h-16 mx-auto mb-5 object-contain" />
            <h1 className="text-white text-2xl font-bold mb-2">{t.platformName}</h1>
            <p className="text-slate-500 text-sm">{t.subtitle}</p>
          </div>

          {/* Azure AD Login */}
          <button onClick={handleAzureLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 mb-4 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all"
            style={{ background: "linear-gradient(135deg, #2D9B9B, #00B4D8)", boxShadow: "0 4px 20px rgba(45,155,155,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
            {lang === "en" ? "Sign in with Microsoft" : "تسجيل الدخول بحساب مايكروسوفت"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-slate-600 text-[11px] uppercase">{lang === "en" ? "or use demo" : "أو استخدم حساب تجريبي"}</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Demo Accounts */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest text-center mb-4">{t.demoAccounts}</p>
            {[
              { email: "epmo@gov.sa", label: t.epmoHead },
              { email: "it@gov.sa", label: t.deptManager },
              { email: "pm@gov.sa", label: t.projectManager },
            ].map((a) => (
              <button key={a.email} onClick={() => handleQuickLogin(a.email)} className="w-full flex items-center justify-between px-4 py-3 mb-2 last:mb-0 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 text-sm hover:bg-teal-500/[0.08] hover:border-teal-500/20 transition-all cursor-pointer">
                <span className="font-medium">{a.label}</span>
                <span className="text-[11px] text-slate-600">{a.email}</span>
              </button>
            ))}
          </div>

          <button onClick={toggleLang} className="mt-4 mx-auto flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-300 text-xs transition-all cursor-pointer">
            <span>{lang === "en" ? "العربية" : "English"}</span>
          </button>
          <div className="text-center mt-6">
            <p className="text-slate-700 text-[10px] uppercase tracking-widest">{t.brandPowered}</p>
          </div>
        </div>
      </div>
    );
  }

  // ----- PAGE ROUTER -----
  const renderPage = () => {
    switch (nav) {
      case "dashboard":
        return <Dashboard projects={visibleProjects} stratGoals={stratGoals} lang={lang} translations={t} currentUser={currentUser} />;
      case "projects":
        return <ProjectList projects={visibleProjects} stratGoals={stratGoals} lang={lang} translations={t} />;
      case "strategy":
        return <StrategyAlignment projects={visibleProjects} stratGoals={stratGoals} lang={lang} translations={t} />;
      case "kpis":
        return <KpiTracker projects={visibleProjects} lang={lang} translations={t} />;
      case "reports":
        return <Reports projects={visibleProjects} lang={lang} translations={t} currentUser={currentUser} />;
      case "update":
        return <UpdateStatus projects={visibleProjects} onUpdate={handleProjectUpdate} lang={lang} translations={t} />;
      case "assistant":
        return <AiAssistant projects={visibleProjects} stratGoals={stratGoals} lang={lang} translations={t} currentUser={currentUser} />;
      case "users":
        return <UserManagement currentUser={currentUser} lang={lang} translations={t} />;
      default:
        return (
          <div className="bg-slate-800/50 border border-white/[0.06] rounded-xl p-8">
            <h2 className="text-white text-xl font-bold mb-2">{nav.charAt(0).toUpperCase() + nav.slice(1)} Page</h2>
            <p className="text-slate-400 text-sm">Active page: <span className="text-teal-400 font-semibold">{nav}</span></p>
          </div>
        );
    }
  };

  // ----- MAIN LAYOUT -----
  return (
    <div className="min-h-screen bg-[#0a1a1a]" dir={lang === "ar" ? "rtl" : "ltr"}>
      <Sidebar
        activeNav={nav}
        onNavChange={setNav}
        currentUser={currentUser}
        lang={lang}
        onLangToggle={toggleLang}
        onLogout={handleLogout}
        translations={t}
      />
      <main className="ml-56 min-h-screen p-6">
        {/* Auth badge */}
        {authMode === "azure" && (
          <div className="mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-teal-400 text-[11px] font-semibold">
              {lang === "en" ? "Authenticated via Microsoft Entra ID" : "مصادق عبر Microsoft Entra ID"}
            </span>
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
}

// ============================================================
// ROOT APP (wraps with MSAL Provider)
// ============================================================
export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}
