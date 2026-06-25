import { GuardState } from '../services/accountGuard';

// ─── GuardOverlay ─────────────────────────────────────────────────────────────
//
// Enforces the guard visually and interactively when the wrong account is active.
//
// What it does when blocked:
//
//   1. WARNS — injects a prominent red banner before each comment composer.
//
//   2. BLOCKS COMPOSER — applies the `inert` HTML attribute to the entire
//      MarkdownEditor container (one level above the CommentBox wrapper, so the
//      footer with the "Comment" submit button is also blocked).
//      `inert` is the correct API for this: it makes ALL descendants
//      non-focusable, non-clickable, and hidden from the accessibility tree.
//      React cannot undo it because React never sets or reads `inert`.
//
//   3. BLOCKS REACTIONS — installs a capture-phase click/mousedown listener at
//      the document level.  Capture fires before React's synthetic events, so
//      we can reliably preventDefault() and stopImmediatePropagation() on any
//      reaction interaction.  This works even when React re-renders the buttons.
//
//   4. RE-APPLIES on DOM changes — a single MutationObserver watches for new
//      composers (e.g. inline reply forms) and re-applies all three layers.
//
// This class coordinates with CommentAvatar: when guard is active it calls
// commentAvatar.suppress() so the "Commenting as" banner is not shown inside
// the inert area.
// ─────────────────────────────────────────────────────────────────────────────

const BLOCKED_ATTR   = 'data-gh-guard-blocked';
const WARNING_CLASS  = 'gh-guard-warning';

export class GuardOverlay {
  private active    = false;
  private state: GuardState | null = null;

  private captureClick:     ((e: Event) => void) | null = null;
  private captureMousedown: ((e: Event) => void) | null = null;
  private mutObs: MutationObserver | null = null;
  private rafPending = false;

  // ─── Public API ────────────────────────────────────────────────────────

  apply(state: GuardState): void {
    this.state  = state;
    this.active = state.isBlocked;

    if (!state.isBlocked) {
      this.clear();
      return;
    }

    this.blockComposers();
    this.injectWarnings();
    this.installReactionBlocker();
    this.startObserver();
  }

  clear(): void {
    this.active = false;
    this.mutObs?.disconnect();
    this.mutObs = null;

    document.querySelectorAll(`[${BLOCKED_ATTR}]`).forEach(el => {
      el.removeAttribute('inert');
      el.removeAttribute(BLOCKED_ATTR);
    });
    document.querySelectorAll(`.${WARNING_CLASS}`).forEach(el => el.remove());
    this.uninstallReactionBlocker();
  }

  // ─── Composer blocking ─────────────────────────────────────────────────

  private blockComposers(): void {
    document.querySelectorAll<HTMLElement>('nav[aria-label="View mode"]').forEach(nav => {
      // The MarkdownEditor container is the grandparent of the CommentBox wrapper.
      // It contains both the editor (textarea) AND the footer (submit button).
      const editorContainer = this.findEditorContainer(nav);
      if (!editorContainer || editorContainer.hasAttribute(BLOCKED_ATTR)) return;

      editorContainer.setAttribute(BLOCKED_ATTR, '1');
      editorContainer.setAttribute('inert', '');
    });
  }

  // Walk up from nav → find ancestor containing <textarea> (CommentBox wrapper)
  // → go one more level up (MarkdownEditor container that also wraps the footer).
  private findEditorContainer(nav: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = nav.parentElement;
    for (let i = 0; i < 10; i++) {
      if (!el) return null;
      if (el.querySelector('textarea')) {
        // This is the CommentBox wrapper; its parent is the MarkdownEditor container.
        return el.parentElement;
      }
      el = el.parentElement;
    }
    return null;
  }

  // ─── Warning banners ───────────────────────────────────────────────────

  private injectWarnings(): void {
    if (!this.state) return;

    document.querySelectorAll<HTMLElement>('nav[aria-label="View mode"]').forEach(nav => {
      const editorContainer = this.findEditorContainer(nav);
      if (!editorContainer) return;

      const parent = editorContainer.parentElement;
      if (!parent) return;

      // One banner per parent container (avoid duplicates on re-apply).
      if (parent.querySelector(`.${WARNING_CLASS}`)) return;

      const banner = this.buildBanner(this.state!);
      parent.insertBefore(banner, editorContainer);
    });
  }

  private buildBanner(state: GuardState): HTMLElement {
    const el = document.createElement('div');
    el.className = WARNING_CLASS;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');

    el.innerHTML = `
      <div class="gh-guard-icon" aria-hidden="true">⚠️</div>
      <div class="gh-guard-body">
        <strong class="gh-guard-title">Wrong account — interaction blocked</strong>
        <span class="gh-guard-detail">
          <code class="gh-guard-code">@${this.esc(state.usedAccount ?? '')}</code>
          already participated here.
          You are signed in as
          <code class="gh-guard-code">@${this.esc(state.currentUser)}</code>.
          Switch to the correct account to interact.
        </span>
      </div>
    `;

    return el;
  }

  // ─── Reaction blocker ──────────────────────────────────────────────────
  //
  // Capture phase fires before React's synthetic event system, so
  // preventDefault + stopImmediatePropagation reliably prevents reactions
  // even after React re-renders the buttons.

  private installReactionBlocker(): void {
    if (this.captureClick) return; // already installed

    const handler = (e: Event): void => {
      if (!this.active) return;
      const target = e.target as Element | null;
      if (!target) return;

      const reactionEl = target.closest(
        '[aria-label*="reaction" i], [aria-label*="React" i], ' +
        '[data-testid="reaction-button"], button[name="reaction"], ' +
        '.js-reaction-popover-container, [class*="reaction"]',
      );

      if (reactionEl) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    this.captureClick     = handler;
    this.captureMousedown = handler;

    document.addEventListener('click',     this.captureClick,     { capture: true });
    document.addEventListener('mousedown', this.captureMousedown, { capture: true });
  }

  private uninstallReactionBlocker(): void {
    if (this.captureClick) {
      document.removeEventListener('click',     this.captureClick,     { capture: true });
      document.removeEventListener('mousedown', this.captureMousedown!, { capture: true });
      this.captureClick     = null;
      this.captureMousedown = null;
    }
  }

  // ─── Observer ──────────────────────────────────────────────────────────

  private startObserver(): void {
    if (this.mutObs) return;

    this.mutObs = new MutationObserver(() => {
      if (this.rafPending || !this.active) return;
      this.rafPending = true;
      requestAnimationFrame(() => {
        this.blockComposers();
        this.injectWarnings();
        this.rafPending = false;
      });
    });

    this.mutObs.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Util ──────────────────────────────────────────────────────────────

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}
