// ─── ScrollToBottom ─────────────────────────────────────────────────────────
//
// A minimal circular button, bottom-right corner of the viewport, mirroring
// the identity widget's circle language on the opposite side.
//
// Behaviour mirrors chat apps (Telegram, etc.):
//   - Hidden while already at the bottom of the page (or the page doesn't
//     scroll at all).
//   - Fades/slides in as soon as the user scrolls away from the bottom.
//   - Click smooth-scrolls the page to the very bottom.
// ─────────────────────────────────────────────────────────────────────────────

export const SCROLL_BOTTOM_ID = 'gh-scroll-bottom-btn';

const NEAR_BOTTOM_PX = 80;

const ARROW_SVG = `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
  <path d="M8 2a.75.75 0 0 1 .75.75v7.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V2.75A.75.75 0 0 1 8 2Z"/>
</svg>`;

export class ScrollToBottom {
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
    btn.id = SCROLL_BOTTOM_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Scroll to bottom of page');
    btn.title = 'Scroll to bottom';
    btn.innerHTML = ARROW_SVG;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
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
    const isScrollable   = scrollHeight - viewportHeight > NEAR_BOTTOM_PX;
    const distanceFromBottom = scrollHeight - (window.scrollY + viewportHeight);
    const shouldShow = isScrollable && distanceFromBottom > NEAR_BOTTOM_PX;

    if (shouldShow === this.visible) return;
    this.visible = shouldShow;
    this.el.classList.toggle('gh-scroll-bottom-visible', shouldShow);
  }
}
