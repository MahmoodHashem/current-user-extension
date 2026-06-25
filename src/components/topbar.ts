import { BadgeConfig, BADGE_PRESETS, GitHubAccount } from '../types';

// ─── Topbar ───────────────────────────────────────────────────────────────────
//
// A fixed identity strip that is always visible and always correctly positioned:
//
//   Not scrolled → sits flush below GitHub's AppHeader (repo nav row).
//   Scrolled     → sits flush below GitHub's sticky issue/PR compact header
//                  that appears when the issue title scrolls off screen.
//
// Both elements are `position: sticky/fixed` from GitHub's side, so on every
// scroll tick we re-measure their combined bottom edge and update our `top`.
//
// We use requestAnimationFrame throttling so the measurement never fires more
// than once per frame regardless of scroll speed.
// ─────────────────────────────────────────────────────────────────────────────

export const TOPBAR_ID = 'gh-account-identity-topbar';
const SPACER_ID   = 'gh-account-identity-topbar-spacer';
const TOPBAR_H_PX = 38; // must match CSS height

// GitHub's secondary sticky header (compact issue/PR title bar).
// Listed in rough probability order — the first match that is actually
// sticky and positioned just below the AppHeader wins.
const SECONDARY_STICKY_SELECTORS = [
  '.js-issue-header-sticky',
  '.gh-header-sticky',
  '[data-sticky-header]',
  '[class*="StickyHeader"]',
  '[class*="sticky-header"]',
];

export class Topbar {
  private el: HTMLElement | null = null;
  private spacer: HTMLElement | null = null;
  private account: GitHubAccount | null = null;
  private rafPending = false;
  private boundScroll = this.onScroll.bind(this);

  mount(account: GitHubAccount): void {
    this.account = account;
    this.ensureElement();
    this.render();
    this.el!.style.display = 'flex';
    this.ensureSpacer();
    window.addEventListener('scroll', this.boundScroll, { passive: true });
    this.updateTopOffset(); // set correct position immediately
  }

  hide(): void {
    if (this.el) this.el.style.display = 'none';
    if (this.spacer) this.spacer.style.display = 'none';
  }

  show(): void {
    if (this.el) this.el.style.display = 'flex';
    if (this.spacer) this.spacer.style.display = 'block';
    this.updateTopOffset();
  }

  unmount(): void {
    window.removeEventListener('scroll', this.boundScroll);
    this.el?.remove();
    this.el = null;
    this.spacer?.remove();
    this.spacer = null;
  }

  // ─── DOM management ──────────────────────────────────────────────────────

  private ensureElement(): void {
    if (this.el && document.body.contains(this.el)) return;

    const el = document.createElement('div');
    el.id = TOPBAR_ID;
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Current GitHub account identity');
    // Always attach to body — position:fixed resolves against the viewport,
    // not an ancestor's transform/clip context inside GitHub's layout.
    document.body.appendChild(el);
    this.el = el;
  }

  // The spacer reserves vertical space so our fixed topbar never covers content.
  private ensureSpacer(): void {
    if (this.spacer && document.body.contains(this.spacer)) return;

    const spacer = document.createElement('div');
    spacer.id = SPACER_ID;
    spacer.style.height = `${TOPBAR_H_PX}px`;
    spacer.setAttribute('aria-hidden', 'true');

    const anchor = document.querySelector(
      '#js-pjax-container, [data-turbo-frame="repo-content-turbo-frame"], main',
    );
    if (anchor) {
      anchor.insertBefore(spacer, anchor.firstChild);
    } else {
      document.body.prepend(spacer);
    }
    this.spacer = spacer;
  }

  // ─── Scroll-aware positioning ─────────────────────────────────────────────

  private onScroll(): void {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.updateTopOffset();
      this.rafPending = false;
    });
  }

  private updateTopOffset(): void {
    if (!this.el) return;

    // 1. Bottom edge of GitHub's main AppHeader (always sticky at top:0).
    const appHeader = document.querySelector<HTMLElement>(
      '.AppHeader, header[role="banner"], .Header',
    );
    const appBottom = appHeader
      ? appHeader.getBoundingClientRect().bottom
      : 64;

    // 2. Check for GitHub's compact secondary sticky header (issue/PR title bar).
    //    When active it sticks immediately below the AppHeader, so its
    //    getBoundingClientRect().top ≈ appBottom.
    const secondary = this.findSecondaryStickyHeader(appBottom);
    const finalTop = secondary
      ? secondary.getBoundingClientRect().bottom
      : appBottom;

    this.el.style.top = `${Math.max(0, finalTop)}px`;
  }

  private findSecondaryStickyHeader(appHeaderBottom: number): HTMLElement | null {
    // Fast path: try known class/attribute selectors.
    for (const sel of SECONDARY_STICKY_SELECTORS) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      // The element is visible and its top is at the AppHeader bottom (±4px).
      if (rect.height > 0 && Math.abs(rect.top - appHeaderBottom) <= 4) {
        return el;
      }
    }

    // Fallback: scan direct children of the main content container for any
    // sticky element whose top is near appHeaderBottom.  Bounded scan, O(k)
    // where k is the number of direct children — typically <20.
    const container = document.querySelector<HTMLElement>(
      '#js-pjax-container, [data-turbo-frame="repo-content-turbo-frame"], main',
    );
    if (!container) return null;

    for (const child of container.children) {
      const el = child as HTMLElement;
      if (el.id === TOPBAR_ID || el.id === SPACER_ID) continue;
      const pos = getComputedStyle(el).position;
      if (pos !== 'sticky' && pos !== 'fixed') continue;
      const rect = el.getBoundingClientRect();
      if (rect.height > 0 && Math.abs(rect.top - appHeaderBottom) <= 4) {
        return el;
      }
    }

    return null;
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  private render(): void {
    if (!this.el || !this.account) return;
    const badge = BADGE_PRESETS[this.account.accountType];
    this.el.innerHTML = this.buildHTML(this.account, badge);
  }

  private buildHTML(account: GitHubAccount, badge: BadgeConfig): string {
    const emailPart = account.email
      ? `<span class="gh-id-topbar-sep" aria-hidden="true">|</span>
         <a class="gh-id-topbar-email"
            href="mailto:${this.esc(account.email)}"
            title="${this.esc(account.email)}"
            aria-label="Email: ${this.esc(account.email)}"
         >${this.esc(account.email)}</a>`
      : '';

    return `
      <img
        class="gh-id-topbar-avatar"
        src="${this.esc(account.avatarUrl)}?size=48"
        alt="${this.esc(account.username)}'s avatar"
        width="24" height="24" loading="lazy"
      />
      <div class="gh-id-topbar-badge"
           style="color:${badge.fgColor};background:${badge.bgColor};border-color:${badge.borderColor}"
           aria-label="${this.esc(badge.label)}">
        <span class="gh-id-dot" style="background:${badge.dotColor}" aria-hidden="true"></span>
        <span>${this.esc(badge.label)}</span>
      </div>
      <a class="gh-id-topbar-name"
         href="${this.esc(account.profileUrl)}"
         target="_blank" rel="noopener noreferrer"
         aria-label="View ${this.esc(account.username)}'s GitHub profile"
      >${this.esc(account.displayName)}</a>
      <span class="gh-id-topbar-handle"
            aria-label="Username: @${this.esc(account.username)}"
      >@${this.esc(account.username)}</span>
      ${emailPart}
      <a class="gh-id-topbar-profile-link"
         href="${this.esc(account.profileUrl)}"
         target="_blank" rel="noopener noreferrer"
         aria-label="Open GitHub profile in new tab"
      >↗</a>
    `;
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}
