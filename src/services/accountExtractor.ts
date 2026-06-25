import { AccountType, GitHubAccount } from '../types';

// ─── AccountExtractor ─────────────────────────────────────────────────────────
//
// Extracts the currently authenticated GitHub account from the page DOM
// without making any API calls.
//
// Extraction chain (most-to-least reliable):
//   1. <meta name="user-login"> — GitHub injects this on every authenticated page.
//   2. data-login attributes on header elements.
//   3. AppHeader user-menu button text / aria label.
//   4. Embedded JSON in <script type="application/json"> data-target tags.
//
// Avatar is always constructed from the username via GitHub's avatar service,
// which works without authentication and never 404s for real accounts.
// ─────────────────────────────────────────────────────────────────────────────

export class AccountExtractor {
  extract(): GitHubAccount | null {
    const username = this.extractUsername();
    if (!username) return null;

    return {
      username,
      displayName: this.extractDisplayName() ?? username,
      email: this.extractEmail(),
      avatarUrl: this.buildAvatarUrl(username),
      profileUrl: `https://github.com/${username}`,
      accountType: this.detectAccountType(username),
      bio: this.extractBio(),
      organizations: [],
      followers: null,
      following: null,
      publicRepos: null,
    };
  }

  // ─── Username ──────────────────────────────────────────────────────────────

  private extractUsername(): string | null {
    // Strategy 1: meta tag — GitHub adds this to every authenticated page.
    // This is the most reliable single source.
    const metaLogin = document
      .querySelector<HTMLMetaElement>('meta[name="user-login"]')
      ?.getAttribute('content');
    if (metaLogin) return metaLogin.trim();

    // Strategy 2: data-login attributes (e.g. on the signed-in user's avatar
    // dropdown trigger in the AppHeader).
    const dataLoginEl = document.querySelector<HTMLElement>(
      'button[data-login], [data-login][data-hpc]',
    );
    const dataLogin = dataLoginEl?.dataset.login;
    if (dataLogin) return dataLogin.trim();

    // Strategy 3: AppHeader — the "You have no unread notifications" link
    // often carries the account login in its href or aria-label.
    const ariaLabel = document
      .querySelector<HTMLElement>('[aria-label^="View profile and more"]')
      ?.getAttribute('aria-label');
    if (ariaLabel) {
      // e.g. "View profile and more (username)"
      const match = ariaLabel.match(/\(([^)]+)\)/);
      if (match?.[1]) return match[1].trim();
    }

    // Strategy 4: header avatar img — GitHub uses the username as the alt text
    // on the signed-in user's avatar img in the top-right menu.
    const avatarImg = document.querySelector<HTMLImageElement>(
      '.AppHeader-user img.avatar-user, ' +
      '.Header-link .avatar-user, ' +
      'img.avatar-user[alt]',
    );
    if (avatarImg?.alt) return avatarImg.alt.replace(/^@/, '').trim();

    // Strategy 5: Embedded JSON payloads from GitHub's React/Turbo pages.
    const fromJson = this.extractUsernameFromEmbeddedJson();
    if (fromJson) return fromJson;

    return null;
  }

  // ─── Display name ──────────────────────────────────────────────────────────

  private extractDisplayName(): string | null {
    // On a user's own profile page the name is in an h1.vcard-names span.
    const nameEl = document.querySelector<HTMLElement>(
      '[itemprop="name"], .p-name, .vcard-fullname',
    );
    const name = nameEl?.textContent?.trim();
    return name || null;
  }

  // ─── Email ─────────────────────────────────────────────────────────────────

  private extractEmail(): string | null {
    // GitHub surfaces the public email on profile pages.
    const emailEl = document.querySelector<HTMLElement>(
      '[itemprop="email"], .p-email',
    );
    const emailText = emailEl?.textContent?.trim();
    if (emailText) return emailText;

    // Fallback: look for a mailto: link inside a profile card area.
    const mailtoLink = document.querySelector<HTMLAnchorElement>(
      'a[href^="mailto:"]',
    );
    if (mailtoLink) return mailtoLink.href.replace('mailto:', '').trim();

    return null;
  }

  // ─── Bio ───────────────────────────────────────────────────────────────────

  private extractBio(): string | null {
    const bioEl = document.querySelector<HTMLElement>(
      '.p-note, [itemprop="description"]',
    );
    return bioEl?.textContent?.trim() ?? null;
  }

  // ─── Avatar URL ────────────────────────────────────────────────────────────

  private buildAvatarUrl(username: string): string {
    // Prefer the in-page avatar so we get the exact size cached by the browser.
    const headerAvatar = document.querySelector<HTMLImageElement>(
      '.AppHeader-user img.avatar-user, img.avatar-user',
    );
    if (headerAvatar?.src && headerAvatar.src.includes('avatars.githubusercontent.com')) {
      // Strip the size param so we can request a specific size later.
      return headerAvatar.src.replace(/[?&]s=\d+/, '');
    }

    // GitHub's avatar CDN always resolves for any valid username.
    return `https://avatars.githubusercontent.com/${encodeURIComponent(username)}`;
  }

  // ─── Account type ──────────────────────────────────────────────────────────

  private detectAccountType(_username: string): AccountType {
    // GitHub doesn't surface account type in page metadata on issue/PR pages.
    // Future: look at org membership, [data-hovercard-type], or extension storage
    // for a user-configured label.  Default to personal.
    return 'personal';
  }

  // ─── Embedded JSON extraction ──────────────────────────────────────────────

  private extractUsernameFromEmbeddedJson(): string | null {
    // GitHub's newer React/Turbo pages embed payload data in
    // <script type="application/json" data-target="react-app.embeddedData">
    const scriptEls = document.querySelectorAll<HTMLScriptElement>(
      'script[type="application/json"][data-target], ' +
      'script[type="application/json"][data-component-name]',
    );

    for (const script of scriptEls) {
      const login = this.searchJsonForLogin(script.textContent ?? '');
      if (login) return login;
    }

    return null;
  }

  private searchJsonForLogin(raw: string): string | null {
    try {
      const data: unknown = JSON.parse(raw);
      return this.walkForLogin(data, 0);
    } catch {
      return null;
    }
  }

  // Recursively walks an unknown JSON structure looking for a `login` field
  // near the root so we don't accidentally pick up a comment author's login.
  private walkForLogin(node: unknown, depth: number): string | null {
    if (depth > 4 || node === null || typeof node !== 'object') return null;

    const obj = node as Record<string, unknown>;

    // Prefer keys that indicate the current viewer / current user.
    const viewerFields = ['viewer', 'current_user', 'currentUser', 'user'];
    for (const key of viewerFields) {
      if (key in obj) {
        const sub = obj[key];
        if (typeof sub === 'object' && sub !== null) {
          const login = (sub as Record<string, unknown>)['login'];
          if (typeof login === 'string' && login) return login;
        }
      }
    }

    for (const value of Object.values(obj)) {
      const result = this.walkForLogin(value, depth + 1);
      if (result) return result;
    }

    return null;
  }
}
