# Animation implementation plans

These plans were produced from the read-only animation audit of `components/interactive` at commit `15ae331`.

| Plan | Title | Severity | Status |
| --- | --- | --- | --- |
| [001](001-use-ease-in-out-for-diagram-migrations.md) | Use ease-in-out for diagram migrations | MEDIUM | DONE |
| [002](002-make-active-beat-indicators-immediate.md) | Make active-beat indicators immediate | MEDIUM | DONE |
| [003](003-speed-up-instrument-state-feedback.md) | Speed up instrument state feedback | MEDIUM | DONE |

## Recommended execution order

1. **001 — Diagram migrations**: establish the physical character of persistent moving objects first.
2. **002 — Active-beat indicators**: make scroll-position acknowledgement immediate relative to that longer diagram motion.
3. **003 — Instrument state feedback**: align the remaining color and opacity readouts with the same crisp UI-response hierarchy.

## Dependencies

- The plans have no functional dependencies and may be implemented independently.
- Execute them sequentially because all three touch CSS under `components/interactive`, and plans 001–003 also touch nearby rules in `app/globals.css`.
- Each plan is scoped to distinct selectors or transition properties. Do not broaden an implementation into shared motion-token consolidation; that was a separate, unselected audit finding.
