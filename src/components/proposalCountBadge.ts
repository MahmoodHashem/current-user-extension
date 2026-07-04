import { AccountGuard } from '../services/accountGuard';

// ─── ProposalCountBadge ─────────────────────────────────────────────────────
//
// On issue pages, injects a small pill BEFORE the "Open"/"Closed" state label
// showing the total number of "Proposal" comments in the thread. If a saved
// account has a proposal, its rank (e.g. "#2 of 10") is surfaced in the
// tooltip so you can tell at a glance where our submissions land.
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CLASS = 'gh-id-proposal-count-badge';

const LIST_SVG = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
  <path d="M2.75 3a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 4.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 4.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM6 4.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 6 4.25Zm0 4.5a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 6 8.75ZM6.75 12a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"/>
</svg>`;

export class ProposalCountBadge {
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

    if (!/\/issues\/\d+/.test(location.pathname)) {
      document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
      return;
    }

    const { total, ranksByUser } = this.guard.getProposalStats();
    const stateEls = document.querySelectorAll<HTMLElement>('[data-testid="header-state"]');

    if (total === 0) {
      document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
      return;
    }

    const myAccounts = this.guard.getAccounts();
    const ourRanks = myAccounts
      .filter(a => a.toLowerCase() in ranksByUser)
      .map(a => `@${a} is #${ranksByUser[a.toLowerCase()]}`);

    const label = `${total} proposal${total === 1 ? '' : 's'}` +
      (ourRanks.length ? ` — ${ourRanks.join(', ')}` : '');

    stateEls.forEach(stateEl => {
      const host = stateEl.parentElement;
      if (!host) return;

      host.style.display       = 'flex';
      host.style.alignItems    = 'center';
      host.style.flexDirection = 'row';
      host.style.gap           = '8px';

      // Reuse the existing badge if present and just refresh its content —
      // skipping entirely here would freeze the count at whatever total was
      // visible on the first render (e.g. before lazy-loaded comments finish
      // populating), instead of tracking the live total.
      let badge = host.querySelector<HTMLElement>(`.${BADGE_CLASS}`);
      if (!badge) {
        badge = document.createElement('span');
        badge.className = BADGE_CLASS;
        host.insertBefore(badge, stateEl);
      }

      const pillHeight = stateEl.getBoundingClientRect().height;
      badge.title = label;
      badge.setAttribute('aria-label', label);
      if (pillHeight > 0) badge.style.height = `${pillHeight}px`;
      badge.innerHTML =
        LIST_SVG +
        `<span class="gh-id-proposal-count-number">${total}</span>`;
    });
  }
}
