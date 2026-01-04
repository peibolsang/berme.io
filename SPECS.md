
Below is a detailed implementation specification you can hand to a coding agent. It’s written to minimize ambiguity, define exact UI/UX behavior, and spell out data, state, and edge cases.

---

# Feature Spec: Label-based Filtering for Posts Index (Multi-select Chips)

## 1) Goal and Non-goals

### Goal

Add an interactive label (tag) filtering experience to the main posts index page (the page that currently lists all posts grouped by year and sorted newest → oldest). Users can:

* See all labels as “chips”
* Click one or more chips to filter the list to posts that contain **all** selected labels (AND semantics)
* See which remaining labels are still applicable to the currently filtered set (enabled) vs not applicable (disabled/greyed out)
* Toggle chips on/off to refine or broaden the filter
* Return to the full list by unselecting all chips

### Non-goals (explicitly out of scope)

* Creating/editing labels (labels already exist on posts)
* Server-side persistence of filter state (optional; can be added later)
* Complex query language, search, or fuzzy label matching
* Changing the year-grouping or date sorting rules beyond what filtering requires

---

## 2) Definitions and Data Model

### Post

You must investigate how GitHub API handles labels data structure for GitHub issues. Are they coming within the issue? is a separate API call needed because it's a different entity?

  * Labels are **user-defined**, not canonicalized by a central taxonomy.
  * A post may have zero labels.

### Label

A label is a string:

* Must be displayed exactly as stored (unless normalization rules are explicitly applied; see below).
* For filtering, labels must be compared in a consistent normalized form (case/whitespace handling), while displaying the original or a canonical display form.

#### Normalization rule (recommended, unless your existing system already enforces something else)

Define:

* `normalize(label) = label.trim().toLowerCase()`
* Deduplicate labels across posts using `normalize`.
* Display label in a consistent style:

  * Prefer first-seen original casing for display (store `displayName` alongside normalized key).
  * Example: first time you see `"Cloud"` => display `"Cloud"` for the `"cloud"` key.

This avoids “Cloud” and “cloud” appearing as separate chips.

---

## 3) Current Page Behavior (Baseline)

Main posts page currently shows:

* Posts grouped by year, spanning 2025 down to 2007 (range can grow).
* Year sections ordered descending by year.
* Inside a year: posts ordered by date descending (latest first).

This existing ordering **must remain** when filtering:

* Filtering removes posts but does not change sort/grouping rules.
* Years with zero posts after filtering should not be shown (see UX section).

---

## 4) User Experience Requirements

## 4.1 Chips bar

At top of the posts index page (above the list), show all labels as chips.

Chips have 3 states:

1. **Unselected & Enabled**

* Clickable
* Hover/focus styles
* Selecting it adds it to the active filter set

2. **Selected**

* Clickable
* Visually distinct (filled/outlined, checkmark, etc.)
* Clicking again unselects it (toggle off)

3. **Disabled (Greyed out)**

* Not clickable
* Indicates “no posts match if you add this label given current selections”
* Must have appropriate aria-disabled semantics

### Ordering of chips

Pick one, specify clearly for consistency:

**Recommended ordering**:

* Primary sort: alphabetical by displayName
* Optional enhancement: show counts and sort by count desc (but then keep stable ordering once selected)

For v1: alphabetical is simplest and stable.

### Chip counts (optional but recommended)

Show a count next to each label representing how many posts would be shown if:

* The label is **selected already**: count = number of posts matching current selected set (same for all selected chips, not very informative)
* The label is **unselected**: count = number of posts matching `selectedLabels ∪ {thisLabel}`

This is a very helpful affordance and is straightforward if you already compute applicability.

If you don’t want counts, skip entirely; do not half-implement.

---

## 5) Filtering Semantics (Critical)

### Selected labels behave as AND

A post is included if it contains **every** selected label.

Formally:

* `selected = set of normalized labels`
* For each post `p`, let `pLabels = set(normalize(p.labels))`
* `p` matches iff `selected ⊆ pLabels`

If `selected` is empty, all posts match (including posts with no labels).

### Disabled labels are computed based on “would adding this yield any results?”

A label chip (when not selected) is **enabled** if there exists at least one post that would match after selecting it in addition to current selection.

Formally, for a label `L` not currently selected:

* enabled iff `count(posts where (selected ∪ {L}) ⊆ pLabels) > 0`

A label chip that is already selected is never disabled.

### Posts with no labels

* When no labels are selected: these posts are visible (normal list).
* When at least one label is selected: these posts are excluded (they cannot match).

---

## 6) Visual Behavior of the Posts List

### When filters active

* Only show years that contain at least one matching post.
* Within each visible year, show only matching posts, still sorted by date desc.

### Empty result state

If the current selected set yields zero posts (ideally this can only happen if:

* You allow selecting disabled chips (you should not), or
* Labels change dynamically under you, or
* There’s a bug)

Still, you must handle it gracefully:

* Show an empty state message: “No posts match the selected labels.”
* Provide a “Clear filters” action that unselects all.

### Clear filters affordance

Include a clear action near chips:

* “Clear” button visible only when `selectedLabels.length > 0`
* Clicking clears all selections.

---

## 7) Interaction Details

### Click behavior

* Clicking an enabled unselected chip selects it.
* Clicking a selected chip unselects it.
* Clicking a disabled chip does nothing.

### Keyboard behavior / Accessibility

Chips must be keyboard navigable:

* Tab moves focus across interactive chips
* Enter/Space toggles selection for enabled chips
* Disabled chips are either skipped in tab order or focusable but aria-disabled; preferred: not focusable
* Provide aria-pressed for toggle chips or use `role="switch"`/`button` semantics consistently.

### Focus/aria

* Each chip: `button` with `aria-pressed={selected}`
* Disabled: `disabled` attribute or `aria-disabled=true` + remove from tab order.

---

## 8) State Management and Derived Data

## 8.1 State (source of truth)

* `selectedLabels: string[]` (store normalized keys)
* Optional: `selectedDisplayLabels` not required if you map keys to displayName.

## 8.2 Derived data

From full posts dataset, derive:

* `allLabels: { key: string; displayName: string }[]`
* `matchingPosts: Post[]` computed from `selectedLabels`
* `enabledLabelKeys: Set<string>` computed from the “would adding yield results” rule

### Efficient computation approach (recommended)

Precompute an inverted index:

* `labelToPostIds: Map<labelKey, Set<postId>>`
* Also a map `postIdToLabelKeys: Map<postId, Set<labelKey>>` or just store on post.

Then:

* To compute `matchingPosts` for selected set:

  * If no selection: all posts
  * Else intersect post sets for each selected label:

    * `candidateIds = intersect(labelToPostIds[label]...)`
  * Map back to posts.

* To compute enabled/disabled for each label:

  * For each label L not selected:

    * `count(intersect(candidateIds, labelToPostIds[L])) > 0`
  * Where `candidateIds` is:

    * If no selected labels: all post IDs
    * Else intersection result for current selected set

This makes the UI responsive even with many posts.

### Avoid O(N_labels * N_posts) brute force

Do not repeatedly scan all posts for each label if the dataset is large. Use set intersections.

---

## 9) URL / Persistence (Optional but strongly recommended)

If you want shareable filtered views and back/forward support:

### Query param format

* `?labels=cloud,frontend` using normalized keys
* On load:

  * Parse labels param
  * Filter out unknown labels (not in `allLabels`)
  * Initialize `selectedLabels`
* On selection change:

  * Update URL with shallow routing (Next.js) without full reload

If out of scope, skip. But implement internal state so this can be added later.

---

## 10) UI Placement and Layout

* Chips bar at top of page, before the year-grouped list.
* Chips wrap to multiple lines.
* The list of years remains the primary content.
* When filters are active, show a subtle “Filtered by: X labels” or similar, plus “Clear”.

---

## 11) Edge Cases & Rules

1. **Duplicate labels on a post**

* Normalize + dedupe per post.

2. **Labels with leading/trailing spaces**

* `trim()` during normalization.

3. **Labels with different casing**

* Lowercase keys via normalization.

4. **Posts with missing/undefined labels field**

* Treat as empty array.

5. **Very large label sets**

* Chips bar must wrap; optionally add “Show more” later, but not required in v1.

6. **Dynamic data updates**
   If posts list can change at runtime (revalidation, live updates):

* Recompute `allLabels`, indices, and derived states.
* Ensure selected labels that no longer exist are removed from selection (or kept but disabled + show empty state). Recommended: remove and update URL accordingly.

---

## 12) Acceptance Criteria (Testable)

### Rendering

* [ ] Chips show every distinct label across all posts (after normalization).
* [ ] Posts list remains grouped by year and sorted desc as before.

### Filtering

* [ ] Selecting one label shows only posts containing that label.
* [ ] Selecting multiple labels shows only posts containing **all** selected labels.
* [ ] Posts with no labels disappear as soon as any label is selected.

### Chips state

* [ ] Selected labels are visually distinct and togglable.
* [ ] Unselected labels that would yield zero results if added are disabled/greyed out and non-clickable.
* [ ] Unselecting a label updates:

  * Matching posts
  * Enabled/disabled state of all other labels
  * Year sections displayed

### Clear

* [ ] “Clear filters” appears when at least one label is selected.
* [ ] Clicking it restores full list and all chips enabled (except those that are inherently absent—should not exist).

### Accessibility

* [ ] Chips are keyboard accessible with correct aria semantics.
* [ ] Disabled chips are not focusable (preferred) and communicate disabled state to screen readers.

### Optional URL persistence (if implemented)

* [ ] Refresh preserves selection via query param.
* [ ] Back/forward updates selection accordingly.

---

## 13) Implementation Notes (Framework-agnostic but Next.js-friendly)

### Suggested component structure

* `PostsIndexPage`

  * `LabelsFilterBar`

    * receives `allLabels`, `selectedLabels`, `enabledLabelKeys`, `onToggle(labelKey)`, `onClear()`
  * `YearGroupedPostsList`

    * receives `matchingPosts` and groups/sorts them

### Pure functions (easy to unit test)

* `normalizeLabel(label: string): string`
* `extractAllLabels(posts): LabelMeta[]`
* `buildLabelIndex(posts): { labelToPostIds, postIdToPost }`
* `computeCandidateIds(selectedLabels, labelToPostIds, allPostIds): Set<string>`
* `computeEnabledLabels(selectedLabels, candidateIds, labelToPostIds): Set<string>`
* `filterAndGroupPosts(candidateIds, postIdToPost): Map<year, Post[]>`

Unit tests should cover:

* normalization
* AND filtering correctness
* enabled/disabled label correctness
* posts with no labels behavior

---

## 14) QA Scenarios (Concrete Examples)

Using your example:

* Post A labels: [frontend, cloud]
* Post B labels: [economics, cloud]

Initial:

* Selected: []
* Visible posts: A, B
* Chips enabled: frontend, cloud, economics

Select `cloud`:

* Visible posts: A, B
* Chips enabled: frontend, economics (because adding either still yields results)
* Chips disabled: any other label not in A or B (if present globally)

Select `frontend` (with cloud already selected):

* Selected: [cloud, frontend]
* Visible posts: A only
* Chip `economics` disabled (because no post has all 3)
* Chip `cloud` and `frontend` selected

Unselect `frontend`:

* Back to [cloud] state
* Both posts visible again
* economics enabled again

Clear:

* All posts visible, all chips enabled

---

If you want, I can also produce:

* A “developer handoff” section with exact TypeScript types and pseudo-code for the set-intersection approach, or
* A Next.js-specific routing plan (App Router vs Pages Router) with query param sync and memoization strategy.
