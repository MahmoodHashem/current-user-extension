export const STYLES = `
/* ── Shared reset ────────────────────────────────────────────────────────── */
#gh-account-identity-bar *,
.gh-id-comment-banner *,
.gh-guard-notice *,
.gh-guard-ta-overlay *,
.gh-guard-popover *,
#gh-scroll-bottom-btn,
#gh-scroll-top-btn,
.gh-id-linked-pr-badge *,
.gh-id-proposal-count-badge,
.gh-id-proposal-count-badge *,
.gh-id-proposal-popover,
.gh-id-proposal-popover * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LINKED PR BADGE — beside the issue's Open/Closed state pill
   ══════════════════════════════════════════════════════════════════════════ */

.gh-id-linked-pr-badge {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  height: 32px; 
  box-sizing: border-box;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 14px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  text-decoration: none;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease;
}
.gh-id-linked-pr-badge:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}
.gh-id-linked-pr-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: block;
  object-fit: cover;
  flex-shrink: 0;
}
.gh-id-linked-pr-number {
  line-height: 1;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LINKED ISSUE BADGE — beside the PR's Open/Closed/Merged state pill
   ══════════════════════════════════════════════════════════════════════════ */

.gh-id-linked-issue-badge {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border-default, #d0d7de);
  background: var(--color-canvas-subtle, #f6f8fa);
  color: var(--color-fg-default, #1f2328);
  font-size: 14px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  text-decoration: none;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease, background 0.12s ease, border-color 0.12s ease;
}
.gh-id-linked-issue-badge:hover {
  transform: translateY(-1px);
  background: var(--color-neutral-muted, rgba(175,184,193,0.2));
  border-color: var(--color-fg-muted, #656d76);
}
.gh-id-linked-issue-number {
  line-height: 1;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPOSAL COUNT BADGE — before the issue's Open/Closed state pill
   ══════════════════════════════════════════════════════════════════════════ */

.gh-id-proposal-count-badge {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6px;
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border-default, #d0d7de);
  background: var(--color-canvas-subtle, #f6f8fa);
  color: var(--color-fg-default, #1f2328);
  font-size: 14px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  line-height: 1;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}
.gh-id-proposal-count-badge:hover {
  background: var(--color-neutral-muted, rgba(175,184,193,0.2));
  border-color: var(--color-fg-muted, #656d76);
}
.gh-id-proposal-count-badge[aria-expanded="true"] {
  background: var(--color-neutral-muted, rgba(175,184,193,0.25));
  border-color: var(--color-fg-default, #1f2328);
}
.gh-id-proposal-count-badge:focus-visible {
  outline: 2px solid var(--color-accent-fg, #0969da);
  outline-offset: 2px;
}
.gh-id-proposal-count-number {
  line-height: 1;
  white-space: nowrap;
}

/* ── Proposal list popover ───────────────────────────────────────────────── */

.gh-id-proposal-popover {
  position: fixed;
  z-index: 200;
  background: var(--color-canvas-default, #ffffff);
  border: 1px solid var(--color-border-default, #d0d7de);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(31, 35, 40, 0.18);
  padding: 10px;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.gh-id-proposal-popover--open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}
.gh-id-proposal-pop-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-fg-default, #1f2328);
  padding: 2px 6px 8px;
}
.gh-id-proposal-pop-title {
  font-size: 13px;
  font-weight: 600;
}
.gh-id-proposal-pop-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow-y: auto;
}
.gh-id-proposal-pop-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.1s;
}
.gh-id-proposal-pop-row:hover { background: var(--color-neutral-muted, rgba(175,184,193,0.15)); }
.gh-id-proposal-pop-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--color-neutral-muted, rgba(175,184,193,0.3));
  color: var(--color-fg-default, #1f2328);
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
.gh-id-proposal-pop-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.gh-id-proposal-pop-name {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--color-fg-default, #1f2328);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.gh-id-proposal-pop-row--saved {
  background: color-mix(in srgb, var(--color-accent-fg, #0969da) 8%, transparent);
}
.gh-id-proposal-pop-row--saved:hover {
  background: color-mix(in srgb, var(--color-accent-fg, #0969da) 14%, transparent);
}
.gh-id-proposal-pop-row--saved .gh-id-proposal-pop-name {
  color: var(--color-accent-fg, #0969da);
  font-weight: 600;
}
.gh-id-proposal-pop-row--saved .gh-id-proposal-pop-rank {
  background: var(--color-accent-fg, #0969da);
  color: #fff;
}
.gh-id-proposal-pop-star {
  color: var(--color-accent-fg, #0969da);
  font-size: 11px;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL-TO-BOTTOM BUTTON — bottom-right corner
   ══════════════════════════════════════════════════════════════════════════ */

#gh-scroll-bottom-btn {
  position: fixed;
  bottom: 24px;
  right: 20px;
  z-index: 95;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-canvas-default, #ffffff);
  border: 1.5px solid var(--color-border-default, #d0d7de);
  box-shadow: 0 2px 10px rgba(31, 35, 40, 0.18);
  color: var(--color-fg-muted, #656d76);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, border-color 0.12s, color 0.12s, box-shadow 0.12s;
}
#gh-scroll-bottom-btn.gh-scroll-bottom-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
#gh-scroll-bottom-btn:hover {
  border-color: var(--color-fg-default, #1f2328);
  color: var(--color-fg-default, #1f2328);
  box-shadow: 0 4px 14px rgba(31, 35, 40, 0.26);
}
#gh-scroll-bottom-btn:focus-visible {
  outline: 2px solid var(--color-accent-fg, #0969da);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  #gh-scroll-bottom-btn { transition: opacity 0.01s linear; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL-TO-TOP BUTTON — bottom-right corner, stacked above scroll-to-bottom
   ══════════════════════════════════════════════════════════════════════════ */

#gh-scroll-top-btn {
  position: fixed;
  bottom: 76px;
  right: 20px;
  z-index: 95;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-canvas-default, #ffffff);
  border: 1.5px solid var(--color-border-default, #d0d7de);
  box-shadow: 0 2px 10px rgba(31, 35, 40, 0.18);
  color: var(--color-fg-muted, #656d76);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, border-color 0.12s, color 0.12s, box-shadow 0.12s;
}
#gh-scroll-top-btn.gh-scroll-top-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
#gh-scroll-top-btn:hover {
  border-color: var(--color-fg-default, #1f2328);
  color: var(--color-fg-default, #1f2328);
  box-shadow: 0 4px 14px rgba(31, 35, 40, 0.26);
}
#gh-scroll-top-btn:focus-visible {
  outline: 2px solid var(--color-accent-fg, #0969da);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  #gh-scroll-top-btn { transition: opacity 0.01s linear; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FLOATING WIDGET — two circles, bottom-left corner
   ══════════════════════════════════════════════════════════════════════════ */

#gh-account-identity-bar {
  position: fixed;
  bottom: 24px;
  left: 20px;
  display: none; /* set to flex by JS */
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  z-index: 95;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.gh-id-circles {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
}
.gh-id-chips {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}
.gh-id-proposal-circle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-left: 8px !important;
  border-radius: 50%;
  border: 1.5px solid;
  box-shadow: 0 2px 6px rgba(31, 35, 40, 0.15), 0 0 0 2px #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  flex-shrink: 0;
  cursor: pointer;
  text-decoration: none;
  outline: none;
}
.gh-id-proposal-circle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(31, 35, 40, 0.22), 0 0 0 2px #fff;
}
.gh-id-proposal-circle:focus-visible {
  box-shadow: 0 0 0 3px currentColor, 0 0 0 5px #fff;
}
.gh-id-pc-avatar {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  object-fit: cover;
  display: block;
}
.gh-id-pc-rank {
  position: absolute;
  top: -5px;
  left: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 999px;
  background: #1f2328;
  color: #fff;
  border: 2px solid #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 12px;
  text-align: center;
  box-sizing: border-box;
}


/* ── Large avatar circle ─────────────────────────────────────────────────── */

.gh-id-avatar-circle {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(31, 35, 40, 0.22), 0 0 0 2.5px #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  flex-shrink: 0;
  outline: none;
}
.gh-id-avatar-circle:hover,
.gh-id-avatar-circle:focus-visible {
  transform: scale(1.07);
  box-shadow: 0 4px 16px rgba(31, 35, 40, 0.3), 0 0 0 2.5px #fff;
}
.gh-id-avatar-circle:focus-visible {
  box-shadow: 0 0 0 3px var(--color-accent-fg, #0969da), 0 0 0 5px #fff;
}

.gh-id-avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: block;
  object-fit: cover;
}

/* ── Hover tooltip ───────────────────────────────────────────────────────── */

.gh-id-avatar-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 0;
  min-width: 190px;
  background: var(--color-canvas-default, #ffffff);
  border: 1px solid var(--color-border-default, #d0d7de);
  border-radius: 12px;
  padding: 14px !important;
  box-shadow: 0 8px 24px rgba(31, 35, 40, 0.15);
  display: flex;
  gap: 10px;
  align-items: flex-start;

  opacity: 0;
  transform: translateY(5px);
  pointer-events: none;
  transition: opacity 0.14s ease, transform 0.14s ease;
  z-index: 10;
  white-space: nowrap;
}
.gh-id-avatar-circle:hover .gh-id-avatar-tooltip,
.gh-id-avatar-circle:focus-visible .gh-id-avatar-tooltip {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.gh-id-tt-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border-default, #d0d7de);
  display: block;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 1px;
}

.gh-id-tt-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.gh-id-tt-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-fg-default, #1f2328);
  overflow: hidden;
  text-overflow: ellipsis;
}
.gh-id-tt-handle {
  font-size: 12px;
  color: var(--color-fg-muted, #656d76);
}
.gh-id-tt-email {
  font-size: 11px;
  color: var(--color-fg-muted, #656d76);
  text-decoration: none;
}
.gh-id-tt-email:hover { text-decoration: underline; }
.gh-id-tt-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid;
  align-self: flex-start;
  margin-top: 5px;
}
.gh-id-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

/* ── Small guard circle ──────────────────────────────────────────────────── */

.gh-id-guard-circle {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-canvas-default, #ffffff);
  border: 1.5px solid var(--color-border-default, #d0d7de);
  box-shadow: 0 2px 6px rgba(31, 35, 40, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-fg-muted, #656d76);
  padding: 0;
  flex-shrink: 0;
  transition: border-color 0.12s, color 0.12s, transform 0.12s, box-shadow 0.12s;
}
.gh-id-guard-circle:hover {
  border-color: var(--color-fg-default, #1f2328);
  color: var(--color-fg-default, #1f2328);
  transform: scale(1.08);
  box-shadow: 0 3px 10px rgba(31, 35, 40, 0.2);
}
.gh-id-guard-circle:focus-visible {
  outline: 2px solid var(--color-accent-fg, #0969da);
  outline-offset: 2px;
}

/* Status dot on the guard circle */
.gh-id-guard-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid var(--color-canvas-default, #fff);
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
  box-shadow: 0 8px 28px rgba(31, 35, 40, 0.18);
  padding: 14px;
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.gh-guard-popover--open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.gh-guard-pop-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-fg-default, #1f2328);
  margin-bottom: 5px;
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
  user-select: none;
  transition: background 0.1s;
}
.gh-guard-pop-row:hover { background: var(--color-neutral-muted, rgba(175,184,193,0.15)); }
.gh-guard-pop-row--you { opacity: 0.6; }
.gh-guard-pop-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--color-border-default, #d0d7de);
  object-fit: cover;
  flex-shrink: 0;
}
.gh-guard-pop-meta {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.gh-guard-pop-name {
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--color-fg-default, #1f2328);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
}
.gh-guard-pop-link:hover { text-decoration: underline; }
.gh-guard-pop-role {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}
.gh-guard-pop-status {
  font-size: 10px;
  color: var(--color-fg-muted, #656d76);
  flex-shrink: 0;
}
.gh-guard-pop-you {
  font-size: 10px;
  color: var(--color-fg-muted, #656d76);
  flex-shrink: 0;
  font-style: italic;
}
.gh-guard-pop-empty {
  font-size: 12px;
  color: var(--color-fg-muted, #656d76);
  font-style: italic;
  padding: 4px 0;
}

/* ── Toggle switch ───────────────────────────────────────────────────────── */

.gh-guard-switch { display: inline-flex; align-items: center; flex-shrink: 0; }
.gh-guard-switch input { position: absolute; opacity: 0; width: 0; height: 0; }

.gh-guard-track {
  display: inline-flex;
  align-items: center;
  width: 34px;
  height: 19px;
  border-radius: 10px;
  background: var(--color-neutral-muted, #d0d7de);
  padding: 2px;
  cursor: pointer;
  transition: background 0.18s;
}
.gh-guard-thumb {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.18s cubic-bezier(0.4,0,0.2,1);
  flex-shrink: 0;
}
input:checked ~ .gh-guard-track                    { background: #1a7f37; }
input:checked ~ .gh-guard-track .gh-guard-thumb    { transform: translateX(15px); }

/* ═══════════════════════════════════════════════════════════════════════════
   COMMENT COMPOSER BANNER  — "Commenting as" above the textarea
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

.gh-id-cb-avatar-link { flex-shrink: 0; display: block; border-radius: 50%; outline-offset: 2px; }
.gh-id-cb-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  border: 2px solid var(--color-border-default, #d0d7de);
  display: block; object-fit: cover;
  transition: border-color 0.15s ease;
}
.gh-id-cb-avatar-link:hover .gh-id-cb-avatar,
.gh-id-cb-avatar-link:focus .gh-id-cb-avatar { border-color: var(--color-accent-fg, #0969da); }

.gh-id-cb-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.gh-id-cb-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  padding: 2px 8px; border-radius: 999px; border: 1px solid;
  align-self: flex-start; margin-bottom: 2px;
}
.gh-id-cb-name {
  font-size: 15px; font-weight: 600;
  color: var(--color-fg-default, #1f2328);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.gh-id-cb-handle { font-size: 13px; color: var(--color-fg-muted, #656d76); }
.gh-id-cb-email {
  font-size: 12px; color: var(--color-fg-muted, #656d76);
  text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.gh-id-cb-email:hover { color: var(--color-accent-fg, #0969da); text-decoration: underline; }

/* ═══════════════════════════════════════════════════════════════════════════
   GUARD — inline notice + textarea overlay
   ══════════════════════════════════════════════════════════════════════════ */

/* Small notice at the top of the CommentBox (above Write/Preview tabs) */
.gh-guard-notice {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #6e2020;
  background: rgba(207, 34, 46, 0.05);
  border: 1px solid rgba(207, 34, 46, 0.18);
  border-radius: 6px;
  animation: gh-id-fade-in 0.15s ease;
  line-height: 1.4;
}
.gh-guard-notice-icon { font-size: 14px; flex-shrink: 0; opacity: 0.8; }
.gh-guard-notice-text { flex: 1; }

/* Frosted overlay covering only the textarea input area */
.gh-guard-ta-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(253, 249, 249, 0.92);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  border: 1.5px solid rgba(207, 34, 46, 0.25);
  border-radius: 6px;
  cursor: not-allowed;
  animation: gh-id-fade-in 0.15s ease;
}

.gh-guard-ta-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 24px;
  text-align: center;
  max-width: 300px;
}
.gh-guard-ta-icon {
  font-size: 22px;
  color: rgba(207, 34, 46, 0.7);
  line-height: 1;
}
.gh-guard-ta-title {
  font-size: 13px;
  font-weight: 600;
  color: #6e2020;
}
.gh-guard-ta-detail {
  font-size: 11.5px;
  color: #6e2020;
  opacity: 0.85;
  line-height: 1.5;
}

/* Inline code chips used in notices and overlays */
.gh-guard-code-sm {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10.5px;
  background: rgba(207, 34, 46, 0.08);
  border: 1px solid rgba(207, 34, 46, 0.15);
  border-radius: 3px;
  padding: 0 3px;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DARK THEME
   ══════════════════════════════════════════════════════════════════════════ */

[data-color-mode="dark"] .gh-id-avatar-tooltip,
[data-color-mode="dark"] .gh-guard-popover,
[data-color-mode="dark"] .gh-id-proposal-popover {
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
}
[data-color-mode="dark"] .gh-id-guard-circle {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
[data-color-mode="dark"] .gh-id-linked-pr-badge:hover { filter: brightness(1.15); }
[data-color-mode="dark"] .gh-id-proposal-count-badge {
  background: var(--color-canvas-subtle, #161b22);
  border-color: var(--color-border-default, #30363d);
  color: var(--color-fg-default, #e6edf3);
}
[data-color-mode="dark"] .gh-id-linked-issue-badge {
  background: var(--color-canvas-subtle, #161b22);
  border-color: var(--color-border-default, #30363d);
  color: var(--color-fg-default, #e6edf3);
}
[data-color-mode="dark"] #gh-scroll-bottom-btn {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}
[data-color-mode="dark"] #gh-scroll-bottom-btn:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
[data-color-mode="dark"] #gh-scroll-top-btn {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}
[data-color-mode="dark"] #gh-scroll-top-btn:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}
[data-color-mode="dark"] .gh-id-proposal-circle {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 2px #0d1117;
}
[data-color-mode="dark"] .gh-id-proposal-circle:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 0 2px #0d1117;
}
[data-color-mode="dark"] .gh-id-pc-avatar { border-color: #0d1117; }
[data-color-mode="dark"] .gh-id-pc-rank   { border-color: #0d1117; background: #e6edf3; color: #1f2328; }
[data-color-mode="dark"] .gh-guard-track    { background: #30363d; }
[data-color-mode="dark"] input:checked ~ .gh-guard-track { background: #238636; }

[data-color-mode="dark"] .gh-guard-ta-overlay {
  background: rgba(22, 16, 16, 0.88);
  border-color: rgba(248, 81, 73, 0.3);
}
[data-color-mode="dark"] .gh-guard-ta-title,
[data-color-mode="dark"] .gh-guard-ta-detail,
[data-color-mode="dark"] .gh-guard-ta-icon  { color: #ffa198; }
[data-color-mode="dark"] .gh-guard-ta-icon  { opacity: 0.8; }

[data-color-mode="dark"] .gh-guard-notice {
  background: rgba(207, 34, 46, 0.1);
  border-color: rgba(248, 81, 73, 0.25);
  color: #ffa198;
}
[data-color-mode="dark"] .gh-guard-code-sm {
  background: rgba(248, 81, 73, 0.12);
  border-color: rgba(248, 81, 73, 0.25);
}

/* ═══════════════════════════════════════════════════════════════════════════
   HIGH CONTRAST
   ══════════════════════════════════════════════════════════════════════════ */

@media (forced-colors: active) {
  .gh-id-avatar-circle { box-shadow: 0 0 0 2px ButtonText; }
  .gh-id-guard-circle  { border: 2px solid ButtonText; }
  .gh-id-avatar-tooltip,
  .gh-guard-popover    { border: 2px solid ButtonText; }
  .gh-guard-track      { border: 1px solid ButtonText; forced-color-adjust: none; }
  .gh-guard-ta-overlay { border: 2px solid Mark; }
  .gh-id-comment-banner { border: 2px solid ButtonText; }
  .gh-id-cb-avatar     { border: 2px solid ButtonText; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   REDUCED MOTION
   ══════════════════════════════════════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
.gh-id-avatar-circle     { transition: none; }
  .gh-id-avatar-tooltip    { transition: none; }
  .gh-id-guard-circle      { transition: none; }
  .gh-guard-popover        { transition: none; }
  .gh-guard-track,
  .gh-guard-thumb          { transition: none; }
  .gh-id-comment-banner,
  .gh-guard-notice,
  .gh-guard-ta-overlay     { animation: none; }
  .gh-id-cb-avatar         { transition: none; }
}
`;
