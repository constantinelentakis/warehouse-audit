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

async function generateReport(answers, email, sessionId) {
  const formattedAnswers = formatAnswersForPrompt(answers);
  const response = await fetch("/api/generate-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: formattedAnswers, email, sessionId }),
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
            <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
              <input
                type="number"
                min="0"
                max="100"
                value={val}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value);
                  onChange({ ...value, [zone]: isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed)) });
                }}
                style={{
                  width: "52px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px",
                  color: val > 0 ? theme.text : theme.textDim, background: theme.surface, border: `1px solid ${theme.border}`,
                  borderRadius: "4px", padding: "4px 6px", outline: "none", boxSizing: "border-box",
                  MozAppearance: "textfield", WebkitAppearance: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = theme.borderFocus; e.target.select(); }}
                onBlur={(e) => (e.target.style.borderColor = theme.border)}
              />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: theme.textDim }}>%</span>
            </div>
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
function ReportView({ report, onBack, email }) {
  const handlePrint = () => {
    const pw = window.open("", "_blank");
    pw.document.write(`<!DOCTYPE html><html><head><title>Warehouse Audit Report</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; color: #1A1D26; padding: 40px 48px; max-width: 800px; margin: 0 auto; line-height: 1.7; font-size: 13px; }
        h1 { font-size: 22px; margin-bottom: 4px; text-align: center; }
        h2 { font-size: 16px; margin: 0 0 12px; color: #B5654A; }
        h3 { font-size: 13px; margin: 14px 0 8px; text-transform: uppercase; letter-spacing: 1px; color: #A69E98; font-family: 'JetBrains Mono', monospace; }
        p { margin-bottom: 10px; }
        .date { text-align: center; color: #6B6460; font-size: 12px; margin-bottom: 28px; }
        .score-block { text-align: center; margin-bottom: 24px; padding: 20px 0; }
        .score { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 700; color: #B5654A; }
        .score-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #A69E98; margin-top: 4px; }
        .summary { text-align: center; max-width: 600px; margin: 0 auto 28px; color: #1A1D26; font-size: 14px; line-height: 1.7; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; margin-left: 8px; }
        .section-score { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; float: right; }
        .finding { padding: 8px 0; border-bottom: 1px solid #E4DED8; font-size: 13px; line-height: 1.7; break-inside: avoid; page-break-inside: avoid; }
        .rec { padding: 14px 0; border-bottom: 1px solid #E4DED8; break-inside: avoid; page-break-inside: avoid; }
        .rec-p { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #B5654A; margin-bottom: 4px; }
        .rec-a { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
        .rec-i { font-size: 13px; color: #4A4440; line-height: 1.7; }
        .section { break-inside: avoid; page-break-inside: avoid; margin-bottom: 28px; padding: 20px 24px; border: 1px solid #E4DED8; border-radius: 8px; background: #FAFAF8; }
        .qw-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 24px; padding: 16px 20px; border: 1px solid #1A9960; border-radius: 8px; background: rgba(26,153,96,0.04); }
        .sp-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 24px; padding: 16px 20px; border: 1px solid #B5654A; border-radius: 8px; background: rgba(181,101,74,0.04); }
        .qw-item { padding: 6px 0; font-size: 13px; line-height: 1.7; break-inside: avoid; page-break-inside: avoid; }
        .sp-item { padding: 6px 0; font-size: 13px; line-height: 1.7; break-inside: avoid; page-break-inside: avoid; }
        .ref-block { margin-top: 28px; padding-top: 16px; border-top: 1px solid #E4DED8; break-inside: avoid; page-break-inside: avoid; }
        .ref-item { font-size: 10px; color: #6B6460; padding: 3px 0; font-family: 'JetBrains Mono', monospace; line-height: 1.6; }
        @media print {
          body { padding: 24px 32px; }
          .section, .rec, .finding, .qw-block, .sp-block, .qw-item, .sp-item, .ref-block { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
      </style></head><body>`);

    // Title and date
    pw.document.write(`<h1>Warehouse Operations Audit Report</h1>`);
    pw.document.write(`<div class="date">Generated ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</div>`);

    // Centered score
    pw.document.write(`<div class="score-block"><div class="score">${report.overall_score}/100</div><div class="score-label">Overall Operations Score</div></div>`);

    // Executive summary
    pw.document.write(`<div class="summary">${report.executive_summary}</div>`);

    // Quick wins on first page
    pw.document.write(`<div class="qw-block"><h2 style="color:#1A9960;margin-bottom:10px;">Quick Wins — Implement This Week</h2>`);
    report.quick_wins.forEach((q) => pw.document.write(`<div class="qw-item"><span style="color:#1A9960;font-weight:700;margin-right:8px;">✓</span>${q}</div>`));
    pw.document.write(`</div>`);

    // Strategic priorities on first page
    pw.document.write(`<div class="sp-block"><h2 style="color:#B5654A;margin-bottom:10px;">Strategic Priorities — Next 3–6 Months</h2>`);
    report.strategic_priorities.forEach((s) => pw.document.write(`<div class="sp-item"><span style="color:#B5654A;font-weight:700;margin-right:8px;">→</span>${s}</div>`));
    pw.document.write(`</div>`);

    // Detailed sections
    report.sections.forEach((s) => {
      const rc = RISK_COLORS[s.risk_level] || RISK_COLORS.moderate;
      pw.document.write(`<div class="section">`);
      pw.document.write(`<h2>${s.title} <span class="badge" style="background:${rc.bg};color:${rc.text};border:1px solid ${rc.border}">${rc.label} risk</span><span class="section-score">${s.score}/100</span></h2>`);
      pw.document.write(`<h3>Findings</h3>`);
      s.findings.forEach((f) => pw.document.write(`<div class="finding">${f}</div>`));
      pw.document.write(`<h3 style="margin-top:16px">Recommendations</h3>`);
      s.recommendations.forEach((r) => pw.document.write(`<div class="rec"><div class="rec-p">Priority ${r.priority} · ${r.effort} effort${r.timeframe ? ' · ' + r.timeframe : ''}</div><div class="rec-a">${r.action}</div><div class="rec-i">${r.impact}</div></div>`));
      pw.document.write(`</div>`);
    });

    // References
    if (report.references && report.references.length > 0) {
      pw.document.write(`<div class="ref-block"><h3 style="color:#6B6460;">References</h3>`);
      report.references.forEach((r) => pw.document.write(`<div class="ref-item">${r}</div>`));
      pw.document.write(`</div>`);
    }

    pw.document.write(`</body></html>`);
    pw.document.close();
    pw.onload = () => pw.print();
  };

  return (
    <div>
      {email && (
        <div style={{ background: theme.successDim, border: `1px solid ${theme.success}`, borderRadius: "8px", padding: "14px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: theme.success, fontSize: "18px" }}>✓</span>
          <span style={{ fontSize: "14px", color: theme.text }}>A PDF copy of this report and your invoice have been sent to <strong>{email}</strong></span>
        </div>
      )}
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
function SummaryView({ answers, onBack, onGenerate, email, onEmailChange, onLegalPage }) {
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

      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "24px", marginBottom: "16px" }}>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "15px", color: theme.accent, fontWeight: 600, marginBottom: "8px" }}>Receive your report</h3>
        <p style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>Enter your email to receive a PDF copy of your audit report. No spam — just your report.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@yourcompany.com.au"
          style={{
            width: "100%", padding: "14px 16px", background: theme.bg, border: `1px solid ${theme.border}`,
            borderRadius: "8px", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", color: theme.text,
            outline: "none", boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = theme.borderFocus)}
          onBlur={(e) => (e.target.style.borderColor = theme.border)}
        />
      </div>

      <p style={{ fontSize: "12px", color: theme.textMuted, textAlign: "center", marginTop: "24px", marginBottom: "12px", lineHeight: 1.6 }}>
        By proceeding to payment, you agree to our{" "}
        <span onClick={() => onLegalPage("terms")} style={{ color: theme.accent, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms & Conditions</span>,{" "}
        <span onClick={() => onLegalPage("privacy")} style={{ color: theme.accent, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</span>, and{" "}
        <span onClick={() => onLegalPage("disclaimer")} style={{ color: theme.accent, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>AI Disclaimer</span>.
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={{ flex: 1, padding: "14px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.textMuted, fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer" }}>← Edit Answers</button>
        <button onClick={onGenerate} style={{ flex: 2, padding: "14px", background: theme.accent, border: "none", borderRadius: "8px", color: "#fff", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", boxShadow: `0 0 24px ${theme.accentGlow}` }}>Proceed to Payment — $249 AUD</button>
      </div>
    </div>
  );
}

/* ─── Legal Pages ─── */
function LegalPageView({ page, onBack }) {
  const h1Style = { fontFamily: "'DM Sans', sans-serif", fontSize: "28px", fontWeight: 700, color: theme.accent, marginBottom: "8px" };
  const h2Style = { fontFamily: "'DM Sans', sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, marginTop: "32px", marginBottom: "12px" };
  const pStyle = { fontSize: "14px", color: theme.text, lineHeight: 1.8, marginBottom: "12px" };
  const liStyle = { fontSize: "14px", color: theme.text, lineHeight: 1.8, marginBottom: "6px", paddingLeft: "8px" };
  const dateStyle = { fontSize: "13px", color: theme.textMuted, marginBottom: "32px" };

  const H2 = ({ children }) => <h2 style={h2Style}>{children}</h2>;
  const P = ({ children }) => <p style={pStyle}>{children}</p>;
  const Li = ({ children }) => <li style={liStyle}>{children}</li>;

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: theme.accent, fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginBottom: "24px", padding: 0 }}>← Back</button>

      {page === "privacy" && (
        <div>
          <h1 style={h1Style}>Privacy Policy</h1>
          <p style={dateStyle}>Last updated: 26 March 2026</p>

          <P>This Privacy Policy explains how Constantine Jack Lentakis (ABN 70 558 151 101) ("we", "us", or "our") collects, uses, and protects personal information when you use our Warehouse Operations Audit tool (the "Service") at pickrate.com.au.</P>
          <P>We are committed to protecting your privacy in accordance with the Australian Privacy Principles set out in the Privacy Act 1988 (Cth), even where the small business exemption may apply.</P>

          <H2>1. What personal information we collect</H2>
          <P>We collect only the minimum information necessary to deliver our Service:</P>
          <ul><Li>Email address — provided by you when requesting an audit report</Li><Li>Questionnaire responses — information about your warehouse operations that you enter into the audit questionnaire</Li></ul>
          <P>We do not collect names, phone numbers, physical addresses, payment card details (these are handled entirely by our payment processor), or any other personal information.</P>

          <H2>2. How we collect your information</H2>
          <P>We collect personal information only when you voluntarily provide it to us through the Service — specifically when you enter your email address and complete the audit questionnaire. We do not collect information from third parties or use tracking technologies to identify you.</P>

          <H2>3. Why we collect your information</H2>
          <P>We collect and use your personal information for the following purposes:</P>
          <ul><Li>To generate your personalised warehouse audit report</Li><Li>To deliver your audit report and invoice to your email address</Li><Li>To process your purchase and provide proof of payment</Li></ul>
          <P>We do not use your information for marketing, advertising, profiling, or any purpose other than delivering the Service you have purchased.</P>

          <H2>4. Automated decision-making</H2>
          <P>Our Service uses artificial intelligence (specifically, Anthropic's Claude API) to analyse your questionnaire responses and generate a personalised audit report. This means:</P>
          <ul><Li>Your questionnaire responses are sent to Anthropic's API to generate the report</Li><Li>The recommendations in your report are produced by AI, not by a human consultant</Li><Li>No human reviews your individual responses as part of the report generation process</Li></ul>
          <P>In anticipation of upcoming transparency requirements under the Privacy and Other Legislation Amendment Act 2024 (commencing 10 December 2026), we proactively disclose that automated decision-making is used in the production of your audit report. The AI analyses the information you provide and generates recommendations based on published warehouse operations research.</P>

          <H2>5. How we store and protect your information</H2>
          <P>Your email address is processed by Resend (our email delivery service) to send your report and invoice. Your questionnaire responses are processed in memory during report generation and are not stored in a database after your report has been delivered.</P>
          <P>We take reasonable technical and organisational measures to protect your information, including the use of encrypted connections (HTTPS/TLS) for all data in transit.</P>

          <H2>6. Third-party service providers</H2>
          <P>We use the following third-party services to operate the Service:</P>
          <ul><Li>Anthropic (Claude API) — to generate your audit report</Li><Li>Resend — to deliver your report and invoice by email</Li><Li>Vercel — to host the Service</Li><Li>Stripe — to process payments. We do not receive or store your payment card details.</Li></ul>
          <P>We do not sell, rent, or trade your personal information to any third party.</P>

          <H2>7. Overseas disclosure</H2>
          <P>Your information may be processed by servers located outside Australia (including in the United States) through our third-party service providers listed above. By using the Service, you consent to this transfer. We take reasonable steps to ensure these providers protect your information in accordance with the Australian Privacy Principles.</P>

          <H2>8. Your rights</H2>
          <P>You have the right to:</P>
          <ul><Li>Request access to any personal information we hold about you</Li><Li>Request correction of any inaccurate information</Li><Li>Request deletion of your personal information</Li><Li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC) if you believe your privacy has been breached</Li></ul>
          <P>To exercise any of these rights, contact us at lentakisc@gmail.com.</P>

          <H2>9. Data retention</H2>
          <P>We do not maintain a database of customer information. Your questionnaire responses are processed in memory and discarded after your report is generated. Your email address is retained only in our email delivery service's logs for the purpose of delivery confirmation, and in our payment processor's records as required for tax and accounting purposes.</P>

          <H2>10. Changes to this policy</H2>
          <P>We may update this Privacy Policy from time to time. The updated version will be posted on our website with a revised "Last updated" date.</P>

          <H2>11. Contact us</H2>
          <P>If you have questions about this Privacy Policy or wish to exercise your rights, please contact:</P>
          <P>Constantine Jack Lentakis<br/>Email: lentakisc@gmail.com</P>
        </div>
      )}

      {page === "terms" && (
        <div>
          <h1 style={h1Style}>Terms & Conditions</h1>
          <p style={dateStyle}>Last updated: 26 March 2026</p>

          <P>These Terms & Conditions ("Terms") govern your use of the Warehouse Operations Audit tool (the "Service") operated by Constantine Jack Lentakis (ABN 70 558 151 101) ("we", "us", or "our"). By using the Service and purchasing an audit report, you agree to be bound by these Terms.</P>

          <H2>1. The Service</H2>
          <P>The Service is an AI-powered warehouse operations audit tool. You complete a structured questionnaire about your warehouse operations, and the Service generates a personalised audit report containing findings and recommendations across five operational areas.</P>
          <P>The report is generated using artificial intelligence and is based on the specific information you provide in the questionnaire, published peer-reviewed warehouse operations research, and Australian workplace health and safety regulations and data.</P>
          <P>The report is delivered to you both on-screen and as a PDF attachment to the email address you provide.</P>

          <H2>2. Pricing and payment</H2>
          <P>The Service is priced at $249.00 AUD per audit report. This is the total price. We are not registered for GST and no GST is charged.</P>
          <P>Payment is processed securely through Stripe. We do not receive, process, or store your payment card details.</P>
          <P>An invoice is automatically generated and sent to your email address with the report as proof of purchase for your tax records.</P>

          <H2>3. What you receive</H2>
          <P>Upon successful payment, you receive:</P>
          <ul><Li>An AI-generated warehouse audit report covering Warehouse Layout & Space Utilisation, B2C Pick/Pack Workflow, B2B Pick/Pack Workflow, Staffing & Labour Allocation, and B2B Document & Transfer Flow</Li><Li>An on-screen interactive version of the report</Li><Li>A PDF copy of the report sent to your email</Li><Li>A PDF invoice sent to your email</Li></ul>

          <H2>4. Refund policy</H2>
          <P>Because the audit report is a personalised digital product generated specifically from your questionnaire responses, change-of-mind refunds are not available once the report has been generated and delivered.</P>
          <P>However, under the Australian Consumer Law, consumer guarantees apply to all goods and services, including digital products. You are entitled to a refund if:</P>
          <ul><Li>The report fails to generate or is not delivered to you</Li><Li>The report does not match the description provided on our website</Li><Li>The Service is not of acceptable quality or not fit for the described purpose</Li></ul>
          <P>To request a refund, contact us at lentakisc@gmail.com with your invoice number and a description of the issue.</P>

          <H2>5. AI-generated content disclaimer</H2>
          <P>The audit report is generated by artificial intelligence (Anthropic's Claude). You acknowledge and agree that:</P>
          <ul><Li>The report contains general recommendations based on your questionnaire responses, not professional consulting advice tailored to your specific business circumstances</Li><Li>The AI may not account for all factors relevant to your warehouse operations</Li><Li>Recommendations are informed by published research, but the analysis and application to your situation is performed by AI, not a human expert</Li><Li>You should independently verify any recommendations before implementing changes to your operations</Li><Li>We are not liable for business decisions you make based on the report</Li></ul>
          <P>The report is intended as a starting point for operational improvement, not as a substitute for professional warehouse consulting, engineering, safety assessment, or legal advice.</P>

          <H2>6. Limitation of liability</H2>
          <P>To the maximum extent permitted by law, our total liability arising out of or in connection with the Service is limited to the amount you paid for the report ($249.00 AUD).</P>
          <P>We are not liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profit, revenue, business, or data.</P>
          <P>Nothing in these Terms excludes, restricts, or modifies any consumer guarantee, right, or remedy under the Australian Consumer Law that cannot be excluded, restricted, or modified by agreement.</P>

          <H2>7. Intellectual property</H2>
          <P>The content, design, and functionality of the Service are owned by us and protected by copyright. The audit report generated for you is licensed for your internal business use only. You may not resell, redistribute, or commercially exploit the report or any part of the Service.</P>

          <H2>8. Accuracy of information you provide</H2>
          <P>The quality of the audit report depends entirely on the accuracy and completeness of the information you provide in the questionnaire. We are not responsible for inaccurate recommendations resulting from incomplete or incorrect responses.</P>

          <H2>9. Availability</H2>
          <P>We do not guarantee that the Service will be available at all times or free from errors. We may modify, suspend, or discontinue the Service at any time without notice.</P>

          <H2>10. Governing law</H2>
          <P>These Terms are governed by the laws of the State of Queensland, Australia. Any disputes arising from these Terms or the Service will be subject to the exclusive jurisdiction of the courts of Queensland, Australia.</P>

          <H2>11. Changes to these Terms</H2>
          <P>We may update these Terms from time to time. The updated version will be posted on our website with a revised "Last updated" date. Your continued use of the Service after any changes constitutes acceptance of the updated Terms.</P>

          <H2>12. Contact us</H2>
          <P>If you have questions about these Terms, please contact:</P>
          <P>Constantine Jack Lentakis<br/>Email: lentakisc@gmail.com</P>
        </div>
      )}

      {page === "disclaimer" && (
        <div>
          <h1 style={h1Style}>AI Disclaimer</h1>
          <p style={dateStyle}>Last updated: 26 March 2026</p>

          <P>This AI Disclaimer applies to the Warehouse Operations Audit tool (the "Service") operated by Constantine Jack Lentakis (ABN 70 558 151 101).</P>

          <H2>1. AI-generated reports</H2>
          <P>The audit reports produced by this Service are generated entirely by artificial intelligence, specifically Anthropic's Claude large language model. No human consultant reviews your individual questionnaire responses or writes any part of your report.</P>
          <P>While the AI draws on a curated library of peer-reviewed research and current Australian workplace health and safety data, the analysis, scoring, and recommendations are produced by an AI system. AI systems can produce errors, and outputs may not fully reflect the complexity of your specific situation.</P>

          <H2>2. Not professional advice</H2>
          <P>The audit report does not constitute:</P>
          <ul><Li>Professional warehouse consulting or management advice</Li><Li>Engineering or structural advice</Li><Li>Workplace health and safety compliance advice or assessment</Li><Li>Legal advice</Li><Li>Financial or business planning advice</Li></ul>
          <P>The report is a general informational product intended to identify potential areas for operational improvement based on the information you provide. It should not be relied upon as the sole basis for making business, safety, or operational decisions.</P>

          <H2>3. Research citations</H2>
          <P>The report may reference published academic research and industry data to support its recommendations. These citations have been verified for accuracy at the time of inclusion in the system, but:</P>
          <ul><Li>Research findings may not directly apply to your specific warehouse configuration, workforce, or industry</Li><Li>The AI selects which citations to include based on relevance to your answers — this selection is automated, not curated by a human for your specific case</Li><Li>Research evolves over time, and cited studies may be superseded by newer findings</Li></ul>

          <H2>4. Australian WHS references</H2>
          <P>The report may reference Australian workplace health and safety regulations, penalty structures, and Safe Work Australia data. These references are for informational purposes only and are current as at the date they were embedded in the system. They do not constitute compliance advice. You should consult the relevant state or territory WHS regulator or a qualified WHS professional for compliance guidance specific to your workplace.</P>

          <H2>5. Limitation of accuracy</H2>
          <P>The quality of the report depends on the accuracy and completeness of the information you provide. The AI cannot verify your responses, inspect your facility, or account for factors not covered by the questionnaire. Recommendations may not be appropriate for all warehouse environments.</P>

          <H2>6. Your responsibility</H2>
          <P>You are solely responsible for:</P>
          <ul><Li>Evaluating whether any recommendation is appropriate for your business</Li><Li>Seeking independent professional advice before implementing significant operational changes</Li><Li>Ensuring any changes you make comply with applicable laws, regulations, and workplace health and safety requirements</Li><Li>Any decisions, actions, or outcomes resulting from the use of the report</Li></ul>

          <H2>7. Contact us</H2>
          <P>If you have questions about this AI Disclaimer, please contact:</P>
          <P>Constantine Jack Lentakis<br/>Email: lentakisc@gmail.com</P>
        </div>
      )}
    </div>
  );
}

/* ─── Landing View ─── */
function LandingView({ onStart }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "3px", color: theme.accent, textTransform: "uppercase", marginBottom: "24px" }}>Warehouse Operations Audit</div>
      <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700, color: theme.text, lineHeight: 1.2, maxWidth: "600px", margin: "0 auto 20px" }}>Find the inefficiencies your warehouse can't see</h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", color: theme.textMuted, lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 40px" }}>Answer questions curated by real industry experience about your warehouse operations across five critical areas. Get a detailed, AI-powered audit report, designed to match your answers against the best industry research and standards. Access tailored recommendations that could cut costs, speed up dispatch, and fix what's slowing you down.</p>
      <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "48px", flexWrap: "wrap" }}>
        {[{ num: "15", label: "minutes to complete" }, { num: "5", label: "areas audited" }, { num: "$249", label: "per report" }].map((stat) => (
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
  const [customerEmail, setCustomerEmail] = useState("");
  const [legalPage, setLegalPage] = useState(null);
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
    if (!customerEmail || !customerEmail.includes("@")) {
      setError("Please enter a valid email address to receive your report.");
      return;
    }
    setError(null);
    try {
      // Save answers and email to localStorage before redirecting to Stripe
      localStorage.setItem("wa_answers", JSON.stringify(answers));
      localStorage.setItem("wa_email", customerEmail);

      // Create Stripe Checkout session
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customerEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create checkout session");

      // Redirect to Stripe
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout failed:", err);
      setError(err.message || "Payment failed. Please try again.");
    }
  };

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment === "success") {
      const sessionId = params.get("session_id");
      // Clean URL without reloading
      window.history.replaceState({}, "", window.location.pathname);

      // Retrieve saved data from localStorage
      const savedAnswers = localStorage.getItem("wa_answers");
      const savedEmail = localStorage.getItem("wa_email");

      if (savedAnswers && savedEmail && sessionId) {
        const parsedAnswers = JSON.parse(savedAnswers);
        setAnswers(parsedAnswers);
        setCustomerEmail(savedEmail);
        setView("loading");

        // Generate report with payment verification
        generateReport(parsedAnswers, savedEmail, sessionId)
          .then((result) => {
            setReport(result);
            setView("report");
            // Clear saved data
            localStorage.removeItem("wa_answers");
            localStorage.removeItem("wa_email");
          })
          .catch((err) => {
            console.error("Report generation failed:", err);
            setError(err.message || "Report generation failed. Please contact support.");
            setView("summary");
          });
      } else {
        setError("Payment was successful but your session could not be verified. Please contact lentakisc@gmail.com with your Stripe receipt for a manual report.");
        setView("landing");
      }
    } else if (payment === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
      // Restore saved data so they can try again
      const savedAnswers = localStorage.getItem("wa_answers");
      const savedEmail = localStorage.getItem("wa_email");
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedEmail) setCustomerEmail(savedEmail);
      setError("Payment was cancelled. Your answers have been saved — you can try again when ready.");
      setView("summary");
    }
  }, []);

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
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 600, color: theme.text, letterSpacing: "-0.3px" }}>PickRate</span>
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
          <SummaryView answers={answers} onBack={() => { setView("audit"); setCurrentCategoryIndex(CATEGORIES.length - 1); }} onGenerate={handleGenerate} email={customerEmail} onEmailChange={setCustomerEmail} onLegalPage={(page) => { setLegalPage(page); setView("legal"); topRef.current?.scrollIntoView({ behavior: "smooth" }); }} />
        )}

        {view === "loading" && <LoadingView />}
        {view === "report" && report && <ReportView report={report} onBack={() => setView("summary")} email={customerEmail} />}
        {view === "legal" && legalPage && <LegalPageView page={legalPage} onBack={() => { setLegalPage(null); setView("landing"); topRef.current?.scrollIntoView({ behavior: "smooth" }); }} />}
      </div>

      <footer style={{ borderTop: `1px solid ${theme.border}`, padding: "24px 32px", textAlign: "center", marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginBottom: "12px" }}>
          {[
            { label: "Privacy Policy", page: "privacy" },
            { label: "Terms & Conditions", page: "terms" },
            { label: "AI Disclaimer", page: "disclaimer" },
          ].map((link) => (
            <button key={link.page} onClick={() => { setLegalPage(link.page); setView("legal"); topRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ background: "none", border: "none", color: theme.textMuted, fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", padding: 0 }}>
              {link.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "11px", color: theme.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
          Constantine Jack Lentakis · ABN 70 558 151 101
        </div>
      </footer>
    </div>
  );
}
