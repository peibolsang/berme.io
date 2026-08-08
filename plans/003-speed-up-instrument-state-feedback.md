# 003 — Speed up instrument state feedback

- **Status**: DONE
- **Commit**: 15ae331
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 3 CSS files, 5 state-readout rules

## Problem

Five sets of diagram elements act as scientific-instrument readouts: they indicate which assumption, gate, spiral node, or fundamentals band is current. Their color and opacity changes take 320–420ms, often with bare `ease`, so the displayed state lags the narrative beat selected by scrolling. These are immediate status changes, not the diagram's explanatory travel.

```css
/* components/interactive/blocks/assumption-avalanche/AssumptionAvalancheScrolly.module.css:309 — current */
.ledgerRow {
  color: #6f8394;
  opacity: 0.28;
  transform: translateX(0.55rem);
  transition: opacity 360ms ease, transform 480ms cubic-bezier(0.22, 1, 0.36, 1), color 320ms ease;
}

/* components/interactive/blocks/inner-loop-control/InnerLoopControlScrolly.module.css:143 — current */
.gate {
  color: var(--line);
  opacity: 0.42;
  transition: color 320ms ease, opacity 320ms ease;
}

/* app/globals.css:676 — current */
.delegation-loop__gate {
  color: var(--loop-line);
  opacity: 0.4;
  transition:
    color 340ms ease,
    opacity 340ms ease;
}

/* app/globals.css:1956 — current */
.practice-spiral__node {
  color: var(--spiral-line);
  opacity: 0.38;
  transition:
    color 420ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* app/globals.css:2412 — current */
.learning-paths__fundamentals-band {
  color: var(--paths-panel-muted);
  opacity: 0.42;
  transition:
    color 420ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

## Target

Use an exact 220ms strong ease-out for status color and opacity in all five rules:

```css
/* target for status-only color and opacity */
transition:
  color 220ms cubic-bezier(0.23, 1, 0.32, 1),
  opacity 220ms cubic-bezier(0.23, 1, 0.32, 1);
```

The Assumption Avalanche ledger row also has a spatial entrance. Keep that transform transition unchanged while making its status properties immediate:

```css
/* target for .ledgerRow */
transition:
  opacity 220ms cubic-bezier(0.23, 1, 0.32, 1),
  transform 480ms cubic-bezier(0.22, 1, 0.36, 1),
  color 220ms cubic-bezier(0.23, 1, 0.32, 1);
```

## Repo conventions to follow

- The UI motion budget in this repository's animation guidance is under 300ms; explanatory spatial motion may remain longer.
- `components/interactive/blocks/certainty-phase-change/CertaintyPhaseChangeScrolly.module.css:284` demonstrates the intended crisp feedback range and canonical ease-out `cubic-bezier(0.23, 1, 0.32, 1)`.
- Preserve the existing `past`, `active`, `reached`, and `future` class logic in TSX. This plan changes only how quickly their CSS state becomes legible.
- Do not introduce motion tokens in this plan; use the exact curve inline until the separate token-consolidation finding is selected.

## Steps

1. In `components/interactive/blocks/assumption-avalanche/AssumptionAvalancheScrolly.module.css`, change `.ledgerRow` opacity and color to `220ms cubic-bezier(0.23, 1, 0.32, 1)`. Leave its transform at `480ms cubic-bezier(0.22, 1, 0.36, 1)`.
2. In `components/interactive/blocks/inner-loop-control/InnerLoopControlScrolly.module.css`, change `.gate` color and opacity to `220ms cubic-bezier(0.23, 1, 0.32, 1)`.
3. In `app/globals.css`, apply the same 220ms color and opacity values to `.delegation-loop__gate`.
4. In `app/globals.css`, apply the same values to `.practice-spiral__node`.
5. In `app/globals.css`, apply the same values to `.learning-paths__fundamentals-band`.
6. Confirm that selectors defining the actual state values—such as `.active`, `.is-active`, `.past`, and `.is-past`—and every TSX file remain unchanged.

## Boundaries

- Do NOT change beat prose or beat underline transitions; plan 002 owns the existing underline indicators.
- Do NOT shorten path drawing, packet travel, particle travel, ledger-row translation, or other explanatory spatial motion.
- Do NOT change colors, opacity values, filters, shadows, transforms, state-class logic, markup, or reduced-motion rules.
- Do NOT add dependencies or shared tokens.
- If a step does not match commit `15ae331`, STOP and report the drift instead of improvising.

## Verification

- **Mechanical**: run `npm run lint`; it must exit successfully. Inspect the five selectors with `rg -n -A 8 "\.ledgerRow|^\.gate|delegation-loop__gate|practice-spiral__node|learning-paths__fundamentals-band" components/interactive/blocks app/globals.css`; color and opacity must be exactly `220ms cubic-bezier(0.23, 1, 0.32, 1)`, and the ledger transform must remain exactly `480ms cubic-bezier(0.22, 1, 0.36, 1)`.
- **Feel check**: run `npm run dev` and inspect Assumption Avalanche, Inner Loop Control, Delegation Loop Shift, Practice Spiral, and Learning Paths. Scroll across every boundary in both directions and confirm:
  - the active color and opacity settle before longer diagram travel finishes;
  - active, past, and future states never become ambiguous during a transition;
  - the ledger rows still translate at their original explanatory pace while their status color responds promptly;
  - fast threshold reversals smoothly retarget without flashes;
  - at 10% playback speed in DevTools, the status response is visibly shorter than path or marker movement.
- Toggle `prefers-reduced-motion: reduce` and confirm the repository's current reduced-motion behavior is unchanged.
- **Done when**: all five readout families use the exact 220ms strong ease-out for color and opacity, no explanatory movement or state value changes, and lint passes.
