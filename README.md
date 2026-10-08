# TrueLinks AI

TrueLinks AI is a prototype property management dashboard for lease review and maintenance issue intelligence. It helps a property owner review a lease, validate it against owner-defined standards, match it to a known unit, and connect a photo-based issue to a draft work order.

## Business problem and solution

The product addresses a common operational problem in residential property management: a team must manually read lease documents, compare them to owner rules, inspect visible property damage, and then create work orders. This prototype packages those tasks into a single unit-centered workflow in a small application that can run locally without paid AI services.

The solution includes:

-The solution includes:

- a lease extraction and human-review workflow using deterministic demo input
- deterministic rule evaluation based on the supplied ruleset
- unit matching and occupancy safeguards
- a photo-based issue analysis workflow
- draft work-order creation and review status
- human review actions with evidence kept alongside extracted values

## Implemented workflows

### Lease intelligence workflow

1. A lease text payload is submitted to the mock lease extraction agent.
2. Structured lease data is extracted and paired with evidence snippets.
3. The lease is validated against seven owner-defined rules.
4. The system checks the unit exists and is available before a new lease can be linked.
5. A user can review the extraction and the rule results before any final linkage action.

### Property issue workflow

1.A user selects a unit and uploads a supported image or uses a demo image reference. 2. A mock vision agent identifies visible issues, equipment, and uncertainty notes. 3. A draft issue and draft work order are generated. 4. The owner can accept, edit, or reject the proposed work order before any approval.

## Architecture overview

- App Router screens under `app/` provide the dashboard, units list, and unit detail view.
- Shared business logic lives under `services/` so UI code remains presentational.
- `agents/` exposes typed interfaces for lease and vision analysis behind mock implementations.
- `data/` preserves the supplied owner records and rule definitions.
- `types/` contains the core domain types and evaluation schemas.
- Tests under `tests/` validate the lease rules and safety checks.

## What is real and what is mocked

This is a functional prototype, not a production AI integration.

Real in this prototype:

- typed rule engine based on the supplied JSON ruleset
- unit lookup, validation logic, and occupancy safeguards
- UI and API flow using the Next.js App Router
- deterministic mock extraction and image analysis for demo use

Mocked in this prototype:

- lease extraction output
- image analysis results
- evidence generated from synthetic text and image descriptions
- future external AI or OCR integration is intentionally left as a drop-in replacement

The README and UI explicitly label the mock behavior. The system does not present demo output as if it were extracted from a real PDF or real property photo.

## Setup and installation

```bash
npm install
npm run dev
```

Open http://localhost:3000 after the dev server starts.

## Tests and verification

```bash
npm test -- --run
npm run type-check
npm run lint
npm run build
```

The project is designed to run without a secret or API-key setup. The only required environment would be for a future real AI or OCR provider.

## Assumptions and edge cases

- The supplied `units.json` is treated as the source of truth for unit IDs and availability.
- Exact unit IDs, including leading zeros and case-specific IDs, are preserved exactly as supplied.
- A lease can only be linked to a unit that exists and is marked as available.
- Missing data triggers `NOT_DETERMINABLE` rather than an invented value.
- The date validation uses month counts between commencement and expiry dates; if a date is invalid or missing, the rule is not determinable.
- The system does not silently change occupancy until an owner confirms the link and the final review steps are accepted.

## Deliberately left out

- Authentication, billing, payment systems, contractor marketplace integrations, and notifications
- Real OCR or document extraction from uploaded PDF files
- Real Azure or external AI provider setup
- Multi-user concurrent editing persistence with a database layer

These are intentionally deferred so the prototype stays focused on correctness, evidence, review, and business logic.

## Security and reliability notes

- No secrets are hard-coded in client-side code.
- Sensitive lease documents should be stored securely and access-controlled in production.
- AI outputs are treated as assistive evidence only, never final business truth.
- Large PDFs and image batches can become slow or inaccurate without a proper OCR and storage pipeline.
- In production, background jobs, audit retention, and monitoring would be required for scale.

## Product Improvements / What I Would Build Next

The current prototype proves the workflow is viable and gives the owner a clear unit-centered view of lease and property risk. The next step is not to replace it with a more complex interface; it is to turn it into a workflow that a property owner or property manager can trust and actually use every day.

### 1. Owner Review Queue

User problem:

- Owners and managers do not have a single place to see all lease issues, property concerns, and approval decisions that still need a person to act.
- Risky items are buried among normal portfolio activity, which slows review and creates missed follow-up.

Proposed solution:

- Create a central review queue showing all lease records and property issues requiring human attention.
- Group items by urgency, risk level, rule failure, or unresolved work order.
- Prioritize lease exceptions, missing signatures, occupancy concerns, and maintenance items that have a direct financial or legal impact.

Why it is useful:

- It reduces decision fatigue by surfacing the highest-risk items first.
- It makes review more consistent because the owner sees what requires action, not just raw data.
- It saves time by moving the reviewer from scanning everything to focusing on the items that matter most.

Why it is a future improvement rather than part of the current prototype:

- The current app is intentionally focused on demonstrating the unit-level workflow and approval logic rather than building a full operational queue with prioritization rules, filters, and role-based routing.

### 2. Risk and Priority Dashboard

User problem:

- Owners often need to understand which units are currently more risky or more operationally important, not just view a single unit in isolation.
- Lease rule failures and maintenance issues exist across the portfolio, and the owner needs a quick sense of what is urgent.

Proposed solution:

- Build a dashboard that aggregates lease risks, unresolved issues, review states, and work-order priority across the portfolio.
- Highlight urgent conditions first, such as failed compliance checks, lease mismatches, or unresolved issues with safety or habitability implications.
- Let the user sort by urgency, unit, property, or issue type.

Why it is useful:

- It improves decision-making by giving the owner a portfolio-level view instead of a piecemeal one.
- It supports faster triage because the highest-risk assets are visually emphasized.
- It helps prevent a small issue from being missed when multiple units require attention.

Why it is a future improvement rather than part of the current prototype:

- The prototype is focused on proving the core unit review loop. Portfolio aggregation is conceptually straightforward, but building a production-ready prioritization model requires more operational rules and more data than the demo contains.

### 3. Unit Timeline / Property History

User problem:

- A property owner often needs to see the complete story of a unit: lease changes, status updates, property issues, work orders, approvals, and review decisions.
- Without a timeline, the owner cannot easily reconstruct what happened and why a decision was made.

Proposed solution:

- Add a timeline for each unit showing lease events, issue reports, work-order creation, approval actions, corrections, and status changes in chronological order.
- Include a clear record of what was reviewed, who changed what, and when the change happened.

Why it is useful:

- It gives the owner a complete property history in one place.
- It supports accountability because changes are visible and traceable.
- It helps operations teams follow the chain of events when there is a dispute, a surprise issue, or a turnover event.

Why it is a future improvement rather than part of the current prototype:

- The prototype demonstrates a single review path and issue workflow, but it does not yet maintain a full historical ledger across many unit events or cross-reference them in a polished timeline view.

### 4. AI Confidence + Human Decision Tracking

User problem:

- When AI suggestions are involved, owners need to know how confident the system is and whether the output is a suggestion or a final decision.
- Without clear separation, users may confuse AI-generated recommendations with validated business decisions.

Proposed solution:

- Show confidence scores, evidence snippets, and uncertainty notes next to AI-generated lease or issue recommendations.
- Keep the AI output clearly marked as a suggestion, and require a distinct human approval step before any action becomes final.
- Record who approved or rejected the recommendation and why.

Why it is useful:

- It builds trust because the owner can see both the reasoning and the confidence level behind the suggestion.
- It increases accountability because approvals remain distinctly human decisions.
- It reduces the risk of over-relying on automation without clear evidence.

Why it is a future improvement rather than part of the current prototype:

- The prototype deliberately uses deterministic mock output to demonstrate the workflow without external APIs. It is already structured around human review, but it does not yet include a full confidence model, rich audit reasons, or a mature enterprise approval trail.

## Production / Scale Considerations

A production version of this workflow would need more than the in-memory prototype to support real portfolio operations.

- Replace the in-memory store with a database to persist leases, units, review actions, issue records, and work-order states.
- Add real document ingestion and PDF extraction so lease files can be processed reliably from actual uploaded files.
- Replace the demo vision logic with a real image understanding model for property issues and maintenance detection.
- Use object storage for uploaded lease files and property images so they are durable, accessible, and cost-efficient.
- Add authentication and role-based access so owners, managers, and reviewers have the correct permissions and visibility.
- Keep persistent audit logs for all AI suggestions, human approvals, edits, and work-order decisions.
- Move expensive document and image analysis to background processing so large files do not block the UI.
- Add monitoring and retry handling for ingestion, extraction, and workflow orchestration to make the system resilient under load.

## What I Intentionally Left Out

This prototype is intentionally narrow and transparent about its limits. The following items are not included because the goal is to demonstrate the product workflow clearly without building a full production system.

- No real external AI API is connected.
- No database is used for persistence.
- No authentication is implemented.
- No cloud storage is used for uploaded files.
- No production OCR or vision pipeline is integrated.
- Deterministic mock AI was used to demonstrate the review and approval flow without requiring API keys or external services.

This keeps the implementation honest: the app shows how the process could work, the review decisions it supports, and the product logic behind it, without pretending to be a fully deployed production system.

## Known limitations at scale

- Large PDF files may slow down parsing or OCR quality.
- Image-based damage detection can misclassify finishes, stains, or nearby fixtures.
- Concurrent updates across multiple reviewers could create race conditions without a database ledger.
- Storage of lease documents and tenant data should follow strict privacy and retention standards.
- Without background processing, large file upload bursts may create poor UX or brittle operations.
