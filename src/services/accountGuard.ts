export const STORAGE_KEY          = 'myAccounts';
export const DISABLED_STORAGE_KEY = 'guardDisabledAccounts';
export const DEFAULT_ACCOUNTS     = ['nabi-ebrahimi', 'marufsharifi', 'x-dev90'];

export interface GuardState {
  isBlocked:        boolean;
  currentUser:      string;
  /** The account from myAccounts that has already participated (null if not blocked). */
  usedAccount:      string | null;
  myAccounts:       string[];
  /** Accounts whose participation is currently ignored by the guard. */
  disabledAccounts: string[];
}

export class AccountGuard {
  private myAccounts:       string[]     = [...DEFAULT_ACCOUNTS];
  private disabledAccounts: Set<string>  = new Set();
  private onStateChange: ((state: GuardState) => void) | null = null;

  // ─── Init ────────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    await this.loadAccounts();

    // Erase any previously persisted disabled-accounts so old data doesn't
    // override the "reset on refresh" behaviour.
    chrome.storage.sync.remove(DISABLED_STORAGE_KEY);

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (STORAGE_KEY in changes) {
        this.myAccounts = (changes[STORAGE_KEY].newValue as string[]) ?? DEFAULT_ACCOUNTS;
        this.onStateChange?.(this.evaluate());
      }
    });
  }

  setOnStateChange(cb: (state: GuardState) => void): void {
    this.onStateChange = cb;
  }

  // ─── Evaluation ──────────────────────────────────────────────────────────

  evaluate(): GuardState {
    const currentUser = this.getCurrentUser();
    const authors     = this.getAllAuthors();
    const usedAccount = this.findUsedAccount(authors);

    const isBlocked = !!(
      currentUser &&
      usedAccount &&
      !this.disabledAccounts.has(usedAccount.toLowerCase()) &&
      usedAccount.toLowerCase() !== currentUser.toLowerCase() &&
      this.myAccounts.some(a => a.toLowerCase() === currentUser.toLowerCase()) &&
      this.myAccounts.some(a => a.toLowerCase() === usedAccount.toLowerCase())
    );

    return {
      isBlocked,
      currentUser:      currentUser ?? '',
      usedAccount:      isBlocked ? usedAccount : null,
      myAccounts:       this.myAccounts,
      disabledAccounts: [...this.disabledAccounts],
    };
  }

  recheck(): void {
    this.onStateChange?.(this.evaluate());
  }

  getAccounts(): string[] {
    return [...this.myAccounts];
  }

  // ─── Per-account toggle ──────────────────────────────────────────────────

  toggleAccount(username: string): void {
    const key = username.toLowerCase();
    if (this.disabledAccounts.has(key)) {
      this.disabledAccounts.delete(key);
    } else {
      this.disabledAccounts.add(key);
    }
    // Intentionally NOT persisted — resets to all-active on every page refresh.
    this.onStateChange?.(this.evaluate());
  }

  isAccountDisabled(username: string): boolean {
    return this.disabledAccounts.has(username.toLowerCase());
  }

  // ─── Storage ─────────────────────────────────────────────────────────────

  private loadAccounts(): Promise<void> {
    return new Promise(resolve => {
      chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULT_ACCOUNTS }, result => {
      
        if (chrome.runtime.lastError) { resolve(); return; }
        const val = result[STORAGE_KEY];
        this.myAccounts = (Array.isArray(val) && val.length > 0) ? val : [...DEFAULT_ACCOUNTS];
        resolve();
      });
    });
  }

  // ─── DOM extraction ──────────────────────────────────────────────────────

  private getCurrentUser(): string | null {
    return (
      document.querySelector<HTMLMetaElement>('meta[name="user-login"]')?.content ?? null
    );
  }

  private getAllAuthors(): Set<string> {
    const authors = new Set<string>();
    const EXCLUDED = new Set(['orgs', 'apps', 'teams', 'marketplace', 'sponsors']);

    const addFromEl = (el: HTMLElement): void => {
      if (el.tagName === 'A') {
        const href  = (el as HTMLAnchorElement).getAttribute('href') ?? '';
        const match = href.match(/^\/([a-zA-Z0-9][a-zA-Z0-9-]{0,37})(?:[/?#]|$)/);
        if (match?.[1] && !EXCLUDED.has(match[1])) {
          authors.add(match[1].toLowerCase());
          return;
        }
      }
      const text = el.textContent?.trim().replace(/^@/, '') ?? '';
      if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,37}$/.test(text)) {
        authors.add(text.toLowerCase());
      }
    };

    // Issue + PR conversation comments, PR inline review threads, timeline events
    document.querySelectorAll<HTMLElement>('a[data-hovercard-type="user"]').forEach(addFromEl);

    // React-rendered PR pages use data-hovercard-url="/users/<login>/hovercard"
    // on profile links even when data-hovercard-type is absent.
    document.querySelectorAll<HTMLElement>('a[data-hovercard-url*="/users/"]').forEach(el => {
      const url   = el.getAttribute('data-hovercard-url') ?? '';
      const match = url.match(/\/users\/([a-zA-Z0-9][a-zA-Z0-9-]{0,37})\//);
      if (match?.[1] && !EXCLUDED.has(match[1])) {
        authors.add(match[1].toLowerCase());
      }
    });

    // PR review summary banners ("X approved", "X requested changes")
    document.querySelectorAll<HTMLElement>(
      '[data-testid="reviewer"], [data-testid="comment-author"]',
    ).forEach(addFromEl);

    // data-author on comment wrapper divs (present on both issue and PR comments)
    document.querySelectorAll<HTMLElement>('[data-author]').forEach(el => {
      const login = el.getAttribute('data-author') ?? '';
      if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,37}$/.test(login) && !EXCLUDED.has(login)) {
        authors.add(login.toLowerCase());
      }
    });

    // PR collapsed review threads expose author via data-login on avatar buttons
    document.querySelectorAll<HTMLElement>('[data-login]').forEach(el => {
      const login = el.getAttribute('data-login') ?? '';
      if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,37}$/.test(login) && !EXCLUDED.has(login)) {
        authors.add(login.toLowerCase());
      }
    });

    // Widest net: GitHub sets alt="@username" on every user avatar image across
    // ALL page variants (classic, React, new issue design, PRs, discussions).
    // This catches comment authors even when no data-* attribute is present.
    document.querySelectorAll<HTMLImageElement>('img[alt^="@"]').forEach(img => {
      const login = img.alt.replace(/^@/, '').trim();
      if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,37}$/.test(login) && !EXCLUDED.has(login)) {
        authors.add(login.toLowerCase());
      }
    });

    return authors;
  }

  private findUsedAccount(authors: Set<string>): string | null {
    const me = this.getCurrentUser()?.toLowerCase() ?? '';
    for (const account of this.myAccounts) {
      const key = account.toLowerCase();
      // Skip the current user — they're always in authors (AppHeader shows their login).
      // We want the FIRST *other* account from myAccounts that participated.
      if (key !== me && authors.has(key)) return account;
    }
    return null;
  }

  // ─── Per-user participation (for popover display) ────────────────────────

  /**
   * Returns participation info for `username` in the current issue / PR.
   * Only meaningful on issue, PR, or discussion pages; returns nulls elsewhere.
   *
   * Roles:
   *   'author'   — opened this issue / PR
   *   'c+'       — assigned (and/or has comments) but didn't open it
   *   'reviewer' — left a PR review (no other role applies)
   *   null       — no special role detected
   */
  getParticipation(username: string): {
    commentUrl: string | null;
    role: 'author' | 'c+' | 'reviewer' | null;
  } {
    const p = location.pathname;
    if (!/\/issues\/\d+|\/pull\/\d+|\/discussions\/\d+/.test(p)) {
      return { commentUrl: null, role: null };
    }

    const lower = username.toLowerCase();
    const base  = location.href.split('#')[0];

    // ── First comment / review URL ──────────────────────────────────────
    let commentUrl: string | null = null;
    const commentEls = document.querySelectorAll<HTMLElement>(
      '[id^="issuecomment-"], [id^="pullrequestreview-"]',
    );
    for (const el of commentEls) {
      if (this.elHasUser(el, lower)) {
        commentUrl = `${base}#${el.id}`;
        break;
      }
    }

    // ── Is opener? ───────────────────────────────────────────────────────
    // The "X opened this" timeline event contains the opener's user link
    // before any issuecomment- element.
    let isOpener = false;
    document.querySelectorAll<HTMLElement>(
      '.TimelineItem, [data-testid*="timeline"]',
    ).forEach(item => {
      if (isOpener) return;
      const text = item.textContent ?? '';
      if (/opened this|created this/i.test(text) && this.elHasUser(item, lower)) {
        isOpener = true;
      }
    });
    // Fallback: first user-attributed block before any issuecomment- elements
    if (!isOpener) {
      const firstComment = document.querySelector<HTMLElement>('[id^="issuecomment-"]');
      const opBody = document.querySelector<HTMLElement>('.js-comment-body, .comment-body');
      if (opBody && firstComment && opBody.compareDocumentPosition(firstComment) & Node.DOCUMENT_POSITION_FOLLOWING) {
        const opContainer = opBody.closest('[data-body-version], .js-comment, article') as HTMLElement | null;
        if (opContainer && this.elHasUser(opContainer, lower)) isOpener = true;
      }
    }

    // ── Is assigned? ─────────────────────────────────────────────────────
    let isAssigned = false;
    const assigneeRoot = document.querySelector<HTMLElement>(
      '.sidebar-assignees, [data-testid*="assignee"], [aria-label*="Assignee" i]',
    );
    if (assigneeRoot && this.elHasUser(assigneeRoot, lower)) isAssigned = true;

    // ── Is reviewer? (PR only) ───────────────────────────────────────────
    let isReviewer = false;
    const reviewerRoot = document.querySelector<HTMLElement>(
      '.sidebar-reviews, [data-testid*="reviewer"], [aria-label*="Reviewer" i]',
    );
    if (reviewerRoot && this.elHasUser(reviewerRoot, lower)) isReviewer = true;

    // If opener has no comment yet, the link is the issue/PR itself
    if (isOpener && !commentUrl) commentUrl = base;

    // ── Role priority ────────────────────────────────────────────────────
    const role: 'author' | 'c+' | 'reviewer' | null =
      isOpener   ? 'author'   :
      isAssigned ? 'c+'       :
      isReviewer ? 'reviewer' :
      null;

    return { commentUrl, role };
  }

  private elHasUser(el: HTMLElement, usernameLower: string): boolean {
    // img alt — GitHub preserves original case, so compare after lowercasing
    for (const img of el.querySelectorAll<HTMLImageElement>('img[alt^="@"]')) {
      if (img.alt.replace(/^@/, '').trim().toLowerCase() === usernameLower) return true;
    }
    // data-login attributes (most explicit signal)
    for (const le of el.querySelectorAll<HTMLElement>('[data-login]')) {
      if ((le.getAttribute('data-login') ?? '').toLowerCase() === usernameLower) return true;
    }
    // Exact profile-page links: href="/username" (no trailing segment)
    for (const a of el.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const href = (a.getAttribute('href') ?? '').toLowerCase();
      if (href === `/${usernameLower}`) return true;
    }
    return false;
  }

  // ─── Load-more auto-click ───────────────────────────────────────────────
  // Only runs on issue and PR pages so it doesn't accidentally click
  // "Show more" buttons on unrelated pages (repo file browser, etc.).

  static clickLoadMore(): void {
    const p = location.pathname;
    if (!/\/issues\/\d+|\/pull\/\d+/.test(p)) return;

    document.querySelectorAll<HTMLButtonElement>('button').forEach(btn => {
      const text = btn.innerText.toLowerCase();
      if (
        text.includes('load more') ||
        text.includes('load previous') ||
        text.includes('show more')
      ) {
        btn.click();
      }
    });
  }
}
