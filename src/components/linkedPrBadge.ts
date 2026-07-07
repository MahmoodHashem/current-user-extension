import { AccountGuard } from '../services/accountGuard';

// ─── LinkedPrBadge ──────────────────────────────────────────────────────────
//
// On issue pages, injects a small pill beside the "Open"/"Closed" state label
// (in both the sticky header and the top-of-page header) whenever the issue
// has one or more linked pull requests opened by saved accounts.
//
//   - Exactly one linked PR  -> clicking the badge navigates straight there.
//   - More than one          -> clicking opens a dropdown listing every PR
//                                (author, number, state); clicking a row
//                                jumps to that PR.
//
// GitHub keeps two parallel header-state nodes mounted at once (a normal one
// at the top of the page, a sticky duplicate that fades in on scroll) — both
// match `[data-testid="header-state"]`, so injecting next to each covers both
// cases without any sticky-specific logic.
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CLASS   = 'gh-id-linked-pr-badge';
const POPOVER_CLASS = 'gh-id-linked-pr-popover';

const PR_SVG = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
  <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
</svg>`;

const STATE_COLOR: Record<string, string> = {
  open:   '#1a7f37',
  merged: '#8250df',
  closed: '#cf222e',
  draft:  '#656d76',
};

type LinkedPr = ReturnType<AccountGuard['getLinkedPRsByAccounts']>[number];

export class LinkedPrBadge {
  private guard: AccountGuard | null = null;
  private popoverEl: HTMLElement | null = null;
  private latestPrs: LinkedPr[] = [];

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

    const prs = this.guard.getLinkedPRsByAccounts();
    this.latestPrs = prs;
    const stateEls = document.querySelectorAll<HTMLElement>('[data-testid="header-state"]');

    if (prs.length === 0) {
      document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
      this.closePopover();
      return;
    }

    const primary = prs[0];
    const color   = STATE_COLOR[primary.state] ?? STATE_COLOR.open;
    const label   = prs.length === 1
      ? `Linked PR #${primary.number} by @${primary.username} (${primary.state})`
      : `${prs.length} linked PRs — click to view all`;

    stateEls.forEach(stateEl => {
      const host = stateEl.parentElement;
      if (!host) return;

      // Force the host into a row layout and match the state pill's own
      // height, since GitHub's wrapper classes are hashed/unstable and we
      // can't rely on them staying flex or a particular size.
      host.style.display       = 'flex';
      host.style.alignItems    = 'center';
      host.style.flexDirection = 'row';
      host.style.gap           = '8px';

      // Reuse the existing badge if present and refresh its content — the
      // primary PR (and its state) can change as more timeline/sidebar
      // content lazy-loads, so skipping entirely would freeze it at
      // whatever was true on the first render.
      let badge = host.querySelector<HTMLButtonElement>(`.${BADGE_CLASS}`);
      if (!badge) {
        badge = document.createElement('button');
        badge.type = 'button';
        badge.className = BADGE_CLASS;
        badge.setAttribute('aria-haspopup', 'dialog');
        badge.addEventListener('click', e => {
          e.stopPropagation();
          if (this.latestPrs.length <= 1) {
            if (this.latestPrs[0]) location.assign(this.latestPrs[0].url);
            return;
          }
          this.popoverEl ? this.closePopover() : this.openPopover(badge!);
        });
        host.appendChild(badge);
      }

      const pillHeight = stateEl.getBoundingClientRect().height;
      badge.title = label;
      badge.setAttribute('aria-label', label);
      badge.setAttribute('aria-expanded', this.popoverEl ? 'true' : 'false');
      badge.style.color = color;
      badge.style.borderColor = `${color}40`;
      badge.style.background = `${color}14`;
      if (pillHeight > 0) badge.style.height = `${pillHeight}px`;

      // Only touch innerHTML when the PR set actually changed. The guard's
      // MutationObserver watches childList across the whole page, so an
      // unconditional innerHTML write here re-triggers it every tick —
      // recheck() -> mutation -> scheduled recheck() -> mutation -> forever.
      const sig = `${primary.number}|${primary.state}|${primary.username}|${prs.length}`;
      if (badge.dataset.ghSig !== sig) {
        badge.dataset.ghSig = sig;
        const moreBadge = prs.length > 1
          ? `<span class="gh-id-linked-pr-more">+${prs.length - 1}</span>`
          : '';
        badge.innerHTML =
          PR_SVG +
          `<img class="gh-id-linked-pr-avatar" src="https://github.com/${this.esc(primary.username)}.png?size=32"
                width="16" height="16" alt="" loading="lazy" />` +
          `<span class="gh-id-linked-pr-number">#${this.esc(primary.number)}</span>` +
          moreBadge;
      }
    });

    // If the dropdown is already open, keep its contents in sync with the
    // live PR list instead of leaving it stale until the next open.
    if (this.popoverEl) this.renderPopoverList(this.popoverEl);
  }

  // ─── Popover (only used when there's more than one linked PR) ──────────

  private openPopover(anchor: HTMLElement): void {
    if (this.popoverEl) return;

    const popover = document.createElement('div');
    popover.className = POPOVER_CLASS;
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Linked pull requests');
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
    const prs = this.latestPrs;

    const rows = prs.map(pr => {
      const color = STATE_COLOR[pr.state] ?? STATE_COLOR.open;
      return `
        <a class="gh-id-linked-pr-pop-row" href="${this.esc(pr.url)}">
          <img class="gh-id-linked-pr-pop-avatar" src="https://github.com/${this.esc(pr.username)}.png?size=48"
               width="20" height="20" alt="" loading="lazy" />
          <span class="gh-id-linked-pr-pop-number">#${this.esc(pr.number)}</span>
          <span class="gh-id-linked-pr-pop-name">@${this.esc(pr.username)}</span>
          <span class="gh-id-linked-pr-pop-state" style="color:${color};background:${color}1a">${this.esc(pr.state)}</span>
        </a>`;
    }).join('');

    const html = `
      <div class="gh-id-linked-pr-pop-header">
        ${PR_SVG}
        <span class="gh-id-linked-pr-pop-title">${prs.length} Linked PR${prs.length === 1 ? '' : 's'}</span>
      </div>
      <div class="gh-id-linked-pr-pop-list">${rows}</div>
    `;

    // Skip the write entirely when nothing changed, otherwise the open
    // popover gets its DOM replaced on every mutation tick — including
    // mid-click on one of its rows.
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
