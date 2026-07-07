import { AccountGuard } from '../services/accountGuard';

// ─── LinkedIssueBadge ───────────────────────────────────────────────────────
//
// On PR pages, injects a small pill beside the "Open"/"Closed"/"Merged" state
// label (in both the sticky header and the top-of-page header) whenever the
// PR closes/references an issue — mirrors LinkedPrBadge's placement, but in
// the opposite direction (PR -> issue instead of issue -> PR).
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CLASS = 'gh-id-linked-issue-badge';

const ISSUE_SVG = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
  <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
</svg>`;

export class LinkedIssueBadge {
  private guard: AccountGuard | null = null;

  mount(guard: AccountGuard): void {
    this.guard = guard;
  }

  unmount(): void {
    document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
    this.guard = null;
  }

  recheck(): void {
    if (!this.guard) return;

    if (!/\/pull\/\d+/.test(location.pathname)) {
      document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
      return;
    }

    const issue = this.guard.getLinkedIssueForPR();
    // PR pages use a different header layout than the issue viewer, and the
    // normal vs. sticky PR header wrap the state pill in DIFFERENT ancestor
    // components (PageHeader.Description vs. PH_LeadingVisual) — so we match
    // on the state pill's own `data-status` attribute directly rather than
    // scoping to either specific ancestor.
    const stateEls = document.querySelectorAll<HTMLElement>(
      '[data-testid="header-state"], span[data-status]',
    );

    if (!issue) {
      document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
      return;
    }

    const label = `Closes issue #${issue.number}`;

    stateEls.forEach(stateEl => {
      const host = stateEl.parentElement;
      if (!host) return;

      host.style.display       = 'flex';
      host.style.alignItems    = 'center';
      host.style.flexDirection = 'row';
      host.style.gap           = '8px';

      // Reuse the existing badge if present and refresh its content — the
      // linked issue can change as more of the PR description/sidebar
      // lazy-loads, so skipping entirely would freeze it at whatever was
      // true on the first render.
      let badge = host.querySelector<HTMLAnchorElement>(`.${BADGE_CLASS}`);
      if (!badge) {
        badge = document.createElement('a');
        badge.className = BADGE_CLASS;
        badge.target = '_blank';
        host.appendChild(badge);
      }

      const pillHeight = stateEl.getBoundingClientRect().height;
      badge.href = issue.url;
      badge.title = label;
      badge.setAttribute('aria-label', label);
      if (pillHeight > 0) badge.style.height = `${pillHeight}px`;

      // Only touch innerHTML when the linked issue actually changed — an
      // unconditional write here would re-trigger the guard's childList
      // MutationObserver every tick, causing an infinite render loop.
      const sig = issue.number;
      if (badge.dataset.ghSig !== sig) {
        badge.dataset.ghSig = sig;
        badge.innerHTML =
          ISSUE_SVG +
          `<span class="gh-id-linked-issue-number">#${this.esc(issue.number)}</span>`;
      }
    });
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}


