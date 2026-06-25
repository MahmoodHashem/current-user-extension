export const STYLES = `
/* ── Scoped reset ────────────────────────────────────────────────────────── */
#gh-account-identity-topbar *,
.gh-id-comment-banner * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOPBAR  — always-visible fixed strip below GitHub's headers
   ══════════════════════════════════════════════════════════════════════════ */

#gh-account-identity-topbar {
  /* position:fixed + body attachment means this never sits inside GitHub's
     layout tree, so it can't accidentally render inside the repo nav bar.
     top is set by JS and updated on every scroll frame to stay flush below
     whichever GitHub sticky header is currently visible. */
  position: fixed;
  left: 0;
  right: 0;
  width: 100%;
  height: 38px;

  /* Sit above page content but below GitHub's own header (z ~100). */
  z-index: 95;

  /* Hidden by default; JS switches to flex when account is detected. */
  display: none;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 0 16px;

  background: var(--color-canvas-default, #ffffff);
  border-bottom: 2px solid var(--color-border-default, #d0d7de);
  box-shadow: 0 2px 6px rgba(31,35,40,0.08);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

#gh-account-identity-topbar::-webkit-scrollbar { display: none; }

.gh-id-topbar-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--color-border-default, #d0d7de);
  flex-shrink: 0;
  display: block;
  object-fit: cover;
}

.gh-id-topbar-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 8px;
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

.gh-id-topbar-name {
  font-weight: 600;
  color: var(--color-fg-default, #1f2328);
  text-decoration: none;
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 13px;
}
.gh-id-topbar-name:hover { text-decoration: underline; }

.gh-id-topbar-handle {
  color: var(--color-fg-muted, #656d76);
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 13px;
}

.gh-id-topbar-sep {
  color: var(--color-border-muted, #d8dee4);
  pointer-events: none;
  flex-shrink: 0;
}

.gh-id-topbar-email {
  color: var(--color-fg-muted, #656d76);
  text-decoration: none;
  white-space: nowrap;
  font-size: 12px;
  flex-shrink: 0;
}
.gh-id-topbar-email:hover {
  color: var(--color-accent-fg, #0969da);
  text-decoration: underline;
}

.gh-id-topbar-profile-link {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--color-fg-muted, #656d76);
  text-decoration: none;
  font-size: 14px;
  padding: 0 4px;
}
.gh-id-topbar-profile-link:hover { color: var(--color-fg-default, #1f2328); }

/* ═══════════════════════════════════════════════════════════════════════════
   COMMENT BANNER  — "Commenting as" identity block above the comment form
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DARK THEME
   ══════════════════════════════════════════════════════════════════════════ */

[data-color-mode="dark"] .gh-id-comment-banner,
@media (prefers-color-scheme: dark) {
  .gh-id-comment-banner {
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   HIGH CONTRAST
   ══════════════════════════════════════════════════════════════════════════ */

@media (forced-colors: active) {
  #gh-account-identity-topbar {
    border-bottom: 2px solid ButtonText;
  }
  .gh-id-topbar-badge,
  .gh-id-cb-badge {
    border: 1px solid ButtonText;
  }
  .gh-id-comment-banner {
    border: 2px solid ButtonText;
  }
  .gh-id-cb-avatar {
    border: 2px solid ButtonText;
  }
  .gh-id-dot {
    forced-color-adjust: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   REDUCED MOTION
   ══════════════════════════════════════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  .gh-id-comment-banner { animation: none; }
  .gh-id-cb-avatar { transition: none; }
}
`;
