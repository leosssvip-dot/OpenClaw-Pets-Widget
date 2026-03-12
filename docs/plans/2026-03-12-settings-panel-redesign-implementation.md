# OpenClaw Widget Settings Panel Redesign – Implementation

## Scope

- Simplify the in-panel settings experience behind the `More settings` entry in `WidgetPanel`.
- Keep the existing three logical groups (Display, Characters, Connection) but reduce visual noise and extra explanatory chrome.
- Preserve responsive behavior so the drawer works from narrow widths up to the existing max panel width.
- Target: 简洁风格、自适应宽度 (minimal style, adaptive width).

## Implementation Notes

- **Markup (WidgetPanel.tsx)**:
  - Drawer wrapped in `<aside class="settings-drawer">` with `aria-label="Panel settings"`.
  - Header: `settings-drawer__header` with title "Settings" and subtitle "Display · Characters · Connection".
  - Body: `settings-drawer__body drawer` containing the three `drawer-group` sections.
  - Shortened copy: "How companions appear.", "Favorite on stage.", "Not connected.", "SSH host, user, token."
  - `legend` and inline labels for Display/Pinned/Character use `visually-hidden` where appropriate; `aria-label` on controls kept for a11y and tests.
- **Styles (styles.css)**:
  - Added `.visually-hidden` utility for screen-reader-only text.
  - Layout: `widget-layout--with-drawer` uses `minmax(220px, 300px)` for drawer column (adaptive width).
  - New `.settings-drawer`, `.settings-drawer__header`, `.settings-drawer__title`, `.settings-drawer__subtitle`, `.settings-drawer__body` for minimal header and flex layout.
  - `.drawer`: lighter card (white 92%, subtle border, smaller shadow), 16px radius, 14px padding.
  - `.drawer-group`: lighter background, 12px radius, smaller section title (10px uppercase), reduced padding/gaps.
  - `.drawer-row` / `.drawer-copy`: tighter spacing and smaller secondary text (10px).
  - `.drawer-character-item`: 10px radius, light border, less padding.
- Core labels and `aria-label`/role contracts unchanged; existing tests (e.g. `getByLabelText('Pinned agent')`) pass.
- Media query at 920px unchanged: drawer stacks below main content (`grid-template-columns: 1fr`), full width on narrow viewports.

## 2026-03-12 Redesign (Stitch MCP + code)

- **Stitch**: Created project "OpenClaw Desktop Pet Settings Panel", generated one screen from text prompt (Display / Characters / Connection sections, responsive sidebar). Design reference: dark theme, compact sections, same options.
- **Markup**: Replaced `drawer` / `drawer-group` / `drawer-row` with `settings-section`, `settings-section__content`, `settings-row`, `settings-row__label`, `settings-row__control`. Display mode uses `settings-display-mode` fieldset; Connection uses `settings-btn` (primary / secondary / ghost). Character list uses `settings-character-list`, `settings-character-item`, `settings-character-item__info`, `settings-character-item__select`. Gateway block in `settings-section__extra`.
- **Styles**: New BEM-style classes under `.settings-drawer__body`. Section blocks with light background and border; rows with flex-wrap and `min-width: 0` for adaptive width. `@media (max-width: 320px)` for character items to stack (single column). Buttons: `settings-btn--primary` (Add gateway), `settings-btn--secondary` (Reconnect), `settings-btn--ghost` (Edit/Hide).
- **Behavior**: All existing props and handlers unchanged; tests (App, AgentBindings, GatewayProfiles) pass.

## 2026-03-12 Narrow Storybook Variant (Stitch only)

- User clarified updated design goals:
  - narrow settings drawer
  - width feeling around `250-280px`
  - pure white / near-white palette
  - storybook card tone instead of generic system settings
  - restrained pet hint in the header
  - calm, cute, quiet, not technical
- A new Stitch project was created:
  - `OpenClaw Narrow Storybook Settings Panel`
- Stitch generated 2 variants:
  - `Variant 1`
    - visually closer to `280px`
    - small silhouette-stamp header
    - stacked soft cards
    - slightly warmer / booklet-like
  - `Variant 2`
    - visually closer to `250px`
    - purer white background
    - circular pet vignette header
    - cleaner and quieter overall
- Both variants keep the same real structure:
  - `Display`
  - `Characters`
  - `Connection`
- Current likely best direction:
  - `Variant 2` if prioritizing narrowness and calmness
  - `Variant 1` if prioritizing slightly stronger storybook personality

## 2026-03-12 Variant 1 State Package (Stitch only)

- User selected:
  - `Variant 1`
  - and requested both:
    - default state
    - connection expanded state
- A new Stitch refinement pass generated 2 explicit screens for the same drawer direction:
  - `OpenClaw Settings: Default State`
  - `OpenClaw Settings: Connection Expanded`
- Shared properties of both screens:
  - narrow drawer feeling around `280px`
  - small storybook-style header
  - restrained pet hint
  - same three cards:
    - `Display`
    - `Characters`
    - `Connection`
  - soft white / off-white palette
  - rounded, lightly outlined paper-card treatment
- Expanded-state behavior in Stitch:
  - `Connection` card opens into a soft inset card
  - inset area contains lightweight SSH editing fields
  - upper sections remain visually stable
- Current purpose:
  - use these two screens as the design reference before any further code implementation

## 2026-03-12 Variant 1 Implemented In Code

- The chosen direction (`Variant 1`) has now been applied to the live widget settings drawer.
- **Markup changes**:
  - added a restrained pet-hint masthead to the drawer header
  - subtitle adjusted to `Display · Companions · Connection`
  - wrapped `Characters` rows inside the same soft card container style as the other sections
  - added a bookmark accent element for each character row
- **Style changes**:
  - drawer column tightened to `250-280px`
  - drawer itself capped to `280px` and visually aligned as a narrow side booklet
  - cards updated to lighter paper-like white / off-white surfaces
  - segmented control and buttons softened toward a booklet / tactile card feel
  - character rows updated from generic list rows to bookmark-like mini cards
- **Test coverage**:
  - added an assertion for the new pet-hint header element in `App.test.tsx`
  - verified with:
    - targeted `src/App.test.tsx`
    - full `pnpm --filter macos-shell test`

## 2026-03-12 Extended Variant 1 Package (Stitch only)

- User pointed out that the design package still missed:
  - `Agent` selection
  - and previously also lacked fuller connection management coverage
- User chose:
  - `Agent` should be moved into the settings drawer
  - rendered as a `dropdown`
  - placed as a new dedicated top card
- A new Stitch pass generated a 3-screen extended package:
  - `Settings: Default with Agent Card`
  - `Settings: SSH Connection Form`
  - `Settings: Gateway Management List`
- This pass now explicitly includes:
  - a dedicated `Agent` card at the top
  - a fuller `Connection` expanded form state
  - a separate gateway management/list state
- Important accuracy note:
  - the Stitch form state is now much closer to the real current settings
  - but based on the returned summary, it still appears to emphasize:
    - `Host`
    - `User`
    - `SSH Port`
    - `Identity File`
    - `Password`
  - and does **not yet clearly prove** that `Gateway Port` and `Gateway Token` are fully represented in the UI draft
- Current status:
  - `Agent` is now designed into the drawer package
  - the design package is substantially more complete
  - but if the goal is exact 1:1 coverage of every current settings field, one more Stitch refinement may still be needed for the full connection form

## 2026-03-12 Connection Completion Addendum (Stitch only)

- User requested one more Stitch pass specifically to fully cover the real `Connection` settings.
- A final addendum package was generated with 3 connection-focused screens:
  - `Settings: Comprehensive SSH Form`
  - `Settings: Gateway Profile Management`
  - `Settings: Delete Profile Confirmation`
- This pass explicitly covers the full current SSH form field set:
  - `Remote Host`
  - `SSH User`
  - `SSH Port`
  - `Identity File`
  - `SSH Password`
  - `Gateway Port`
  - `Gateway Token`
- This pass also explicitly covers the management states:
  - saved gateway profiles list
  - active profile indication
  - add new gateway action
  - edit action
  - delete action
  - confirm / cancel delete state
- Updated coverage conclusion:
  - `Agent` / `Display` / `Characters` / `Connection` are now all represented in the Stitch design package
  - `Connection` is now substantially aligned with the real current settings scope
  - if needed later, remaining refinements should be interaction polish rather than missing information architecture

## 2026-03-12 Agent Card Implemented In Code

- A dedicated `Agent` card has now been added to the live settings drawer implementation.
- Implementation details:
  - new top-level `Agent` section inserted before `Display`
  - uses a full-width `Current agent` dropdown
  - reuses existing panel logic by switching to `pinned` mode and updating `pinnedAgentId`
  - helper copy reflects the currently focused companion and status when available
  - drawer subtitle updated to `Agent · Display · Companions · Connection`
- Test coverage:
  - `App.test.tsx` now asserts:
    - `Agent` heading exists
    - `Current agent` control exists
  - verified with:
    - targeted `src/App.test.tsx`
    - full `pnpm --filter macos-shell test`

## 2026-03-12 Connection Implementation Progress

- The live drawer now moves closer to the complete Stitch `Connection` package, not just the earlier lightweight placeholder.
- **Behavior / coverage improvements**:
  - integration test now verifies the settings drawer can reach the fuller management flow:
    - open `Connection`
    - click `Edit`
    - see `Gateway management`
    - click `Connect Remote`
    - see `Gateway Port`
    - see `Gateway Token`
- **Markup improvements**:
  - `GatewayProfiles` heading updated from generic `Gateways` to `Gateway management`
  - helper copy added so the management area reads like part of the drawer rather than a reused admin block
- **Style improvements**:
  - gateway management area now uses lighter paper-card surfaces
  - SSH form fields are visually softened to match the drawer
  - saved gateway profile rows are calmer and more card-like
  - edit / delete / connect actions now better match the narrow storybook drawer tone
- Verification:
  - `ReadLints` clean
  - targeted `src/App.test.tsx` passed
  - full `pnpm --filter macos-shell test` passed

## 2026-03-12 Unified Panel Restructure Implemented

- User clarified the previous drawer-based implementation was fundamentally the wrong surface:
  - the full visible panel should match the redesign
  - not a legacy main panel plus a separate `More settings` layer
- The live implementation now uses a single unified panel layout in `WidgetPanel`:
  - removed `More settings`
  - removed quick-switch buttons for `Switch agent` / `Switch character`
  - kept the lightweight companion summary at the top
  - kept `Quick prompt` in the main visual flow
  - moved `Agent` / `Display` / `Characters` / `Connection` directly into the same panel
- Settings behavior is now organized as inline collapsible cards:
  - `Agent` is expanded by default
  - `Display`, `Characters`, and `Connection` start collapsed
  - opening a section happens in-place instead of opening a second visual layer
  - the empty-state `Connect gateway` action now expands `Connection` directly
- Visual consolidation in `styles.css`:
  - narrowed the overall panel shell to a compact storybook-card width
  - reused the existing soft white / paper-like palette across the whole panel
  - added section toggle styling so collapsed and expanded states feel like one system
  - tightened the companion summary card so the top area reads as lightweight context, not the old primary layout
- Test coverage updated for the new behavior:
  - `App.test.tsx` now asserts unified-panel expectations instead of drawer-triggered expectations
  - verifies absence of `More settings`, `Switch agent`, `Switch character`
  - verifies `Agent` default expanded and `Display` collapsible interaction
  - verifies `Connection` can still reveal gateway management and the full SSH fields
- Verification:
  - `ReadLints` clean for edited files
  - `pnpm --filter macos-shell test -- --run src/App.test.tsx` passed

## 2026-03-12 Adaptive Width Follow-up

- User reported the unified settings panel still felt visually clipped on the right side:
  - the issue was not content alignment
  - the issue was incomplete visible width / overflow behavior in narrow panel space
- The follow-up fix focused on adaptive layout safety rather than changing the information architecture:
  - added global `box-sizing: border-box` inheritance so `width: 100%` controls no longer overflow because of padding and borders
  - changed the panel shell back to a true adaptive width model:
    - `width: 100%`
    - `max-width: 360px`
    - outer shell padding now scales with available space instead of forcing the same inset on every narrow width
  - explicitly set key unified-panel containers to `width: 100%` and `min-width: 0`
  - explicitly constrained textareas and other full-width form controls to `max-width: 100%`
  - added width safety to the segmented display-mode control so it can shrink with the panel instead of pushing the right edge outward
- Practical result:
  - the settings area now prefers the same compact visual target
  - but when the available panel width is smaller, the panel and its controls shrink with the viewport instead of appearing cut off on the right
- Verification:
  - `ReadLints` clean
  - `pnpm --filter macos-shell test -- --run src/App.test.tsx` passed

## 2026-03-12 Remove Legacy Companion Hero Card

- User pointed out the large companion introduction card was still visible at the top of the unified panel.
- This was confirmed to be leftover structure from the previous stage-centric panel, not part of the intended settings-first layout.
- Fix applied in `WidgetPanel.tsx`:
  - removed the full `pet-stage` hero block
  - removed its illustration import and helper text logic
  - kept `Quick prompt`, result bubble, and inline settings sections intact
- Test coverage updated:
  - `App.test.tsx` now asserts the old hero heading is absent
  - also asserts the old stage summary copy such as `Signal` no longer appears in the unified panel path
- Verification:
  - `ReadLints` clean
  - `pnpm --filter macos-shell test -- --run src/App.test.tsx` passed

## 2026-03-12 Remove Agent Settings Card

- User decided the dedicated `Agent` settings card was redundant in the unified panel.
- Implementation changes:
  - removed the `Agent` collapsible section from `WidgetPanel`
  - removed the `Current agent` dropdown from the settings panel path
  - updated the settings subtitle from `Agent · Display · Companions · Connection` to `Display · Companions · Connection`
  - changed the default expanded section from `Agent` to `Display`
- Rationale:
  - the panel becomes more concise
  - `Display` already retains the practical agent-targeting control through `Pinned agent`
  - this reduces one extra top-level card without losing the core panel flow
- Test coverage updated:
  - `App.test.tsx` now asserts the `Agent` button and `Current agent` control are absent
  - verifies `Display` is expanded by default after the removal
- Verification:
  - `ReadLints` clean
  - `pnpm --filter macos-shell test -- --run src/App.test.tsx` passed

## 2026-03-12 Quick Prompt Send Feedback Fix

- User reported that clicking `Send Task` appeared to do nothing.
- Root-cause investigation found the panel send path had no immediate feedback:
  - `useQuickComposer` awaited `bridge.sendMessage()` first
  - only after the bridge promise resolved did it mark the pet as `thinking`
  - if the bridge request stalled, timed out, or rejected, the panel showed no visible response
- Fix applied:
  - mark the pet as `thinking` immediately when the submit starts
  - if the bridge send fails, mark the pet as `blocked` and surface the error message in the same reply channel
  - applied the same error-handling pattern to the pet-surface `sendMessage` and `createTask` flows for consistency
- Test coverage:
  - added `useQuickComposer` regression tests that verify:
    - pending bridge requests still show immediate thinking feedback
    - failed bridge requests surface an error instead of failing silently
- Verification:
  - `ReadLints` clean
  - `pnpm --filter macos-shell test -- --run src/features/composer/__tests__/useQuickComposer.test.ts src/App.test.tsx` passed
