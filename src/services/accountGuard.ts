// ─── AccountGuard ─────────────────────────────────────────────────────────────
//
// Determines whether the currently signed-in account should be blocked from
// interacting with the current issue/PR because a different known account has
// already participated there.
//
// Account list is persisted in chrome.storage.sync so the popup can manage it
// without touching source code.  The content script listens to storage changes
// so enforcement updates immediately when the popup adds/removes an account.
// ─────────────────────────────────────────────────────────────────────────────

export const STORAGE_KEY      = 'myAccounts';
export const DEFAULT_ACCOUNTS = ['nabi-ebrahimi', 'marufsharifi', 'x-dev90'];

export interface GuardState {
  isBlocked:   boolean;
  currentUser: string;
  /** The account from MY_ACCOUNTS that has already participated (null if not blocked). */
  usedAccount: string | null;
  myAccounts:  string[];
}

export class AccountGuard {
  private myAccounts: string[] = [...DEFAULT_ACCOUNTS];
  private onStateChange: ((state: GuardState) => void) | null = null;

  // ─── Init ────────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    await this.loadAccounts();

    // Sync updates from the popup in real time.
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && STORAGE_KEY in changes) {
        this.myAccounts = (changes[STORAGE_KEY].newValue as string[]) ?? DEFAULT_ACCOUNTS;
        this.onStateChange?.(this.evaluate());
      }
    });
  }

  setOnStateChange(cb: (state: GuardState) => void): void {
    this.onStateChange = cb;
  }

  // ─── Evaluation ──────────────────────────────────────────────────────────

  /** Evaluates the current page and returns a GuardState.  Pure — no side effects. */
  evaluate(): GuardState {
    const currentUser = this.getCurrentUser();
    const authors     = this.getAllAuthors();
    const usedAccount = this.findUsedAccount(authors);

    const isBlocked = !!(
      currentUser &&
      usedAccount &&
      usedAccount.toLowerCase() !== currentUser.toLowerCase() &&
      this.myAccounts.some(a => a.toLowerCase() === currentUser.toLowerCase()) &&
      this.myAccounts.some(a => a.toLowerCase() === usedAccount.toLowerCase())
    );

    return {
      isBlocked,
      currentUser: currentUser ?? '',
      usedAccount: isBlocked ? usedAccount : null,
      myAccounts:  this.myAccounts,
    };
  }

  /** Force a re-evaluation and notify the callback.  Called by content.ts on mutations. */
  recheck(): void {
    this.onStateChange?.(this.evaluate());
  }

  getAccounts(): string[] {
    return [...this.myAccounts];
  }

  // ─── Storage ─────────────────────────────────────────────────────────────

  private loadAccounts(): Promise<void> {
    return new Promise(resolve => {
      chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULT_ACCOUNTS }, result => {
        this.myAccounts = result[STORAGE_KEY] as string[];
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

  /**
   * Collects all unique usernames that appear as comment/event authors on the page.
   *
   * Extraction priority:
   *   1. href attribute of `a[data-hovercard-type="user"]` links.
   *      GitHub's hovercard anchors always point to `/<username>`, making this
   *      the most reliable source regardless of UI redesigns.
   *   2. textContent of `[data-testid="comment-author"]` as a fallback.
   */
  private getAllAuthors(): Set<string> {
    const authors = new Set<string>();

    document
      .querySelectorAll<HTMLElement>(
        'a[data-hovercard-type="user"], [data-testid="comment-author"]',
      )
      .forEach(el => {
        // Strategy 1: extract from href (/username path)
        if (el.tagName === 'A') {
          const href = (el as HTMLAnchorElement).getAttribute('href') ?? '';
          const match = href.match(/^\/([a-zA-Z0-9][a-zA-Z0-9-]{0,37})(?:[/?#]|$)/);
          if (match?.[1]) {
            authors.add(match[1].toLowerCase());
            return;
          }
        }

        // Strategy 2: text content
        const text = el.textContent?.trim().replace(/^@/, '') ?? '';
        if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,37}$/.test(text)) {
          authors.add(text.toLowerCase());
        }
      });

    return authors;
  }

  private findUsedAccount(authors: Set<string>): string | null {
    for (const account of this.myAccounts) {
      if (authors.has(account.toLowerCase())) return account;
    }
    return null;
  }

  // ─── Load-more auto-click (intentional — kept from original github-guard) ──
  //
  // Automatically clicks "Load more", "Load previous", and "Show more" buttons
  // anywhere on the page so that all comments are loaded before author scanning.
  // This is intentional behavior.

  static clickLoadMore(): void {
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
