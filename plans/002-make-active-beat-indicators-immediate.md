# 002 — Make active-beat indicators immediate

- **Status**: DONE
- **Commit**: 15ae331
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 4 CSS files, 5 indicator rules covering 6 components

## Problem

The thin underline that marks the active narrative beat is navigation feedback: it should confirm the current scroll position immediately. Five older rules take `320ms` to fade in and `480–520ms` to extend, causing the indicator to trail the step change. The newer certainty component already establishes a crisper equivalent at 180ms/220ms.

```css
/* components/interactive/blocks/assumption-avalanche/AssumptionAvalancheScrolly.module.css:414 — current */
.beat > div::before {
  opacity: 0;
  transform: scaleX(0.35);
  transform-origin: left;
  transition: opacity 320ms ease, transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* components/interactive/blocks/constraint-migration/ConstraintMigrationScrolly.module.css:290 — current */
.beat > div::before {
  opacity: 0;
  transform: scaleX(0.35);
  transform-origin: left;
  transition: opacity 320ms ease, transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* components/interactive/blocks/inner-loop-control/InnerLoopControlScrolly.module.css:305 — current */
.beat > div::before {
  opacity: 0;
  transform: scaleX(0.35);
  transform-origin: left;
  transition: opacity 320ms ease, transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* app/globals.css:1239 — current; shared by design-space and delegation-workbench */
.design-space__beat > div::before,
.delegation-workbench__beat > div::before {
  opacity: 0;
  transform: scaleX(0.35);
  transform-origin: left;
  transition:
    opacity 320ms ease,
    transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* app/globals.css:2681 — current */
.learning-paths__beat > div::before {
  opacity: 0;
  transform: scaleX(0.35);
  transform-origin: left;
  transition:
    opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

## Target

All six affected components must use the same indicator timing and easing as Certainty Phase Change:

```css
/* target for every affected beat underline */
transition:
  opacity 180ms cubic-bezier(0.23, 1, 0.32, 1),
  transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
```

Keep `transform-origin: left`, the inactive `scaleX(0.35)`, and the active `scaleX(1)` exactly as they are.

## Repo conventions to follow

- `components/interactive/blocks/certainty-phase-change/CertaintyPhaseChangeScrolly.module.css:273` is the accepted exemplar.
- Its canonical strong ease-out is `cubic-bezier(0.23, 1, 0.32, 1)` and its indicator uses `180ms` for opacity and `220ms` for transform.
- Keep each component's existing colors and selector structure. The shared global selector for Design Space and Delegation Workbench should remain shared.
- Inline the exact curve in the older rules. Do not broaden this plan into global token consolidation.

## Steps

1. In `components/interactive/blocks/assumption-avalanche/AssumptionAvalancheScrolly.module.css`, change only `.beat > div::before` to `opacity 180ms cubic-bezier(0.23, 1, 0.32, 1)` and `transform 220ms cubic-bezier(0.23, 1, 0.32, 1)`.
2. Apply the identical two transition values to `.beat > div::before` in `components/interactive/blocks/constraint-migration/ConstraintMigrationScrolly.module.css`.
3. Apply the identical two transition values to `.beat > div::before` in `components/interactive/blocks/inner-loop-control/InnerLoopControlScrolly.module.css`.
4. In `app/globals.css`, apply the identical values to the shared `.design-space__beat > div::before, .delegation-workbench__beat > div::before` rule.
5. In `app/globals.css`, apply the identical values to `.learning-paths__beat > div::before`, replacing its current 320ms/520ms pair.
6. Confirm that `components/interactive/blocks/certainty-phase-change/CertaintyPhaseChangeScrolly.module.css` is unchanged; it is the exemplar, not part of the edit.

## Boundaries

- Do NOT change the `.beat` article's color or opacity timing; this plan only covers the thin `::before` indicator.
- Do NOT add indicators to Constraint Descent, Delegation Loop Shift, or Practice Spiral; they do not currently use this visual pattern.
- Do NOT change dimensions, color, initial scale, active scale, transform origin, layout, or markup.
- Do NOT change reduced-motion rules or add dependencies.
- If a step does not match commit `15ae331`, STOP and report the drift instead of improvising.

## Verification

- **Mechanical**: run `npm run lint`; it must exit successfully. Run `rg -n -A 14 "beat.*div::before" components/interactive/blocks app/globals.css` and confirm every existing beat underline uses `180ms` opacity, `220ms` transform, and `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Feel check**: run `npm run dev` and inspect Assumption Avalanche, Constraint Migration, Inner Loop Control, Design Space Field, Delegation Workbench, Learning Paths, and the unchanged Certainty Phase Change exemplar. Scroll slowly and quickly in both directions. Confirm:
  - the underline acknowledges a new active beat almost immediately;
  - it finishes before the diagram's longer explanatory motion;
  - reversing across a threshold smoothly retargets the scale instead of flashing;
  - at 10% playback speed in DevTools, opacity and extension feel like one coordinated response;
  - all indicators still grow from the left edge.
- Toggle `prefers-reduced-motion: reduce` and confirm the existing no-transition treatment remains unchanged in the older components.
- **Done when**: all six older beat indicators match the 180ms/220ms certainty exemplar without changing their appearance or surrounding prose transitions, and lint passes.
