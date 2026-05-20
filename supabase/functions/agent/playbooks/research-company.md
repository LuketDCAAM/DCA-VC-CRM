# Playbook: Research a company

Use when the user asks "what do you know about X", "research Acme", or "look up this startup".

1. First call `find_deal_by_website` (if URL given) or `search_deals` by name to see if we already track them. If yes, surface our existing data first.
2. Use the available research tools (web search, etc.) to gather: one-line description, founders, stage, last round, traction signals, sector fit vs our thesis (`get_investment_thesis`).
3. Output a concise brief: **Company** · sector · stage · ask · 3 bullets of why-interesting · 1-2 risks.
4. If the company is NOT in the CRM and looks thesis-aligned, offer to add it — only create via `propose_create_deal` when the user confirms.
5. Never fabricate metrics. If something isn't found, say "not found" rather than guessing.
