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
    await this.loadDisabledAccounts();

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (STORAGE_KEY in changes) {
        this.myAccounts = (changes[STORAGE_KEY].newValue as string[]) ?? DEFAULT_ACCOUNTS;
      }
      if (DISABLED_STORAGE_KEY in changes) {
        this.disabledAccounts = new Set(
          (changes[DISABLED_STORAGE_KEY].newValue as string[]) ?? [],
        );
      }
      this.onStateChange?.(this.evaluate());
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
    chrome.storage.sync.set({ [DISABLED_STORAGE_KEY]: [...this.disabledAccounts] });
    this.onStateChange?.(this.evaluate());
  }

  isAccountDisabled(username: string): boolean {
    return this.disabledAccounts.has(username.toLowerCase());
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

  private loadDisabledAccounts(): Promise<void> {
    return new Promise(resolve => {
      chrome.storage.sync.get({ [DISABLED_STORAGE_KEY]: [] }, result => {
        this.disabledAccounts = new Set(result[DISABLED_STORAGE_KEY] as string[]);
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

    document
      .querySelectorAll<HTMLElement>(
        'a[data-hovercard-type="user"], [data-testid="comment-author"]',
      )
      .forEach(el => {
        if (el.tagName === 'A') {
          const href  = (el as HTMLAnchorElement).getAttribute('href') ?? '';
          const match = href.match(/^\/([a-zA-Z0-9][a-zA-Z0-9-]{0,37})(?:[/?#]|$)/);
          if (match?.[1]) { authors.add(match[1].toLowerCase()); return; }
        }
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
