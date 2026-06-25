import { BadgeConfig, BADGE_PRESETS, GitHubAccount } from '../types';
import { AccountGuard, GuardState } from '../services/accountGuard';

// ─── Topbar ───────────────────────────────────────────────────────────────────
//
// Two floating circles, bottom-left corner of the viewport:
//
//   ● Large circle  — avatar image; hover reveals a tooltip with name + badge.
//                     Click opens the GitHub profile.
//   ● Small circle  — shield icon for Account Guard; click opens the per-account
//                     toggle popover.
//
// Both circles slide-fade out when a comment composer enters the viewport.
// ─────────────────────────────────────────────────────────────────────────────

export const TOPBAR_ID = 'gh-account-identity-bar';


const SHIELD_SVG = `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
  <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z"/>
</svg>`;

export class Topbar {
  private el:         HTMLElement | null = null;
  private account:    GitHubAccount | null = null;
  private guard:      AccountGuard | null = null;
  private guardState: GuardState | null = null;
  private popoverEl:  HTMLElement | null = null;

  // ─── Public API ────────────────────────────────────────────────────────

  mount(account: GitHubAccount, guard: AccountGuard): void {
    this.account = account;
    this.guard   = guard;
    this.ensureElement();
    this.render();
    this.el!.style.display = 'flex';
    this.wireAvatarCircle();
    this.wireGuardCircle();
  }

  unmount(): void {
    this.closePopover();
    document.removeEventListener('click', this.onDocClick);
    this.el?.remove();
    this.el = null;
  }

  updateGuardState(state: GuardState): void {
    this.guardState = state;
    this.renderGuardDot();
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
    this.el.innerHTML = this.buildHTML(this.account, badge);
  }

  // ─── Avatar circle ──────────────────────────────────────────────────────

  private wireAvatarCircle(): void {
    const circle = this.el?.querySelector<HTMLElement>('.gh-id-avatar-circle');
    if (!circle || !this.account) return;

    const url = this.account.profileUrl;
    circle.addEventListener('click', () => window.open(url, '_blank', 'noopener,noreferrer'));
    circle.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  }

  // ─── Guard circle ───────────────────────────────────────────────────────

  private wireGuardCircle(): void {
    const btn = this.el?.querySelector<HTMLButtonElement>('.gh-id-guard-circle');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      this.popoverEl ? this.closePopover() : this.openPopover();
    });
    document.addEventListener('click', this.onDocClick);
  }

  private onDocClick = (e: MouseEvent): void => {
    if (!this.popoverEl) return;
    if (
      !this.popoverEl.contains(e.target as Node) &&
      !(e.target as Element)?.closest?.('.gh-id-guard-circle')
    ) {
      this.closePopover();
    }
  };

  private renderGuardDot(): void {
    const dot = this.el?.querySelector<HTMLElement>('.gh-id-guard-dot');
    if (!dot || !this.guardState) return;

    const { myAccounts, disabledAccounts, currentUser } = this.guardState;
    const peers = myAccounts.filter(a => a.toLowerCase() !== currentUser.toLowerCase());

    if (peers.length === 0) { dot.style.display = 'none'; return; }

    const allPaused  = peers.every(a => disabledAccounts.some(d => d.toLowerCase() === a.toLowerCase()));
    const somePaused = !allPaused && disabledAccounts.length > 0;

    dot.style.display    = 'block';
    dot.style.background = allPaused ? '#818b98' : somePaused ? '#bf8700' : '#1a7f37';
  }

  // ─── Popover ────────────────────────────────────────────────────────────

  private openPopover(): void {
    if (this.popoverEl || !this.guardState) return;

    const popover = this.buildPopover(this.guardState);
    this.popoverEl = popover;
    document.body.appendChild(popover);
    this.positionPopover();

    popover.querySelectorAll<HTMLInputElement>('input[data-guard-account]').forEach(inp => {
      inp.addEventListener('change', () => {
        this.guard?.toggleAccount(inp.getAttribute('data-guard-account') ?? '');
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

    const guardCircle = this.el.querySelector<HTMLElement>('.gh-id-guard-circle');
    const rect = (guardCircle ?? this.el).getBoundingClientRect();
    const W = 264;
    let left = rect.left + rect.width / 2 - W / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - W - 8));

    this.popoverEl.style.bottom = `${window.innerHeight - rect.top + 12}px`;
    this.popoverEl.style.left   = `${left}px`;
    this.popoverEl.style.width  = `${W}px`;
  }

  private syncPopoverToggles(state: GuardState): void {
    if (!this.popoverEl) return;
    const disabled = new Set(state.disabledAccounts.map(a => a.toLowerCase()));
    this.popoverEl.querySelectorAll<HTMLInputElement>('input[data-guard-account]').forEach(inp => {
      const key     = (inp.getAttribute('data-guard-account') ?? '').toLowerCase();
      inp.checked   = !disabled.has(key);
      const statusEl = inp.closest('.gh-guard-pop-row')?.querySelector('.gh-guard-pop-status');
      if (statusEl) statusEl.textContent = inp.checked ? 'Active' : 'Paused';
    });
    this.renderGuardDot();
  }

  private buildPopover(state: GuardState): HTMLElement {
    const el = document.createElement('div');
    el.className = 'gh-guard-popover';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Account Guard Settings');

    const { myAccounts, disabledAccounts, currentUser } = state;
    const disabled = new Set(disabledAccounts.map(a => a.toLowerCase()));
    const peers    = myAccounts.filter(a => a.toLowerCase() !== currentUser.toLowerCase());

    const rows = peers.length === 0
      ? `<p class="gh-guard-pop-empty">No other accounts in your list.</p>`
      : peers.map(u => {
          const active = !disabled.has(u.toLowerCase());
          return `
            <label class="gh-guard-pop-row">
              <img class="gh-guard-pop-avatar"
                   src="https://github.com/${this.esc(u)}.png?size=48"
                   width="22" height="22" alt="" loading="lazy" />
              <span class="gh-guard-pop-name">@${this.esc(u)}</span>
              <span class="gh-guard-pop-status">${active ? 'Active' : 'Paused'}</span>
              <span class="gh-guard-switch" aria-hidden="true">
                <input type="checkbox" data-guard-account="${this.esc(u)}" ${active ? 'checked' : ''} />
                <span class="gh-guard-track"><span class="gh-guard-thumb"></span></span>
              </span>
            </label>`;
        }).join('');

    el.innerHTML = `
      <div class="gh-guard-pop-header">
        ${SHIELD_SVG}
        <span class="gh-guard-pop-title">Account Guard</span>
      </div>
      <p class="gh-guard-pop-desc">Block interactions if a selected account has already participated here.</p>
      <div class="gh-guard-pop-list">${rows}</div>
      ${currentUser ? `<p class="gh-guard-pop-current">Signed in as <strong>@${this.esc(currentUser)}</strong></p>` : ''}
    `;
    return el;
  }

  // ─── HTML ────────────────────────────────────────────────────────────────

  private buildHTML(account: GitHubAccount, badge: BadgeConfig): string {
    const emailLine = account.email
      ? `<a class="gh-id-tt-email" href="mailto:${this.esc(account.email)}">${this.esc(account.email)}</a>`
      : '';

    return `
      <div class="gh-id-avatar-circle" tabindex="0" role="link"
           aria-label="@${this.esc(account.username)} — view GitHub profile">
        <img class="gh-id-avatar-img"
             src="${this.esc(account.avatarUrl)}?size=96"
             alt="${this.esc(account.username)}'s avatar"
             width="48" height="48" loading="lazy" />
        <div class="gh-id-avatar-tooltip" role="tooltip">
          <img class="gh-id-tt-avatar"
               src="${this.esc(account.avatarUrl)}?size=80"
               alt="" width="36" height="36" loading="lazy" />
          <div class="gh-id-tt-info">
            <span class="gh-id-tt-name">${this.esc(account.displayName)}</span>
            <span class="gh-id-tt-handle">@${this.esc(account.username)}</span>
            ${emailLine}
            <div class="gh-id-tt-badge"
                 style="color:${badge.fgColor};background:${badge.bgColor};border-color:${badge.borderColor}">
              <span class="gh-id-dot" style="background:${badge.dotColor}" aria-hidden="true"></span>
              ${this.esc(badge.label)}
            </div>
          </div>
        </div>
      </div>

      <button class="gh-id-guard-circle" type="button"
              aria-label="Account Guard settings" aria-haspopup="dialog" title="Account Guard">
        ${SHIELD_SVG}
        <span class="gh-id-guard-dot" aria-hidden="true" style="display:none"></span>
      </button>
    `;
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}
