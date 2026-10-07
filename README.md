# TrueLinks AI

TrueLinks AI is a prototype property management dashboard for lease review and maintenance issue intelligence. It helps a property owner review a lease, validate it against owner-defined standards, match it to a known unit, and connect a photo-based issue to a draft work order.

## Business problem and solution

The product addresses a common operational problem in residential property management: a team must manually read lease documents, compare them to owner rules, inspect visible property damage, and then create work orders. This prototype packages those tasks into a single unit-centered workflow in a small application that can run locally without paid AI services.

The solution includes:

- a lease upload and extraction workflow
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

1. A user selects a unit and uploads one or more supported images.
2. A mock vision agent identifies visible issues, equipment, and uncertainty notes.
3. A draft issue and draft work order are generated.
4. The owner can accept, edit, or reject the proposed work order before any approval.

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
npm run test
npm run type-check
npm run lint
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

## Future product ideas

1. Real PDF OCR and lease parsing with Azure Document Intelligence or a comparable provider.
2. Property photo analysis with a real vision model and structured issue classification.
3. A database-backed review queue with per-unit timelines and audit logs.
4. Work-order assignment to vendors, contractor messaging, and completion tracking.
5. Search, filters, and dashboard slices by unit type, flagged rules, and work-order status.

Each enhancement addresses an actual owner pain point: trust in extraction, faster issue triage, and auditable maintenance operations.

## Known limitations at scale

- Large PDF files may slow down parsing or OCR quality.
- Image-based damage detection can misclassify finishes, stains, or nearby fixtures.
- Concurrent updates across multiple reviewers could create race conditions without a database ledger.
- Storage of lease documents and tenant data should follow strict privacy and retention standards.
- Without background processing, large file upload bursts may create poor UX or brittle operations.
