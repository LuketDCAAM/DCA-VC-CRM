// Shared allow-lists & helpers used by both the agent edge function
// and the server-side apply-actions edge function.

export const DEAL_COLUMNS = new Set([
  "company_name", "description", "sector", "pipeline_stage", "round_stage",
  "round_size", "post_money_valuation", "revenue", "website", "linkedin_url",
  "crunchbase_url", "location", "city", "state_province", "country",
  "headquarters_location", "contact_name", "contact_email", "contact_phone",
  "deal_source", "source_date", "deal_lead", "next_steps", "tags",
  "founded_year", "employee_count_range", "company_type", "investment_vehicle",
  "ic_review_date", "last_call_date", "last_funding_date", "total_funding_raised",
  "reason_for_passing", "deal_score", "is_priority_deal", "priority_rank",
  "relationship_owner",
]);

export const INVESTOR_COLUMNS = new Set([
  "contact_name", "firm_name", "firm_website", "contact_email", "contact_phone",
  "location", "city", "state_province", "country", "preferred_sectors",
  "preferred_investment_stage", "average_check_size", "linkedin_url", "tags",
  "last_call_date", "relationship_owner",
]);

export const CONTACT_COLUMNS = new Set([
  "name", "email", "phone", "title", "company_or_firm", "deal_id",
  "investor_id", "portfolio_company_id", "relationship_owner",
]);

export const REMINDER_COLUMNS = new Set([
  "title", "description", "reminder_date", "priority", "task_type",
  "deal_id", "investor_id", "portfolio_company_id", "assigned_to",
  "send_email_reminder", "status",
]);

export const SCORECARD_COLUMNS = new Set([
  // identity / context
  "sector", "stage", "geography", "geography_tier", "founding_year",
  "deal_lead", "vehicle",
  // team / round
  "repeat_founder", "has_technical_cofounder", "fundraise_amount", "valuation",
  "prev_valuation", "committed_amount", "round_deadline", "founder_ownership_pct",
  "bridge_rounds_18mo", "total_debt_excl_convertibles",
  // financials
  "current_arr", "prior_arr", "forecast_arr", "gross_burn", "net_burn",
  "cash_balance", "total_raised", "gross_margin", "fcst_gross_margin", "acv",
  "employee_count", "nrr", "grr", "top_cust_pct", "monthly_churn",
  // narrative
  "company_overview", "investment_thesis", "traction_milestones", "business_model",
  "key_strengths", "key_risks", "investor_base", "competitive_landscape",
  "use_of_funds", "dca_value_add",
  // notes
  "metric_notes",
]);

export function pickAllowed(
  payload: Record<string, unknown>,
  allowed: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (allowed.has(k) && v !== undefined && v !== "") out[k] = v;
  }
  return out;
}

export function normalizeDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = url.includes("://") ? url : `https://${url}`;
    const host = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null;
  }
}

export function formatPgError(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  const obj = e as Record<string, unknown>;
  const parts = [obj.message, obj.details, obj.hint, obj.code].filter(Boolean).map(String);
  return parts.length ? parts.join(" — ") : JSON.stringify(e);
}
