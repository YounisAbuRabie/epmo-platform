// ============================================================
// AI ASSISTANT - src/components/AiAssistant.jsx
// ============================================================
// 3 AI agent personas (Strategy, Risk, PM) with Claude API
// chat interface, suggested prompts, conversation history.
//
// PROPS:
// - projects: visible projects
// - stratGoals: strategic goal definitions
// - lang: "en" or "ar"
// - translations: current language strings
// - currentUser: logged-in user
// ============================================================

import { useState, useRef, useEffect } from "react";

const cardClass = "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4";

const AGENTS = (t) => ({
  strategy: {
    id: "strategy",
    name: t.stratAgent,
    desc: t.stratAgentDesc,
    color: "#2D9B9B",
    icon: "🎯",
    system: (lang) => `You are a Strategic Analysis Agent for a Saudi government EPMO (Enterprise Project Management Office). Your role:
- Analyze strategic alignment of projects to Vision 2030 goals
- Evaluate goal achievement rates and KPI performance
- Identify misalignment, underperforming goals, and resource gaps
- Provide actionable strategic recommendations
Respond in ${lang === "en" ? "English" : "Arabic"}. Be concise, data-driven, and specific. Use bullet points for recommendations.`,
    prompts: (lang) => lang === "en" ? [
      "Which strategic goals are underperforming and why?",
      "How well is our portfolio aligned with Vision 2030?",
      "Which projects should be reprioritized for better strategic alignment?",
    ] : [
      "ما الأهداف الاستراتيجية ذات الأداء المنخفض ولماذا؟",
      "ما مدى توافق محفظتنا مع رؤية 2030؟",
      "ما المشاريع التي يجب إعادة ترتيب أولوياتها؟",
    ],
  },
  risk: {
    id: "risk",
    name: t.riskAgent,
    desc: t.riskAgentDesc,
    color: "#FF4D6A",
    icon: "⚠️",
    system: (lang) => `You are a Risk Analysis Agent for a Saudi government EPMO. Your role:
- Identify risk patterns across the portfolio (budget overruns, schedule delays, escalations)
- Flag projects with compounding risk factors
- Predict which projects are likely to escalate
- Recommend mitigation strategies
Respond in ${lang === "en" ? "English" : "Arabic"}. Be direct about risks — don't sugarcoat. Quantify impact where possible.`,
    prompts: (lang) => lang === "en" ? [
      "Which projects have the highest risk of failure?",
      "Identify budget overrun patterns across the portfolio",
      "What are the top 3 risks that could derail our portfolio?",
    ] : [
      "ما المشاريع الأكثر عرضة للفشل؟",
      "حدد أنماط تجاوز الميزانية في المحفظة",
      "ما أهم 3 مخاطر قد تعرقل المحفظة؟",
    ],
  },
  pm: {
    id: "pm",
    name: t.pmAgent,
    desc: t.pmAgentDesc,
    color: "#00B4D8",
    icon: "📊",
    system: (lang) => `You are a Project Management Agent for a Saudi government EPMO. Your role:
- Track project delivery, milestones, and schedule performance
- Analyze resource utilization and allocation efficiency
- Identify bottlenecks and suggest corrective actions
- Compare project performance across departments
Respond in ${lang === "en" ? "English" : "Arabic"}. Focus on actionable delivery insights.`,
    prompts: (lang) => lang === "en" ? [
      "Which projects are behind schedule and what's the recovery plan?",
      "How efficiently are resources being utilized across departments?",
      "Give me a delivery status overview for all critical projects",
    ] : [
      "ما المشاريع المتأخرة عن الجدول الزمني وما خطة التعافي؟",
      "ما مدى كفاءة استخدام الموارد عبر الإدارات؟",
      "أعطني نظرة عامة على حالة التسليم للمشاريع الحرجة",
    ],
  },
});

export default function AiAssistant({ projects, stratGoals, lang, translations: t, currentUser }) {
  const agents = AGENTS(t);
  const [activeAgent, setActiveAgent] = useState("strategy");
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const agent = agents[activeAgent];

  const agentMessages = messages[activeAgent] || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages, loading]);

  const buildContext = () => {
    const projCtx = projects.map(p =>
      `${p.id}|${p.name}|${p.dept}|${p.status}|Budget:SAR${p.budget}|Spent:SAR${p.spent}|${p.completion}%|Risk:${p.risk}|Goal:${p.goalId}|KPIs:BudExec=${p.kpis?.budgetExec}%,Mile=${p.kpis?.mileRate}%,ResUtil=${p.kpis?.resUtil}%,RiskMit=${p.kpis?.riskMit}%,Sat=${p.kpis?.satScore},SchedVar=${p.kpis?.schedVar}d,CostVar=${p.kpis?.costVar}%,Esc=${p.kpis?.escCount}`
    ).join("\n");
    const goalCtx = stratGoals.map(g =>
      `${g.id}|${lang === "en" ? g.name : g.nameAr}|KPIs:${g.kpis.map((k, i) => `${k}:${g.actuals[i]}/${g.targets[i]}`).join(",")}`
    ).join("\n");
    const totB = projects.reduce((s, p) => s + p.budget, 0);
    const totS = projects.reduce((s, p) => s + p.spent, 0);
    const nCrit = projects.filter(p => p.status === "Critical").length;
    const nDel = projects.filter(p => p.status === "Delayed").length;
    return `PORTFOLIO DATA (${projects.length} projects, SAR ${(totB/1e6).toFixed(1)}M budget, SAR ${(totS/1e6).toFixed(1)}M spent, ${nCrit} critical, ${nDel} delayed)\n\nPROJECTS:\n${projCtx}\n\nSTRATEGIC GOALS:\n${goalCtx}`;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    const prev = [...agentMessages, userMsg];
    setMessages(m => ({ ...m, [activeAgent]: prev }));
    setInput("");
    setLoading(true);

    try {
      const apiMessages = [
        { role: "user", content: `Here is the current portfolio data:\n\n${buildContext()}\n\nRespond to all questions using this data.` },
        { role: "assistant", content: lang === "en" ? "I have the portfolio data loaded. I'm ready to analyze. What would you like to know?" : "تم تحميل بيانات المحفظة. جاهز للتحليل. ماذا تريد أن تعرف؟" },
        ...prev.slice(-10),
      ];

     const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: agent.system(lang),
          messages: apiMessages,
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      console.log("API response:", JSON.stringify(data));
      const reply = data.content?.map(b => b.text || "").join("") || (lang === "en" ? "No response." : "لا توجد إجابة.");
      setMessages(m => ({ ...m, [activeAgent]: [...prev, { role: "assistant", content: reply }] }));
    } catch (err) {
      setMessages(m => ({
        ...m,
        [activeAgent]: [...prev, { role: "assistant", content: lang === "en" ? `Error: ${err.message}. Check API key configuration.` : `خطأ: ${err.message}` }],
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-5">{t.agents}</h2>

      {/* Agent Selector */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {Object.values(agents).map(a => (
          <button key={a.id} onClick={() => setActiveAgent(a.id)}
            className={`${cardClass} cursor-pointer transition-all text-left`}
            style={{
              borderColor: activeAgent === a.id ? `${a.color}44` : "rgba(255,255,255,0.06)",
              background: activeAgent === a.id ? `${a.color}08` : "rgba(255,255,255,0.03)",
            }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">{a.icon}</span>
              <span className="text-[13px] font-bold" style={{ color: activeAgent === a.id ? a.color : "#e2e8f0" }}>{a.name}</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-snug">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className={cardClass} style={{ borderColor: `${agent.color}22` }}>
        {/* Chat Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
          <span className="text-lg">{agent.icon}</span>
          <div>
            <div className="text-sm font-bold" style={{ color: agent.color }}>{agent.name}</div>
            <div className="text-slate-600 text-[10px]">{lang === "en" ? "Powered by Azure AI" : "مدعوم بـ Azure AI"}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="min-h-[300px] max-h-[420px] overflow-y-auto mb-4 space-y-3 pr-1">
          {agentMessages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-600 text-sm mb-4">
                {lang === "en" ? "Ask a question or pick a suggested prompt below." : "اطرح سؤالاً أو اختر من الاقتراحات أدناه."}
              </p>
              <div className="flex flex-col gap-2 max-w-md mx-auto">
                {agent.prompts(lang).map((pr, i) => (
                  <button key={i} onClick={() => sendMessage(pr)}
                    className="text-left px-3.5 py-2.5 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-teal-400 hover:border-teal-500/20 cursor-pointer transition-all">
                    {pr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {agentMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-teal-500/15 text-teal-100"
                  : "bg-black/30 border border-white/[0.06] text-slate-300"
              }`}>
                <pre className="whitespace-pre-wrap font-[inherit] m-0 break-words">{msg.content}</pre>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: agent.color, animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && sendMessage(input)}
            placeholder={t.askQ}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-black/30 border border-white/[0.08] rounded-xl text-white text-sm outline-none focus:border-teal-500/30 transition-all disabled:opacity-50 placeholder:text-slate-700"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[#0a1a1a]"
            style={{ background: "linear-gradient(135deg, #2D9B9B, #00B4D8)" }}>
            {t.send}
          </button>
        </div>

        {/* Suggested prompts (below input, shown after first message) */}
        {agentMessages.length > 0 && (
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {agent.prompts(lang).map((pr, i) => (
              <button key={i} onClick={() => sendMessage(pr)} disabled={loading}
                className="text-[10px] px-2.5 py-1 rounded-full border border-white/[0.06] text-slate-600 hover:text-slate-400 cursor-pointer transition-all disabled:opacity-40">
                {pr.length > 50 ? pr.slice(0, 47) + "..." : pr}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
