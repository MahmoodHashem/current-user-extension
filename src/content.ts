// ─── GitHub Account Identity & Guard — Content Script ─────────────────────────
//
// Runs on ALL github.com pages.
//
// Bottom circles widget   — ALL pages (avatar + guard toggle always visible).
// Comment avatar banner   — issues / PRs / discussions only.
// Guard blocking          — ALL pages (blocks composer + reactions when wrong
//                           account detected on any issue, PR, or discussion).
// ─────────────────────────────────────────────────────────────────────────────

import { Topbar }          from './components/topbar';
import { CommentAvatar }   from './components/commentAvatar';
import { GuardOverlay }    from './components/guardOverlay';
import { ScrollToBottom }  from './components/scrollToBottom';
import { LinkedPrBadge }   from './components/linkedPrBadge';
import { ProposalCountBadge } from './components/proposalCountBadge';
import { AccountExtractor } from './services/accountExtractor';
import { AccountGuard }    from './services/accountGuard';
import { STYLES }          from './styles';

const NAV_DEBOUNCE_MS  = 400;
const RETRY_INTERVAL_MS = 600;
const MAX_RETRIES       = 6;

class IdentityWidget {
  private readonly extractor      = new AccountExtractor();
  private readonly topbar         = new Topbar();
  private readonly commentAvatar  = new CommentAvatar();
  private readonly guard          = new AccountGuard();
  private readonly guardOverlay   = new GuardOverlay();
  private readonly scrollToBottom     = new ScrollToBottom();
  private readonly linkedPrBadge      = new LinkedPrBadge();
  private readonly proposalCountBadge = new ProposalCountBadge();

  private stylesInjected   = false;
  private navDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer:       ReturnType<typeof setTimeout> | null = null;
  private retryCount        = 0;

  // Main guard MutationObserver — debounced, handles re-checking on DOM changes.
  private guardMutObs: MutationObserver | null = null;
  private guardRafPending = false;

  async init(): Promise<void> {
    this.injectStyles();

    // Page-content-agnostic — mounted once, stays alive across SPA navigations.
    this.scrollToBottom.mount();

    // Load account list from storage (async, once per page lifetime).
    await this.guard.init();
    this.linkedPrBadge.mount(this.guard);
    this.proposalCountBadge.mount(this.guard);

    // When guard state changes (storage update, new comments, toggle flip) propagate everywhere.
    this.guard.setOnStateChange(state => {
      if (state.isBlocked) {
        this.commentAvatar.suppress();
        this.guardOverlay.apply(state);
      } else {
        this.guardOverlay.clear();
        this.commentAvatar.unsuppress();
      }
      this.topbar.updateGuardState(state);
    });

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
    // Guard + load-more: all pages
    AccountGuard.clickLoadMore();
    this.guard.recheck();
    this.startGuardObserver();

    // Account extraction works on every GitHub page (reads meta[name="user-login"])
    const account = this.extractor.extract();
    if (!account) {
      this.scheduleRetry();
      return;
    }

    this.retryCount = 0;

    // Circles widget: ALL GitHub pages
    this.topbar.mount(account, this.guard);

    // Comment avatar banner: only inside issue / PR / discussion threads
    if (this.isTargetPage()) {
      this.commentAvatar.mount(account);
    } else {
      this.commentAvatar.unmount();
    }
  }

  private scheduleRetry(): void {
    if (this.retryCount >= MAX_RETRIES) return;
    this.retryCount += 1;
    this.retryTimer = setTimeout(() => this.initialise(), RETRY_INTERVAL_MS);
  }

  private teardownIdentity(): void {
    this.topbar.unmount();
    this.commentAvatar.unmount();
  }

  private teardown(): void {
    this.teardownIdentity();
    this.guardOverlay.clear();
    this.guardMutObs?.disconnect();
    this.guardMutObs = null;
  }

  // ─── Guard observer ────────────────────────────────────────────────────
  //
  // Watches for new comments being added (including after "Load more" clicks)
  // and re-evaluates the guard state.  Debounced via rAF.

  private startGuardObserver(): void {
    if (this.guardMutObs) return;

    this.guardMutObs = new MutationObserver(() => {
      if (this.guardRafPending) return;
      this.guardRafPending = true;
      requestAnimationFrame(() => {
        AccountGuard.clickLoadMore();
        this.guard.recheck();
        this.scrollToBottom.recheck();
        this.proposalCountBadge.recheck();
        this.linkedPrBadge.recheck();
        this.guardRafPending = false;
      });
    });

    this.guardMutObs.observe(document.body, { childList: true, subtree: true });
  }

  // ─── SPA navigation ────────────────────────────────────────────────────

  private listenForNavigation(): void {
    const onNav = () => this.debouncedReinit();

    document.addEventListener('pjax:end',     onNav);
    document.addEventListener('turbo:load',   onNav);
    document.addEventListener('soft-nav:end', onNav);
    window.addEventListener('popstate',       onNav);

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
      this.scrollToBottom.recheck();
      this.proposalCountBadge.recheck();
      this.linkedPrBadge.recheck();
    }, NAV_DEBOUNCE_MS);
  }

  // ─── URL guard ─────────────────────────────────────────────────────────

  private isTargetPage(): boolean {
    const p = location.pathname;
    return (
      /\/issues\/\d+/.test(p) ||
      /\/pull\/\d+/.test(p)   ||
      /\/discussions\/\d+/.test(p)
    );
  }
}

// ─── Boot ──────────────────────────────────────────────────────────────────

const widget = new IdentityWidget();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => widget.init());
} else {
  widget.init();
}
