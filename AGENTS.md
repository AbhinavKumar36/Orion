# ORION Antigravity Repository Rules (aligned with Master Spec v3.2)

## Authority and precedence

1. `docs/ORION_Master_v3.2.md` is the primary project specification for architecture, scope, phases, product behavior and implementation decisions.
2. `docs/contract-v1.1.md` plus the v1.2 deltas in master section 5 is normative for the canonical API/data contract. Breaking changes need a new major version and an approved ADR.
3. `risk_config.yaml` is normative for every numeric value and every policy, impact, classification, severity, threshold, floor, cap, evidence weight and calibration rule that it defines. The engine must load it; never hard-code a value that appears there. Its `version` is stored in incident `model_metadata.risk_config_version`.
4. Source code and tests implement the authoritative specifications above. They must not silently redefine them.
5. If two authoritative sources disagree, or a request conflicts with the frozen architecture: **STOP, report the exact conflict and affected files/sections, and wait for a decision.** Do not pick a side silently.

## Working procedure

- Read `docs/PHASE_STATUS.md` first. It names the current phase, its exit gate and what is already done. Update it when a gate passes.
- Work only on the current phase's deliverables. Do not start the next phase until the current gate passes.
- Inspect the repository before editing. Never assume a file, endpoint, table, model, config key or dependency exists; verify it.
- Use separate branches/worktrees for genuinely parallel streams when useful: backend-core, detectors, frontend, data-eval-docs. Do not create branch complexity for its own sake.
- Keep changes small and reversible. A phase gate must remain mergeable and reproducible. Tag each passed gate (`gate-p1`, `gate-p2`, ...).
- Never merge a stream that has not passed its targeted tests.
- Record every architectural decision as an ADR in `docs/adr/` (one short file each).

## Mandatory engineering rules

### Scope control

- Mention of a capability in PS09, the master document, or an innovation section does not authorize implementation by itself.
- Follow the current phase and tier classification exactly.
- MUST items have priority over SHOULD, SHOULD over COULD.
- ROADMAP items must not be implemented unless the master specification explicitly promotes them through an approved scope decision.
- Do not introduce a new framework, model, database or service merely to demonstrate an innovation opportunity.

### Architecture and data flow

- Detection engines emit detector output + normalized evidence only. They never compute severity, score, alerts or actions.
- The risk engine is a pure deterministic function: no database, clock, network, filesystem/config loading or randomness. Policy floors/caps, impact and classification are resolved from validated configuration passed into pure helper functions.
- `risk_config.yaml` is loaded through one configuration loader at application startup or explicit dependency injection and validated before analysis requests are served.
- Missing, malformed or incompatible risk configuration is a configuration/startup error; never fall back to hard-coded defaults.
- Every incident stores the exact loaded `risk_config.yaml` version in `model_metadata.risk_config_version`.
- Detector-specific operational thresholds may live in `detector_config.yaml` where explicitly defined by the master specification. Do not duplicate the same value across configuration files.
- The UI consumes canonical incidents only, never module-specific detector output.
- Preserve frozen API contracts. Frontend types are generated from FastAPI OpenAPI; do not hand-maintain duplicates.
- External adapters must fail safely and return degraded/inconclusive results. Never a silent SAFE.
- Inconclusive is never displayed as SAFE. A fired policy floor makes the assessment `threat` (floors win over the inconclusive clamp).
- Every explanation factor must reference an existing evidence ID. Optional LLM wording must not change scores, evidence or actions.
- Use a repository/data-access layer for all SQL. Enable `PRAGMA foreign_keys=ON` and WAL.
- Use an injectable clock everywhere outside the API boundary. Seeds and tests must be deterministic (fixed IDs, fixed random seeds).

## Demo preservation

- Before modifying an existing working feature, identify its current entry point, API contract and tests.
- Do not refactor working demo paths while implementing unrelated features.
- Prefer additive changes over rewrites.
- Before merging a change, verify that all previously passing demo scenarios still work.
- If a proposed change risks breaking an existing demo path, STOP and report the risk before making the change.
- Never trade a working MUST/demo scenario for an unfinished SHOULD/COULD feature.

## Safety and privacy (non-negotiable)

- Never fetch, crawl, resolve or follow submitted URLs. Redirect evidence = static parsing of redirect parameters or a user-supplied redirect chain. HTML snippets are parsed statically, never rendered or executed.
- Libraries must not make network calls at runtime (configure offline mode, e.g. bundled public-suffix list for domain parsing; no model auto-download at runtime).
- Use only synthetic, authorized or public data. No real credentials, tokens, private keys or personal data in the repo, logs or fixtures.
- Defang URLs in logs, fixtures, docs and judge-facing output (`hxxp://`, `[.]`). Mask emails, phone numbers and tokens in logs.
- Uploads: validate size and type, generate opaque filenames, store outside static/executable paths, apply decoding limits, never execute uploaded content.
- Response actions are advisory. `recommended_actions[].automated` is always `false`. "Simulate" only writes an action-log entry; it never blocks, revokes or notifies anything real.
- Simulated webhook/email alerts are log entries only.
- Do not build credential theft, malware, authentication bypass or unauthorized scanning features.

## Testing rules

- Never edit or weaken a test merely to make it pass. Never delete a failing test without an approved, documented specification change.
- Golden cases (`backend/tests/fixtures/golden_cases.json`) must reproduce exactly, including assessment and threat_type.
- Property tests: bounds, determinism, band consistency, impact monotonicity, floor-wins, unknown-is-not-safe. Evidence monotonicity is asserted only within the same assessment state and with no floor/cap transition; never across the inconclusive boundary.
- Contract tests: validate `docs/fixtures/ORN-DEMO-*.json` against the Pydantic models; OpenAPI snapshot fails on unapproved change.
- Explanation completeness: every evidence type in `risk_config.yaml` has a template.
- Run targeted tests after each change and the full suite at every gate.
- Do not change expected golden outputs merely to accommodate an implementation. If implementation and golden behavior disagree, inspect the specification first and stop if the conflict is not already resolved.

## Dependencies

- Approved without ADR: fastapi, uvicorn, pydantic v2, pytest, hypothesis, numpy, pandas, scikit-learn, joblib, pyyaml, pillow, python-multipart, rapidfuzz; frontend: react, vite, tailwindcss, recharts, openapi-typescript.
- Requires a short ADR first: opencv-python-headless (QR/video), any pretrained model or model download, any audio library, any graph library, any LLM SDK.
- Pin versions. Commit lockfiles.
- Do not add a dependency solely because an agent considers it convenient. Verify that the dependency is allowed for the current phase and does not introduce runtime network behavior.

## Configuration ownership

- `risk_config.yaml` owns risk formula parameters, severity bands, evidence weights, impact mappings, classification rules, policy floors/caps, inconclusive behavior, alert thresholds and other numeric/policy values explicitly defined there.
- `detector_config.yaml` owns detector-specific firing thresholds only where the master specification assigns them there.
- If ownership of a new numeric or policy value is unclear, STOP and request an ADR rather than duplicating or guessing.
- Any runtime configuration required for deterministic analysis must be explicit, versioned where appropriate, validated, and included in the demo reproducibility record.

## Change discipline

- Any change to `risk_config.yaml` bumps its `version`, updates golden fixtures if outputs change, and is recorded in its changelog.
- Do not rewrite unrelated working code. Prefer small, testable changes.
- Update OpenAPI snapshots only for an approved contract change.
- Do not silently rename API fields, evidence types, threat types, enum values, database columns or configuration keys.
- If a migration is required, make it explicit, reversible where practical, and covered by migration tests.
- Keep commits focused enough that a failed change can be reverted without losing unrelated work.

## Demo safety and freeze

- `POST /api/demo/reset` is disabled unless `ORION_DEMO_RESET_ENABLED=true` and operates only on demo/seed data.
- After the feature-freeze checkpoint (master section 16) only bug fixes are allowed, each on its own commit with a rollback tag. Config, seeds, model artifacts, UI copy and API schema are frozen.
- Keep a backup copy of `orion.db`, the trained model artifacts and the seed set for the demo machine.
- Do not introduce new features during the freeze under the label of a "bug fix". A bug fix must restore already-specified behavior without expanding scope.
- Before the freeze, maintain a clean reproducible demo path and record the exact commit/config/model/seed versions used by the demo machine.

## Agent execution protocol

Before every implementation task:

1. Read `docs/PHASE_STATUS.md`.
2. Read the relevant section(s) of `docs/ORION_Master_v3.2.md`.
3. Read the relevant contract/config sections.
4. Inspect the existing repository implementation and tests.
5. State the files/components that will be changed.
6. Implement the smallest change satisfying the current phase gate.
7. Run targeted tests.
8. Run relevant frontend/backend build or type checks.
9. Verify previously working demo paths when the change touches shared code.
10. Update documentation/ADR/phase status when required.
11. Do not proceed to the next phase until the current exit gate passes.

If the task cannot be completed without violating an authority, safety rule, frozen contract, or current phase boundary: **STOP and report the conflict instead of improvising.**
