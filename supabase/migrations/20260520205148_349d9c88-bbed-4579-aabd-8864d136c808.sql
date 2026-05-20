create index if not exists deals_company_name_lower_idx on public.deals (lower(company_name));
create index if not exists deals_website_domain_idx on public.deals (lower(split_part(regexp_replace(coalesce(website, ''), '^https?://(www\.)?', ''), '/', 1)));
create index if not exists agent_actions_user_status_created_idx on public.agent_actions (user_id, status, created_at desc);