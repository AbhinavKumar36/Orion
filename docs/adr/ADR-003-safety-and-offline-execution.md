# ADR-003: Safety, Privacy, and Offline Execution Boundaries

## Status
Accepted

## Context
Cybersecurity prototypes in competition settings risk operational failure or severe policy violations if they crawl external links, execute uploaded malware, transmit real credentials, or attempt autonomous offensive actions.

## Decision
1. **Offline & Static Analysis Only**:
   - Zero runtime URL fetching, crawling, or DNS resolution.
   - Redirect chains are extracted from URL parameters or supplied analyst context.
   - HTML snippets are parsed using static DOM parsing (`html.parser`), never rendered or executed in a live browser engine.
2. **Data Sanitization & Defanging**:
   - All URLs displayed or logged are defanged (e.g. `hxxps://`, `domain[.]com`).
   - Synthetic and sanitized datasets only; user IDs are anonymized/hashed.
3. **Advisory & Simulated Response**:
   - Recommended actions are strictly advisory (`automated: false`).
   - "Simulate Playbook" writes an entry to `ACTION_LOG` and updates incident state in SQLite; it never executes active blocking, account locking, or firewall configuration.
4. **Resilient Local Demo**:
   - System relies on pre-seeded SQLite databases and local scikit-learn models.
   - Live demo resets via `POST /api/demo/reset` (enabled only when `ORION_DEMO_RESET_ENABLED=true`).

## Consequences
- Total immunity from network dropouts or third-party rate limits during the live demo.
- Compliance with hackathon ethics, privacy standards, and SOC defense guidelines.
