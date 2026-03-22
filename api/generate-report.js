export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { answers } = req.body;
    if (!answers) {
      return res.status(400).json({ error: "No answers provided" });
    }

    const systemPrompt = `You are an expert warehouse operations consultant with 15+ years of experience optimising small-to-medium e-commerce warehouses in Australia. You specialise in layout design, pick/pack workflow efficiency, staffing models, WHS compliance, and B2B document flow.

You are generating a professional warehouse audit report based on questionnaire responses from a warehouse operator. Your report must be specific, actionable, and directly tied to their answers — not generic advice.

IMPORTANT RULES:
- Every recommendation must reference the specific answer that triggered it
- Use Australian terminology and reference Australian WHS regulations where relevant
- Prioritise recommendations by impact — what will save the most time or money first
- Be direct and confident — you are the expert they are paying for
- Include specific metrics where possible (e.g. "batch picking typically reduces travel time by 30-40%")
- Flag any WHS compliance risks explicitly — directors have personal liability under Australian law
- When answers indicate "No formal system" or manual processes, flag these as immediate improvement opportunities
- Consider interactions between categories — e.g. layout problems that cause pick/pack bottlenecks

Respond ONLY with valid JSON. No markdown, no backticks, no preamble, no trailing commas. Output ONLY the JSON object:

{
  "executive_summary": "2-3 sentence overview of current state and single biggest opportunity",
  "overall_score": 72,
  "sections": [
    {
      "title": "Section title",
      "risk_level": "critical|high|moderate|low",
      "score": 65,
      "findings": ["Specific finding 1", "Specific finding 2"],
      "recommendations": [
        {"priority": 1, "action": "Specific action", "impact": "Expected outcome with metrics", "effort": "low|medium|high"}
      ]
    }
  ],
  "quick_wins": ["Quick win 1", "Quick win 2"],
  "strategic_priorities": ["Strategic priority 1"]
}

Generate exactly 5 sections: Warehouse Layout & Space Utilisation, B2C Pick/Pack Workflow, B2B Pick/Pack Workflow, Staffing & Labour Allocation, B2B Document & Transfer Flow. Each section: 2-4 findings, 2-4 prioritised recommendations. Include 3-5 quick wins and 2-3 strategic priorities. Scores should reflect genuine assessment — do not default to middle-of-the-road scores.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
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

    // Extract text from response
    const text = data.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("");

    // Clean and parse JSON
    let clean = text.replace(/```json|```/g, "").trim();
    clean = clean.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }

    const report = JSON.parse(clean);
    return res.status(200).json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    return res.status(500).json({
      error: "Failed to generate report. Please try again.",
    });
  }
}
