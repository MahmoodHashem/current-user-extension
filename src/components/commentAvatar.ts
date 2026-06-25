import { BADGE_PRESETS, GitHubAccount } from '../types';

// ─── CommentAvatar ────────────────────────────────────────────────────────────
//
// Injects a "Commenting as" identity banner at the top of every GitHub
// comment composer on the page.  Prevents accidentally submitting a comment
// from the wrong account.
//
// GitHub renders comment forms in several ways:
//   1. `#new_comment_form` — traditional page-bottom reply form.
//   2. `.js-new-comment-form` — behaviour class used in older layouts.
//   3. Inline reply forms that appear dynamically when clicking "Reply".
//
// We use a MutationObserver on document.body to catch forms that are added
// after initial load (GitHub loads some forms lazily on scroll or on click).
// Each form gets at most one banner; we detect re-injection via a data attribute.
// ─────────────────────────────────────────────────────────────────────────────

const BANNER_ATTR    = 'data-gh-id-injected';
const BANNER_CLASS   = 'gh-id-comment-banner';

// Selectors for GitHub's comment composer forms / containers.
const FORM_SELECTORS = [
  '#new_comment_form',
  '.js-new-comment-form',
  'form[data-type="comment"]',
  // Newer GitHub — target attribute on the comment action component.
  '[data-target="new-comment.newComment"]',
  '[data-target="inline-comment-form-manager.commentForm"]',
];

// Inject the banner before the first visible interactive element inside the
// form: the Write/Preview tab bar or the textarea.
const INNER_ANCHOR_SELECTORS = [
  '.tabnav-tabs',          // Write | Preview tabs
  '.CommentBox-header',    // newer GitHub
  'textarea',              // bare fallback
];

export class CommentAvatar {
  private account: GitHubAccount | null = null;
  private observer: MutationObserver | null = null;

  mount(account: GitHubAccount): void {
    this.account = account;
    this.injectAll();
    this.startObserver();
  }

  unmount(): void {
    this.observer?.disconnect();
    this.observer = null;
    document
      .querySelectorAll(`.${BANNER_CLASS}`)
      .forEach(el => el.remove());
  }

  // ─── Injection ─────────────────────────────────────────────────────────

  private injectAll(): void {
    for (const sel of FORM_SELECTORS) {
      document.querySelectorAll<HTMLElement>(sel).forEach(form => {
        this.injectIntoForm(form);
      });
    }
  }

  private injectIntoForm(form: HTMLElement): void {
    if (form.hasAttribute(BANNER_ATTR)) return; // already done
    if (!this.account) return;

    const anchor = this.findAnchor(form);
    if (!anchor) return;

    const banner = this.buildBanner(this.account);
    anchor.parentElement?.insertBefore(banner, anchor);
    form.setAttribute(BANNER_ATTR, '1');
  }

  private findAnchor(form: HTMLElement): HTMLElement | null {
    for (const sel of INNER_ANCHOR_SELECTORS) {
      const el = form.querySelector<HTMLElement>(sel);
      if (el) return el;
    }
    return null;
  }

  // ─── Observer ──────────────────────────────────────────────────────────

  private startObserver(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(mutations => {
      let needsScan = false;
      for (const m of mutations) {
        if (m.addedNodes.length) { needsScan = true; break; }
      }
      if (needsScan) this.injectAll();
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Banner HTML ────────────────────────────────────────────────────────

  private buildBanner(account: GitHubAccount): HTMLElement {
    const badge = BADGE_PRESETS[account.accountType];

    const el = document.createElement('div');
    el.className = BANNER_CLASS;
    el.setAttribute('role', 'note');
    el.setAttribute('aria-label', `Commenting as ${account.username}`);

    el.innerHTML = `
      <a href="${this.esc(account.profileUrl)}"
         target="_blank" rel="noopener noreferrer"
         class="gh-id-cb-avatar-link"
         aria-label="View ${this.esc(account.username)}'s profile">
        <img
          class="gh-id-cb-avatar"
          src="${this.esc(account.avatarUrl)}?size=112"
          alt="${this.esc(account.username)}'s avatar"
          width="56" height="56" loading="lazy"
        />
      </a>
      <div class="gh-id-cb-info">
        <div class="gh-id-cb-badge"
             style="color:${badge.fgColor};background:${badge.bgColor};border-color:${badge.borderColor}">
          <span class="gh-id-dot" style="background:${badge.dotColor}" aria-hidden="true"></span>
          Commenting as
        </div>
        <div class="gh-id-cb-name">${this.esc(account.displayName)}</div>
        <div class="gh-id-cb-handle">@${this.esc(account.username)}</div>
        ${account.email
          ? `<div class="gh-id-cb-email">${this.esc(account.email)}</div>`
          : ''}
      </div>
    `;

    return el;
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}
