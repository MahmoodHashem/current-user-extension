import { AccountGuard } from '../services/accountGuard';

// ─── ProposalCountBadge ─────────────────────────────────────────────────────
//
// On issue pages, injects a small pill BEFORE the "Open"/"Closed" state label
// showing the total number of "Proposal" comments in the thread. Clicking it
// opens a dropdown listing every proposal author in rank order; clicking a
// row jumps straight to that proposal's comment.
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CLASS   = 'gh-id-proposal-count-badge';
const POPOVER_CLASS = 'gh-id-proposal-popover';

const LIST_SVG = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
  <path d="M2.75 3a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 4.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 4.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM6 4.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 6 4.25Zm0 4.5a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 6 8.75ZM6.75 12a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"/>
</svg>`;

type ProposalStats = ReturnType<AccountGuard['getProposalStats']>;

export class ProposalCountBadge {
  private guard: AccountGuard | null = null;
  private popoverEl: HTMLElement | null = null;
  private latestStats: ProposalStats = { total: 0, ranksByUser: {}, proposals: [] };

  mount(guard: AccountGuard): void {
    this.guard = guard;
    document.addEventListener('click', this.onDocClick);
    document.addEventListener('keydown', this.onDocKeydown);
  }

  unmount(): void {
    document.removeEventListener('click', this.onDocClick);
    document.removeEventListener('keydown', this.onDocKeydown);
    this.closePopover();
    document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
    this.guard = null;
  }

  recheck(): void {
    if (!this.guard) return;

    if (!/\/issues\/\d+/.test(location.pathname)) {
      document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
      this.closePopover();
      return;
    }

    const stats = this.guard.getProposalStats();
    this.latestStats = stats;
    const stateEls = document.querySelectorAll<HTMLElement>('[data-testid="header-state"]');

    if (stats.total === 0) {
      document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
      this.closePopover();
      return;
    }

    const myAccounts = this.guard.getAccounts();
    const ourRanks = myAccounts
      .filter(a => a.toLowerCase() in stats.ranksByUser)
      .map(a => `@${a} is #${stats.ranksByUser[a.toLowerCase()]}`);

    const label = `${stats.total} proposal${stats.total === 1 ? '' : 's'}` +
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
      let badge = host.querySelector<HTMLButtonElement>(`.${BADGE_CLASS}`);
      if (!badge) {
        badge = document.createElement('button');
        badge.type = 'button';
        badge.className = BADGE_CLASS;
        badge.setAttribute('aria-haspopup', 'dialog');
        badge.setAttribute('aria-expanded', 'false');
        badge.addEventListener('click', e => {
          e.stopPropagation();
          this.popoverEl ? this.closePopover() : this.openPopover(badge!);
        });
        host.insertBefore(badge, stateEl);
      }

      const pillHeight = stateEl.getBoundingClientRect().height;
      badge.title = label;
      badge.setAttribute('aria-label', label);
      if (pillHeight > 0) badge.style.height = `${pillHeight}px`;

      // Only touch innerHTML when the number actually changed. The guard's
      // MutationObserver watches childList across the whole page, so an
      // unconditional innerHTML write here re-triggers it every tick —
      // recheck() -> mutation -> scheduled recheck() -> mutation -> forever,
      // which was hammering the page and swallowing clicks on the badge.
      const sig = String(stats.total);
      if (badge.dataset.ghSig !== sig) {
        badge.dataset.ghSig = sig;
        badge.innerHTML =
          LIST_SVG +
          `<span class="gh-id-proposal-count-number">${stats.total}</span>`;
      }
    });

    // If the dropdown is already open, keep its contents in sync with the
    // live stats instead of leaving it stale until the next open.
    if (this.popoverEl) this.renderPopoverList(this.popoverEl);
  }

  // ─── Popover ────────────────────────────────────────────────────────────

  private openPopover(anchor: HTMLElement): void {
    if (this.popoverEl) return;

    const popover = document.createElement('div');
    popover.className = POPOVER_CLASS;
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Proposals');
    this.renderPopoverList(popover);

    document.body.appendChild(popover);
    this.popoverEl = popover;
    anchor.setAttribute('aria-expanded', 'true');
    this.positionPopover(anchor, popover);

    requestAnimationFrame(() => popover.classList.add(`${POPOVER_CLASS}--open`));
  }

  private closePopover(): void {
    this.popoverEl?.remove();
    this.popoverEl = null;
    document.querySelectorAll<HTMLElement>(`.${BADGE_CLASS}`).forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  private positionPopover(anchor: HTMLElement, popover: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    const W = 240;
    let left = rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - W - 8));

    popover.style.top   = `${rect.bottom + 8}px`;
    popover.style.left  = `${left}px`;
    popover.style.width = `${W}px`;
  }

  private renderPopoverList(popover: HTMLElement): void {
    const { total, proposals } = this.latestStats;
    const savedLower = new Set((this.guard?.getAccounts() ?? []).map(a => a.toLowerCase()));

    const rows = proposals.map(p => {
      const isSaved = savedLower.has(p.username.toLowerCase());
      return `
      <a class="gh-id-proposal-pop-row${isSaved ? ' gh-id-proposal-pop-row--saved' : ''}"
         href="${this.esc(p.url)}">
        <span class="gh-id-proposal-pop-rank">${p.rank}</span>
        <img class="gh-id-proposal-pop-avatar" src="https://github.com/${this.esc(p.username)}.png?size=48"
             width="20" height="20" alt="" loading="lazy" />
        <span class="gh-id-proposal-pop-name">@${this.esc(p.username)}</span>
        ${isSaved ? '<span class="gh-id-proposal-pop-star" aria-hidden="true">★</span>' : ''}
      </a>`;
    }).join('');

    const html = `
      <div class="gh-id-proposal-pop-header">
        ${LIST_SVG}
        <span class="gh-id-proposal-pop-title">${total} Proposal${total === 1 ? '' : 's'}</span>
      </div>
      <div class="gh-id-proposal-pop-list">${rows}</div>
    `;

    // Same rationale as the badge above: skip the write entirely when
    // nothing changed, otherwise the open popover gets its DOM replaced on
    // every mutation tick — including mid-click on one of its rows.
    if (popover.dataset.ghSig === html) return;
    popover.dataset.ghSig = html;
    popover.innerHTML = html;
  }

  private onDocClick = (e: MouseEvent): void => {
    if (!this.popoverEl) return;
    const target = e.target as Element;
    if (!this.popoverEl.contains(target) && !target.closest(`.${BADGE_CLASS}`)) {
      this.closePopover();
    }
  };

  private onDocKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.popoverEl) this.closePopover();
  };

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}
