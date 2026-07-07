// ─── ScrollToTop ────────────────────────────────────────────────────────────
//
// A minimal circular button, bottom-right corner of the viewport, stacked
// directly above the ScrollToBottom button.
//
// Behaviour mirrors chat apps (Telegram, etc.):
//   - Hidden while already at the top of the page (or the page doesn't
//     scroll at all).
//   - Fades/slides in as soon as the user scrolls away from the top.
//   - Click smooth-scrolls the page to the very top.
// ─────────────────────────────────────────────────────────────────────────────

export const SCROLL_TOP_ID = 'gh-scroll-top-btn';

const NEAR_TOP_PX = 80;

const ARROW_SVG = `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
  <path d="M8 14a.75.75 0 0 1-.75-.75V5.56L4.53 8.28a.75.75 0 1 1-1.06-1.06l4-4a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06L8.75 5.56v7.69A.75.75 0 0 1 8 14Z"/>
</svg>`;

export class ScrollToTop {
  private el: HTMLButtonElement | null = null;
  private visible = false;
  private rafPending = false;

  mount(): void {
    this.ensureElement();
    this.checkVisibility();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
  }

  unmount(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    this.el?.remove();
    this.el = null;
    this.visible = false;
  }

  // Call after DOM content changes (page height may have changed).
  recheck(): void {
    this.checkVisibility();
  }

  private ensureElement(): void {
    if (this.el && document.body.contains(this.el)) return;
    const btn = document.createElement('button');
    btn.id = SCROLL_TOP_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Scroll to top of page');
    btn.title = 'Scroll to top';
    btn.innerHTML = ARROW_SVG;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
    this.el = btn;
  }

  private onScroll = (): void => {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.checkVisibility();
      this.rafPending = false;
    });
  };

  private checkVisibility(): void {
    if (!this.el) return;

    const scrollHeight   = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const isScrollable   = scrollHeight - viewportHeight > NEAR_TOP_PX;
    const shouldShow = isScrollable && window.scrollY > NEAR_TOP_PX;

    if (shouldShow === this.visible) return;
    this.visible = shouldShow;
    this.el.classList.toggle('gh-scroll-top-visible', shouldShow);
  }
}
