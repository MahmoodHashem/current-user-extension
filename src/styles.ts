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
  border-radius: 20px; 
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
  padding: 20px;

  background: var(--color-canvas-default, #ffffff);
  border-top: 1px solid var(--color-border-default, #d0d7de);
  box-shadow: 0 -2px 8px rgba(31, 35, 40, 0.08);

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
`;
