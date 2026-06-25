import { BadgeConfig, BADGE_PRESETS, GitHubAccount } from '../types';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
//
// Renders a sticky card in the left gutter of GitHub's issue/PR layout.
// Only shown when there is enough left-gutter space (detected via JS so it
// works regardless of which GitHub redesign is active).
//
// Positioning strategy:
//   We query the bounding rect of GitHub's main content container and place
//   ourselves in the gap to its left.  If that gap < MIN_GUTTER_PX we hide
//   and let the topbar take over.
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_ID = 'gh-account-identity-sidebar';
const SIDEBAR_WIDTH = 190;
const MIN_GUTTER_PX = SIDEBAR_WIDTH + 16;   // 16px minimum inner margin

// CSS selectors that identify GitHub's main timeline / content area.
// Listed in priority order — we stop at the first one that resolves.
const CONTENT_SELECTORS = [
  '.Layout-main',
  '[data-hpc] .js-discussion',
  '.js-issues-results',
  '[role="main"] .container-xl',
  'main.js-pjax-container',
  '#js-pjax-container',
  'main',
];

export class Sidebar {
  private el: HTMLElement | null = null;
  private account: GitHubAccount | null = null;

  mount(account: GitHubAccount): void {
    this.account = account;
    this.ensureElement();
    this.render();
  }

  unmount(): void {
    this.el?.remove();
    this.el = null;
  }

  /** Returns true if the sidebar was shown, false if not enough space. */
  updatePosition(): boolean {
    if (!this.el) return false;
    return this.applyPosition();
  }

  // ─── DOM management ──────────────────────────────────────────────────────

  private ensureElement(): void {
    if (this.el && document.body.contains(this.el)) return;

    const el = document.createElement('aside');
    el.id = SIDEBAR_ID;
    el.setAttribute('role', 'complementary');
    el.setAttribute('aria-label', 'Current GitHub account identity');
    document.body.appendChild(el);
    this.el = el;
  }

  private render(): void {
    if (!this.el || !this.account) return;

    const account = this.account;
    const badge = BADGE_PRESETS[account.accountType];
    const positioned = this.applyPosition();

    this.el.innerHTML = this.buildHTML(account, badge);
    this.el.style.display = positioned ? 'block' : 'none';
  }

  // ─── Positioning ─────────────────────────────────────────────────────────

  private applyPosition(): boolean {
    if (!this.el) return false;

    const contentEl = this.findContentElement();
    if (!contentEl) {
      this.el.style.display = 'none';
      return false;
    }

    const rect = contentEl.getBoundingClientRect();
    const leftGutter = rect.left;  // px from viewport left to content edge

    if (leftGutter < MIN_GUTTER_PX) {
      this.el.style.display = 'none';
      return false;
    }

    // Center the card within the available gutter, with an 8px inner margin.
    const cardLeft = Math.max(8, leftGutter - SIDEBAR_WIDTH - 8);

    // Detect the GitHub header height so we don't overlap it.
    const headerEl = document.querySelector<HTMLElement>(
      '.AppHeader, #top, header[role="banner"], .Header',
    );
    const headerHeight = headerEl ? headerEl.offsetHeight : 60;
    const topOffset = headerHeight + 16;

    this.el.style.left = `${cardLeft}px`;
    this.el.style.top = `${topOffset}px`;
    this.el.style.display = 'block';

    return true;
  }

  private findContentElement(): Element | null {
    for (const sel of CONTENT_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ─── HTML template ───────────────────────────────────────────────────────

  private buildHTML(account: GitHubAccount, badge: BadgeConfig): string {
    const emailHtml = account.email
      ? `<a class="gh-id-email" href="mailto:${this.esc(account.email)}" title="${this.esc(account.email)}" aria-label="Email: ${this.esc(account.email)}">
           <span class="gh-id-icon" aria-hidden="true">✉</span>${this.esc(account.email)}
         </a>`
      : '';

    const statsHtml =
      account.followers !== null || account.publicRepos !== null
        ? `<div class="gh-id-stats" aria-label="Account statistics">
            ${account.publicRepos !== null ? `<span title="Public repositories">${this.esc(account.publicRepos)} repos</span>` : ''}
            ${account.followers !== null ? `<span title="Followers">${this.esc(account.followers)} followers</span>` : ''}
           </div>`
        : '';

    return `
      <div class="gh-id-card" role="region" aria-label="Account identity card">
        <div class="gh-id-badge" style="color:${badge.fgColor};background:${badge.bgColor};border-color:${badge.borderColor}" aria-label="${badge.label}">
          <span class="gh-id-dot" style="background:${badge.dotColor}" aria-hidden="true"></span>
          ${this.esc(badge.label)}
        </div>

        <a href="${this.esc(account.profileUrl)}" target="_blank" rel="noopener noreferrer" class="gh-id-avatar-link" aria-label="View ${this.esc(account.username)}'s GitHub profile">
          <img
            class="gh-id-avatar"
            src="${this.esc(account.avatarUrl)}?size=160"
            alt="${this.esc(account.username)}'s avatar"
            width="80"
            height="80"
            loading="lazy"
          />
        </a>

        <div class="gh-id-name" aria-label="Display name: ${this.esc(account.displayName)}">${this.esc(account.displayName)}</div>
        <div class="gh-id-handle" aria-label="Username: @${this.esc(account.username)}">@${this.esc(account.username)}</div>

        ${account.bio ? `<div class="gh-id-bio" aria-label="Bio: ${this.esc(account.bio)}">${this.esc(account.bio)}</div>` : ''}
        ${emailHtml}
        ${statsHtml}

        <nav class="gh-id-links" aria-label="Quick links">
          <a href="${this.esc(account.profileUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Go to profile page">Profile</a>
          <a href="${this.esc(account.profileUrl)}?tab=repositories" target="_blank" rel="noopener noreferrer" aria-label="View repositories">Repositories</a>
          <a href="${this.esc(account.profileUrl)}?tab=projects" target="_blank" rel="noopener noreferrer" aria-label="View projects">Projects</a>
        </nav>
      </div>
    `;
  }

  /** Escapes user-sourced strings for safe HTML insertion. */
  private esc(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
