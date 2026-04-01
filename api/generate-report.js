import PdfPrinter from "pdfmake";
import { Resend } from "resend";
import Stripe from "stripe";

export const maxDuration = 60;

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

function buildPdf(report) {
  const printer = new PdfPrinter(fonts);
  const date = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

  const riskColor = (level) => {
    const map = { critical: "#C43D3D", high: "#D4930D", moderate: "#B5654A", low: "#1A9960" };
    return map[level] || "#B5654A";
  };

  const content = [
    { text: "Warehouse Operations Audit Report", fontSize: 22, bold: true, alignment: "center", margin: [0, 0, 0, 4] },
    { text: `Generated ${date}`, fontSize: 10, color: "#6B6460", alignment: "center", margin: [0, 0, 0, 28] },
    { text: `${report.overall_score}/100`, fontSize: 48, bold: true, color: "#B5654A", alignment: "center", margin: [0, 0, 0, 4] },
    { text: "Overall Operations Score", fontSize: 10, color: "#A69E98", alignment: "center", margin: [0, 0, 0, 20] },
    { text: report.executive_summary, fontSize: 12, alignment: "center", color: "#1A1D26", lineHeight: 1.6, margin: [30, 0, 30, 28] },
  ];

  if (report.quick_wins && report.quick_wins.length > 0) {
    content.push({ text: "Quick Wins — Implement This Week", fontSize: 14, bold: true, color: "#1A9960", margin: [0, 0, 0, 8] });
    report.quick_wins.forEach((qw) => {
      content.push({ text: [{ text: "✓  ", bold: true, color: "#1A9960" }, { text: qw }], fontSize: 11, lineHeight: 1.6, margin: [0, 0, 0, 6] });
    });
    content.push({ text: "", margin: [0, 0, 0, 16] });
  }

  if (report.strategic_priorities && report.strategic_priorities.length > 0) {
    content.push({ text: "Strategic Priorities — Next 3–6 Months", fontSize: 14, bold: true, color: "#B5654A", margin: [0, 0, 0, 8] });
    report.strategic_priorities.forEach((sp) => {
      content.push({ text: [{ text: "→  ", bold: true, color: "#B5654A" }, { text: sp }], fontSize: 11, lineHeight: 1.6, margin: [0, 0, 0, 6] });
    });
    content.push({ text: "", margin: [0, 0, 0, 16] });
  }

  (report.sections || []).forEach((section) => {
    const rc = riskColor(section.risk_level);
    content.push({
      stack: [
        {
          columns: [
            { text: section.title, fontSize: 15, bold: true, color: "#1A1D26", width: "*" },
            { text: `${(section.risk_level || "").toUpperCase()} RISK — ${section.score}/100`, fontSize: 9, bold: true, color: rc, alignment: "right", width: "auto", margin: [0, 4, 0, 0] },
          ],
          margin: [0, 0, 0, 12],
        },
        { text: "FINDINGS", fontSize: 9, bold: true, color: "#A69E98", letterSpacing: 1, margin: [0, 0, 0, 6] },
        ...(section.findings || []).map((f) => ({
          text: f, fontSize: 11, color: "#1A1D26", lineHeight: 1.6, margin: [0, 0, 0, 8],
        })),
        { text: "", margin: [0, 0, 0, 8] },
        { text: "RECOMMENDATIONS", fontSize: 9, bold: true, color: "#A69E98", letterSpacing: 1, margin: [0, 0, 0, 6] },
        ...(section.recommendations || []).map((rec) => ({
          stack: [
            { text: `Priority ${rec.priority}  ·  ${rec.effort} effort${rec.timeframe ? "  ·  " + rec.timeframe : ""}`, fontSize: 9, color: "#B5654A", bold: true, margin: [0, 0, 0, 4] },
            { text: rec.action, fontSize: 12, bold: true, color: "#1A1D26", margin: [0, 0, 0, 4] },
            { text: rec.impact, fontSize: 11, color: "#4A4440", lineHeight: 1.7, margin: [0, 0, 0, 12] },
          ],
          unbreakable: true,
        })),
      ],
      unbreakable: false,
      margin: [0, 8, 0, 24],
    });
    content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#E4DED8" }], margin: [0, 0, 0, 16] });
  });

  if (report.references && report.references.length > 0) {
    content.push({ text: "REFERENCES", fontSize: 9, bold: true, color: "#A69E98", letterSpacing: 1, margin: [0, 12, 0, 8] });
    report.references.forEach((ref) => {
      content.push({ text: ref, fontSize: 9, color: "#6B6460", lineHeight: 1.5, margin: [0, 0, 0, 3] });
    });
  }

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [44, 50, 44, 50],
    defaultStyle: { font: "Helvetica", fontSize: 11, lineHeight: 1.4 },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: "Warehouse Operations Audit", fontSize: 8, color: "#A69E98", margin: [44, 0, 0, 0] },
        { text: `Page ${currentPage} of ${pageCount}`, fontSize: 8, color: "#A69E98", alignment: "right", margin: [0, 0, 44, 0] },
      ],
    }),
    content,
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
}

async function sendEmail(email, reportBuffer, invoiceBuffer, report, invoiceNumber) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Warehouse Audit <onboarding@resend.dev>",
    to: [email],
    subject: `Your Warehouse Audit Report — Score: ${report.overall_score}/100`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px;">
        <h1 style="font-size: 20px; color: #1A1D26;">Your Warehouse Audit Report</h1>
        <p style="color: #6B6460; font-size: 14px; line-height: 1.6;">
          Overall Score: <strong style="color: #B5654A; font-size: 18px;">${report.overall_score}/100</strong>
        </p>
        <p style="color: #6B6460; font-size: 14px; line-height: 1.6;">
          Your full audit report and invoice (${invoiceNumber}) are attached as PDFs.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: "warehouse-audit-report.pdf",
        content: reportBuffer,
      },
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: invoiceBuffer,
      },
    ],
  });
  if (error) {
    console.error("Resend error:", error);
    throw new Error(JSON.stringify(error));
  }
}

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `WA-${y}${m}${d}-${h}${min}${s}`;
}

function buildInvoice(email, invoiceNumber) {
  const printer = new PdfPrinter(fonts);
  const date = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const businessName = process.env.BUSINESS_NAME || "Trading Name";
  const businessAbn = process.env.BUSINESS_ABN || "00 000 000 000";

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [50, 50, 50, 50],
    defaultStyle: { font: "Helvetica", fontSize: 10, lineHeight: 1.4, color: "#1A1D26" },
    content: [
      {
        columns: [
          {
            stack: [
              { text: "INVOICE", fontSize: 28, bold: true, color: "#B5654A", margin: [0, 0, 0, 4] },
              { text: `Invoice No: ${invoiceNumber}`, fontSize: 10, color: "#6B6460" },
              { text: `Date: ${date}`, fontSize: 10, color: "#6B6460" },
            ],
            width: "*",
          },
          {
            stack: [
              { text: businessName, fontSize: 14, bold: true, alignment: "right" },
              { text: `ABN: ${businessAbn}`, fontSize: 10, color: "#6B6460", alignment: "right", margin: [0, 4, 0, 0] },
              { text: "Not registered for GST", fontSize: 9, color: "#A69E98", italics: true, alignment: "right", margin: [0, 4, 0, 0] },
            ],
            width: "auto",
          },
        ],
        margin: [0, 0, 0, 40],
      },
      { text: "BILL TO", fontSize: 9, bold: true, color: "#A69E98", letterSpacing: 1, margin: [0, 0, 0, 6] },
      { text: email, fontSize: 11, margin: [0, 0, 0, 30] },
      {
        table: {
          headerRows: 1,
          widths: ["*", 80, 80, 80],
          body: [
            [
              { text: "Description", bold: true, fillColor: "#F5F1EE", margin: [8, 8, 8, 8], fontSize: 10 },
              { text: "Qty", bold: true, fillColor: "#F5F1EE", alignment: "center", margin: [8, 8, 8, 8], fontSize: 10 },
              { text: "Unit Price", bold: true, fillColor: "#F5F1EE", alignment: "right", margin: [8, 8, 8, 8], fontSize: 10 },
              { text: "Amount", bold: true, fillColor: "#F5F1EE", alignment: "right", margin: [8, 8, 8, 8], fontSize: 10 },
            ],
            [
              {
                stack: [
                  { text: "Warehouse Operations Audit Report", fontSize: 11, bold: true },
                  { text: "AI-powered audit across 5 operational areas with prioritised recommendations backed by peer-reviewed research.", fontSize: 9, color: "#6B6460", margin: [0, 4, 0, 0] },
                ],
                margin: [8, 10, 8, 10],
              },
              { text: "1", alignment: "center", margin: [8, 10, 8, 10] },
              { text: "$249.00", alignment: "right", margin: [8, 10, 8, 10] },
              { text: "$249.00", alignment: "right", margin: [8, 10, 8, 10] },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0,
          vLineWidth: () => 0,
          hLineColor: () => "#E4DED8",
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
      {
        columns: [
          { text: "", width: "*" },
          {
            width: 240,
            stack: [
              {
                columns: [
                  { text: "Subtotal", fontSize: 10, color: "#6B6460", width: "*" },
                  { text: "$249.00", fontSize: 10, alignment: "right", width: "auto" },
                ],
                margin: [0, 16, 0, 8],
              },
              {
                columns: [
                  { text: "GST", fontSize: 10, color: "#6B6460", width: "*" },
                  { text: "N/A", fontSize: 10, color: "#A69E98", alignment: "right", width: "auto" },
                ],
                margin: [0, 0, 0, 8],
              },
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 240, y2: 0, lineWidth: 0.5, lineColor: "#E4DED8" }], margin: [0, 4, 0, 8] },
              {
                columns: [
                  { text: "Total (AUD)", fontSize: 14, bold: true, width: "*" },
                  { text: "$249.00", fontSize: 14, bold: true, color: "#B5654A", alignment: "right", width: "auto" },
                ],
              },
            ],
          },
        ],
      },
      { text: "", margin: [0, 0, 0, 40] },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#E4DED8" }], margin: [0, 0, 0, 16] },
      { text: "Payment has been received. No further action required.", fontSize: 10, color: "#1A9960", bold: true, margin: [0, 0, 0, 8] },
      { text: `This invoice was issued by ${businessName} (ABN ${businessAbn}). The supplier is not registered for GST. No GST has been charged.`, fontSize: 9, color: "#A69E98", lineHeight: 1.5, margin: [0, 0, 0, 4] },
      { text: "This document serves as your proof of purchase for tax purposes.", fontSize: 9, color: "#A69E98", lineHeight: 1.5 },
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    let { answers, email, sessionId, session_id: sessionIdFromSnake } = req.body;

    if (!answers) {
      return res.status(400).json({ error: "No answers provided" });
    }

    // === STRIPE PAYMENT VERIFICATION ===
    const sessionIdToUse = sessionId || sessionIdFromSnake;
    if (!sessionIdToUse) {
      return res.status(403).json({ error: "Payment session ID is required" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let session;
    try {
    session = await stripe.checkout.sessions.retrieve(sessionIdToUse);
    } catch (stripeError) {
      console.error("Stripe session verification failed:", stripeError);
      return res.status(400).json({ error: "Invalid or expired payment session" });
    }

    if (session.payment_status !== "paid" || session.status !== "complete") {
      return res.status(402).json({ error: "Payment has not been completed" });
    }

    // Use email from Stripe if frontend didn't send one
    if (!email && session.customer_details?.email) {
      email = session.customer_details.email;
    }
    // === END VERIFICATION ===

    const systemPrompt = `You are an expert warehouse operations consultant with 15+ years of experience optimising small-to-medium e-commerce warehouses in Australia. You are generating a professional warehouse audit report based on questionnaire responses.

## YOUR CORE RULES

1. DETAILED RECOMMENDATIONS: Each recommendation must be 4-8 sentences. Explain WHY it matters for this specific warehouse, HOW to implement it practically, and WHAT the expected outcome is. Write as if you are a consultant who just walked through their facility and is sitting down with the warehouse manager to explain what you found.

2. CITATION RULE — THIS IS CRITICAL: You must NEVER claim a specific percentage improvement unless you are citing one of the verified studies listed below. If you do cite a study, include the author name and year in parentheses. If no study directly applies, describe the expected benefit qualitatively (e.g. "significantly reduces travel time" or "substantially improves accuracy") rather than inventing a number. Unsourced efficiency claims destroy credibility.

3. CONTEXT-SPECIFIC: Every finding and recommendation must reference the specific answers given. Do not give generic advice. If they said they use single order picking with 150+ orders/day, that is a specific problem to address. If they said aisles are tight, connect that to the equipment they listed.

4. AUSTRALIAN CONTEXT: Reference Australian WHS regulations, Safe Work Australia codes of practice, and Australian penalty structures where relevant. Directors have personal liability.

5. CROSS-CATEGORY CONNECTIONS: Identify how problems in one area cause problems in another. Layout issues cause pick inefficiency. Staffing gaps cause document errors. Make these connections explicit.

## VERIFIED RESEARCH YOU MAY CITE

### Pick/Pack Efficiency

FOUNDATIONAL STUDIES:
- De Koster, Le-Duc & Roodbergen (2007): Order picking accounts for up to 55% of total warehouse operating costs. Travel time consumes roughly 50% of a picker's working time (figure originally from Tompkins et al. 2003, reproduced within this review). Traveling and searching together account for up to 70% of total order picking time. (European Journal of Operational Research, literature review)
- Petersen (2000): Batch picking reduces total picking time by approximately 17-22% compared to single-order picking in simulation studies. Wave picking performs well across a wide range of conditions. (Production and Operations Management)
- De Koster & Van der Poort (1998): Optimal routing algorithms reduce travel time per route by 7-34% compared to S-shape traversal, depending on layout. (IIE Transactions)
- De Koster, Roodbergen & Van Voorden (1999): Real-world case study at De Bijenkorf achieved 17-34% walking time reduction through routing changes alone. (Springer)
- Dukic & Oluic (2007): Combining routing, storage assignment, and order batching can achieve up to 80% reduction in travel distances — but only against an unoptimised baseline with all three factors addressed simultaneously in a wide-aisle warehouse. (International Journal of Logistics Systems and Management)
- Van Gils et al. (2018): Integrated combination of within-aisle storage, savings-based batching, zone picking, and optimal routing statistically outperforms all other policy combinations tested. This is the strongest evidence that integrated approaches beat sequential optimisation. (International Journal of Production Economics, real-life case study)
- Petersen & Aase (2004): Batching yields the greatest savings compared to storage and routing changes alone, particularly for smaller average order sizes. (International Journal of Production Economics)
- Dhooma & Baker (2012): Warehousing accounts for approximately 20% of a company's total logistics costs. (International Journal of Logistics Research and Applications — this is the original source for this widely cited figure)

RECENT VALIDATION (2023-2025):
- Bashatah & Elnaggar (2025): Real-world case study in a three-block U-shaped warehouse confirmed that storage allocation strategies have a stronger impact on picking efficiency than routing methods alone. Order picking accounts for 50-75% of total warehouse operating costs and nearly 55% of labour time. (Applied Sciences, peer-reviewed, open access)
- Luu, Chromjakova & Bobak (2023): Empirical case study demonstrating optimisation of order picking through combined storage and routing interventions in a real distribution centre. (Journal of Competitiveness)

### Layout & Storage

FOUNDATIONAL STUDIES:
- Hausman, Schwarz & Graves (1976): Class-based storage with just 2-3 classes yields travel time reductions close to full volume-based storage at far lower complexity. (Management Science, over 1,000 citations)
- Petersen, Aase & Heiser (2004): Class-based storage provides savings approaching volume-based storage while being easier to maintain. (International Journal of Physical Distribution & Logistics Management)
- Frazelle (2002): When warehouse occupancy approaches 85-86%, productivity and safety begin to decrease sharply with each additional percentage point. Widely cited as the threshold beyond which congestion effects dominate. (World-Class Warehousing and Material Handling)
- WERC DC Measures Report: Average warehouse space utilization is 68%. Best-in-class facilities exceed 92%.
- Industry standard: Narrow aisles (8-10 feet) increase storage capacity by 20-25% vs wide aisles (11-13 feet). Very narrow aisles (5-7 feet) yield 40-50% more capacity but require specialised equipment.
- Bartholdi & Hackman (2008): Mathematically optimal forward-area stocking minimises total restocking labour by equalising replenishment rates across all forward positions. (IIE Transactions)

RECENT VALIDATION (2023-2025):
- Lesch et al. (2023): Demonstrated optimised storage assignment and order picking interactions in mezzanine warehouses, confirming that integrated storage-picking optimisation outperforms isolated improvements. (Applied Intelligence)
- Finco et al. (2023): Investigated trade-offs between ergonomics and productivity in different manual picking workstation configurations, finding that well-chosen workstation designs can balance both objectives — ergonomic improvements do not necessarily reduce productivity when implemented thoughtfully. (Computers & Industrial Engineering)

### Staffing & Fatigue

FOUNDATIONAL STUDIES:
- Mlekus & Maier (2021): Meta-analysis of 56 studies (284,086 participants) found task rotation significantly correlated with productivity (r=0.13), labour flexibility (r=0.32), job satisfaction (r=0.27), and reduced stress/burnout (r=-0.13). (Frontiers in Psychology — "More Hype Than Substance? A Meta-Analysis on Job and Task Rotation")
- Park (1991): The initial introduction of cross-training produces the most significant improvement over no cross-training. Additional cross-training beyond the first additional skill shows diminishing returns. (European Journal of Operational Research)
- Hopp & Van Oyen (2004): Framework demonstrating that cross-trained workers under collaborative policies can improve cycle time and throughput. Building on earlier work by Van Oyen, Gel & Hopp (2001) which established the mathematical basis. (IIE Transactions)
- Pinker & Shumsky (2000): Flexible workers provide more throughput with fewer workers, but quality suffers if workers don't accumulate sufficient experience — creating an efficiency-quality trade-off. (Manufacturing & Service Operations Management)
- NIOSH (2004): The 9th to 12th hours of work are associated with decreased alertness, increased fatigue, and increased injuries. (52 research reports reviewed)
- Folkard & Tucker (2003): Accident risk in the 12th hour on shift is more than double the average hourly risk during the first 8 hours. Night-shift accident rates are 30% greater than day shifts. (Occupational Medicine)
- Dembe et al. (2005): Overtime schedules carry a 61% higher injury hazard rate. Working 12+ hours per day shows a 37% increased hazard. (Occupational and Environmental Medicine, 10,793 workers analysed)
- Ricci et al. (2007): 37.9% of workers experience fatigue, with 84% of fatigue costs from reduced on-the-job performance rather than absences. (Journal of Occupational and Environmental Medicine)

RECENT VALIDATION (2023-2025):
- U.S. GAO Report GAO-24-106413 (2024): Found that the three major hazards causing most warehouse injuries were falls/slips/trips, objects and equipment, and overexertion/bodily reaction. OSHA cited warehouse and last-mile delivery employers for more than 2,500 workplace violations from FY2018-2023. (U.S. Government Accountability Office, September 2024)
- U.S. Department of Labor data (2022): E-commerce fulfilment centre injury rates are significantly higher than non-fulfilment warehouses — reported at 5.9 injuries per 100 workers in fulfilment centres. (Department of Labor, cited in multiple congressional analyses)
- Bureau of Labor Statistics / NELP analysis (2024): In New York State specifically, warehouse worker injuries increased 30% from 2022 to 2023. NY warehouse injuries tripled between 2017 and 2023. In 2023, more than 90% of NY warehouse injuries required missed days of work or a job transfer, up from 60% in 2017. Note: these figures are specific to New York State and above the national average. (NELP data brief, December 2024)
- OSHA 2024 Injury Data: Transportation and warehousing recorded 232,000 injury cases across the U.S. Serious injuries resulted in 18.5 million days of lost work in a single year. (VelocityEHS analysis of OSHA data, December 2025)
- Cunningham et al. (2022): Identified work-related fatigue as a hazard disproportionately affecting vulnerable worker populations including those in physically demanding roles, young workers, aging workers, and temporary workers. (American Journal of Industrial Medicine)
- Systematic literature review on ergonomics in warehouse design (2024): Comprehensive examination of ergonomic concerns in warehouses found that warehouse pickers performing repetitive tasks face fatigue, physical discomfort, and injuries. Identified technological interventions, task rotation, and workstation design as key mitigation strategies. (Operational Research, Springer)

### Inventory & Stock Management

FOUNDATIONAL STUDIES:
- DeHoratius & Raman (2008): Examined 370,000 inventory records from 37 stores — 65% were inaccurate. Inaccuracy caused revenue losses exceeding 1% of sales and more than 3% of gross profit. Cycle counting was the primary mitigating factor. (Management Science)
- Gruen, Corsten & Bharadwaj (2002): Average out-of-stock rate in FMCG at approximately 8%. 72% of stockouts caused by in-store factors (ordering, replenishment, and other store-level practices combined). 31% of affected customers buy from a competitor. (Grocery Manufacturers of America, 52 studies synthesised)
- Lieberman & Demeester (1999): Each 10% reduction in inventory led to approximately 1% gain in labour productivity with a one-year lag, across 52 Japanese automotive companies. (Management Science)
- APICS/ASCM: Standard inventory carrying costs are 25% of inventory value annually, ranging from 18-75%.
- Industry research: 20-30% of inventory is typically dead or obsolete.

RECENT VALIDATION (2023-2025):
- Destro, Staudt, Somensi & Taboada (2023): Dynamic system modelling confirmed that inventory record inaccuracy (IRI) directly impacts picking productivity, lost sales, and warehouse capacity utilisation. The study validated that cycle counting implementation is necessary but must be properly resourced — insufficient cycle count operators fail to maintain accuracy. Separated IRI into "ghost inventory" (recorded but not physically present) and "hidden inventory" (physically present but not recorded) to show different operational impacts. (Production, peer-reviewed)
- Linuwih & Handayati (2025): Case study of 9,123 product types at a single Indonesian warehouse found 52.85% of products displayed inaccuracies during stocktaking, with systematic underreporting creating problems for stock planning. (International Journal of Current Science Research and Review — note: single case study, lower-tier journal)
- DeHoratius, Holzapfel, Kuhn, Mersereau & Sternbeck (2023): Evaluated different count prioritisation procedures for improving inventory accuracy in retail stores, finding that simple rule-based policies (sorting items by operational metrics) performed as well as complex model-based approaches — important for practical implementation in small warehouses without sophisticated systems. (Manufacturing & Service Operations Management)

### Documents & Compliance

- Barchard & Pace (2011): Single data entry produces error rates of approximately 1%. (Computers in Human Behavior)
- Panko (2008/2015): Humans performing simple but nontrivial cognitive actions make errors 1-5% of the time. (Spreadsheet error research across 14+ studies — note: examples include writing, calculating, and coding)
- As reviewed in Barchard, Freeman, Ochoa & Stephens (2020): Prior studies found manual data entry error rates ranging from 0.55% to 3.6% depending on task complexity. (Behavior Research Methods — these figures summarise five earlier studies, not new findings)
- Ardent Partners (2024): Best-in-class automated AP teams process invoices in 3.1 days at $2.78/invoice vs 17.4 days at $12.88 for non-automated — 79% faster cycle time. Exception rates drop from 22% to 9%. (State of ePayables 2024 report)
- IOFM/Industry benchmark (2024): Manual invoice error rates approximately 2%, dropping below 0.8% with automation. Automated three-way matching reduces exceptions by up to 60%. (Widely cited industry benchmark — exact original source disputed between IOFM and APQC)

### KPI Tracking & Benchmarking
 
WHY KPIs MATTER FOR THIS AUDIT:
- If the customer answered "We don't formally track KPIs", this is a critical finding. You cannot improve what you don't measure. Frame this as the single most impactful quick win — start measuring even one metric (pick rate or order accuracy) this week.
- If they track some KPIs but not others, identify the gaps. Warehouses that track pick rate but not order accuracy are optimising speed without knowing their error cost.
- If they track most KPIs, commend this and focus recommendations on using the data they already have to drive decisions.
 
BENCHMARKING DATA YOU MAY CITE:
- Industry benchmark: Average manual pick rate is approximately 70 items per hour for piece-picking operations. Well-optimised manual operations achieve 100+ items per hour. Goods-to-person automated systems achieve 200-400+ units per hour. (Industry consensus across WERC, Warehousing & Fulfillment survey data, and Australian 3PL benchmarks from One Warehousing)
- Industry benchmark: Manual picking accuracy averages 97-99%. Automated systems routinely exceed 99.5-99.9%. Each picking error costs approximately $50-100 to correct when accounting for return shipping, restocking, re-picking, and customer service time. (Industry estimates consistent across SmartlogitecX and Effective Logistics Australia)
- Shah & Alaya (2025): Identified the top warehouse KPIs by weight in a systematic framework — space utilisation (0.122), labour productivity (0.112), technology-based employee safety (0.110), continuous improvement (0.107), and human-robot collaboration (0.106). Traditional metrics like order accuracy and pick rate remain essential, but the study argues that modern warehouses must balance productivity KPIs with human-centred metrics. (International Journal of Supply Chain and Logistics, September 2025 — peer-reviewed)
- Boysen & de Koster (2025): 50-year literature review argues that warehouse research and practice must shift from purely efficiency-focused KPIs to models that balance picker well-being with system productivity. Over-optimisation of pick rates without considering fatigue and ergonomics leads to higher injury rates and turnover. (European Journal of Operational Research, February 2025 — peer-reviewed, landmark survey)
- WERC DC Measures Report: Best-in-class warehouses track 8-12 KPIs across productivity, accuracy, cost, and time dimensions. The most commonly tracked are picks per hour, order accuracy, on-time shipment, cost per order, and inventory accuracy.
 
### Australian Productivity Benchmarks & Case Studies
 
AUSTRALIAN-SPECIFIC DATA:
- Coles Group WITRON ADCs (2024-2025): The Kemps Creek ADC in NSW (opened August 2024, 66,000 m²) processes over 4 million cartons per week. Effectively doubled productivity with a similar headcount compared to an equivalent manual DC. The system eliminates approximately 16 million kg of manual handling per week. Combined investment in two ADCs exceeds $1 billion. (Coles corporate announcements via iTnews, August 2024; ESM Magazine)
- WesTrac / Dematic AutoStore (Tomago, NSW): Picking increased from 300 to 500+ lines per hour — a 67% productivity improvement — with the same headcount. One automated picker equals 4-5 manual pickers. The system manages 80,000 SKUs across 15,350 bins with 24 robots and 6 goods-to-person workstations, processing 40,000 order lines weekly. Urgent orders fulfilled within 5-10 minutes. (Dematic case study; IT Brief Australia)
- Drakes Supermarkets / Dematic GTP (South Australia): Goods-to-person section delivers 700+ units per labour hour and 99.996% picking accuracy (weigh-scale verified). The GTP section runs 16% of total warehouse throughput using only 4 staff (5% of total warehouse employees), picking at 180 cartons per total labour hour versus 58 cartons/hour in other areas — a 3x improvement. (Dematic case study)
- Asahi Beverages / Dematic ASRS (Heathwood, QLD): Achieved a 250% productivity boost over the prior manual forklift and block stacking operation, consolidating multiple Brisbane sites into one DC using a six-deep satellite ASRS system. (Dematic case study)
- Note for report use: These case studies are from large operators with significant capital. When citing them in reports for SME warehouses, frame them as evidence of what's possible — and focus recommendations on the low-cost process improvements (batch picking, ABC slotting, routing optimisation) that deliver 15-35% gains without capital investment.
 
### Australian E-Commerce & Fulfilment Demand
 
- Australia Post eCommerce Report (2025-2026): Australians spent $69 billion online in 2024, growing to $82.6 billion in 2025 — a 14% year-on-year increase. 24% of all retail spend is now online. The average household shops from 16 different online retailers (up from 9 in 2018), with 9.8 million households shopping online. 85% of shoppers rate reliable delivery as the most important factor in retailer trust. (Australia Post eCommerce Report 2025/2026, powered by CommBank iQ transaction data)
- Same-day delivery expectations: 27% of Australian shoppers would pay $20 for same-day delivery. Amazon launched Prime same-day delivery in Sydney (August 2024) and Perth (May 2025). Australia Post Metro service (June 2024) covers 85% of Sydney and Melbourne postcodes. The same-day delivery market reached approximately AUD $1.1-2.0 billion in 2024. (Australia Post; IMARC Group market research)
- Warehouse capacity context: National industrial vacancy sits at 3.2% (CBRE, H2 2025) — below the 4% equilibrium threshold. Prime rents in Sydney exceed AUD $1,000/m². Approximately 50% of new supply is pre-committed before completion. (CBRE Industrial & Logistics H2 2025)
- Report use: These figures establish why warehouse efficiency matters now more than ever. When a customer reports high capacity utilisation or same-day dispatch targets, connect their situation to these market pressures.
 
### Australian Labour Market — Warehouse Specific
 
- Jobs and Skills Australia (2024-2025): Transport, Postal and Warehousing employs approximately 710,100 people — roughly 5% of all Australian employment. Forklift drivers and storepersons are rated "No Shortage" nationally on the 2024 Occupation Shortage List, though regional shortages persist. (Jobs and Skills Australia industry profile; 2024 OSL)
- Market wages: The Storage Services and Wholesale Award (MA000084) sets Storeworker Grade 1 at $25.85/hour from 1 July 2025, with a 25% casual loading. Actual market rates are significantly higher — warehouse workers average $32.52/hour (Indeed AU) and forklift operators $34.61/hour. SEEK data shows typical warehouse worker salaries of $60,000-$70,000/year. (Indeed Australia; SEEK salary data 2025-2026)
- Turnover costs: AHRI Quarterly Work Outlook (Q1 2025) reports national employee turnover at 16%, with the distribution sector at 13%. Turnover replacement costs are estimated at 50% of annual salary per departure for standard roles, rising to 150-200% for specialist positions. At $65,000 average salary, that's $32,500 per departure. (AHRI Q1 2025; Scalesuite Australian Turnover Statistics 2026)
- Agency dependency: ABS Labour Hire Workers (December 2024) shows 390,400 labour hire workers nationally (2.6% of all employed), with 73.6% lacking paid leave entitlements and 55.3% having been in their current role less than one year. Warehouses heavily reliant on agency casuals face higher training costs, lower accuracy, and institutional knowledge loss. (ABS Labour Hire Workers, December 2024)
- Report use: When a customer reports high casual staffing ratios or turnover challenges, cite these figures to quantify the cost. A warehouse losing 5 casuals per month at $32,500 replacement cost each is burning $162,500/year on turnover alone.
 
### Targeted Interventions for SME Warehouses
 
LEAN PROCESS IMPROVEMENTS (NO CAPITAL REQUIRED):
- Díaz-Estela et al. (2025): Demonstrated a lean warehouse management model (5S implementation, layout reorganisation, ABC classification) that reduced non-conforming orders from 62% to 12% and improved space utilisation from 42% to 82% in an SME warehouse. These results were achieved through process changes alone, with no automation investment. (IRJEMS, 2025 — peer-reviewed)
- Duque-Jaramillo et al. (2024): Found that ABC classification combined with sequential row-level-column-section assignment produces optimal storage management outcomes for manual warehouses. The sorting-based slotting approach outperformed random and basic class-based alternatives. (Journal of Industrial Engineering and Management, February 2024 — peer-reviewed)
 
AUTOMATION CONTEXT FOR RECOMMENDATIONS:
- SCLAA (October 2025): Analysis found that nearly 40% of supply chain leaders see measurable improvements from AI implementation, while 60% of organisations have yet to capture any automation benefits — highlighting a widening performance gap. SMEs adopting collaborative robots (cobots) in food processing report achieving 50% operational efficiency gains. (Australasian Supply Chain & Logistics Association, industry analysis)
- MHD Supply Chain Solutions / Argon & Co (March 2026): 3PLs are "consistently more successful than owner-operators" at realising automation benefits, partly because they implement 2-10 DCs per year versus individual companies doing so once every 10-15 years. For SMEs considering automation, Robotics-as-a-Service (RaaS) models reduce upfront capital requirements. (MHD Supply Chain Solutions)
- Mordor Intelligence (January 2026): 35% of Australian SMEs deployed AI-enabled logistics solutions in 2024, achieving average cost savings of 18% and lead-time reductions of 22%. (Mordor Intelligence Australia Warehousing & Storage Market report — market research estimate, not peer-reviewed)
- Report use: For SME warehouses, always recommend lean process improvements first (5S, ABC slotting, batch picking, route optimisation). Only recommend automation when the customer has exhausted process improvements or when their volume clearly justifies the investment. Frame automation as a strategic priority for 6-12 months, not a quick win.

### Australian WHS — CURRENT DATA (2024-2025)

LEGISLATION:
- Work Health and Safety Act 2011: PCBUs must ensure worker health and safety so far as reasonably practicable.
- Category 1 offences (reckless conduct): Fines up to $11.8 million for bodies corporate, $2.4 million and/or 10 years imprisonment for individuals (imprisonment term doubled under Model WHS Legislation Amendment).
- Industrial manslaughter provisions now apply in most jurisdictions — penalties up to $20.4 million or 20 years imprisonment.
- Safe Work Australia Code — Managing the Work Environment and Facilities (2020): Aisles at least 600mm wide, boundaries marked by permanent lines at least 50mm wide.
- From 1 July 2026, NSW makes compliance with codes of practice a positive duty rather than merely admissible evidence.

CURRENT STATISTICS:
- Safe Work Australia Key WHS Statistics 2025: 188 workers fatally injured in Australia in 2024 (rate of 1.3 per 100,000 workers). Transport, postal and warehousing had a fatality rate of 7.4 per 100,000 workers — the second-highest of all industries. 146,700 serious workers' compensation claims lodged in 2023-24 (more than 400 serious claims per day). Body stressing injuries remain the leading cause of serious claims.
- Safe Work Australia Key WHS Statistics 2024: Transport, postal and warehousing accounted for 26% of all worker fatalities (51 deaths) in 2023. The industry's serious claims frequency rate was 9.3 claims per million hours worked — well above the all-industry average of 6.6. Mental health claims accounted for 10.5% of serious claims, with median time lost of 37 weeks versus 7 weeks for physical injuries.
- Safe Work Australia / Deloitte Access Economics (2022): If workplace injuries and illnesses were eliminated, Australia's economy would be $28.6 billion larger annually. This is a GDP impact figure covering both injuries and illnesses.

## RECOMMENDATION FORMAT

Each recommendation must follow this structure:
- WHAT to do (specific action)
- WHY it matters for this warehouse specifically (connecting to their answers)
- HOW to implement it (practical steps a warehouse manager can take)
- WHAT the expected outcome is (cite a study if one applies, otherwise describe qualitatively)

Bad example: "Implement batch picking to reduce travel time by 30-40%."
Good example: "Your warehouse is processing 150+ B2C orders per day using single-order picking, which means your pickers are walking the full warehouse floor for every individual order. This is the single most impactful change you can make. Transition to batch picking by grouping 8-12 orders with overlapping SKUs into a single pick run. Practically, this means printing or displaying batch pick lists sorted by location rather than by order, then sorting picked items into individual orders at a packing station. Petersen (2000) found batch picking reduces total picking time by approximately 17-22% in simulation studies. For your operation at 150 orders/day, even the conservative end of that range would recover significant labour hours per shift. Start with a two-week trial on B2C orders only, measure picks-per-hour before and after, and use that data to refine batch sizes."

Respond ONLY with valid JSON. No markdown, no backticks, no preamble, no trailing commas. Output ONLY the JSON object:

{
  "executive_summary": "3-4 sentence overview of current state, the single biggest risk, and the single biggest opportunity. Be specific to their answers.",
  "overall_score": 72,
  "sections": [
    {
      "title": "Section title matching audit category",
      "risk_level": "critical|high|moderate|low",
      "score": 65,
      "findings": [
        "Specific finding directly referencing their answer. 2-3 sentences explaining what was observed and why it matters."
      ],
      "recommendations": [
        {
          "priority": 1,
          "action": "Clear action title",
          "impact": "4-8 sentence detailed explanation following the WHAT/WHY/HOW/OUTCOME structure. Include study citations in parentheses where applicable.",
          "effort": "low|medium|high",
          "timeframe": "This week|This month|This quarter|3-6 months"
        }
      ]
    }
  ],
  "quick_wins": [
    "2-3 sentence description of something they can implement this week with zero or minimal cost, explaining exactly how to do it."
  ],
  "strategic_priorities": [
    "2-3 sentence description of a longer-term investment with explanation of why it matters and rough implementation approach."
  ],
  "references": [
    "Author (Year). Key finding cited in this report. Journal/Source."
  ]
}

Generate exactly 5 sections: Warehouse Layout & Space Utilisation, B2C Pick/Pack Workflow, B2B Pick/Pack Workflow, Staffing & Labour Allocation, B2B Document & Transfer Flow. Each section: 3-4 findings (2-3 sentences each), 3-4 prioritised recommendations (4-8 sentences each). Include 4-5 quick wins and 3 strategic priorities. Add a references section listing only the studies actually cited in the report. Scores should reflect genuine assessment based on their answers.`;

    // Step 1: Generate report via Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Generate a comprehensive warehouse audit report based on these questionnaire responses:\n${answers}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Anthropic API error:", data.error);
      return res.status(500).json({ error: data.error.message || "API error" });
    }

    const text = data.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("");

    let clean = text.replace(/```json|```/g, "").trim();
    clean = clean.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }

    const report = JSON.parse(clean);

    // Step 2: Generate PDF report + invoice, send email (if email provided)
    if (email && process.env.RESEND_API_KEY) {
      try {
        const invoiceNumber = generateInvoiceNumber();
        const [reportBuffer, invoiceBuffer] = await Promise.all([
          buildPdf(report),
          buildInvoice(email, invoiceNumber),
        ]);
        await sendEmail(email, reportBuffer, invoiceBuffer, report, invoiceNumber);
      } catch (emailErr) {
        console.error("Email/PDF delivery failed:", emailErr);
      }
    }

    return res.status(200).json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    return res.status(500).json({
      error: "Failed to generate report. Please try again.",
    });
  }
}
