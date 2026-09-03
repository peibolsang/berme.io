# berme.io dark-theme brand guidelines

Status: canonical guidance for future UI work  
Last updated: 2026-09-01

## Purpose

The berme.io dark theme is the clearest expression of the site's visual identity. It should feel like a quiet editorial workspace after dark: thoughtful, precise, warm in small moments, and comfortable for sustained reading.

Use this document when creating or reviewing pages, components, data views, interactive stories, diagrams, and states for berme.io. Preserve the light theme, while treating the dark theme as the reference for brand decisions.

## Brand character

- **Editorial:** content carries the page. Interface chrome stays secondary.
- **Calm:** deep slate surfaces replace pure black and avoid harsh contrast jumps.
- **Precise:** hierarchy comes from type, spacing, alignment, and thin rules.
- **Warm:** amber marks the current state, progress, or a meaningful exception.
- **Technical when useful:** monospace supports data and instrument labels; it does not become the site-wide voice.

The signature element is an **amber thread through a midnight field**. Amber appears wherever the interface answers “where am I?” or “what is active?” Examples include reading progress, the selected tab, an active graph state, and a draft marker. It should never become ambient decoration.

## Design principles

### Let writing lead

Build the page around the title, argument, or collection. Decorative panels should be rare. A well-spaced list or text block is usually more appropriate than a dashboard card.

### Use depth sparingly

Create hierarchy with adjacent slate tones, a one-pixel border, and occasional transparency. Reserve strong shadows for floating overlays, menus, and modals. Content within the normal page flow should feel settled into the page.

### Spend color on meaning

Most screens should be almost entirely slate and zinc. Use amber for selection, progress, focus, draft status, or a visual concept that requires it. Red is reserved for errors and destructive states.

### Keep the interface quiet

Prefer one composed interaction over several small flourishes. Hover and focus states should clarify the interface without making content shift, bounce, or glow.

## Color system

These are the canonical dark-theme colors. Use the listed Tailwind utilities in application code and the hex values in custom CSS, SVG, charts, or generated assets.

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| `canvas` | `#0F172A` | `slate-900` | Root background, article header, standard dark surface |
| `canvas-deep` | `#020617` | `slate-950` | Modals, command surfaces, segmented-control wells, immersive graphics |
| `content-band` | `#1E293B` | `slate-800` | Long-form reading body, raised in-page regions, hover fill |
| `border` | `#334155` | `slate-700` | Dividers, outlines, field borders, quiet structure |
| `ink` | `#F4F4F5` | `zinc-100` | Headings, titles, primary links |
| `reading-ink` | `#E2E8F0` | `slate-200` | Root foreground and long-form prose |
| `body` | `#D4D4D8` | `zinc-300` | Component descriptions and supporting body copy |
| `muted` | `#A1A1AA` | `zinc-400` | Metadata, secondary actions, supporting labels |
| `quiet` | `#71717A` | `zinc-500` | Tertiary or redundant information only |
| `accent` | `#FCD34D` | `amber-300` | Active states, progress, selected controls, key diagram state |
| `accent-strong` | `#FBBF24` | `amber-400` | Small marks or emphasis that needs more saturation |

### Surface hierarchy

Use this order from broadest to most elevated:

1. Page canvas: `slate-900`
2. Reading or sectional band: `slate-800`
3. Standard panel: `slate-900` with a `slate-700` border
4. Deep or floating panel: `slate-950` with a `slate-700` border
5. Selected control: `amber-300` with `zinc-950` text

Transparency is part of the language. `slate-900/60`, `slate-950/70`, and `amber-300/10` are suitable for subtle layering. Keep the underlying solid token recognizable.

### Text contrast

- Use `zinc-100` for titles and essential links.
- Use `slate-200` for long-form reading copy.
- Use `zinc-300` for component descriptions and supporting body copy.
- Use `zinc-400` for readable secondary copy and metadata.
- `zinc-500` on `slate-900` has only about `3.69:1` contrast. Restrict it to nonessential, redundant labels and never use it for body copy, instructions, or the only indication of state.
- Amber text or marks on the dark canvas have strong contrast. When amber becomes a filled control, use `zinc-950` text.

### Accent discipline

Amber should answer a functional question:

- Which tab or filter is selected?
- How far through the article has the reader moved?
- Which step or node is active?
- Is this content a draft or special editorial state?

Avoid amber gradients, large amber backgrounds, decorative glows, and several competing amber objects on one screen. A thin line, dot, compact pill, or selected segment is usually enough.

## Typography

### Families

- **Editorial display:** Playfair Display, weight `600`. Use for detail-page titles only.
- **Interface and reading:** Geist Sans. Use for navigation, body copy, lists, metadata, controls, and most headings.
- **Utility and instruments:** Geist Mono. Use for diagrams, counters, code, technical labels, and compact data. Use it with restraint.

Do not introduce another font family without an explicit identity decision.

### Scale and roles

| Role | Recommended treatment |
| --- | --- |
| Detail-page title | Playfair Display, `text-4xl sm:text-6xl`, `font-semibold` |
| Special route hero | Geist Sans, `text-4xl sm:text-5xl`, `font-semibold`, `tracking-tight` |
| Site identity | Geist Sans, `text-2xl`, `font-semibold`, `tracking-tight` |
| Markdown `h1` | `text-3xl`, `font-semibold` |
| Markdown `h2` | `text-2xl`, `font-semibold` |
| Markdown `h3` | `text-xl`, `font-semibold` |
| Standard body | `text-base`, line height `1.65` |
| Detail reading body | `1.03rem`, line height `1.9` |
| Supporting copy | `text-sm`, `leading-relaxed` |
| Metadata | `text-xs`, `zinc-400` |
| Utility label | `10–12px`, `font-semibold`, uppercase, tracking `0.16–0.2em` |

Headings use approximately `-0.02em` letter spacing. Playfair titles keep their natural serif rhythm. Utility labels may use wider tracking because they function as compact signposts.

Uppercase belongs to short interface labels such as “Now,” “Links,” “Reading map,” and metadata categories. Avoid uppercase sentences and paragraph-length labels.

## Layout and spacing

The layout should read as an editorial composition with a narrow, stable measure.

- Standard content width: `max-w-2xl`.
- Expanded reading width: up to `50rem` on larger screens.
- Homepage shell: `max-w-5xl` with a `240px` identity rail and the content column.
- Page gutters: `px-6` by default.
- Page breathing room: commonly `py-16` on index pages and `pb-16` on reading pages.
- Long-form content may add a quiet reading-map rail at extra-large widths.

Use spacing before adding containers. Section gaps around `2.5rem` (`space-y-10`, `mt-10`) are common. Component interiors generally use `0.75–1.25rem` of padding.

On mobile, preserve the reading order and content width. Collapse secondary rails, allow tabs to scroll horizontally, and keep touch controls at least `36px` high, preferably `44px` when space allows.

## Shape, borders, and elevation

### Corners

- Pills, tags, toggles, and icon buttons: `rounded-full`
- Inputs, toolbars, empty states, and compact panels: `rounded-xl`
- Cards, dialogs, and substantial panels: `rounded-2xl`
- Immersive visual containers: `1.5–2rem` radius when the scale supports it
- Images inside prose: `0.75rem` radius

Rounded forms should feel soft and editorial. Avoid nesting several rounded rectangles unless each boundary represents a real layer or control.

### Borders

Use a one-pixel `slate-700` border as the default dark-theme boundary. Lower it to `70–80%` opacity for large or translucent surfaces. Dashed borders communicate temporary, draft, empty, or unresolved states; they are not decoration.

### Shadows

- In-flow content: no shadow or a barely visible shadow.
- Floating triggers and cards: `shadow-sm` to `shadow-md`.
- Menus, popovers, and dialogs: `shadow-xl` or `shadow-2xl`.

Dark surfaces gain most of their depth from tone and border, so avoid heavy luminous shadows.

## Components and interaction states

### Links

Primary links use `zinc-100` and move to white on hover. Secondary links use `zinc-400` and brighten to `zinc-100`. Inline article links are underlined with a comfortable underline offset. Color alone should never be the sole cue for an inline link.

### Buttons

Default buttons use a dark surface, `slate-700` border, and `zinc-200` text. Selected segmented controls use an amber fill with `zinc-950` text. Avoid oversized filled buttons unless the action is genuinely primary for the page.

### Tabs and segmented controls

Tabs use a bottom rule and quiet uppercase labels. The active tab receives an amber underline and `zinc-100` text. Segmented controls sit inside a `slate-950/70` pill; only the selected segment receives the amber fill.

### Cards and panels

Cards are for objects with a real boundary: a book, comment, dialog, graph, PDF viewer, or grouped editorial highlight. Lists of posts and views should generally remain open, using spacing and small metadata columns instead of one card per row.

### Empty, draft, and error states

- Empty state: `slate-800/60`, dashed `slate-700` border, `zinc-400` text.
- Draft state: dashed `amber-300/50` border, `amber-300/10` fill, `amber-200` text.
- Error state: muted red surface and border with readable red text; keep the message direct and actionable.

### Focus

Every interactive element needs a visible keyboard focus state. Use a two-pixel ring or border change with enough contrast against its immediate surface. Amber is appropriate for the current item; zinc or slate focus rings are suitable when amber would imply selection.

## Motion

Motion is occasional and functional. Use the shared strong ease-out curve:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

- Icon or state swap: `120–160ms`
- Highlight crossfade: `160ms`
- Panel reveal: `180–220ms`
- Diagram or scrollytelling state: usually `180–420ms`, based on distance and complexity

Animate opacity and small transforms. Keep exits symmetric, allow interactions to retarget while moving, and remove spatial movement under `prefers-reduced-motion: reduce`. A short opacity cue may remain so the state change is still legible.

Avoid perpetual ambient motion, hover lift on ordinary article rows, long page-load choreography, and animation that competes with reading.

## Imagery, diagrams, and data views

Visuals should feel like instruments or editorial figures rather than generic product dashboards.

- Place complex diagrams on a self-contained midnight panel when they need a stable internal palette.
- Keep labels legible in both themes. A permanently dark visual must define its own ink colors instead of inheriting page text.
- Use amber for the active route, signal, measure, or selected state.
- Use other hues only when the data model needs categorical separation. Explain their meaning with labels or a legend.
- Prefer direct labels, fine rules, restrained grids, and solid geometry over gradients and glow.
- Preserve the article's argument without JavaScript; motion should synchronize or clarify content that remains readable in static form.

## Theme behavior

The app uses a class-based dark theme. The `dark` class belongs on the root `<html>` element. Theme preference is stored under the `theme` local-storage key and falls back to `prefers-color-scheme` when no stored choice exists.

For a new component, define both light and dark treatments in the same class list. Start by making the dark version consistent with this guide, then map each role to its light equivalent.

```tsx
<section className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-700 dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-300">
  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
    Section title
  </h2>
  <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
    Supporting copy stays quieter than the title while remaining readable.
  </p>
</section>
```

## Voice inside the interface

UI copy is plain, specific, and compact.

- Name controls by the action or concept people recognize.
- Use sentence case for buttons, errors, empty states, and descriptions.
- Keep action names consistent through the interaction.
- State what happened and what the person can do next.
- Avoid promotional language, vague reassurance, and clever labels that hide meaning.

## Avoid

- Pure-black page backgrounds or pure-white body text across large areas
- Blue or purple as a default “tech” accent
- Large gradients, neon glows, glass effects, or decorative grain
- A card around every piece of content
- Thick borders and high-contrast dividers throughout a page
- Amber applied to passive decoration or ordinary body links
- Several font families, oversized utility labels, or monospace body copy
- Motion on every hover or scroll event
- Low-contrast `zinc-500` for essential content
- Theme-specific visuals that inherit an illegible text color in the other theme

## Agent implementation checklist

Before shipping a new UI, confirm that:

- [ ] The dark theme uses slate surfaces, zinc text, and amber only for meaningful emphasis.
- [ ] The content has a clear hierarchy without relying on cards or color alone.
- [ ] Reading copy uses `slate-200`; component copy uses `zinc-300` or `zinc-400`; essential text never relies on `zinc-500`.
- [ ] Titles and reading measures follow the existing type roles.
- [ ] Borders are one pixel and surfaces use the established radius scale.
- [ ] Hover, active, focus, disabled, empty, error, and loading states are designed.
- [ ] Keyboard focus is visible and color is not the only state cue.
- [ ] Motion is purposeful, brief, interruptible, and reduced-motion safe.
- [ ] The component works at mobile and desktop widths without horizontal overflow.
- [ ] Both light and dark themes were visually checked.

## Repository references

Treat these files as the implementation source of truth:

- `app/globals.css` — root tokens, typography, reading rhythm, shared easing
- `app/layout.tsx` — Geist font setup and global theme mounting
- `components/ThemeToggle.tsx` — theme preference and root-class behavior
- `components/AppMotion.module.css` — shared interface motion and reduced-motion handling
- `components/ReadingShell.tsx` — reading hierarchy and amber progress treatment
- `components/LandingViews.tsx` — tabs, lists, highlights, cards, and empty states
- `components/ui/` — reusable popover, menu, tab, command, and calendar patterns

When implementation and this document diverge, verify whether the code represents an intentional newer direction. Update both sources together once the change is accepted.
