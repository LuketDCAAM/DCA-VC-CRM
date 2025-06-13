DCA VC CRM – Project Outline Documentation
This document outlines the requirements and structure for the internal CRM system designed to track deal flow, portfolio companies, and investor contacts for a VC firm. The goal is to provide a comprehensive tool for reviewing and monitoring the full VC deal cycle.

1. Core Structure and Pages
The CRM will feature a relational back-end database, providing structured pages for key functionalities. Each page will support editing, searching, filtering, tagging, file uploads, and collaboration among team members.

1.1. Main Navigation Pages:
Dashboard: Overview of key metrics and activities.

Deals: Management of prospective investment opportunities.

Portfolio Companies: Tracking of companies in which the firm has invested.

Investors: Management of investor contacts.

Contact List: Unified directory of all contacts.

2. Deals Page
This page will manage all deal records, providing a detailed view of each potential investment.

2.1. Deal Record Fields:
Company Name: Name of the company.

Pipeline Stage: Current stage in the deal pipeline (editable and taggable).

Round Stage: Current funding round stage (e.g., Seed, Series A).

Round Size: Total amount of the funding round.

Post-Money Valuation: Company valuation after the investment.

Revenue: Current or projected revenue.

Location: Geographic location of the company.

Website: Company's official website URL.

Contact Information: Key contact details for the company.

Last Call Date: Date of the last interaction.

Tags/Labels: Categorization (e.g., sector, urgency, source).

Relationship Owner: Firm team member responsible for the deal.

Person Who Added the Entry: User who created the record.

Attachments: Uploaded documents (PDFs, pitch decks, links).

2.2. Interaction View:
Add call notes: Log details of calls and meetings.

Add next steps: Define future actions required for the deal.

Set reminders: Schedule follow-up alerts.

Upload supporting docs: Add additional relevant files.

View activity log: Chronological record of all changes and interactions related to the deal.

3. Investors Page
This page will track and manage all investor contacts.

3.1. Investor Record Fields:
Contact Information: Full contact details.

Firm: Name of the investor's firm.

Website: Firm's website URL.

Location: Geographic location of the investor/firm.

Investment Stage: Preferred investment stage (e.g., Seed, Growth).

Average Check Size: Typical investment amount.

Preferred Sectors: Industry sectors of interest.

Tags/Labels: Categorization.

Relationship Owner: Firm team member responsible for the investor relationship.

Person Who Added the Entry: User who created the record.

3.2. Interaction View:
Add call notes: Log details of calls and meetings.

View and log deals shared: Track which deals have been shared with this investor.

Set reminders: Schedule follow-up alerts.

Upload relevant documents: Add supporting files.

4. Portfolio Companies Page
This page will house records for all companies in which the firm has invested. An automation will trigger population of this page when a deal's pipeline stage is marked as "Invested".

4.1. Portfolio Company Record Fields:
Company Name: Name of the invested company.

Date(s) of Investment: Support for multiple investment dates.

Amount(s) Invested: Support for multiple investment amounts.

Post-Money Valuation at Time of Investment: Valuation at the time of each investment.

PPS at Time of Investment: Price per share at the time of each investment.

Revenue at Time of Investment: Revenue at the time of each investment.

Ownership % at Time of Investment: Firm's ownership percentage at the time of each investment.

Last Round Post-Money Valuation: Valuation from the most recent funding round.

Last Round PPS: Price per share from the most recent funding round.

Current Ownership %: Firm's current ownership percentage.

Status: Current status (Active, Exited, Dissolved).

Tags/Labels: Categorization.

Relationship Owner: Firm team member responsible for the portfolio company relationship.

Person Who Added the Entry: User who created the record.

Upload documents and links: Relevant files and external links.

5. Contact List Page
A unified contact book consolidating contact information from both the Deals and Investors sections.

5.1. Contact Record Fields:
Name: Full name of the contact.

Title: Job title.

Company or Firm: Associated organization.

Email / Phone: Contact details.

Associated Deals or Investors: Linked deal or investor records.

Relationship Owner: Firm team member responsible for the contact relationship.

Person Who Added the Entry: User who created the record.

6. Dashboard Page
The dashboard will provide real-time analytics, summaries, and critical reminders.

6.1. Dashboard Components:
Pipeline Overview:

Deal count by stage.

Deal volume added by quarter.

Capital Overview:

Total Capital Invested.

Geographic Map:

Count of deals by location.

Investor Stats:

Number of investor contacts.

Deal Analytics by Quarter:

Median Valuation.

Median Revenue Multiple.

Visual Charts:

Pie chart of deals by Sector.

Pie chart of deals by Round Stage.

Reminders:

For deals and investors.

Customizable (recurring every X weeks or specific dates).

Ideally integrated with Microsoft To-Do or sent via email.

Activity Feed:

Recent team activity and changes across the CRM.

7. Functional Requirements
These define the core capabilities and underlying architecture of the CRM.

7.1. Core Functionalities:
Add/Edit Entries: Available on all core pages (Deals, Investors, Portfolio Companies, Contacts).

Search Functionality:

Full-text search across Deals, Investors, Portfolio Companies, and Contacts.

Filtering: Available on each section:

By tag, owner, geography, sector, stage, and custom fields.

Tag Management:

Ability to add and update tags for pipeline stages and other entities.

Automation:

When Deal Stage = "Invested", automatically prompt to fill portfolio entry details and move the entry to the Portfolio Companies tab.

Upload & Download:

Upload documents directly to records.

Download/Export data to Excel/CSV from all major pages.

Collaboration:

Support for multiple user logins.

Shared notes within records.

Activity log per record for tracking changes and interactions.

Permissions & Roles:

User access controls to manage data visibility and modification rights.

7.2. System Architecture:
Database Structure: Structured similarly to Affinity, featuring:

Linked tables for relational data.

Clean views for presenting data.

Relationship mapping between entities (e.g., deals linked to contacts, investors linked to deals).

This documentation provides a foundational guide for the development of the DCA VC CRM, detailing each required component and functionality.