import { BADGE_PRESETS, GitHubAccount } from '../types';

// ─── CommentAvatar ────────────────────────────────────────────────────────────
//
// Injects a "Commenting as" identity banner at the top of every GitHub comment
// composer on the page.
//
// DOM strategy — class names are ALL hashed on GitHub (e.g. `__H4O8J`, `__wPxKr`)
// and change on every deploy.  We NEVER use class selectors.  Instead:
//
//   1.  Find `nav[aria-label="View mode"]` — the Write/Preview tab nav.
//       This aria-label is part of GitHub's accessible markup and is stable.
//
//   2.  Walk up the DOM from that nav until we reach the first ancestor that
//       also contains a `<textarea>`.  That ancestor is the CommentBox wrapper
//       (historically `.Shared-module__CommentBox__xxx`).
//
//   3.  Insert our banner as the FIRST CHILD of that wrapper, so it appears
//       above the Write/Preview tabs and formatting toolbar.
//
// A MutationObserver on document.body catches composers that GitHub renders
// lazily (page-bottom reply box on scroll, inline reply forms on click).
// We prevent duplicate banners with a `data-gh-id-banner` attribute.
// ─────────────────────────────────────────────────────────────────────────────

const BANNER_ATTR  = 'data-gh-id-banner';    // marks a container already injected
export const BANNER_CLASS = 'gh-id-comment-banner';

// How far up the DOM we walk looking for the CommentBox wrapper.
const MAX_WALK = 10;

export class CommentAvatar {
  private account: GitHubAccount | null = null;
  private observer: MutationObserver | null = null;
  private rafPending = false;

  mount(account: GitHubAccount): void {
    this.account = account;
    this.injectAll();
    this.startObserver();
  }

  unmount(): void {
    this.observer?.disconnect();
    this.observer = null;
    document.querySelectorAll(`.${BANNER_CLASS}`).forEach(el => el.remove());
    // Clear markers so a fresh mount can re-inject
    document.querySelectorAll(`[${BANNER_ATTR}]`).forEach(el => el.removeAttribute(BANNER_ATTR));
  }

  // ─── Injection ──────────────────────────────────────────────────────────

  private injectAll(): void {
    if (!this.account) return;

    // `nav[aria-label="View mode"]` is inside every MarkdownEditor instance.
    // There may be more than one (page-bottom form + inline reply forms).
    const navEls = document.querySelectorAll<HTMLElement>('nav[aria-label="View mode"]');
    for (const nav of navEls) {
      const wrapper = this.findCommentBoxWrapper(nav);
      if (wrapper && !wrapper.hasAttribute(BANNER_ATTR)) {
        this.injectBanner(wrapper);
      }
    }
  }

  // Walk up from the tab-nav element until we find the first ancestor
  // that ALSO contains a <textarea>.  That's the shared CommentBox root.
  private findCommentBoxWrapper(nav: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = nav.parentElement;
    for (let depth = 0; depth < MAX_WALK; depth++) {
      if (!el) return null;
      // textarea is always inside the same CommentBox wrapper as the tab nav
      if (el.querySelector('textarea')) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  private injectBanner(wrapper: HTMLElement): void {
    // Mark immediately to prevent a second inject if the observer fires again
    // before requestAnimationFrame completes.
    wrapper.setAttribute(BANNER_ATTR, '1');

    const banner = this.buildBanner(this.account!);
    // Insert before the first child (the header div with Write/Preview tabs).
    wrapper.insertBefore(banner, wrapper.firstChild);
  }

  // ─── MutationObserver ───────────────────────────────────────────────────

  private startObserver(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      // Debounce via rAF — GitHub can flush many mutations in a single frame
      // when rendering a reply form.
      if (this.rafPending) return;
      this.rafPending = true;
      requestAnimationFrame(() => {
        this.injectAll();
        this.rafPending = false;
      });
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
         target="_blank"
         rel="noopener noreferrer"
         class="gh-id-cb-avatar-link"
         aria-label="View ${this.esc(account.username)}'s GitHub profile">
        <img
          class="gh-id-cb-avatar"
          src="${this.esc(account.avatarUrl)}?size=124"
          alt="${this.esc(account.username)}'s avatar"
          width="56"
          height="56"
          loading="lazy"
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
          ? `<a class="gh-id-cb-email"
                href="mailto:${this.esc(account.email)}"
                aria-label="Email: ${this.esc(account.email)}"
             >${this.esc(account.email)}</a>`
          : ''
        }
      </div>
    `;

    return el;
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
