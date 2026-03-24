import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "layout", title: "Warehouse Layout & Space Utilisation", icon: "◫", description: "How your warehouse space is structured and used" },
  { id: "pickpack_b2c", title: "B2C Pick/Pack Workflow", icon: "⇄", description: "How consumer orders move from shelf to dispatch" },
  { id: "pickpack_b2b", title: "B2B Pick/Pack Workflow", icon: "⇄", description: "How wholesale and trade orders move from shelf to dispatch" },
  { id: "staffing", title: "Staffing & Labour Allocation", icon: "⚙", description: "How your people are organised and deployed" },
  { id: "documents", title: "B2B Document & Transfer Flow", icon: "⊞", description: "How paperwork and transfers are managed" },
];

const QUESTIONS = {
  layout: [
    { id: "floor_area", label: "Total warehouse floor area", type: "number", suffix: "sqm", placeholder: "e.g. 500" },
    {
      id: "space_allocation", label: "What percentage of space is dedicated to each zone?", type: "sliders",
      options: ["Storage / Bulk", "Packing Stations", "Receiving", "Pick / Staging", "Office"],
      helperText: "Approximate percentages — they don't need to total exactly 100%",
    },
    {
      id: "product_organisation", label: "How are products organised in your warehouse?", type: "multiselect",
      options: ["By SKU number", "By product category", "By velocity / popularity", "Combination of methods", "No formal system"],
    },
    {
      id: "forward_pick", label: "Do you have a dedicated forward-pick area for high-velocity items?", type: "multiselect",
      options: ["Yes", "No", "Partially — some fast movers are grouped", "Not sure what this means"],
    },
    {
      id: "reorganise_frequency", label: "How often do you reorganise layout based on sales data?", type: "multiselect",
      options: ["Never", "Annually", "Quarterly", "Monthly", "Continuously / as needed"],
    },
    {
      id: "aisle_width", label: "Are aisles wide enough for equipment and foot traffic simultaneously?", type: "multiselect",
      options: ["Yes — comfortably", "Mostly — occasional tight spots", "No — frequent congestion", "Not applicable — no equipment used"],
    },
    {
      id: "picking_equipment", label: "Do you use order picking equipment?", type: "multiselect",
      options: ["Pick trolleys", "Order picking forklift", "Standard forklift", "Pallet jack", "Conveyor system", "RF scanners / handhelds", "None — manual picking only"],
    },
    {
      id: "bulk_storage", label: "How are bulk products stored?", type: "multiselect",
      options: ["Racking (forklift access)", "Racking (ladder access)", "Mezzanine", "Floor shelving (ladder access)", "Floor / block stacking (pallets on ground)", "Drive-in or drive-through racking", "Cantilever racking (long or irregular items)", "Shelving units", "Shipping containers or external storage", "No dedicated bulk storage"],
    },
    {
      id: "warehouse_capacity", label: "How full is your warehouse?", type: "multiselect",
      options: ["Under 50% — plenty of room", "50–70% — comfortable with room to grow", "70–85% — getting tight", "85–95% — near capacity, limited flexibility", "Over 95% — at or beyond capacity"],
    },
    {
      id: "stock_turnover", label: "Does stock turn over quickly enough to operate close to capacity?", type: "multiselect",
      options: ["Yes — stock moves fast, high capacity is manageable", "Mostly — some slow movers take up space", "No — dead stock and slow movers clog up space", "Not sure — we don't track turnover closely"],
    },
  ],
  pickpack_b2c: [
    { id: "b2c_daily_orders", label: "Average daily B2C orders dispatched (non-busy periods)", type: "number", suffix: "orders/day", placeholder: "e.g. 150" },
    { id: "b2c_daily_orders_busy", label: "Average daily B2C orders dispatched (busy periods)", type: "number", suffix: "orders/day", placeholder: "e.g. 300" },
    { id: "b2c_picks_per_hour", label: "For B2C picks, what is the average items picked per person per hour?", type: "number", suffix: "items/hour", placeholder: "e.g. 60" },
    { id: "b2c_skus_per_order", label: "Average number of items per B2C order", type: "number", suffix: "items", placeholder: "e.g. 3" },
    {
      id: "b2c_dispatch_size", label: "Typical size of dispatched B2C orders", type: "multiselect",
      options: ["Small satchel", "Medium satchel", "Large satchel", "Small box", "Medium box", "Large box", "Multiple boxes", "Pallet", "Multiple pallets"],
    },
    {
      id: "b2c_picking_method", label: "Current B2C picking method", type: "multiselect",
      options: ["Single order picking (one order at a time)", "Batch picking (multiple orders at once)", "Wave picking (scheduled batches)", "Zone picking (staff assigned to areas)", "Combination of methods", "Not sure"],
    },
    {
      id: "b2c_pick_list_generation", label: "How are B2C pick lists generated?", type: "multiselect",
      options: ["Manually written", "Printed from Shopify / e-commerce platform", "Generated by WMS software", "Displayed on handheld device", "No formal pick lists used"],
    },
    {
      id: "b2c_order_to_dispatch", label: "Average time from B2C order received to dispatched", type: "multiselect",
      options: ["Under 2 hours", "2–4 hours", "Same day", "Next business day", "2+ business days", "Varies significantly"],
    },
    {
      id: "b2c_biggest_bottleneck", label: "What's your biggest B2C bottleneck?", type: "multiselect",
      options: ["Finding stock / locating items", "Packing and wrapping", "Labelling and documentation", "Pick / staging for dispatch", "Waiting on carrier pickup", "Replenishment", "Quality checking", "Not sure / haven't identified it"],
    },
    {
      id: "b2c_order_priority", label: "How do you prioritise B2C order processing?", type: "multiselect",
      options: ["Express orders first", "First in, first out (FIFO)", "Bulky / heavy orders separately", "By carrier cutoff times", "No formal priority system"],
    },
  ],
  pickpack_b2b: [
    { id: "b2b_daily_orders", label: "Average daily B2B orders dispatched (non-busy periods)", type: "number", suffix: "orders/day", placeholder: "e.g. 20" },
    { id: "b2b_daily_orders_busy", label: "Average daily B2B orders dispatched (busy periods)", type: "number", suffix: "orders/day", placeholder: "e.g. 40" },
    { id: "b2b_skus_per_order", label: "Average number of items per B2B order", type: "number", suffix: "items", placeholder: "e.g. 12" },
    {
      id: "b2b_dispatch_size", label: "Typical size of dispatched B2B orders", type: "multiselect",
      options: ["Small satchel", "Medium satchel", "Large satchel", "Small box", "Medium box", "Large box", "Multiple boxes", "Pallet", "Multiple pallets"],
    },
    {
      id: "b2b_picking_method", label: "Current B2B picking method", type: "multiselect",
      options: ["Single order picking (one order at a time)", "Batch picking (multiple orders at once)", "Wave picking (scheduled batches)", "Zone picking (staff assigned to areas)", "Combination of methods", "Not sure"],
    },
    {
      id: "b2b_pick_list_generation", label: "How are B2B pick lists generated?", type: "multiselect",
      options: ["Manually written", "Printed from Shopify / e-commerce platform", "Generated by WMS software", "Displayed on handheld device", "No formal pick slips used"],
    },
    {
      id: "b2b_order_to_dispatch", label: "Average time from B2B order received to dispatched", type: "multiselect",
      options: ["Under 2 hours", "2–4 hours", "Same day", "Next business day", "2+ business days", "Varies significantly"],
    },
    {
      id: "b2b_biggest_bottleneck", label: "What's your biggest B2B bottleneck?", type: "multiselect",
      options: ["Finding stock / locating items", "Packing and wrapping", "Labelling and documentation", "Pick / staging for dispatch", "Waiting on carrier pickup", "Replenishment", "Quality checking", "Not sure / haven't identified it"],
    },
    {
      id: "b2b_order_priority", label: "How do you prioritise B2B order processing?", type: "multiselect",
      options: ["Express orders first", "First in, first out (FIFO)", "Bulky / heavy orders separately", "By customer priority or SLA", "By delivery route or region", "No formal priority system"],
    },
  ],
  staffing: [
    { id: "headcount_fulltime", label: "Full-time warehouse staff", type: "number", suffix: "people", placeholder: "e.g. 4" },
    { id: "headcount_parttime", label: "Part-time warehouse staff per day (non-busy periods)", type: "number", suffix: "people", placeholder: "e.g. 2" },
    { id: "headcount_parttime_busy", label: "Part-time warehouse staff per day (busy periods)", type: "number", suffix: "people", placeholder: "e.g. 4" },
    { id: "headcount_casual", label: "Casual warehouse staff per day (non-busy periods)", type: "number", suffix: "people", placeholder: "e.g. 3" },
    { id: "headcount_casual_busy", label: "Casual warehouse staff per day (busy periods)", type: "number", suffix: "people", placeholder: "e.g. 8" },
    {
      id: "task_assignment", label: "How are daily tasks assigned?", type: "multiselect",
      options: ["Verbal instructions each morning", "Whiteboard / physical board", "Digital roster or task system", "Staff self-direct based on experience", "No formal system"],
    },
    {
      id: "cross_training", label: "Do staff cross-train across picking, packing, receiving, and dispatch?", type: "multiselect",
      options: ["Yes — all staff can do all tasks", "Mostly — most staff know multiple areas", "Partially — some specialisation", "No — staff are assigned to fixed roles"],
    },
    {
      id: "peak_handling", label: "How do you handle peak periods and sales spikes?", type: "multiselect",
      options: ["Hire additional casuals", "Overtime for existing staff", "Extend operating hours", "Pre-pick anticipated orders", "Bring in temp agency staff", "No specific strategy — we just push through"],
    },
    {
      id: "staffing_challenge", label: "What's your biggest staffing challenge?", type: "multiselect",
      options: ["High turnover", "Long training time for new staff", "Task allocation and balancing workloads", "Idle time between tasks", "Finding reliable casuals", "Managing across shifts"],
    },
    {
      id: "task_rotation", label: "Do you rotate staff between tasks throughout a day?", type: "multiselect",
      options: ["Yes — structured rotation schedule", "Yes — informal, manager decides as needed", "Occasionally, when someone needs a break", "No — staff stay on one task per shift"],
    },
    {
      id: "rotation_details", label: "If you rotate, which tasks and roughly how often?", type: "textarea",
      placeholder: "e.g. Pick and pack rotate every 2 hours, receiving staff switch to dispatch after lunch...",
      conditional: { field: "task_rotation", notValue: "No — staff stay on one task per shift" },
    },
  ],
  documents: [
    {
      id: "same_invoice_system", label: "Are all B2B customer invoices generated using the same system?", type: "multiselect",
      options: ["Yes — one system for all B2B invoices", "No — different systems for different customers", "Some customers require their own portal or format", "We generate invoices manually (Word, Excel, etc.)", "Our accounting software handles all invoices", "Not sure — different people handle different accounts"],
    },
    {
      id: "b2b_process_varies", label: "For different B2B customers, is the process different?", type: "multiselect",
      options: ["Yes — some customers have specific packing requirements", "Yes — some require specific documentation or labelling", "Yes — some have unique delivery or dispatch processes", "Yes — pricing or invoicing differs per customer", "Slightly — minor variations but mostly the same", "No — same process for all B2B customers"],
    },
    {
      id: "pick_slip_generation", label: "How are B2B pick slips currently generated?", type: "multiselect",
      options: ["Manually written or typed", "System-generated from WMS/ERP", "Spreadsheet-based", "From e-commerce platform (Shopify, WooCommerce, etc.)", "No formal pick slips used"],
    },
    {
      id: "invoice_matching", label: "How are invoices matched to dispatched orders?", type: "multiselect",
      options: ["Manually — someone checks each one", "Partially automated — system helps but needs manual review", "Fully automated — system handles it end to end", "Invoices aren't matched to dispatch — handled separately"],
    },
    {
      id: "delivery_dockets", label: "How are delivery dockets created and tracked?", type: "multiselect",
      options: ["Handwritten", "Printed from a template", "System-generated", "Carrier provides their own", "We don't use delivery dockets"],
    },
    {
      id: "equipment_transfers", label: "How do you handle equipment transfers between locations or departments?", type: "multiselect",
      options: ["Formal transfer documents / system", "Email or message trail", "Verbal — someone just moves it", "Spreadsheet log", "Not applicable — single location"],
    },
    {
      id: "document_stuck", label: "Where do documents get stuck or lost in the process?", type: "multiselect",
      options: ["Between picking and packing", "At dispatch / handoff to carrier", "Invoice generation or matching", "Returns and credits", "Inter-department transfers", "They don't — our flow is solid", "Not sure — we don't track this"],
    },
    {
      id: "people_per_order", label: "How many people touch a single B2B order from pick to dispatch?", type: "multiselect",
      options: ["1 person end to end", "2 people", "3 people", "4+ people", "Varies significantly"],
    },
    {
      id: "document_storage", label: "How are documents stored?", type: "multiselect",
      options: ["Physical filing / paper", "Scanned to computer / shared drive", "Cloud storage (Google Drive, Dropbox, etc.)", "Within our WMS / ERP system", "Email archives", "No formal storage system"],
    },
    {
      id: "document_retention", label: "Do you have a set period you keep documents stored for?", type: "multiselect",
      options: ["Yes — we follow a specific retention policy", "Roughly — we keep things for a few years", "No — we keep everything indefinitely", "No — we discard when we feel like it", "Not sure"],
    },
    {
      id: "spreadsheet_tracking", label: "Do you rely on manual spreadsheets to track order completion progress?", type: "multiselect",
      options: ["Yes — spreadsheets are our main tracking tool", "Partially — spreadsheets supplement our system", "No — our WMS/system handles tracking", "No — we don't formally track completion"],
    },
  ],
};

const theme = {
  bg: "#F7F8F6", surface: "#FFFFFF", surfaceHover: "#F5F1EE",
  border: "#E4DED8", borderFocus: "#B5654A",
  accent: "#B5654A", accentDim: "rgba(181,101,74,0.08)", accentGlow: "rgba(181,101,74,0.18)",
  text: "#1A1D26", textMuted: "#6B6460", textDim: "#A69E98",
  danger: "#C43D3D", success: "#1A9960", successDim: "rgba(26,153,96,0.1)", warning: "#D4930D", warningDim: "rgba(212,147,13,0.1)",
};

const RISK_COLORS = {
  critical: { bg: "rgba(196,61,61,0.08)", border: "#C43D3D", text: "#C43D3D", label: "Critical" },
  high: { bg: "rgba(212,147,13,0.08)", border: "#D4930D", text: "#D4930D", label: "High" },
  moderate: { bg: "rgba(181,101,74,0.08)", border: "#B5654A", text: "#B5654A", label: "Moderate" },
  low: { bg: "rgba(26,153,96,0.08)", border: "#1A9960", text: "#1A9960", label: "Low" },
};

/* ─── Report Generation ─── */

function formatAnswersForPrompt(answers) {
  let output = "";
  CATEGORIES.forEach((cat) => {
    output += `\n## ${cat.title}\n`;
    QUESTIONS[cat.id].forEach((q) => {
      const val = answers[q.id];
      let display = "Not answered";
      if (val !== undefined && val !== null && val !== "") {
        if (Array.isArray(val)) display = val.length > 0 ? val.join(", ") : "Not answered";
        else if (typeof val === "object") {
          const entries = Object.entries(val).filter(([, v]) => v > 0);
          display = entries.length > 0 ? entries.map(([k, v]) => `${k}: ${v}%`).join(", ") : "Not answered";
        } else display = String(val);
      }
      output += `- ${q.label}: ${display}\n`;
    });
  });
  return output;
}

async function generateReport(answers) {
  const formattedAnswers = formatAnswersForPrompt(answers);
  const response = await fetch("/api/generate-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: formattedAnswers }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Report generation failed");
  return data;
}

/* ─── UI Components ─── */

function ProgressBar({ currentCategoryIndex, answers, onCategoryClick }) {
  return (
    <div style={{ display: "flex", gap: "4px", marginBottom: "32px" }}>
      {CATEGORIES.map((cat, i) => {
        const isCurrent = i === currentCategoryIndex;
        const questions = QUESTIONS[cat.id];
        const answered = questions.filter((q) => {
          const val = answers[q.id];
          if (val === undefined || val === null || val === "") return false;
          if (Array.isArray(val)) return val.length > 0;
          if (typeof val === "object") return Object.values(val).some((v) => v > 0);
          return true;
        }).length;
        const complete = answered === questions.length;
        const pct = (answered / questions.length) * 100;
        return (
          <div key={cat.id} style={{ flex: 1, cursor: "pointer" }} onClick={() => onCategoryClick(i)}>
            <div style={{
              height: "4px", borderRadius: "2px", transition: "all 0.4s ease",
              background: complete ? theme.success
                : isCurrent ? `linear-gradient(90deg, ${theme.accent} ${pct}%, ${theme.border} ${pct}%)`
                : answered > 0 ? `linear-gradient(90deg, ${theme.textDim} ${pct}%, ${theme.border} ${pct}%)` : theme.border,
            }} />
            <div style={{
              marginTop: "8px", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.5px", textTransform: "uppercase", transition: "color 0.2s ease",
              color: isCurrent ? theme.accent : complete ? theme.success : theme.textDim,
            }}>
              {cat.icon} {cat.title.split("&")[0].split("Workflow")[0].trim()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NumberInput({ question, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <input type="number" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder}
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "12px 16px", color: theme.text, fontSize: "15px", fontFamily: "'JetBrains Mono', monospace", width: "160px", outline: "none" }}
        onFocus={(e) => (e.target.style.borderColor = theme.borderFocus)}
        onBlur={(e) => (e.target.style.borderColor = theme.border)}
      />
      {question.suffix && <span style={{ color: theme.textMuted, fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }}>{question.suffix}</span>}
    </div>
  );
}

function MultiSelectInput({ question, value = [], onChange }) {
  const toggle = (opt) => value.includes(opt) ? onChange(value.filter((v) => v !== opt)) : onChange([...value, opt]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontSize: "12px", color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace", marginBottom: "4px" }}>Select all that apply</span>
      {question.options.map((opt) => {
        const sel = value.includes(opt);
        return (
          <button key={opt} onClick={() => toggle(opt)} style={{
            background: sel ? theme.accentDim : "transparent", border: `1px solid ${sel ? theme.accent : theme.border}`,
            borderRadius: "8px", padding: "12px 16px", color: sel ? theme.accent : theme.text,
            fontSize: "14px", fontFamily: "'DM Sans', sans-serif", textAlign: "left", cursor: "pointer", transition: "all 0.15s ease", outline: "none",
          }}>
            <span style={{ marginRight: "10px", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>{sel ? "☑" : "☐"}</span>{opt}
          </button>
        );
      })}
    </div>
  );
}

function SliderInput({ question, value = {}, onChange }) {
  const total = Object.values(value).reduce((a, b) => a + b, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {question.helperText && <span style={{ fontSize: "12px", color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{question.helperText}</span>}
      {question.options.map((zone) => {
        const val = value[zone] || 0;
        return (
          <div key={zone} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ width: "130px", fontSize: "13px", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{zone}</span>
            <input type="range" min="0" max="100" step="5" value={val} onChange={(e) => onChange({ ...value, [zone]: parseInt(e.target.value) })} style={{ flex: 1, accentColor: theme.accent, cursor: "pointer" }} />
            <span style={{ width: "45px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: val > 0 ? theme.text : theme.textDim }}>{val}%</span>
          </div>
        );
      })}
      <div style={{ fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", color: total === 100 ? theme.success : total > 100 ? theme.danger : theme.textDim, textAlign: "right" }}>Total: {total}%</div>
    </div>
  );
}

function TextareaInput({ question, value, onChange }) {
  return (
    <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder} rows={3}
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "12px 16px", color: theme.text, fontSize: "14px", fontFamily: "'DM Sans', sans-serif", width: "100%", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
      onFocus={(e) => (e.target.style.borderColor = theme.borderFocus)}
      onBlur={(e) => (e.target.style.borderColor = theme.border)}
    />
  );
}

function QuestionCard({ question, value, onChange, index }) {
  const inputs = { number: NumberInput, multiselect: MultiSelectInput, sliders: SliderInput, textarea: TextareaInput };
  const Input = inputs[question.type];
  return (
    <div style={{ marginBottom: "36px", paddingBottom: "36px", borderBottom: `1px solid ${theme.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: theme.textDim, background: theme.surfaceHover, padding: "4px 8px", borderRadius: "4px", flexShrink: 0, marginTop: "2px" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <label style={{ fontSize: "15px", fontFamily: "'DM Sans', sans-serif", color: theme.text, fontWeight: 500, lineHeight: 1.5 }}>{question.label}</label>
      </div>
      {Input && <Input question={question} value={value} onChange={onChange} />}
    </div>
  );
}

/* ─── Score Ring ─── */
function ScoreRing({ score, size = 100 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? theme.success : score >= 60 ? theme.warning : theme.danger;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.border} strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={theme.text} fontSize={size * 0.3} fontWeight="700" fontFamily="'JetBrains Mono', monospace" style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>{score}</text>
    </svg>
  );
}

/* ─── Report View ─── */
function ReportView({ report, onBack }) {
  const handlePrint = () => {
    const pw = window.open("", "_blank");
    pw.document.write(`<!DOCTYPE html><html><head><title>Warehouse Audit Report</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1A1D26;padding:40px;max-width:800px;margin:0 auto;line-height:1.6}h1{font-size:24px;margin-bottom:8px}h2{font-size:18px;margin:28px 0 12px;color:#B5654A}h3{font-size:15px;margin:16px 0 8px}p{margin-bottom:10px;font-size:14px}.score{font-family:'JetBrains Mono',monospace;font-size:48px;font-weight:700;color:#B5654A}.badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;font-family:'JetBrains Mono',monospace}.finding{padding:8px 0;border-bottom:1px solid #E4DED8;font-size:14px}.rec{padding:12px 0;border-bottom:1px solid #E4DED8}.rec-p{font-family:'JetBrains Mono',monospace;font-size:11px;color:#B5654A}.rec-a{font-weight:600;font-size:14px;margin:4px 0}.rec-i{font-size:13px;color:#6B6460}.section{page-break-inside:avoid;margin-bottom:24px;padding:20px;border:1px solid #E4DED8;border-radius:8px}@media print{body{padding:20px}.section{break-inside:avoid}}</style></head><body>`);
    pw.document.write(`<h1>Warehouse Operations Audit Report</h1><p style="color:#6B6460;margin-bottom:24px">Generated ${new Date().toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}</p>`);
    pw.document.write(`<div class="score">${report.overall_score}/100</div><p style="margin:12px 0 28px">${report.executive_summary}</p>`);
    report.sections.forEach((s) => {
      const rc = RISK_COLORS[s.risk_level] || RISK_COLORS.moderate;
      pw.document.write(`<div class="section"><h2>${s.title} <span class="badge" style="background:${rc.bg};color:${rc.text};border:1px solid ${rc.border}">${rc.label}</span> — ${s.score}/100</h2><h3>Findings</h3>`);
      s.findings.forEach((f) => pw.document.write(`<div class="finding">${f}</div>`));
      pw.document.write(`<h3 style="margin-top:16px">Recommendations</h3>`);
      s.recommendations.forEach((r) => pw.document.write(`<div class="rec"><div class="rec-p">Priority ${r.priority} · ${r.effort} effort${r.timeframe ? ' · ' + r.timeframe : ''}</div><div class="rec-a">${r.action}</div><div class="rec-i">${r.impact}</div></div>`));
      pw.document.write(`</div>`);
    });
    pw.document.write(`<h2>Quick Wins</h2>`);
    report.quick_wins.forEach((q) => pw.document.write(`<div class="finding">✓ ${q}</div>`));
    pw.document.write(`<h2>Strategic Priorities</h2>`);
    report.strategic_priorities.forEach((s) => pw.document.write(`<div class="finding">→ ${s}</div>`));
    if (report.references && report.references.length > 0) {
      pw.document.write(`<h2 style="color:#6B6460;font-size:15px;">References</h2>`);
      report.references.forEach((r) => pw.document.write(`<div style="font-size:11px;color:#6B6460;padding:4px 0;border-bottom:1px solid #E4DED8;font-family:'JetBrains Mono',monospace;">${r}</div>`));
    }
    pw.document.write(`</body></html>`);
    pw.document.close();
    pw.onload = () => pw.print();
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "3px", color: theme.accent, textTransform: "uppercase", marginBottom: "16px" }}>Warehouse Operations Audit Report</div>
        <div style={{ fontSize: "12px", color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>Generated {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</div>
      </div>

      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "32px", marginBottom: "24px", textAlign: "center" }}>
        <ScoreRing score={report.overall_score} size={120} />
        <div style={{ fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", color: theme.textMuted, marginTop: "12px" }}>Overall Operations Score</div>
        <p style={{ fontSize: "15px", color: theme.text, lineHeight: 1.7, marginTop: "16px", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }}>{report.executive_summary}</p>
      </div>

      {report.sections.map((section, i) => {
        const rc = RISK_COLORS[section.risk_level] || RISK_COLORS.moderate;
        return (
          <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "17px", fontWeight: 700, color: theme.text }}>{section.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>{rc.label} risk</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700, color: theme.text }}>{section.score}/100</span>
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: theme.textDim, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Findings</div>
              {section.findings.map((f, fi) => (<div key={fi} style={{ padding: "10px 0", borderBottom: `1px solid ${theme.border}`, fontSize: "14px", lineHeight: 1.6, color: theme.text }}>{f}</div>))}
            </div>
            <div>
              <div style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: theme.textDim, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Recommendations</div>
              {section.recommendations.map((rec, ri) => (
                <div key={ri} style={{ padding: "14px 0", borderBottom: `1px solid ${theme.border}` }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: theme.accent, fontWeight: 600 }}>P{rec.priority}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", padding: "1px 6px", borderRadius: "3px", background: rec.effort === "low" ? theme.successDim : rec.effort === "high" ? "rgba(196,61,61,0.08)" : theme.warningDim, color: rec.effort === "low" ? theme.success : rec.effort === "high" ? theme.danger : theme.warning }}>{rec.effort} effort</span>
                    {rec.timeframe && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: theme.accentDim, color: theme.accent }}>{rec.timeframe}</span>}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: theme.text, marginBottom: "4px" }}>{rec.action}</div>
                  <div style={{ fontSize: "13px", color: theme.textMuted, lineHeight: 1.7 }}>{rec.impact}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ background: theme.successDim, border: `1px solid ${theme.success}`, borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "17px", fontWeight: 700, color: theme.success, marginBottom: "14px" }}>Quick Wins — Implement This Week</h3>
        {report.quick_wins.map((qw, i) => (<div key={i} style={{ padding: "8px 0", fontSize: "14px", color: theme.text, lineHeight: 1.6 }}><span style={{ color: theme.success, marginRight: "8px", fontWeight: 700 }}>✓</span>{qw}</div>))}
      </div>

      <div style={{ background: theme.accentDim, border: `1px solid ${theme.accent}`, borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "17px", fontWeight: 700, color: theme.accent, marginBottom: "14px" }}>Strategic Priorities — Next 3–6 Months</h3>
        {report.strategic_priorities.map((sp, i) => (<div key={i} style={{ padding: "8px 0", fontSize: "14px", color: theme.text, lineHeight: 1.6 }}><span style={{ color: theme.accent, marginRight: "8px", fontWeight: 700 }}>→</span>{sp}</div>))}
      </div>

      {report.references && report.references.length > 0 && (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px", marginBottom: "32px" }}>
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 700, color: theme.textMuted, marginBottom: "14px" }}>References</h3>
          {report.references.map((ref, i) => (
            <div key={i} style={{ padding: "6px 0", fontSize: "12px", color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6, borderBottom: `1px solid ${theme.border}` }}>
              {ref}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "14px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.textMuted, fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer" }}>← Back to Summary</button>
        <button onClick={handlePrint} style={{ flex: 2, padding: "14px", background: theme.accent, border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", boxShadow: `0 0 24px ${theme.accentGlow}` }}>Download as PDF ↓</button>
      </div>
    </div>
  );
}

/* ─── Loading View ─── */
function LoadingView() {
  const [dots, setDots] = useState("");
  const steps = ["Analysing warehouse layout", "Evaluating B2C workflows", "Evaluating B2B workflows", "Assessing staffing", "Reviewing document flows", "Generating recommendations"];
  const [step, setStep] = useState(0);
  useEffect(() => { const i = setInterval(() => setDots((d) => d.length >= 3 ? "" : d + "."), 500); return () => clearInterval(i); }, []);
  useEffect(() => { const i = setInterval(() => setStep((s) => s < steps.length - 1 ? s + 1 : s), 2800); return () => clearInterval(i); }, []);
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ width: "64px", height: "64px", margin: "0 auto 24px", borderRadius: "50%", border: `3px solid ${theme.border}`, borderTopColor: theme.accent, animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "22px", fontWeight: 700, color: theme.text, marginBottom: "32px" }}>Generating Your Audit Report{dots}</h2>
      <div style={{ maxWidth: "360px", margin: "0 auto", textAlign: "left" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ padding: "10px 0", display: "flex", alignItems: "center", gap: "12px", opacity: i <= step ? 1 : 0.3, transition: "opacity 0.5s ease" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", color: i < step ? theme.success : i === step ? theme.accent : theme.textDim }}>{i < step ? "✓" : i === step ? "▸" : "○"}</span>
            <span style={{ fontSize: "13px", color: i <= step ? theme.text : theme.textDim }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Summary View ─── */
function SummaryView({ answers, onBack, onGenerate }) {
  const allQs = Object.values(QUESTIONS).flat();
  const totalAnswered = allQs.filter((q) => {
    const val = answers[q.id];
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.values(val).some((v) => v > 0);
    return true;
  }).length;

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${theme.accentDim}, transparent)`, border: `1px solid ${theme.accent}`, borderRadius: "12px", padding: "32px", marginBottom: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "22px", color: theme.text, fontWeight: 600, marginBottom: "8px" }}>Audit Questionnaire Complete</h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: theme.textMuted }}>{totalAnswered} of {allQs.length} questions answered</p>
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.id} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", color: theme.accent, fontWeight: 600, marginBottom: "16px" }}>{cat.icon} {cat.title}</h3>
          {QUESTIONS[cat.id].map((q) => {
            const val = answers[q.id];
            let display = "—";
            if (val !== undefined && val !== null && val !== "") {
              if (Array.isArray(val)) display = val.length > 0 ? val.join(", ") : "—";
              else if (typeof val === "object") { const entries = Object.entries(val).filter(([, v]) => v > 0); display = entries.length > 0 ? entries.map(([k, v]) => `${k}: ${v}%`).join(", ") : "—"; }
              else display = String(val);
            }
            return (
              <div key={q.id} style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: "12px", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: "4px" }}>{q.label}</div>
                <div style={{ fontSize: "14px", color: display === "—" ? theme.textDim : theme.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{display}</div>
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "14px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.textMuted, fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer" }}>← Edit Answers</button>
        <button onClick={onGenerate} style={{ flex: 2, padding: "14px", background: theme.accent, border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", boxShadow: `0 0 24px ${theme.accentGlow}` }}>Generate Audit Report — $99 AUD</button>
      </div>
    </div>
  );
}

/* ─── Landing View ─── */
function LandingView({ onStart }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "3px", color: theme.accent, textTransform: "uppercase", marginBottom: "24px" }}>Warehouse Operations Audit</div>
      <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700, color: theme.text, lineHeight: 1.2, maxWidth: "600px", margin: "0 auto 20px" }}>Find the inefficiencies your warehouse can't see</h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", color: theme.textMuted, lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 40px" }}>Answer questions about your warehouse operations across five critical areas. Get a detailed, AI-powered audit report with prioritised recommendations to cut costs, speed up dispatch, and fix what's slowing you down.</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "48px", flexWrap: "wrap" }}>
        {[{ num: "15", label: "min to complete" }, { num: "5", label: "areas audited" }, { num: "$99", label: "per report" }].map((stat) => (
          <div key={stat.label}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", color: theme.accent, fontWeight: 700 }}>{stat.num}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: theme.textDim, letterSpacing: "0.5px", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <button onClick={onStart} style={{ padding: "16px 48px", background: theme.accent, border: "none", borderRadius: "8px", color: "#fff", fontSize: "16px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", boxShadow: `0 0 32px ${theme.accentGlow}` }}>Start Your Audit →</button>
      <div style={{ marginTop: "64px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {CATEGORIES.map((cat) => (
          <div key={cat.id} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "20px", textAlign: "left" }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>{cat.icon}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: theme.text, fontWeight: 600, marginBottom: "6px" }}>{cat.title}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: theme.textMuted, lineHeight: 1.5 }}>{cat.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main App ─── */
export default function WarehouseAuditTool() {
  const [view, setView] = useState("landing");
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const topRef = useRef(null);

  const currentCategory = CATEGORIES[currentCategoryIndex];
  const questions = view === "audit" ? QUESTIONS[currentCategory.id] : [];
  const visibleQuestions = questions.filter((q) => {
    if (!q.conditional) return true;
    const val = answers[q.conditional.field];
    if (Array.isArray(val)) return !val.includes(q.conditional.notValue);
    return val !== q.conditional.notValue;
  });

  const updateAnswer = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const goToCategory = (index) => {
    setCurrentCategoryIndex(index);
    setView("audit");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goNext = () => {
    if (currentCategoryIndex < CATEGORIES.length - 1) setCurrentCategoryIndex((i) => i + 1);
    else setView("summary");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goPrev = () => {
    if (currentCategoryIndex > 0) { setCurrentCategoryIndex((i) => i - 1); topRef.current?.scrollIntoView({ behavior: "smooth" }); }
  };

  const handleGenerate = async () => {
    setView("loading");
    setError(null);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    try {
      const result = await generateReport(answers);
      setReport(result);
      setView("report");
    } catch (err) {
      console.error("Report generation failed:", err);
      setError(err.message || "Report generation failed. Please try again.");
      setView("summary");
    }
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      <div ref={topRef} />
      <header style={{ padding: "20px 32px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => { setView("landing"); setCurrentCategoryIndex(0); }}>
          <div style={{ width: "32px", height: "32px", background: theme.accentDim, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: theme.accent, fontWeight: 700 }}>◫</div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 600, color: theme.text, letterSpacing: "-0.3px" }}>WAREHOUSE AUDIT</span>
        </div>
        {view === "audit" && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: theme.textDim }}>Section {currentCategoryIndex + 1} of {CATEGORIES.length}</span>}
        {view === "report" && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: theme.success }}>✓ Report Generated</span>}
      </header>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px 80px" }}>
        {error && (
          <div style={{ background: "rgba(196,61,61,0.08)", border: `1px solid ${theme.danger}`, borderRadius: "8px", padding: "16px", marginBottom: "24px", fontSize: "14px", color: theme.danger }}>{error}</div>
        )}

        {view === "landing" && <LandingView onStart={() => setView("audit")} />}

        {view === "audit" && (
          <>
            <ProgressBar currentCategoryIndex={currentCategoryIndex} answers={answers} onCategoryClick={goToCategory} />
            <div style={{ marginBottom: "32px" }}>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "24px", fontWeight: 700, color: theme.text, marginBottom: "8px" }}>{currentCategory.icon} {currentCategory.title}</h2>
              <p style={{ fontSize: "14px", color: theme.textMuted, lineHeight: 1.6 }}>{currentCategory.description}</p>
            </div>
            {visibleQuestions.map((q, i) => (
              <QuestionCard key={q.id} question={q} value={answers[q.id]} onChange={(val) => updateAnswer(q.id, val)} index={i} />
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", flexWrap: "wrap", gap: "12px" }}>
              <button onClick={goPrev} disabled={currentCategoryIndex === 0}
                style={{ padding: "12px 24px", background: "transparent", border: `1px solid ${currentCategoryIndex === 0 ? theme.border : theme.textDim}`, borderRadius: "8px", color: currentCategoryIndex === 0 ? theme.textDim : theme.textMuted, fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: currentCategoryIndex === 0 ? "not-allowed" : "pointer" }}>
                ← Previous
              </button>
              <button onClick={() => { setView("summary"); topRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ padding: "12px 20px", background: "transparent", border: "none", color: theme.accent, fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                Jump to Review →
              </button>
              <button onClick={goNext}
                style={{ padding: "12px 32px", background: theme.accent, border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", boxShadow: `0 0 20px ${theme.accentGlow}` }}>
                {currentCategoryIndex === CATEGORIES.length - 1 ? "Review Answers →" : "Next Section →"}
              </button>
            </div>
          </>
        )}

        {view === "summary" && (
          <SummaryView answers={answers} onBack={() => { setView("audit"); setCurrentCategoryIndex(CATEGORIES.length - 1); }} onGenerate={handleGenerate} />
        )}

        {view === "loading" && <LoadingView />}
        {view === "report" && report && <ReportView report={report} onBack={() => setView("summary")} />}
      </div>
    </div>
  );
}
