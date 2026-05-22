// ============================================================
// SIDEBAR - src/components/Sidebar.jsx
// ============================================================
// ARRC-branded navigation panel with teal color scheme
// ============================================================

import {
  LayoutDashboard,
  FolderOpen,
  Activity,
  FileText,
  MessageSquare,
  PenSquare,
  Globe,
  LogOut,
  Target,
  Users,
} from "lucide-react";
import arrcLogo from "../assets/arrc-logo.png";

const getNavItems = (t) => [
  { id: "dashboard", icon: LayoutDashboard, label: t.dashboard },
  { id: "strategy", icon: Target, label: t.strategy },
  { id: "projects", icon: FolderOpen, label: t.projects },
  { id: "kpis", icon: Activity, label: t.kpis },
  { id: "reports", icon: FileText, label: t.reports },
  { id: "update", icon: PenSquare, label: t.updateStatus },
  { id: "assistant", icon: MessageSquare, label: t.agents },
  { id: "users", icon: Users, label: t.userManagement },
];

export default function Sidebar({
  activeNav,
  onNavChange,
  currentUser,
  lang,
  onLangToggle,
  onLogout,
  translations: t,
}) {
  const navItems = getNavItems(t);
  const rtl = lang === "ar";

  return (
    <div
      className="fixed top-0 left-0 h-screen w-56 flex flex-col border-r border-white/5 z-50"
      style={{
        background: "linear-gradient(180deg, #0a1a1a 0%, #0d1f1f 100%)",
      }}
      dir={rtl ? "rtl" : "ltr"}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <img src={arrcLogo} alt="ARRC" className="h-8 object-contain mb-1.5" />
        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
          EPMO Intelligence
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 mb-0.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all
                ${active
                  ? "bg-teal-500/15 text-teal-400"
                  : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.03]"
                }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User + Actions */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        {/* User info */}
        <div className="px-3 mb-2.5">
          <div className="text-white text-[12px] font-semibold">
            {lang === "en" ? currentUser?.name : currentUser?.nameAr}
          </div>
          <div className="text-slate-600 text-[10px]">
            {lang === "en" ? currentUser?.title : currentUser?.titleAr}
          </div>
        </div>

        {/* Language toggle */}
        <button
          onClick={onLangToggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 mb-0.5 rounded-lg text-slate-600 text-[13px] hover:text-slate-300 hover:bg-white/[0.03] cursor-pointer transition-all"
        >
          <Globe size={16} strokeWidth={1.8} />
          <span>{lang === "en" ? "العربية" : "English"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-600 text-[13px] hover:text-red-400 hover:bg-red-500/[0.06] cursor-pointer transition-all"
        >
          <LogOut size={16} strokeWidth={1.8} />
          <span>{t.logout}</span>
        </button>

        {/* Powered by ARRC */}
        <div className="mt-3 pt-2.5 border-t border-white/5 text-center">
          <p className="text-slate-700 text-[9px] uppercase tracking-widest">{t.brandPowered}</p>
        </div>
      </div>
    </div>
  );
}
