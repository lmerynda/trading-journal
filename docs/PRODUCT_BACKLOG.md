# Product Backlog

This document captures promising product directions beyond the current public trade library and private authoring experience. It is an idea backlog, not a delivery commitment. Features should be selected according to the product invariants in [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md).

The strongest additions make old reviews easier to find, lessons easier to reuse, and trading decisions easier to explain. The application should not become a generic statistics dashboard or attempt to replace charting and broker platforms.

## Recommended sequence

1. Previous and next navigation within filtered results.
2. Visible autosave status in the editor.
3. Structured trade-review notes.
4. Daily review pages and the supporting domain model.
5. Controlled tag families.
6. Lessons index and weekly review workflows.

This sequence improves the existing experience first, then moves the product toward its intended day-centered structure.

## High-value next features

### Previous and next filtered navigation

Add previous and next controls to public trade pages. Navigation should respect the active search query so a reader reviewing `tag:breakout`, a date range, or a text search moves only through matching trades.

### Daily review pages

Introduce stable pages such as `/days/2026-07-25` that combine all trades from one session with:

- Shared market and session context.
- A daily thesis.
- Trades in execution order.
- A daily summary and final lesson.

This is the natural evolution of grouping sidebar trades by date. It should eventually use the planned `DailyReview` domain record rather than treating a date group as the record itself.

### Structured trade-review notes

Replace or supplement the single notes field with focused prompts:

- Thesis.
- Entry trigger.
- Invalidation.
- Management plan.
- Actual management.
- Exit reason.
- Outcome.
- Lesson.

Structured notes should make reviews more consistent and comparable without preventing free-form context.

### Tag families

Organize controlled tags into the families anticipated by the product plan:

- Setup.
- Context.
- Execution.
- Psychology.

The homepage could group tag filters by family once the tag library becomes too large for one flat list.

### Related reviews

At the end of a trade, show a small set of related reviews based on shared tags, direction, or nearby dates. Keep the relationship deterministic and visible, for example, "More trades tagged `failed-breakout`."

## Authoring improvements

### Draft and complete status

Allow unfinished reviews to be marked as drafts. Public pages should visibly identify draft reviews rather than implying that incomplete material is final.

### Autosave status

The editor currently saves silently. Show a restrained status such as:

```text
Saving...
Saved 14:32
Save failed
```

This should distinguish local optimistic updates from confirmed persistence and provide a clear retry path after failure.

### Screenshot ordering and primary images

Support drag-and-drop ordering within entry-context and outcome sections. Allow one image in each role to be designated as primary without deleting previous uploads.

### Screenshot captions

Add optional captions explaining what the reader should notice. Captions should supplement annotations on the chart rather than duplicate them.

### Duplicate a trade

Create a new review using another trade's tags and note structure while leaving images, dates, and outcome-specific content empty.

## Search and navigation

### Search suggestions

When a reader types `tag:`, suggest available tags. Also suggest supported operators such as `date:`, `from:`, and `to:` without obscuring the plain query field.

### Saved searches

Allow useful filters to be named, for example:

- Opening range failures.
- Short psychology mistakes.
- Recent breakout trades.

A first version could remain browser-local and require no database changes.

### Shareable filtered views

The query is already URL-backed. Add a copy-link control and useful page metadata so filtered library views are easy to share.

### Search-result highlighting

Highlight matching words in titles and notes. A short matching note excerpt in the sidebar could explain why a review appears in the results.

### Keyboard navigation

Support `/` to focus search, arrow keys to move through results, and Enter to open the selected review. Keyboard navigation should respect date groups and active filters.

## Review and learning workflows

### Lessons index

Create a page containing extracted lessons linked back to their source trades. Reuse the existing tag, text, and date-range filtering model.

### Recurring mistake tracking

Use controlled execution and psychology tags to show simple occurrence counts over a selected period. Do not present profitability or performance conclusions until their inputs are reliable.

### Weekly review

Build a weekly workspace from existing daily and trade reviews:

- Trades taken.
- Active trading days.
- Common tags.
- Repeated lessons.
- Links to each reviewed day.

The summary should remain primarily qualitative unless dependable execution data supports calculated facts.

### Review resurfacing

Surface reviews from one month, three months, or one year ago through "Review again" or "On this date" prompts. The goal is deliberate recall, not engagement mechanics.

## Public experience

### Per-review metadata

Add trade-specific titles, descriptions, Open Graph previews, and canonical URLs so public links are useful in search results and when shared.

### Optional image-first sidebar

Offer a compact mode with a small primary entry-context thumbnail for each trade. This should remain optional because thumbnails increase sidebar density and network usage.

## Constraints

- Daily review remains the intended primary record.
- Entry-context and outcome material must stay visibly distinct.
- Calculated facts and human judgment must remain distinguishable.
- Statistics are shown only when their inputs and meanings are dependable.
- Reading stays public; authoring remains owner-only.
- Every public day and trade should have a stable, content-complete URL.
- Features should improve explanation, recall, comparison, or review quality.
- Avoid social feeds, leaderboards, engagement mechanics, and loosely useful dashboard metrics.
