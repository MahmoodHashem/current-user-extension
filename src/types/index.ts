// ─── Account data ──────────────────────────────────────────────────────────

export interface GitHubAccount {
  username: string;
  /** May be same as username if display name not found in page */
  displayName: string;
  email: string | null;
  /** Always resolvable: built from username via avatars.githubusercontent.com */
  avatarUrl: string;
  profileUrl: string;
  accountType: AccountType;
  bio: string | null;
  organizations: string[];
  /** Raw text pulled from page stats, e.g. "123" */
  followers: string | null;
  following: string | null;
  publicRepos: string | null;
}

export type AccountType = 'personal' | 'organization' | 'enterprise' | 'unknown';

// ─── Badge configuration (extensible for multi-account theming) ─────────────

export interface BadgeConfig {
  type: AccountType;
  label: string;
  /** CSS colour for the dot indicator */
  dotColor: string;
  /** Foreground text colour */
  fgColor: string;
  /** Background colour of the badge chip */
  bgColor: string;
  /** Border colour of the badge chip */
  borderColor: string;
}

// Well-known badge presets.  Future: load from extension storage so the user
// can label individual accounts as "Work" / "OSS" / "Personal".
export const BADGE_PRESETS: Record<AccountType, BadgeConfig> = {
  personal: {
    type: 'personal',
    label: 'Current Account',
    dotColor: '#2da44e',
    fgColor: '#1a7f37',
    bgColor: '#dafbe1',
    borderColor: 'rgba(45,164,78,0.25)',
  },
  organization: {
    type: 'organization',
    label: 'Org Account',
    dotColor: '#0969da',
    fgColor: '#0550ae',
    bgColor: '#ddf4ff',
    borderColor: 'rgba(9,105,218,0.25)',
  },
  enterprise: {
    type: 'enterprise',
    label: 'Enterprise',
    dotColor: '#8250df',
    fgColor: '#6639ba',
    bgColor: '#fbefff',
    borderColor: 'rgba(130,80,223,0.25)',
  },
  unknown: {
    type: 'unknown',
    label: 'Current Account',
    dotColor: '#656d76',
    fgColor: '#444c56',
    bgColor: '#f6f8fa',
    borderColor: 'rgba(101,109,118,0.25)',
  },
};

// ─── Layout mode ─────────────────────────────────────────────────────────────

export type LayoutMode = 'sidebar' | 'topbar' | 'hidden';
