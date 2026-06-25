import { GuardState } from '../services/accountGuard';

// ─── GuardOverlay ─────────────────────────────────────────────────────────────
//
// Enforces the guard visually and interactively:
//
//   1. NOTICE — a compact inline alert injected as the first child of the
//      CommentBox wrapper (above the Write/Preview tabs).
//
//   2. TEXTAREA OVERLAY — an absolutely-positioned frosted overlay injected
//      inside the textarea's own wrapper, covering just the input area.
//      The textarea gets `readonly` + capture-phase event blockers (keydown,
//      paste, etc.) so input is blocked at both the CSS and JS layers.
//
//   3. SUBMIT BUTTON — `inert` applied directly to the button element so the
//      Comment/Submit button is non-interactive.
//
//   4. REACTIONS — document-level capture listener that prevents
//      click/mousedown on any reaction element before React sees it.
//
//   5. RE-APPLIES on DOM mutations (rAF-debounced) — catches lazily-rendered
//      inline reply forms.
// ─────────────────────────────────────────────────────────────────────────────

const BLOCKED_ATTR     = 'data-gh-guard-blocked';
const NOTICE_CLASS     = 'gh-guard-notice';
const TA_OVERLAY_CLASS = 'gh-guard-ta-overlay';
const EVENTS_TO_BLOCK  = ['keydown', 'keypress', 'keyup', 'paste', 'cut', 'drop', 'beforeinput'];

export class GuardOverlay {
  private active = false;
  private state: GuardState | null = null;

  private captureClick:     ((e: Event) => void) | null = null;
  private captureMousedown: ((e: Event) => void) | null = null;
  private mutObs: MutationObserver | null = null;
  private rafPending = false;

  // textarea → its unified event-blocker function (one per textarea)
  private textareaBlockers = new Map<HTMLTextAreaElement, EventListener>();
  // submit buttons blocked so we can clean them up
  private blockedSubmits   = new Set<HTMLElement>();

  // ─── Public API ────────────────────────────────────────────────────────

  apply(state: GuardState): void {
    this.state  = state;
    this.active = state.isBlocked;

    if (!state.isBlocked) { this.clear(); return; }

    this.blockEditors();
    this.installReactionBlocker();
    this.startObserver();
  }

  clear(): void {
    this.active = false;
    this.mutObs?.disconnect();
    this.mutObs = null;

    document.querySelectorAll(`.${NOTICE_CLASS}`).forEach(el => el.remove());
    document.querySelectorAll(`.${TA_OVERLAY_CLASS}`).forEach(el => el.remove());

    this.textareaBlockers.forEach((blocker, textarea) => this.unblockTextarea(textarea, blocker));
    this.textareaBlockers.clear();

    this.blockedSubmits.forEach(btn => {
      btn.removeAttribute('inert');
      btn.removeAttribute(BLOCKED_ATTR);
    });
    this.blockedSubmits.clear();

    this.uninstallReactionBlocker();
  }

  // ─── Editor blocking ───────────────────────────────────────────────────

  private blockEditors(): void {
    // Prune stale references (detached DOM nodes)
    this.textareaBlockers.forEach((_, ta) => {
      if (!document.body.contains(ta)) this.textareaBlockers.delete(ta);
    });
    this.blockedSubmits.forEach(btn => {
      if (!document.body.contains(btn)) this.blockedSubmits.delete(btn);
    });

    document.querySelectorAll<HTMLElement>('nav[aria-label="View mode"]').forEach(nav => {
      const wrapper  = this.findCommentBoxWrapper(nav);
      if (!wrapper) return;

      const textarea = wrapper.querySelector<HTMLTextAreaElement>('textarea');
      if (!textarea) return;

      // ① Inline notice above Write/Preview tabs
      if (!wrapper.querySelector(`.${NOTICE_CLASS}`)) {
        wrapper.insertBefore(this.buildNotice(this.state!), wrapper.firstChild);
      }

      // ② Block the textarea itself
      if (!this.textareaBlockers.has(textarea)) {
        this.blockTextarea(textarea);
      }

      // ③ Overlay covering just the textarea area
      const taWrapper = textarea.parentElement;
      if (taWrapper && !taWrapper.querySelector(`.${TA_OVERLAY_CLASS}`)) {
        (taWrapper as HTMLElement).style.position = 'relative';
        taWrapper.appendChild(this.buildTextareaOverlay(this.state!));
      }

      // ④ Block the submit button (it lives in the footer, one level up from the CommentBox)
      const submitBtn = wrapper.parentElement?.querySelector<HTMLElement>('button[type="submit"]');
      if (submitBtn && !submitBtn.hasAttribute(BLOCKED_ATTR)) {
        submitBtn.setAttribute('inert', '');
        submitBtn.setAttribute(BLOCKED_ATTR, 'submit');
        this.blockedSubmits.add(submitBtn);
      }
    });
  }

  private blockTextarea(textarea: HTMLTextAreaElement): void {
    const blocker = (e: Event) => { e.preventDefault(); e.stopImmediatePropagation(); };
    EVENTS_TO_BLOCK.forEach(t => textarea.addEventListener(t, blocker, { capture: true }));
    this.textareaBlockers.set(textarea, blocker);
    textarea.setAttribute(BLOCKED_ATTR, 'textarea');
    textarea.setAttribute('readonly', '');
  }

  private unblockTextarea(textarea: HTMLTextAreaElement, blocker: EventListener): void {
    EVENTS_TO_BLOCK.forEach(t => textarea.removeEventListener(t, blocker, { capture: true }));
    textarea.removeAttribute(BLOCKED_ATTR);
    textarea.removeAttribute('readonly');
    // Remove the overlay from the textarea's parent
    textarea.parentElement?.querySelector(`.${TA_OVERLAY_CLASS}`)?.remove();
    if (textarea.parentElement?.style.position === 'relative') {
      (textarea.parentElement as HTMLElement).style.position = '';
    }
  }

  // Walk up from the tab-nav to the first ancestor that contains a textarea.
  private findCommentBoxWrapper(nav: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = nav.parentElement;
    for (let i = 0; i < 10; i++) {
      if (!el) return null;
      if (el.querySelector('textarea')) return el;
      el = el.parentElement;
    }
    return null;
  }

  // ─── Notice (small inline alert) ───────────────────────────────────────

  private buildNotice(state: GuardState): HTMLElement {
    const el = document.createElement('div');
    el.className = NOTICE_CLASS;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <span class="gh-guard-notice-icon" aria-hidden="true">⊘</span>
      <span class="gh-guard-notice-text">
        <code class="gh-guard-code-sm">@${this.esc(state.usedAccount ?? '')}</code>
        already participated here — switch accounts to interact.
      </span>`;
    return el;
  }

  // ─── Textarea overlay ──────────────────────────────────────────────────

  private buildTextareaOverlay(state: GuardState): HTMLElement {
    const el = document.createElement('div');
    el.className = TA_OVERLAY_CLASS;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="gh-guard-ta-inner">
        <span class="gh-guard-ta-icon">⊘</span>
        <strong class="gh-guard-ta-title">Commenting blocked</strong>
        <span class="gh-guard-ta-detail">
          <code class="gh-guard-code-sm">@${this.esc(state.usedAccount ?? '')}</code>
          already participated · signed in as
          <code class="gh-guard-code-sm">@${this.esc(state.currentUser)}</code>
        </span>
      </div>`;
    return el;
  }

  // ─── Reaction blocker ──────────────────────────────────────────────────

  private installReactionBlocker(): void {
    if (this.captureClick) return;

    const handler = (e: Event): void => {
      if (!this.active) return;
      const t = e.target as Element | null;
      if (t?.closest(
        '[aria-label*="reaction" i],[aria-label*="React" i],' +
        '[data-testid="reaction-button"],button[name="reaction"],' +
        '.js-reaction-popover-container,[class*="reaction"]',
      )) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };

    this.captureClick     = handler;
    this.captureMousedown = handler;
    document.addEventListener('click',     handler, { capture: true });
    document.addEventListener('mousedown', handler, { capture: true });
  }

  private uninstallReactionBlocker(): void {
    if (!this.captureClick) return;
    document.removeEventListener('click',     this.captureClick,     { capture: true });
    document.removeEventListener('mousedown', this.captureMousedown!, { capture: true });
    this.captureClick = this.captureMousedown = null;
  }

  // ─── Observer ──────────────────────────────────────────────────────────

  private startObserver(): void {
    if (this.mutObs) return;
    this.mutObs = new MutationObserver(() => {
      if (this.rafPending || !this.active) return;
      this.rafPending = true;
      requestAnimationFrame(() => { this.blockEditors(); this.rafPending = false; });
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
