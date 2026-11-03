# Review Progress & Evidence — Design Brief

**Status:** planned, not implemented
**Source:** an Impeccable `shape` pass, following the design critique of the single screen
**Addresses:** critique Priority Issue **P1** — "The interface never says where the review stands"

## Problem

Mid-review, a reviewer cannot tell how far the review has come or which criterion the
current question is grading. The nine-criterion list is a static inventory: a criterion
moves from Pending to a graded state with no indication of which question produced it, and
the recorded evidence only appears in the final report. The reviewer has to hold the
conversation and the instrument in their head at once.

## Job and audience

A hiring reviewer watching the tool work, or an ishlabs engineer running a real review.
Both are mid-session with their attention on the conversation, and neither should have to
scroll or remember to understand the current state. Operate surface, carrying the usual
showcase burden.

## Outcome and proof

At any moment the reviewer can answer two questions without scrolling:

1. How far along is this review?
2. What is being assessed right now?

When the review completes, that state resolves into the readiness report that already
exists. This brief adds no new output — only shorter-range visibility of the same data.

## Direction

Extend the existing composition. No new surface, route, or panel.

- **A progress line in the Conversation panel** — `Assessing 4 of 9 · Tool grounding &
  evidence capture` — under the panel heading, above the transcript. Sourced from the
  assessment store (evaluated count plus the criterion most recently graded), never parsed
  from transcript text, so it stays correct when the agent's phrasing changes.
- **Expandable readiness rows** — a graded row opens to show the evidence recorded for it
  and the trace event that produced it. An ungraded row does not expand.
- **Reuse, not reinvention** — the report already carries the same evidence; a row is that
  data at a shorter range, read from the assessment and trace stores.

## Scope and boundaries

In-world refinement of the existing single screen.

- Both layouts: the `xl` two-column stage-and-rail, and the stacked layout below `xl`.
- No new route, no persistence path, and no change to how the agent is prompted.
- No new visual world; colour and type follow [`docs/DESIGN.md`](./DESIGN.md).
- Tracked separately, so out of scope here: timestamps on transcript entries, and
  virtualising the trace list.

## States and ranges

| State | Behaviour |
|---|---|
| Nothing assessed | `Not started · 0 of 9`, or the line is hidden |
| Mid-review | `Assessing N of 9 · <criterion>` |
| All nine assessed | `All 9 assessed` until the report takes the stage |
| Sample vs live | The existing **Sample session** labelling still applies |
| A criterion regraded | The line follows the most recent update; a row's evidence replaces rather than appends |

## Interaction and layout

- The progress line updates as tool calls fire; it never animates or competes with the
  transcript for attention.
- A row header is a real `button` with `aria-expanded` and `aria-controls`; activating it
  leaves focus on the header.
- Expansion grows *inside* the list's scroll box, so the panel height does not jump.
- Evidence text needs a comfortable measure and must survive the widest real content in a
  rail that is only 299–339px wide at `xl`.
- Long criterion names and long evidence wrap rather than truncate.

## Constraints and open decisions

Binding:

- The progress line and the row evidence read from the assessment and trace stores. No new
  write path, and no changes to the tool handlers.
- The disclosure must work keyboard-only and announce its state.
- Every new state indicator follows the existing rule: never colour alone, always paired
  with an icon or a label.

Open for the implementation to settle:

- Whether the progress line names the criterion in the agent's words or the canonical name
  from `lib/criteria.ts`. The canonical name is recommended — it matches the row and the
  report.
- Whether one row or several may be open at once. One is recommended, to keep the list's
  height stable.

## Verification

- A full sample session shows the counter advance `0 → 9` and the criterion name track the
  question being asked.
- Toggling a graded row with the keyboard reveals its evidence and keeps focus on the header.
- The panel does not change height when a row is opened, at `xl` and stacked.
- `pnpm test`, `pnpm build`, and the Impeccable detector stay clean.
