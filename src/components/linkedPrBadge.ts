import { AccountGuard } from '../services/accountGuard';

// ─── LinkedPrBadge ──────────────────────────────────────────────────────────
//
// On issue pages, injects a small pill beside the "Open"/"Closed" state label
// (in both the sticky header and the top-of-page header) whenever the issue
// has a linked pull request opened by one of the saved accounts.
//
// GitHub keeps two parallel header-state nodes mounted at once (a normal one
// at the top of the page, a sticky duplicate that fades in on scroll) — both
// match `[data-testid="header-state"]`, so injecting next to each covers both
// cases without any sticky-specific logic.
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CLASS = 'gh-id-linked-pr-badge';

const PR_SVG = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
  <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
</svg>`;

const STATE_COLOR: Record<string, string> = {
  open:   '#1a7f37',
  merged: '#8250df',
  closed: '#cf222e',
  draft:  '#656d76',
};

export class LinkedPrBadge {
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

    const prs = this.guard.getLinkedPRsByAccounts();
    const stateEls = document.querySelectorAll<HTMLElement>('[data-testid="header-state"]');

    if (prs.length === 0) {
      document.querySelectorAll(`.${BADGE_CLASS}`).forEach(el => el.remove());
      return;
    }

    const primary = prs[0];
    const color   = STATE_COLOR[primary.state] ?? STATE_COLOR.open;
    const label   = `Linked PR #${primary.number} by @${primary.username} (${primary.state})` +
      (prs.length > 1 ? ` +${prs.length - 1} more` : '');

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
      let badge = host.querySelector<HTMLAnchorElement>(`.${BADGE_CLASS}`);
      if (!badge) {
        badge = document.createElement('a');
        badge.className = BADGE_CLASS;
        badge.target = '_blank';
        host.appendChild(badge);
      }

      const pillHeight = stateEl.getBoundingClientRect().height;
      badge.href = primary.url;
      badge.title = label;
      badge.setAttribute('aria-label', label);
      badge.style.color = color;
      badge.style.borderColor = `${color}40`;
      badge.style.background = `${color}14`;
      if (pillHeight > 0) badge.style.height = `${pillHeight}px`;
      badge.innerHTML =
        PR_SVG +
        `<img class="gh-id-linked-pr-avatar" src="https://github.com/${this.esc(primary.username)}.png?size=32"
              width="16" height="16" alt="" loading="lazy" />` +
        `<span class="gh-id-linked-pr-number">#${this.esc(primary.number)}</span>`;
    });
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}
