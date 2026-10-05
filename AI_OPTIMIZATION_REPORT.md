# AI Optimization & Engineering Judgment Report

## Project Context
- **System**: ApparelFlow ERP - Gatekeeper Terminal & Traffic Light Verification Engine
- **Developer**: H.M. Thamod Shashin Dulanjana
- **Primary AI Assistant**: Google Gemini (Developer AI Engineering Partner)

---

## 1. Tools & Prompting Strategy
During the development of ApparelFlow ERP, **Google Gemini** was utilized as an AI engineering assistant across several key development phases:
- **Project Scaffolding**: Generating initial Express.js server structure and React UI layout templates.
- **Relational Schema Drafting**: Formulating initial Prisma ORM schemas for `recipes`, `recipe_components`, and `cutting_orders`.
- **Logic Validation**: Scaffolding baseline unit tests and calculation logic for expected component multipliers.

---

## 2. Identified AI Flaws & Vulnerabilities

### Flaw 1: Client-Side Only Traffic Light Verification (Bypassable Hard Stop)
- **Issue**: The AI initially generated component verification logic exclusively within the React UI frontend (`VerifierTerminal.jsx`). It calculated match ratios (<95% threshold) and disabled the "Approve Batch" button in the DOM. However, the backend Express API endpoint (`POST /api/orders/:id/verify`) accepted direct payload requests without re-validating piece counts on the server side.
- **Risk**: A user or external script could bypass frontend disabled buttons via cURL/Postman and transition a shortage batch to `VERIFIED` status, violating zero-tolerance quality SOPs.

### Flaw 2: UI Input Contrast Defect & White-on-White Rendering
- **Issue**: The AI-scaffolded CSS and Tailwind styling applied transparent/glassmorphic utility classes (`bg-white/10 text-white`) without explicit focus/text-contrast guards. On form input fields and dropdown selectors, typed input text rendered white-on-white during active focus states.
- **Risk**: Failed accessibility compliance (UAT contrast audit failure).

---

## 3. Human Refactoring & Architectural Hardening

### Refactor 1: Server-Side Hard Stop Enforcement & Middleware
- **Action**: Completely decoupled state authorization from the client. Replaced raw frontend validation with a centralized Express middleware (`verifyHardStopGuard`) and transactional Prisma checks.
- **Code Enforcement**:
  - The backend queries expected component counts directly from database recipes.
  - Computes actual vs expected match ratios at the API boundary.
  - Rejects any shortage payload with `422 Unprocessable Entity` and logs the rejection attempt.

### Refactor 2: High-Contrast Accessibility Audit
- **Action**: Refactored global CSS variables and input field styling across all RBAC forms.
- **Code Enforcement**:
  - Applied explicit high-contrast text color defaults (`text-slate-900` / `bg-slate-50`) for all dropdowns, numeric inputs, and search fields.
  - Added visible outline focus rings (`focus:ring-2 focus:ring-blue-600`) to meet Webtezza UI contrast standards.

---

## 4. Defensive Architecture & RBAC Isolation

1. **Role Isolation**: Express authorization middleware (`requireRole(['cutting_verifier'])`) inspects JWT server context rather than client-passed roles. Non-verifier roles attempting verification receive `403 Forbidden`.
2. **Sewing Queue Isolation**: The `/api/sewing/queue` endpoint executes a strict database-level filter (`WHERE status = 'VERIFIED'`). Manipulating URL params or request headers cannot leak unverified or rejected batches.
3. **Immutable Audit Trails**: Successful verifications write permanently to `verification_logs` with server timestamps, verifier IDs, component variances, and calculated fabric wastage percentages.
