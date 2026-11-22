---
name: design-flow
description: Use before writing code for any feature that has screens or a multi-step user flow (sign-up, onboarding, checkout, settings, a wizard, error and retry paths), or when the user asks for a UX flow, user flow or flow chart. Draws every screen and arrow on an infinite canvas in the browser; the user comments on it and approves before you code.
---

# Design Flow

Before you write code for a feature with screens, write its UX flow as `.design-flow/<feature>/flow.yaml`, open it on the canvas, and wait for the user's approval. The canvas shows every screen, branch, error and way back; the user comments on it, and you change the spec until they approve.

## The command

Every command below is this skill's own launcher. Resolve `scripts/design-flow.mjs` relative to this file's directory to an absolute path and run it with Node 20+; nothing needs installing. In this document `design-flow` means:

```bash
node <this skill's directory>/scripts/design-flow.mjs
```

Run it from the project root (or pass `--project-dir <path>`). One local server on port 27420 serves every project; `open` starts it when needed.

## Workflow

1. Pick a feature name: lowercase letters, digits, hyphens (`checkout`, `sign-up`).
2. Run `design-flow open <feature>`. It creates a commented template if the file is missing, starts the local server, opens the browser and prints the canvas URL and the check result.
3. Start `design-flow watch` as a **background** task (your harness's background shell or monitor). It prints one `[design-flow]` line per new comment or approval, so feedback reaches you without the user typing it. If you cannot run background tasks, run `design-flow comments <feature> --unread` whenever the user says they commented.
4. Write `flow.yaml` (the map: lanes, screens, arrows) and `prototype.html` (the screens themselves, as one working page). References below. Draw **every** screen, every branch, every error and interruption, and every way back. A missing line is the most common review comment.
5. Run `design-flow check <feature>`. It checks both files against each other. Fix every issue it prints (file:line:col and a fix). The canvas keeps showing the last valid version while the file is broken.
6. Tell the user, in one line, that the canvas is ready, with the URL `open` printed, and that they can press **C** to comment and **Approve** when it is right. Then wait.
7. For each comment:
   - run `design-flow comments <feature>` to read the thread and where it is anchored,
   - change `flow.yaml`, run `check`,
   - `design-flow reply <feature> <thread> --text "<what you changed>"`,
   - `design-flow resolve <feature> <thread>` when it is settled.
8. **Do not write code for this feature until `design-flow status <feature>` prints `approved`.** Approval arrives as a `[design-flow] … APPROVED` line. Changing `flow.yaml` after approval makes it `stale`; ask for approval again.
9. Build from the approved flow. Screen ids (`P03`) are the names to use when you talk about screens.

Do not edit `layout.json`, `comments.json`, `approval.json` or `.last-valid.yaml`; the tool owns them. Approval covers `flow.yaml` and `prototype.html` together: changing either makes it `stale`.

## prototype.html

Write the screens as **one interactive page** next to `flow.yaml`: `.design-flow/<feature>/prototype.html`. The canvas shows each screen's section in its own frame; **Play** (top right of the canvas) runs the whole page as a clickable demo, so the user can walk the flow before any code exists.

```html
<!doctype html>
<html>
<head>
  <style> /* your product's styles: tokens, components, type */ </style>
  <script> window.app = { email: "" }; /* state shared by every screen */ </script>
</head>
<body>
  <section data-screen="W00">
    <h1>Notes that keep up with you</h1>
    <button class="btn main" data-id="create" data-to="S01">Create account</button>
  </section>
  <section data-screen="S01">
    <a data-back>‹ Back</a>
    <input data-id="email" placeholder="you@example.com">
    <button class="btn main" data-id="continue" data-to="S02">Continue</button>
  </section>
  <!-- one <section data-screen="ID"> per screen in flow.yaml -->
</body>
</html>
```

- One `<section data-screen="ID">` per screen, with the ids from `flow.yaml`. Play shows one at a time, full height of the viewport, so give sections `height: 100vh` if they lay out as a column.
- `data-to="ID"` on anything the user taps to go to another screen; `data-back` goes to the screen before. Play follows them; scripts in `<head>` keep state across screens.
- Every `data-to` needs an arrow in `flow.yaml` (`check` lists the ones missing), and every arrow you draw should have something that triggers it.
- A screen can still use `html:` or `file:` in `flow.yaml` instead; it then has no section here.

## flow.yaml reference

`flow.yaml` is the map: lanes, screens with titles and notes, and the arrows between them. Each screen is **HTML you write in the product's own style**: its colors, type, components and copy, in `prototype.html` (above) or inline here with `html:`. The canvas draws it inside a sandboxed frame at the screen's viewport size; it does not impose a design system. Shared styles go in `prototype.html`'s `<head>`, or in `style` once.

```yaml
version: 1
title: Checkout
subtitle: Cashier tablet · portrait
viewport: { width: 360, height: 720 } # CSS px of one screen; any screen can override it
style: | # placed in every screen's <head>; inline only (no network)
  <style>
    body { margin: 0; font: 15px system-ui; color: #17352c; }
    .btn { padding: 14px; border-radius: 999px; border: 0; }
    .btn.pay { background: #346cc4; color: #fff; }
  </style>
lanes: # rows, top to bottom
  - id: checkout
    title: Checkout
    tone: info # success | info | danger | neutral: colors the lane and its arrows on the canvas
  - id: errors
    title: Errors and interruptions
    tone: danger
    enter: any # reachable from any step: no edges needed into it; screens tile left to right
    note: One line shown at the bottom of the lane
screens:
  - id: H00 # unique; shown as the screen's number
    title: Home # no lane: the entry column on the far left
    html: |
      <h1>Welcome</h1>
      <button class="btn pay" data-id="charge">Charge</button>
  - id: P01
    lane: checkout
    title: Enter amount
    file: screens/p01.html # or keep the HTML in a file next to flow.yaml
  - id: X04
    lane: errors
    title: Timed out
    badges: [home] # home (↩ Home) | video (▶ animated page) | timer (countdown)
    note: No valid input in 60 s → retry
    html: <h1>Timed out</h1><p>Back to Home in 5 s</p>
edges:
  - { from: H00, to: P01, label: Charge } # label = the user's action or the trigger
  - { from: P01, to: X04, label: Timeout, kind: error } # error: red
  - { from: X04, to: H00, kind: back } # back: dashed, ignored by layout
notes:
  - Global rules: idle timeouts, footers, locale, anything true of every screen.
```

Screen HTML rules:

- Draw the real screen at the viewport size: real copy, real states (empty, loading, error), the one primary action. Use the project's existing design system, tokens and component styles when it has them; otherwise choose a style and keep it consistent across screens.
- Frames are sandboxed: scripts run, but there is no network, no `fetch`, no external fonts or images. Inline images as `data:` URLs or draw placeholders in CSS.
- Put `data-id="…"` on the elements people will talk about (buttons, fields, list items). Comments on them are anchored by that id, so they survive edits; without it they anchor by position.
- A comment on an element arrives as `Screen P02 Choose payment · button "Bank card" ([data-id="card"])`.

Layout is automatic: lanes are rows, the flow runs left to right, branches of one step stack in one column. Never compute coordinates; the user drags frames when they want.

## Commands

| Command | Does |
| --- | --- |
| `design-flow open <feature> [--no-open]` | Start server, create template, open canvas |
| `design-flow check <feature>` | Validate; exit 0 clean, 3 issues |
| `design-flow comments <feature> [--unread] [--json]` | Threads with anchors; marks them delivered |
| `design-flow reply <feature> <thread> --text "…"` | Reply as the agent |
| `design-flow resolve <feature> <thread>` | Resolve a thread |
| `design-flow status <feature>` | `draft`, `approved` or `stale`, and open threads |
| `design-flow list` | Features in this project |
