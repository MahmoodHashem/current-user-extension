import { STORAGE_KEY, DEFAULT_ACCOUNTS } from '../services/accountGuard';

// ─── Popup: manage the "my accounts" list stored in chrome.storage.sync ───────

const list    = document.getElementById('account-list') as HTMLUListElement;
const input   = document.getElementById('new-account')  as HTMLInputElement;
const addBtn  = document.getElementById('add-btn')       as HTMLButtonElement;
const status  = document.getElementById('status')        as HTMLParagraphElement;

let accounts: string[] = [];

function renderList(): void {
  list.innerHTML = '';

  if (accounts.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No accounts added yet.';
    list.appendChild(empty);
    return;
  }

  accounts.forEach((username, idx) => {
    const li  = document.createElement('li');
    li.className = 'account-row';

    const name = document.createElement('span');
    name.className = 'account-name';
    name.textContent = `@${username}`;

    const del = document.createElement('button');
    del.className   = 'remove-btn';
    del.textContent = '✕';
    del.setAttribute('aria-label', `Remove @${username}`);
    del.addEventListener('click', () => removeAccount(idx));

    li.appendChild(name);
    li.appendChild(del);
    list.appendChild(li);
  });
}

function save(newAccounts: string[]): void {
  accounts = newAccounts;
  chrome.storage.sync.set({ [STORAGE_KEY]: accounts }, () => {
    renderList();
    showStatus('Saved ✓');
  });
}

function removeAccount(idx: number): void {
  save(accounts.filter((_, i) => i !== idx));
}

function addAccount(): void {
  const raw = input.value.trim().replace(/^@/, '');

  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,37}$/.test(raw)) {
    showStatus('Invalid username.', true);
    return;
  }

  if (accounts.some(a => a.toLowerCase() === raw.toLowerCase())) {
    showStatus('Already in the list.', true);
    return;
  }

  input.value = '';
  save([...accounts, raw]);
}

function showStatus(msg: string, isError = false): void {
  status.textContent  = msg;
  status.style.color  = isError ? '#cf222e' : '#1a7f37';
  clearTimeout((showStatus as any)._t);
  (showStatus as any)._t = setTimeout(() => { status.textContent = ''; }, 2500);
}

// ─── Event wiring ──────────────────────────────────────────────────────────

addBtn.addEventListener('click', addAccount);

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addAccount();
});

// ─── Boot ──────────────────────────────────────────────────────────────────

chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULT_ACCOUNTS }, result => {
  accounts = result[STORAGE_KEY] as string[];
  renderList();
});
