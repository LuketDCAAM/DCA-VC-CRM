import jsPDF from "jspdf";
import type { ComputedSnapshot, QualitativeRatings, ScorecardInputs } from "./types";

interface MemoData {
  companyName: string;
  inputs: ScorecardInputs;
  ratings: QualitativeRatings;
  computed: ComputedSnapshot;
  narrative: Record<string, string | null>;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

const QUAL_LABELS: Record<string, string> = {
  market: "Market Opportunity & Competitive Position",
  product: "Product & Technology",
  business_model: "Business Model & GTM",
  team: "Team & Execution Capability",
  exit: "Exit & Return Potential",
};

const NARRATIVE_SECTIONS: { key: string; label: string }[] = [
  { key: "company_overview", label: "Company Overview" },
  { key: "investment_thesis", label: "Investment Thesis" },
  { key: "traction_milestones", label: "Traction & Milestones" },
  { key: "business_model", label: "Business Model" },
  { key: "key_strengths", label: "Key Strengths" },
  { key: "key_risks", label: "Key Risks & Concerns" },
  { key: "investor_base", label: "Investor Base" },
  { key: "competitive_landscape", label: "Competitive Landscape" },
  { key: "use_of_funds", label: "Use of Funds" },
  { key: "dca_value_add", label: "DCA Value-Add" },
];

const fmtMoney = (v: number | null | undefined) =>
  v == null ? "—" : `$${Math.round(v).toLocaleString()}`;
const fmtPct = (v: number | null | undefined) =>
  v == null ? "—" : `${(v * 100).toFixed(1)}%`;
const fmtNum = (v: number | null | undefined, d = 1) =>
  v == null ? "—" : v.toFixed(d);

export function exportMemoPdf(data: MemoData) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const text = (
    str: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    doc.setFontSize(size);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    if (opts.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(str || "—", contentW);
    ensure(lines.length * (size + 2) + (opts.gap ?? 0));
    doc.text(lines, margin, y);
    y += lines.length * (size + 2) + (opts.gap ?? 4);
  };

  const hr = () => {
    ensure(10);
    doc.setDrawColor(220);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
  };

  const heading = (str: string) => {
    ensure(24);
    y += 6;
    text(str, { size: 13, bold: true, gap: 6 });
    hr();
  };

  // Header
  text("INVESTMENT MEMO", { size: 9, bold: true, color: [120, 120, 120] });
  text(data.companyName, { size: 20, bold: true, gap: 4 });
  const meta = [
    data.inputs.sector,
    data.inputs.stage,
    data.inputs.geography,
    `Status: ${data.status.toUpperCase()}`,
    `Generated: ${new Date().toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  text(meta, { size: 9, color: [100, 100, 100], gap: 8 });

  // Score banner
  ensure(60);
  doc.setFillColor(245, 245, 250);
  doc.rect(margin, y, contentW, 56, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(20, 20, 20);
  doc.text(`${data.computed.blended_score.toFixed(1)} / 100`, margin + 14, y + 28);
  doc.setFontSize(11);
  doc.text(data.computed.classification, margin + 14, y + 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Qualitative ${data.computed.qual_total}/25  ·  Quantitative ${data.computed.quant_total.toFixed(1)}/25`,
    margin + 220,
    y + 28,
  );
  doc.text(
    `Hard stops: ${data.computed.hard_stop_failed ? "FAILED" : "CLEAR"}  ·  Red ${data.computed.red_flag_count}  ·  Yellow ${data.computed.yellow_flag_count}`,
    margin + 220,
    y + 46,
  );
  y += 70;

  // Deal snapshot
  heading("Deal Snapshot");
  const snapshot: [string, string][] = [
    ["Fundraise", fmtMoney(data.inputs.fundraise_amount as number | null)],
    ["Valuation", fmtMoney(data.inputs.valuation as number | null)],
    ["Committed", fmtMoney(data.inputs.committed_amount as number | null)],
    ["Current ARR", fmtMoney(data.inputs.current_arr as number | null)],
    ["Annual Growth", fmtPct(data.computed.autocalcs.annual_growth)],
    ["Gross Margin", fmtPct(data.inputs.gross_margin as number | null)],
    ["NRR", fmtPct(data.inputs.nrr as number | null)],
    ["Runway", `${fmtNum(data.computed.autocalcs.runway_months, 1)} mo`],
    ["Burn Multiple", fmtNum(data.computed.autocalcs.burn_multiple, 2)],
    ["EV / Revenue", `${fmtNum(data.computed.autocalcs.ev_revenue, 1)}x`],
    ["Dilution", fmtPct(data.computed.autocalcs.implied_dilution)],
    ["Deal Lead", String(data.inputs.deal_lead ?? "—")],
  ];
  const colW = contentW / 3;
  const rowH = 28;
  for (let i = 0; i < snapshot.length; i += 3) {
    ensure(rowH);
    for (let j = 0; j < 3 && i + j < snapshot.length; j++) {
      const [k, v] = snapshot[i + j];
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.setFont("helvetica", "normal");
      doc.text(k.toUpperCase(), margin + colW * j, y);
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.text(v, margin + colW * j, y + 13);
    }
    y += rowH;
  }
  y += 4;

  // Narrative
  for (const sec of NARRATIVE_SECTIONS) {
    const v = data.narrative[sec.key];
    if (!v) continue;
    heading(sec.label);
    text(v, { size: 10 });
  }

  // Qualitative
  heading("Qualitative Assessment");
  for (const [key, label] of Object.entries(QUAL_LABELS)) {
    const r = data.ratings[key as keyof QualitativeRatings];
    if (!r?.score && !r?.rationale) continue;
    text(`${label} — ${r?.score ?? "—"} / 5`, { size: 11, bold: true, gap: 2 });
    if (r?.rationale) text(r.rationale, { size: 10, gap: 6 });
  }

  // Quantitative table
  heading("Quantitative Metrics");
  const headers = ["Metric", "Value", "Benchmark", "Variance", "Tier", "Score"];
  const colWs = [contentW * 0.32, contentW * 0.14, contentW * 0.14, contentW * 0.12, contentW * 0.1, contentW * 0.18];
  ensure(18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h.toUpperCase(), x, y);
    x += colWs[i];
  });
  y += 12;
  doc.setDrawColor(220);
  doc.line(margin, y - 4, pageW - margin, y - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  for (const m of data.computed.metrics) {
    ensure(14);
    x = margin;
    const isPct = ["margin", "nrr", "grr", "annual_growth", "top_cust_pct"].some((k) => m.metric.includes(k));
    const val =
      m.value == null
        ? "—"
        : isPct
        ? fmtPct(m.value)
        : m.metric === "ev_revenue"
        ? `${m.value.toFixed(1)}x`
        : Math.round(m.value).toLocaleString();
    const bench =
      m.benchmark == null
        ? "—"
        : isPct
        ? fmtPct(m.benchmark)
        : m.metric === "ev_revenue"
        ? `${m.benchmark}x`
        : m.benchmark.toLocaleString();
    const cells = [
      m.label,
      val,
      bench,
      m.variance == null ? "—" : fmtPct(m.variance),
      m.tier === 0 ? "—" : String(m.tier),
      m.weighted_score.toFixed(2),
    ];
    cells.forEach((c, i) => {
      doc.text(c, x, y);
      x += colWs[i];
    });
    y += 13;
  }
  y += 4;
  text(`Quantitative Total: ${data.computed.quant_total.toFixed(1)} / 25`, { size: 10, bold: true });

  // Risk
  heading("Hard Stops & Risk Flags");
  text(
    `Hard stop verdict: ${data.computed.hard_stop_failed ? "FAILED — DO NOT PROCEED" : "CLEAR"}`,
    { size: 11, bold: true, color: data.computed.hard_stop_failed ? [180, 30, 30] : [30, 120, 60], gap: 6 },
  );
  const failedStops = data.computed.hard_stops.filter((h) => h.failed);
  if (failedStops.length) {
    for (const h of failedStops) text(`• ${h.rule} — ${h.data}`, { size: 10 });
  } else {
    text("All hard stops passed.", { size: 10 });
  }
  y += 4;
  text(
    `Risk flags: ${data.computed.red_flag_count} red · ${data.computed.yellow_flag_count} yellow`,
    { size: 11, bold: true, gap: 4 },
  );
  const activeFlags = data.computed.risk_flags.filter((f) => f.status === "FLAG");
  if (activeFlags.length) {
    for (const f of activeFlags) text(`• [${f.type}] ${f.risk} — ${f.check}`, { size: 10 });
  } else {
    text("No active risk flags.", { size: 10 });
  }

  // Footer with page numbers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `${data.companyName} — Investment Memo`,
      margin,
      pageH - 20,
    );
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 20, { align: "right" });
  }

  const safeName = data.companyName.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  doc.save(`memo_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
