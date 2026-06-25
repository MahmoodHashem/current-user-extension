import { BadgeConfig, BADGE_PRESETS, GitHubAccount } from '../types';
import { AccountGuard, GuardState } from '../services/accountGuard';

// ─── Topbar ───────────────────────────────────────────────────────────────────
//
// Fixed bottom identity strip.  When a comment composer is visible on screen,
// the bar slides down out of view (because CommentAvatar already shows identity
// there).  A shield button on the right opens a per-account guard settings
// popover: each account in the list can be individually enabled/disabled so two
// known accounts can interact on the same issue when needed.
// ─────────────────────────────────────────────────────────────────────────────

export const TOPBAR_ID = 'gh-account-identity-bar';
const HIDDEN_CLASS     = 'gh-id-bar-hidden';
const COMPOSER_SEL     = 'nav[aria-label="View mode"]';
const INTERSECTION_THRESHOLD = 0.15;

// SVG shield icon (GitHub Primer octicon "shield")
const SHIELD_SVG = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
  <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z"/>
</svg>`;

export class Topbar {
  private el:    HTMLElement | null = null;
  private account: GitHubAccount | null = null;
  private guard:   AccountGuard | null = null;
  private guardState: GuardState | null = null;
  private popoverEl: HTMLElement | null = null;

  private intersectionObs: IntersectionObserver | null = null;
  private mutationObs:     MutationObserver | null     = null;
  private observedComposers = new WeakSet<Element>();
  private visibleComposers  = new Set<Element>();
  private mutRafPending     = false;

  // ─── Public API ────────────────────────────────────────────────────────

  mount(account: GitHubAccount, guard: AccountGuard): void {
    this.account = account;
    this.guard   = guard;
    this.ensureElement();
    this.render();
    this.el!.style.display = 'flex';
    this.el!.classList.remove(HIDDEN_CLASS);
    this.wireGuardButton();
    this.trackComposers();
  }

  unmount(): void {
    this.closePopover();
    this.intersectionObs?.disconnect();
    this.mutationObs?.disconnect();
    this.intersectionObs = null;
    this.mutationObs     = null;
    this.visibleComposers.clear();
    this.el?.remove();
    this.el = null;
  }

  /** Called by content.ts whenever guard state changes — updates indicator + open popover. */
  updateGuardState(state: GuardState): void {
    this.guardState = state;
    this.renderGuardIndicator();
    this.syncPopoverToggles(state);
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
    this.el.innerHTML = this.buildBarHTML(this.account, badge);
  }

  // ─── Guard button ───────────────────────────────────────────────────────

  private wireGuardButton(): void {
    const btn = this.el?.querySelector<HTMLButtonElement>('.gh-id-guard-btn');
    if (!btn) return;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      this.popoverEl ? this.closePopover() : this.openPopover();
    });

    // Close popover on outside click.
    document.addEventListener('click', this.onDocClick, { capture: false, passive: true });
  }

  private onDocClick = (e: MouseEvent): void => {
    if (!this.popoverEl) return;
    if (
      !this.popoverEl.contains(e.target as Node) &&
      !(e.target as Element)?.closest?.('.gh-id-guard-btn')
    ) {
      this.closePopover();
    }
  };

  /** Re-colours the shield dot to reflect active/partial/off guard state. */
  private renderGuardIndicator(): void {
    const dot = this.el?.querySelector<HTMLElement>('.gh-id-guard-dot');
    if (!dot || !this.guardState) return;

    const { myAccounts, disabledAccounts, currentUser } = this.guardState;
    const peers = myAccounts.filter(a => a.toLowerCase() !== currentUser.toLowerCase());

    if (peers.length === 0) {
      dot.style.display = 'none';
      return;
    }

    const allDisabled = peers.every(a =>
      disabledAccounts.some(d => d.toLowerCase() === a.toLowerCase()),
    );
    const someDisabled = !allDisabled && disabledAccounts.length > 0;

    dot.style.display  = 'block';
    // green = fully guarded, amber = partial, grey = all paused
    dot.style.background = allDisabled ? '#818b98' : someDisabled ? '#bf8700' : '#1a7f37';
    dot.setAttribute(
      'title',
      allDisabled  ? 'Guard paused for all accounts'  :
      someDisabled ? 'Guard partially active' :
                     'Guard active',
    );
  }

  // ─── Popover ────────────────────────────────────────────────────────────

  private openPopover(): void {
    if (this.popoverEl || !this.el || !this.guardState) return;

    const popover = this.buildPopover(this.guardState);
    this.popoverEl = popover;
    document.body.appendChild(popover);
    this.positionPopover();

    // Wire toggle inputs
    popover.querySelectorAll<HTMLInputElement>('input[data-guard-account]').forEach(inp => {
      inp.addEventListener('change', () => {
        const username = inp.getAttribute('data-guard-account') ?? '';
        this.guard?.toggleAccount(username);
      });
    });

    requestAnimationFrame(() => popover.classList.add('gh-guard-popover--open'));
  }

  private closePopover(): void {
    this.popoverEl?.remove();
    this.popoverEl = null;
  }

  private positionPopover(): void {
    if (!this.popoverEl || !this.el) return;

    const barRect = this.el.getBoundingClientRect();
    const btn = this.el.querySelector<HTMLElement>('.gh-id-guard-btn');
    const btnRect = btn?.getBoundingClientRect() ?? barRect;

    const popoverW = 270;
    let left = btnRect.left + btnRect.width / 2 - popoverW / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - popoverW - 8));

    this.popoverEl.style.bottom = `${window.innerHeight - barRect.top + 10}px`;
    this.popoverEl.style.left   = `${left}px`;
    this.popoverEl.style.width  = `${popoverW}px`;
  }

  /** After a toggle fires, update the checkbox states without rebuilding the popover. */
  private syncPopoverToggles(state: GuardState): void {
    if (!this.popoverEl) return;
    const disabled = new Set(state.disabledAccounts.map(a => a.toLowerCase()));
    this.popoverEl.querySelectorAll<HTMLInputElement>('input[data-guard-account]').forEach(inp => {
      const account = inp.getAttribute('data-guard-account') ?? '';
      inp.checked = !disabled.has(account.toLowerCase());
    });
  }

  private buildPopover(state: GuardState): HTMLElement {
    const el = document.createElement('div');
    el.className = 'gh-guard-popover';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Account Guard Settings');

    const { myAccounts, disabledAccounts, currentUser } = state;
    const disabled = new Set(disabledAccounts.map(a => a.toLowerCase()));

    // Accounts to show: all except the currently logged-in user.
    const peers = myAccounts.filter(
      a => a.toLowerCase() !== currentUser.toLowerCase(),
    );

    const rows = peers.length === 0
      ? `<p class="gh-guard-pop-empty">No other accounts in your list.</p>`
      : peers.map(username => {
          const key     = username.toLowerCase();
          const checked = !disabled.has(key) ? 'checked' : '';
          return `
            <label class="gh-guard-pop-row" aria-label="Toggle guard for @${this.esc(username)}">
              <img
                class="gh-guard-pop-avatar"
                src="https://github.com/${this.esc(username)}.png?size=48"
                width="24" height="24"
                alt="@${this.esc(username)}'s avatar"
                loading="lazy"
              />
              <span class="gh-guard-pop-name">@${this.esc(username)}</span>
              <span class="gh-guard-pop-status">${!disabled.has(key) ? 'Active' : 'Paused'}</span>
              <span class="gh-guard-switch" aria-hidden="true">
                <input
                  type="checkbox"
                  data-guard-account="${this.esc(username)}"
                  ${checked}
                  tabindex="0"
                />
                <span class="gh-guard-track"><span class="gh-guard-thumb"></span></span>
              </span>
            </label>
          `;
        }).join('');

    el.innerHTML = `
      <div class="gh-guard-pop-header">
        ${SHIELD_SVG}
        <span class="gh-guard-pop-title">Account Guard</span>
      </div>
      <p class="gh-guard-pop-desc">
        Block interactions when a selected account has already participated here.
      </p>
      <div class="gh-guard-pop-list">${rows}</div>
      ${currentUser
        ? `<p class="gh-guard-pop-current">
             Signed in as <strong>@${this.esc(currentUser)}</strong>
           </p>`
        : ''}
    `;

    return el;
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
    document.querySelectorAll<Element>(COMPOSER_SEL).forEach(el => {
      if (!this.observedComposers.has(el)) {
        this.observedComposers.add(el);
        this.intersectionObs?.observe(el);
      }
    });
  }

  private showBar(): void {
    if (!this.el) return;
    this.el.style.display = 'flex';
    void this.el.offsetHeight;
    this.el.classList.remove(HIDDEN_CLASS);
  }

  private hideBar(): void {
    if (!this.el) return;
    this.el.classList.add(HIDDEN_CLASS);
    this.closePopover();
  }

  // ─── HTML ────────────────────────────────────────────────────────────────

  private buildBarHTML(account: GitHubAccount, badge: BadgeConfig): string {
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
      <button
        class="gh-id-guard-btn"
        type="button"
        title="Account Guard settings"
        aria-label="Account Guard settings"
        aria-haspopup="dialog"
      >
        ${SHIELD_SVG}
        <span class="gh-id-guard-dot" aria-hidden="true" style="display:none"></span>
      </button>
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
