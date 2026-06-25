export const STYLES = `
/* ── Scoped reset ────────────────────────────────────────────────────────── */
#gh-account-identity-bar *,
.gh-id-comment-banner * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOTTOM IDENTITY BAR
   • Fixed to the bottom of the viewport.
   • Slides out downward (translateY 100%) when a comment composer is visible.
   • Slides back up when the composer scrolls off screen.
   ══════════════════════════════════════════════════════════════════════════ */

#gh-account-identity-bar {
  /* Attached to body; position:fixed resolves against the viewport */
  position: fixed;
  bottom: 40px;
  border-radius: 50px; 
  left: 0;
  right: 0;
  width: 80%;
  margin-inline: auto; 

  /* Above page content, below GitHub dialogs/modals (~z 200+) */
  z-index: 95;

  /* Hidden by default; JS switches to flex on mount */
  display: none;

  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 10px;

  background: var(--color-canvas-default, #ffffff);
  border-top: 1px solid var(--color-border-default, #d0d7de);
  box-shadow: 0 0 8px rgba(31, 35, 40, 0.6);

  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;

  /* Slide transition: visible → translateY(0), hidden → translateY(100%) */
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
              opacity  0.18s ease;
  transform: translateY(0);
  opacity: 1;
}

#gh-account-identity-bar::-webkit-scrollbar { display: none; }

/* Applied by JS when any composer is visible on screen */
#gh-account-identity-bar.gh-id-bar-hidden {
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
}

/* ── Bar internals ───────────────────────────────────────────────────────── */

.gh-id-bar-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border-default, #d0d7de);
  flex-shrink: 0;
  display: block;
  object-fit: cover;
}

.gh-id-bar-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid;
  flex-shrink: 0;
  white-space: nowrap;
}

.gh-id-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

.gh-id-bar-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-fg-default, #1f2328);
  text-decoration: none;
  flex-shrink: 0;
  white-space: nowrap;
}
.gh-id-bar-name:hover { text-decoration: underline; }

.gh-id-bar-handle {
  font-size: 13px;
  color: var(--color-fg-muted, #656d76);
  flex-shrink: 0;
  white-space: nowrap;
}

.gh-id-bar-sep {
  color: var(--color-fg-subtle, #818b98);
  pointer-events: none;
  flex-shrink: 0;
}

.gh-id-bar-email {
  font-size: 12px;
  color: var(--color-fg-muted, #656d76);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}
.gh-id-bar-email:hover {
  color: var(--color-accent-fg, #0969da);
  text-decoration: underline;
}

.gh-id-bar-profile-link {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--color-fg-muted, #656d76);
  text-decoration: none;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 4px;
}
.gh-id-bar-profile-link:hover { color: var(--color-fg-default, #1f2328); }

/* ═══════════════════════════════════════════════════════════════════════════
   COMMENT COMPOSER BANNER  — "Commenting as" block above the textarea
   ══════════════════════════════════════════════════════════════════════════ */

.gh-id-comment-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: var(--color-canvas-subtle, #f6f8fa);
  border: 1px solid var(--color-border-default, #d0d7de);
  border-radius: 8px;
  animation: gh-id-fade-in 0.15s ease;
}

@keyframes gh-id-fade-in {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0);    }
}

.gh-id-cb-avatar-link {
  flex-shrink: 0;
  display: block;
  border-radius: 50%;
  outline-offset: 2px;
}

.gh-id-cb-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--color-border-default, #d0d7de);
  display: block;
  object-fit: cover;
  transition: border-color 0.15s ease;
}
.gh-id-cb-avatar-link:hover .gh-id-cb-avatar,
.gh-id-cb-avatar-link:focus .gh-id-cb-avatar {
  border-color: var(--color-accent-fg, #0969da);
}

.gh-id-cb-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.gh-id-cb-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid;
  align-self: flex-start;
  margin-bottom: 2px;
}

.gh-id-cb-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-fg-default, #1f2328);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gh-id-cb-handle {
  font-size: 13px;
  color: var(--color-fg-muted, #656d76);
}

.gh-id-cb-email {
  font-size: 12px;
  color: var(--color-fg-muted, #656d76);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gh-id-cb-email:hover {
  color: var(--color-accent-fg, #0969da);
  text-decoration: underline;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DARK THEME
   ══════════════════════════════════════════════════════════════════════════ */

[data-color-mode="dark"] #gh-account-identity-bar {
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
}

[data-color-mode="dark"] .gh-id-comment-banner {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

/* ═══════════════════════════════════════════════════════════════════════════
   HIGH CONTRAST
   ══════════════════════════════════════════════════════════════════════════ */

@media (forced-colors: active) {
  #gh-account-identity-bar    { border-top: 2px solid ButtonText; }
  .gh-id-bar-badge            { border: 1px solid ButtonText; }
  .gh-id-comment-banner       { border: 2px solid ButtonText; }
  .gh-id-cb-avatar            { border: 2px solid ButtonText; }
  .gh-id-dot                  { forced-color-adjust: none; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   REDUCED MOTION
   ══════════════════════════════════════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  #gh-account-identity-bar  { transition: none; }
  .gh-id-comment-banner     { animation: none; }
  .gh-id-cb-avatar          { transition: none; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   GUARD BUTTON  (in the bottom bar)
   ══════════════════════════════════════════════════════════════════════════ */

.gh-id-guard-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-fg-muted, #656d76);
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}
.gh-id-guard-btn:hover {
  background: var(--color-neutral-muted, rgba(175,184,193,0.2));
  color: var(--color-fg-default, #1f2328);
}
.gh-id-guard-btn:focus-visible {
  outline: 2px solid var(--color-accent-fg, #0969da);
  outline-offset: 1px;
}

/* Status dot on the shield */
.gh-id-guard-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid var(--color-canvas-default, #fff);
  pointer-events: none;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GUARD POPOVER
   ══════════════════════════════════════════════════════════════════════════ */

.gh-guard-popover {
  position: fixed;
  z-index: 200;
  background: var(--color-canvas-default, #ffffff);
  border: 1px solid var(--color-border-default, #d0d7de);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(31, 35, 40, 0.2);
  padding: 14px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.15s ease, transform 0.15s ease;
  pointer-events: none;
}
.gh-guard-popover--open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.gh-guard-pop-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
  color: var(--color-fg-default, #1f2328);
}
.gh-guard-pop-title {
  font-size: 13px;
  font-weight: 600;
}
.gh-guard-pop-desc {
  font-size: 11px;
  color: var(--color-fg-muted, #656d76);
  line-height: 1.5;
  margin-bottom: 10px;
}

.gh-guard-pop-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gh-guard-pop-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
}
.gh-guard-pop-row:hover { background: var(--color-neutral-muted, rgba(175,184,193,0.15)); }

.gh-guard-pop-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--color-border-default, #d0d7de);
  object-fit: cover;
  flex-shrink: 0;
}
.gh-guard-pop-name {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--color-fg-default, #1f2328);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gh-guard-pop-status {
  font-size: 10px;
  color: var(--color-fg-muted, #656d76);
  flex-shrink: 0;
}

.gh-guard-pop-empty {
  font-size: 12px;
  color: var(--color-fg-muted, #656d76);
  padding: 6px 0;
  font-style: italic;
}
.gh-guard-pop-current {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-muted, #d8dee4);
  font-size: 11px;
  color: var(--color-fg-muted, #656d76);
}

/* ── Toggle switch ─────────────────────────────────────────────────────── */

.gh-guard-switch {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}
.gh-guard-switch input { position: absolute; opacity: 0; width: 0; height: 0; }

.gh-guard-track {
  display: inline-flex;
  align-items: center;
  width: 34px;
  height: 19px;
  border-radius: 10px;
  background: var(--color-neutral-muted, #d0d7de);
  transition: background 0.18s;
  padding: 2px;
  cursor: pointer;
}
.gh-guard-thumb {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}
input:checked ~ .gh-guard-track { background: #1a7f37; }
input:checked ~ .gh-guard-track .gh-guard-thumb { transform: translateX(15px); }

/* ── Dark mode ─────────────────────────────────────────────────────────── */

[data-color-mode="dark"] .gh-guard-popover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}
[data-color-mode="dark"] .gh-guard-track { background: #30363d; }
[data-color-mode="dark"] input:checked ~ .gh-guard-track { background: #238636; }

/* ── High contrast ─────────────────────────────────────────────────────── */

@media (forced-colors: active) {
  .gh-guard-popover { border: 2px solid ButtonText; }
  .gh-guard-track   { border: 1px solid ButtonText; forced-color-adjust: none; }
}

/* ── Reduced motion ────────────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .gh-guard-popover { transition: none; }
  .gh-guard-track, .gh-guard-thumb { transition: none; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACCOUNT GUARD — warning banner + blocked-composer overlay
   ══════════════════════════════════════════════════════════════════════════ */

.gh-guard-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: #fff0f0;
  border: 1.5px solid #cf222e;
  border-radius: 8px;
  animation: gh-id-fade-in 0.15s ease;
}

.gh-guard-icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
}

.gh-guard-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.gh-guard-title {
  font-size: 13px;
  font-weight: 600;
  color: #82071e;
}

.gh-guard-detail {
  font-size: 12px;
  color: #82071e;
  line-height: 1.5;
}

.gh-guard-code {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  font-size: 11px;
  background: rgba(207, 34, 46, 0.08);
  border: 1px solid rgba(207, 34, 46, 0.2);
  border-radius: 4px;
  padding: 1px 4px;
}

/* Visually dim the inert (blocked) composer so the user sees it's locked. */
[data-gh-guard-blocked] {
  opacity: 0.45;
  pointer-events: none;
  cursor: not-allowed;
  filter: grayscale(0.2);
}

[data-color-mode="dark"] .gh-guard-warning {
  background: rgba(207, 34, 46, 0.12);
  border-color: #f85149;
}

[data-color-mode="dark"] .gh-guard-title,
[data-color-mode="dark"] .gh-guard-detail {
  color: #ffa198;
}

[data-color-mode="dark"] .gh-guard-code {
  background: rgba(248, 81, 73, 0.15);
  border-color: rgba(248, 81, 73, 0.3);
}

@media (forced-colors: active) {
  .gh-guard-warning { border: 2px solid Mark; }
  [data-gh-guard-blocked] { opacity: 0.5; filter: none; }
}

@media (prefers-reduced-motion: reduce) {
  .gh-guard-warning { animation: none; }
}
`;
