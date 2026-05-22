// ============================================================
// USER MANAGEMENT - src/components/UserManagement.jsx
// ============================================================
// EPMO-only admin panel: user directory, role management,
// activity log, and add user modal.
//
// PROPS:
// - currentUser: logged-in user (must be epmo role)
// - lang: "en" or "ar"
// - translations: current language strings
// ============================================================

import { useState } from "react";
import { users as demoUsers } from "../data/portfolioData";

const cardClass = "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4";
const inputClass = "w-full px-3.5 py-3 bg-black/30 border border-white/[0.08] rounded-xl text-white text-sm outline-none focus:border-teal-500/30 transition-all";
const labelClass = "block text-slate-500 text-[11px] font-semibold mb-2 uppercase tracking-wide";

const ROLES = {
  epmo: { label: "EPMO Head", labelAr: "رئيس المكتب", color: "#2D9B9B" },
  mgr: { label: "Dept Manager", labelAr: "مدير إدارة", color: "#00B4D8" },
  pm: { label: "Project Manager", labelAr: "مدير مشروع", color: "#A78BFA" },
  viewer: { label: "Viewer", labelAr: "مشاهد", color: "#8899AA" },
};

const ACTIVITY = (lang) => [
  { user: "EPMO Head", action: lang === "en" ? "Generated AI strategic report" : "أنشأ تقرير استراتيجي ذكي", time: "2m ago", color: "#2D9B9B" },
  { user: "Khalid Al-Dosari", action: lang === "en" ? "Updated PRJ-002 status to Delayed" : "حدّث حالة PRJ-002 إلى متأخر", time: "15m ago", color: "#FFB224" },
  { user: "Fahad Al-Shammari", action: lang === "en" ? "Submitted KPI update for PRJ-003" : "أرسل تحديث مؤشرات PRJ-003", time: "1h ago", color: "#00B4D8" },
  { user: "EPMO Head", action: lang === "en" ? "Reviewed portfolio risk report" : "راجع تقرير مخاطر المحفظة", time: "2h ago", color: "#A78BFA" },
  { user: "Khalid Al-Dosari", action: lang === "en" ? "Added risk note to PRJ-013" : "أضاف ملاحظة مخاطر لـ PRJ-013", time: "3h ago", color: "#FF4D6A" },
];

export default function UserManagement({ currentUser, lang, translations: t }) {
  const [userList, setUserList] = useState(
    demoUsers.map(u => ({ ...u, lastActive: "Today, 09:15 AM", status: "Active" }))
  );
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "pm", dept: "" });

  // Only EPMO can access this
  if (currentUser.role !== "epmo") {
    return (
      <div className={`${cardClass} text-center py-12`}>
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="text-white text-lg font-bold mb-2">{lang === "en" ? "Access Restricted" : "الوصول مقيد"}</h3>
        <p className="text-slate-600 text-sm">{lang === "en" ? "Only EPMO Head can manage users." : "فقط رئيس المكتب يمكنه إدارة المستخدمين."}</p>
      </div>
    );
  }

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    setUserList(prev => [...prev, {
      ...newUser, pw: "demo123",
      nameAr: newUser.name, title: ROLES[newUser.role]?.label || "User",
      titleAr: ROLES[newUser.role]?.labelAr || "مستخدم",
      lastActive: "Never", status: "Invited",
    }]);
    setNewUser({ name: "", email: "", role: "pm", dept: "" });
    setShowAdd(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-white text-xl font-bold">{t.userManagement}</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer text-[#0a1a1a]"
          style={{ background: "linear-gradient(135deg, #2D9B9B, #00B4D8)" }}>
          + {t.addUser}
        </button>
      </div>

      {/* Add User Form */}
      {showAdd && (
        <div className={`${cardClass} mb-4`} style={{ borderColor: "rgba(0,229,160,0.2)" }}>
          <h3 className="text-teal-400 text-[13px] font-bold uppercase mb-3.5">{t.addUser}</h3>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className={labelClass}>{t.userName}</label>
              <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                placeholder={lang === "en" ? "Full name" : "الاسم الكامل"} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.userEmail}</label>
              <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@gov.sa" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.userRole}</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className={inputClass}>
                {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k} style={{ background: "#1a2332" }}>{lang === "en" ? r.label : r.labelAr}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.userDept}</label>
              <input value={newUser.dept} onChange={e => setNewUser({ ...newUser, dept: e.target.value })}
                placeholder={lang === "en" ? "Department" : "الإدارة"} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-xs text-slate-500 border border-white/[0.08] cursor-pointer hover:text-slate-300 transition-all">
              {lang === "en" ? "Cancel" : "إلغاء"}
            </button>
            <button onClick={handleAddUser} disabled={!newUser.name || !newUser.email}
              className="px-5 py-2 rounded-lg text-xs font-bold cursor-pointer text-[#0a1a1a] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #2D9B9B, #00B4D8)" }}>
              {t.addUser}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[2fr_1fr] gap-3.5">
        {/* User Directory */}
        <div className={`${cardClass} p-0 overflow-hidden`}>
          <div className="grid gap-2 px-4 py-3 bg-black/20 border-b border-white/[0.06]" style={{ gridTemplateColumns: "1.5fr 1.2fr 0.8fr 1fr 0.6fr" }}>
            {[t.userName, t.userEmail, t.userRole, t.userDept, t.actions].map(h => (
              <div key={h} className="text-slate-600 text-[11px] font-bold uppercase">{h}</div>
            ))}
          </div>
          {userList.map((u, i) => (
            <div key={i} className="grid gap-2 px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all" style={{ gridTemplateColumns: "1.5fr 1.2fr 0.8fr 1fr 0.6fr" }}>
              <div>
                <div className="text-white text-[13px] font-semibold">{lang === "en" ? u.name : (u.nameAr || u.name)}</div>
                <div className="text-[10px]" style={{ color: u.status === "Active" ? "#2D9B9B" : "#FFB224" }}>{u.status || "Active"}</div>
              </div>
              <div className="text-slate-500 text-xs flex items-center">{u.email}</div>
              <div className="flex items-center">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${ROLES[u.role]?.color || "#8899AA"}18`, color: ROLES[u.role]?.color || "#8899AA" }}>
                  {lang === "en" ? ROLES[u.role]?.label || u.role : ROLES[u.role]?.labelAr || u.role}
                </span>
              </div>
              <div className="text-slate-500 text-xs flex items-center">{u.dept === "All" ? (lang === "en" ? "All Departments" : "كل الإدارات") : u.dept}</div>
              <div className="flex items-center">
                <button className="text-slate-600 text-[11px] hover:text-slate-300 cursor-pointer transition-all">
                  {lang === "en" ? "Edit" : "تعديل"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Log */}
        <div className={cardClass}>
          <h3 className="text-white text-[13px] font-semibold mb-3.5">{lang === "en" ? "Recent Activity" : "النشاط الأخير"}</h3>
          <div className="space-y-3">
            {ACTIVITY(lang).map((a, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[12px] font-semibold">{a.user}</div>
                  <div className="text-slate-500 text-[11px] leading-snug">{a.action}</div>
                  <div className="text-slate-700 text-[10px] mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
