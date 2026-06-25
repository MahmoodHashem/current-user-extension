// ─── GitHub Account Identity — Content Script ─────────────────────────────────
//
// Orchestrates:
//   • Bottom bar — fixed strip at viewport bottom; hides when comment composer visible.
//   • CommentAvatar — "Commenting as" banner injected above every comment form.
//
// Handles GitHub SPA navigation (PJAX / Turbo / soft-nav / popstate) and
// viewport resize, re-mounting components as needed.
// ─────────────────────────────────────────────────────────────────────────────

import { Topbar } from './components/topbar';
import { CommentAvatar } from './components/commentAvatar';
import { AccountExtractor } from './services/accountExtractor';
import { STYLES } from './styles';

const NAV_DEBOUNCE_MS  = 400;
const RETRY_INTERVAL_MS = 600;
const MAX_RETRIES       = 6;

class IdentityWidget {
  private readonly extractor     = new AccountExtractor();
  private readonly topbar        = new Topbar();
  private readonly commentAvatar = new CommentAvatar();

  private stylesInjected   = false;
  private navDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer:       ReturnType<typeof setTimeout> | null = null;
  private retryCount        = 0;

  init(): void {
    this.injectStyles();
    this.listenForNavigation();
    this.initialise();
  }

  // ─── Styles ────────────────────────────────────────────────────────────

  private injectStyles(): void {
    if (this.stylesInjected || document.getElementById('gh-account-identity-styles')) return;
    const style = document.createElement('style');
    style.id = 'gh-account-identity-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
    this.stylesInjected = true;
  }

  // ─── Initialisation ────────────────────────────────────────────────────

  private initialise(): void {
    if (!this.isTargetPage()) {
      this.teardown();
      return;
    }

    const account = this.extractor.extract();
    if (!account) {
      this.scheduleRetry();
      return;
    }

    this.retryCount = 0;
    this.topbar.mount(account);
    this.commentAvatar.mount(account);
  }

  private scheduleRetry(): void {
    if (this.retryCount >= MAX_RETRIES) return;
    this.retryCount += 1;
    this.retryTimer = setTimeout(() => this.initialise(), RETRY_INTERVAL_MS);
  }

  private teardown(): void {
    this.topbar.unmount();
    this.commentAvatar.unmount();
  }

  // ─── Navigation handling ───────────────────────────────────────────────
  //
  // GitHub uses several navigation systems; listen to all known events plus
  // a MutationObserver URL-change fallback.
  // ─────────────────────────────────────────────────────────────────────────

  private listenForNavigation(): void {
    const onNav = () => this.debouncedReinit();
    document.addEventListener('pjax:end', onNav);
    document.addEventListener('turbo:load', onNav);
    document.addEventListener('soft-nav:end', onNav);
    window.addEventListener('popstate', onNav);

    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        onNav();
      }
    }).observe(document.documentElement, { subtree: true, childList: true });
  }

  private debouncedReinit(): void {
    if (this.navDebounceTimer) clearTimeout(this.navDebounceTimer);
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    this.retryCount = 0;
    this.navDebounceTimer = setTimeout(() => {
      this.teardown();
      this.initialise();
    }, NAV_DEBOUNCE_MS);
  }

  // ─── URL guard ─────────────────────────────────────────────────────────

  private isTargetPage(): boolean {
    const p = location.pathname;
    return /\/issues\/\d+/.test(p) || /\/pull\/\d+/.test(p) || /\/discussions\/\d+/.test(p);
  }
}

// ─── Boot ──────────────────────────────────────────────────────────────────

const widget = new IdentityWidget();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => widget.init());
} else {
  widget.init();
}
