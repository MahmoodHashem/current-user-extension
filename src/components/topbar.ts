import { BadgeConfig, BADGE_PRESETS, GitHubAccount } from '../types';

// ─── Topbar ───────────────────────────────────────────────────────────────────
//
// A fixed bottom identity strip.
//
// Visibility rules:
//   • Always visible while the user is reading an issue/PR/discussion.
//   • Slides out (bottom) whenever a comment composer is visible on screen,
//     because the CommentAvatar banner already shows identity there.
//
// Composer detection uses IntersectionObserver on `nav[aria-label="View mode"]`
// (the Write/Preview tab nav — the only stable, non-hashed selector in GitHub's
// current React/Primer MarkdownEditor).  A MutationObserver watches for inline
// reply forms that GitHub adds dynamically on click.
// ─────────────────────────────────────────────────────────────────────────────

export const TOPBAR_ID = 'gh-account-identity-bar';
const HIDDEN_CLASS     = 'gh-id-bar-hidden';

// Anchor for composer detection — same as CommentAvatar uses.
const COMPOSER_SELECTOR = 'nav[aria-label="View mode"]';

// 15 % of the composer nav must be visible to trigger hide.
const INTERSECTION_THRESHOLD = 0.15;

export class Topbar {
  private el: HTMLElement | null = null;
  private account: GitHubAccount | null = null;

  private intersectionObs: IntersectionObserver | null = null;
  private mutationObs: MutationObserver | null = null;
  private observedComposers = new WeakSet<Element>();
  private visibleComposers  = new Set<Element>();
  private mutRafPending     = false;

  mount(account: GitHubAccount): void {
    this.account = account;
    this.ensureElement();
    this.render();
    // Make visible (transition starts from translateY(100%) → 0)
    this.el!.style.display = 'flex';
    this.el!.classList.remove(HIDDEN_CLASS);
    this.trackComposers();
  }

  unmount(): void {
    this.intersectionObs?.disconnect();
    this.mutationObs?.disconnect();
    this.intersectionObs   = null;
    this.mutationObs       = null;
    this.visibleComposers.clear();
    this.el?.remove();
    this.el = null;
  }

  // ─── DOM ────────────────────────────────────────────────────────────────

  private ensureElement(): void {
    if (this.el && document.body.contains(this.el)) return;
    const el = document.createElement('div');
    el.id = TOPBAR_ID;
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Current GitHub account identity');
    document.body.appendChild(el);
    this.el = el;
  }

  private render(): void {
    if (!this.el || !this.account) return;
    const badge = BADGE_PRESETS[this.account.accountType];
    this.el.innerHTML = this.buildHTML(this.account, badge);
  }

  // ─── Show / hide with CSS transition ────────────────────────────────────

  private showBar(): void {
    if (!this.el) return;
    this.el.style.display = 'flex';
    // Flush display change before removing the class so the transition runs.
    void this.el.offsetHeight;
    this.el.classList.remove(HIDDEN_CLASS);
  }

  private hideBar(): void {
    if (!this.el) return;
    this.el.classList.add(HIDDEN_CLASS);
  }

  // ─── Composer visibility tracking ───────────────────────────────────────

  private trackComposers(): void {
    this.intersectionObs = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          this.visibleComposers.add(e.target);
        } else {
          this.visibleComposers.delete(e.target);
        }
      }
      this.visibleComposers.size > 0 ? this.hideBar() : this.showBar();
    }, { threshold: INTERSECTION_THRESHOLD });

    this.observeExistingComposers();

    // Watch for inline reply forms added dynamically.
    this.mutationObs = new MutationObserver(() => {
      if (this.mutRafPending) return;
      this.mutRafPending = true;
      requestAnimationFrame(() => {
        this.observeExistingComposers();
        this.mutRafPending = false;
      });
    });
    this.mutationObs.observe(document.body, { childList: true, subtree: true });
  }

  private observeExistingComposers(): void {
    document.querySelectorAll<Element>(COMPOSER_SELECTOR).forEach(el => {
      if (!this.observedComposers.has(el)) {
        this.observedComposers.add(el);
        this.intersectionObs?.observe(el);
      }
    });
  }

  // ─── HTML ────────────────────────────────────────────────────────────────

  private buildHTML(account: GitHubAccount, badge: BadgeConfig): string {
    const emailPart = account.email
      ? `<span class="gh-id-bar-sep" aria-hidden="true">·</span>
         <a class="gh-id-bar-email"
            href="mailto:${this.esc(account.email)}"
            title="${this.esc(account.email)}"
            aria-label="Email: ${this.esc(account.email)}"
         >${this.esc(account.email)}</a>`
      : '';

    return `
      <img
        class="gh-id-bar-avatar"
        src="${this.esc(account.avatarUrl)}?size=48"
        alt="${this.esc(account.username)}'s avatar"
        width="26" height="26" loading="lazy"
      />
      <div class="gh-id-bar-badge"
           style="color:${badge.fgColor};background:${badge.bgColor};border-color:${badge.borderColor}"
           aria-label="${this.esc(badge.label)}">
        <span class="gh-id-dot" style="background:${badge.dotColor}" aria-hidden="true"></span>
        <span>${this.esc(badge.label)}</span>
      </div>
      <a class="gh-id-bar-name"
         href="${this.esc(account.profileUrl)}"
         target="_blank" rel="noopener noreferrer"
         aria-label="View ${this.esc(account.username)}'s GitHub profile"
      >${this.esc(account.displayName)}</a>
      <span class="gh-id-bar-handle"
            aria-label="Username: @${this.esc(account.username)}"
      >@${this.esc(account.username)}</span>
      ${emailPart}
      <a class="gh-id-bar-profile-link"
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
