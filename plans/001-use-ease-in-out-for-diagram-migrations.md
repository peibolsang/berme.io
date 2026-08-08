# 001 — Use ease-in-out for diagram migrations

- **Status**: DONE
- **Commit**: 15ae331
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 3 CSS files, 5 transition declarations

## Problem

Four scrollytelling diagrams move persistent objects from one visible position to another when `activeIndex` changes. Those migrations currently use a strong ease-out curve. Ease-out is appropriate for an object entering the interface, but not for an object the reader watches travel between two established positions: it covers most of the distance immediately and spends the rest of a 480–720ms transition settling.

```css
/* components/interactive/blocks/constraint-migration/ConstraintMigrationScrolly.module.css:198 — current */
.constraintCollar {
  color: var(--constraint-hot);
  transform: translateX(var(--constraint-x)) translateY(168px);
  transition: transform 720ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* components/interactive/blocks/constraint-migration/ConstraintMigrationScrolly.module.css:252 — current */
.engineerMarker {
  color: var(--rail);
  transform: translateX(var(--constraint-x)) translateY(246px);
  transition: transform 720ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* components/interactive/blocks/inner-loop-control/InnerLoopControlScrolly.module.css:187 — current */
.packet {
  color: var(--amber);
  filter: drop-shadow(0 0 7px rgb(244 199 95 / 0.65));
  transition: transform 580ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* app/globals.css:350 — current */
.constraint-story__intent-signal {
  color: var(--story-accent);
  transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* app/globals.css:715 — current */
.delegation-loop__signal {
  color: var(--loop-amber);
  filter: drop-shadow(0 0 9px rgb(242 184 75 / 0.72));
  transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

The positions are supplied directly from the selected step in `ConstraintMigrationScrolly.tsx:64`, `InnerLoopControlScrolly.tsx:50`, `ConstraintDescentScrolly.tsx:157`, and `DelegationLoopShiftScrolly.tsx:48`. The elements persist; they are not recreated for each step.

## Target

Keep the existing explanatory durations and transform geometry. Change only the five migration transitions to the exact ease-in-out curve `cubic-bezier(0.77, 0, 0.175, 1)`:

```css
/* target */
.constraintCollar,
.engineerMarker {
  transition: transform 720ms cubic-bezier(0.77, 0, 0.175, 1);
}

.packet {
  transition: transform 580ms cubic-bezier(0.77, 0, 0.175, 1);
}

.constraint-story__intent-signal {
  transition: transform 480ms cubic-bezier(0.77, 0, 0.175, 1);
}

.delegation-loop__signal {
  transition: transform 600ms cubic-bezier(0.77, 0, 0.175, 1);
}
```

Do not combine the existing selectors merely to match this illustrative target; preserve their current placement and declarations.

## Repo conventions to follow

- This codebase uses CSS transitions for reversible, scroll-selected motion. Do not introduce keyframes, JavaScript animation, or a dependency.
- `components/interactive/blocks/certainty-phase-change/CertaintyPhaseChangeScrolly.module.css:11` already defines the canonical curve as `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`.
- `components/interactive/blocks/certainty-phase-change/CertaintyPhaseChangeScrolly.module.css:181` uses that curve for persistent particles moving between decision positions. Match its motion character while leaving these older components' durations intact.
- Do not add shared tokens in this plan. Motion-token consolidation is a separate, unselected audit finding.

## Steps

1. In `components/interactive/blocks/constraint-migration/ConstraintMigrationScrolly.module.css`, replace the easing curve on `.constraintCollar` and `.engineerMarker` with `cubic-bezier(0.77, 0, 0.175, 1)`. Keep both durations at `720ms`.
2. In `components/interactive/blocks/inner-loop-control/InnerLoopControlScrolly.module.css`, replace the easing curve on `.packet` with `cubic-bezier(0.77, 0, 0.175, 1)`. Keep the duration at `580ms`.
3. In `app/globals.css`, replace the easing curve on `.constraint-story__intent-signal` with `cubic-bezier(0.77, 0, 0.175, 1)`. Keep the duration at `480ms`.
4. In `app/globals.css`, replace the easing curve on `.delegation-loop__signal` with `cubic-bezier(0.77, 0, 0.175, 1)`. Keep the duration at `600ms`.
5. Search the four affected selectors and confirm that no transform, position, filter, duration, or reduced-motion declaration changed.

## Boundaries

- Do NOT modify any TSX or the way `activeIndex` determines positions.
- Do NOT change durations, transform values, filters, colors, SVG geometry, or reduced-motion rules.
- Do NOT alter entrance animations such as parcels, intent inputs, or labels; ease-out remains appropriate for those entrances.
- Do NOT add CSS variables or dependencies.
- If a step does not match commit `15ae331`, STOP and report the drift instead of improvising.

## Verification

- **Mechanical**: run `npm run lint`; it must exit successfully with no new warnings or errors. Run `rg -n "constraintCollar|engineerMarker|\.packet|constraint-story__intent-signal|delegation-loop__signal" components/interactive app/globals.css` and inspect the five target declarations; each must use `cubic-bezier(0.77, 0, 0.175, 1)` at its original duration.
- **Feel check**: run `npm run dev`, open content that renders `constraint-migration`, `inner-loop-control`, `constraint-descent`, and `delegation-loop-shift`, then scroll forward and backward across every step boundary. Confirm:
  - persistent markers visibly accelerate away from their old position and decelerate into the new one;
  - no marker jumps through most of its route at the beginning;
  - fast scroll reversals retarget smoothly from the current interpolated position;
  - the collar and engineer marker remain synchronized;
  - in the DevTools Animations panel at 10% playback speed, motion is symmetric enough to read as travel rather than entrance.
- Toggle `prefers-reduced-motion: reduce` and confirm the existing reduced-motion behavior is unchanged.
- **Done when**: all five migrations use the exact ease-in-out curve, retain their original durations and geometry, remain reversible, and lint passes.
