import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchDeals from "./tools/search-deals";
import getDeal from "./tools/get-deal";
import addCallNote from "./tools/add-call-note";
import listTasks from "./tools/list-tasks";
import createTask from "./tools/create-task";
import searchContacts from "./tools/search-contacts";
import searchInvestors from "./tools/search-investors";
import listPortfolio from "./tools/list-portfolio";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "dca-vc-crm",
  title: "dca-vc-crm",
  version: "0.1.0",
  instructions: [
    "Tools for the DCA VC CRM. All calls act as the signed-in CRM user and respect their access.",
    "Use `search_deals` to find deals in the pipeline, then `get_deal` for full detail including the current",
    "investment scorecard (ARR, burn, valuation, ratings, narratives) and recent call notes.",
    "Use `list_tasks` / `create_task` for follow-ups and `add_call_note` to log meeting notes.",
    "`search_contacts`, `search_investors` and `list_portfolio` cover the relationship and portfolio side.",
  ].join(" "),
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchDeals,
    getDeal,
    addCallNote,
    listTasks,
    createTask,
    searchContacts,
    searchInvestors,
    listPortfolio,
  ],
});
