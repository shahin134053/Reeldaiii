import { DEVELOPER_PROFILE } from './developerProfile';

/**
 * Ensures the SupportKori floating widget button and popup iframe container
 * exist, are accessible, and respond to in-page "Support Shahin" triggers
 * on both the Front Page and the Developer Page.
 */
export function ensureSupportKoriWidgetMounted(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const cfg = DEVELOPER_PROFILE.supportKori;

  // Add responsive & accessible enhancement styles once
  if (!document.getElementById('sk-widget-enhanced-style')) {
    const extraStyle = document.createElement('style');
    extraStyle.id = 'sk-widget-enhanced-style';
    extraStyle.textContent = `
      body .sk-widget-btn {
        position: fixed !important;
        bottom: 20px !important;
        ${cfg.position}: 20px !important;
        z-index: 999998 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        background: ${cfg.color} !important;
        color: #111111 !important;
        padding: 10px 16px !important;
        border-radius: 50px !important;
        border: 1px solid rgba(0, 0, 0, 0.14) !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
        cursor: pointer !important;
        font-family: inherit !important;
        font-weight: 700 !important;
        font-size: 13px !important;
        line-height: 1 !important;
        transition: transform 0.18s ease, box-shadow 0.18s ease !important;
        text-decoration: none !important;
        user-select: none !important;
      }
      body .sk-widget-btn:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.32) !important;
      }
      body .sk-widget-btn:focus-visible {
        outline: 2px solid #FFAC1C !important;
        outline-offset: 2px !important;
      }
      body .sk-widget-btn svg {
        width: 18px !important;
        height: 18px !important;
        flex-shrink: 0 !important;
      }
      body .sk-widget-iframe-container {
        position: fixed !important;
        bottom: 76px !important;
        ${cfg.position}: 20px !important;
        z-index: 999999 !important;
        width: 350px !important;
        max-width: calc(100vw - 24px) !important;
        height: min(550px, calc(100vh - 104px)) !important;
        border-radius: 16px !important;
        background: #141418 !important;
        border: 1px solid rgba(255, 221, 0, 0.35) !important;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45) !important;
        opacity: 0;
        pointer-events: none;
        transform: translateY(16px);
        transition: opacity 0.22s ease, transform 0.22s ease !important;
        overflow: hidden !important;
      }
      body .sk-widget-iframe-container.open {
        opacity: 1 !important;
        pointer-events: all !important;
        transform: translateY(0) !important;
      }
      body .sk-widget-iframe {
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        border-radius: 16px !important;
        background: #ffffff !important;
      }
      .sk-widget-close-bar {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sk-widget-action-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        padding: 0 10px;
        border-radius: 8px;
        background: rgba(17, 17, 20, 0.86);
        color: #FFDD00;
        border: 1px solid rgba(255, 221, 0, 0.35);
        font-size: 11px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        backdrop-filter: blur(6px);
      }
      .sk-widget-action-chip:hover {
        background: rgba(17, 17, 20, 0.96);
      }
      @media (max-width: 640px) {
        body .sk-widget-btn {
          bottom: 12px !important;
          ${cfg.position}: 12px !important;
          padding: 8px 13px !important;
          font-size: 12px !important;
        }
        body .sk-widget-iframe-container {
          bottom: 56px !important;
          left: 12px !important;
          right: 12px !important;
          width: calc(100vw - 24px) !important;
          max-width: 366px !important;
          margin-left: auto !important;
          height: min(545px, calc(100vh - 116px)) !important;
        }
      }
    `;
    document.head.appendChild(extraStyle);
  }

  let btn = document.querySelector<HTMLElement>('.sk-widget-btn');
  let iframeContainer = document.querySelector<HTMLElement>('.sk-widget-iframe-container');

  // If external widget.js has not created the DOM nodes yet (e.g. offline/blocked), create them
  if (!btn || !iframeContainer) {
    let parentUrl = window.location.origin + window.location.pathname;
    try {
      const pageUrl = new URL(window.location.href);
      pageUrl.searchParams.delete('sk_payment');
      parentUrl = pageUrl.href.length <= 1800 ? pageUrl.href : pageUrl.origin + pageUrl.pathname;
    } catch {
      // ignore
    }

    if (!btn) {
      btn = document.createElement('div');
      btn.className = 'sk-widget-btn';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>
        <span>${cfg.message}</span>
      `;
      document.body.appendChild(btn);
    }

    if (!iframeContainer) {
      iframeContainer = document.createElement('div');
      iframeContainer.className = 'sk-widget-iframe-container';
      const iframeSrc = `${cfg.widgetUrl}?parent=${encodeURIComponent(parentUrl)}`;
      iframeContainer.dataset.iframeSrc = iframeSrc;
      iframeContainer.innerHTML = `<iframe data-src="${iframeSrc}" loading="lazy" title="Support Shahin on SupportKori" class="sk-widget-iframe"></iframe>`;
      document.body.appendChild(iframeContainer);
    }

    btn.onclick = () => {
      if (!iframeContainer) return;
      const opening = !iframeContainer.classList.contains('open');
      if (opening) {
        const frame = iframeContainer.querySelector<HTMLIFrameElement>('iframe');
        if (frame && !frame.getAttribute('src')) {
          const lazySrc = frame.getAttribute('data-src') || iframeContainer.dataset.iframeSrc;
          if (lazySrc) frame.setAttribute('src', lazySrc);
        }
      }
      iframeContainer.classList.toggle('open');
    };
  }

  // Enhance accessibility and testability attributes on existing or newly created elements
  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-label', `${cfg.message} — Buy Md Shahin a Coffee on SupportKori`);
  btn.setAttribute('data-testid', 'supportkori-floating-btn');
  btn.onkeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn?.click();
    }
  };

  iframeContainer.setAttribute('data-testid', 'supportkori-popup-container');
  iframeContainer.setAttribute('role', 'dialog');
  iframeContainer.setAttribute('aria-label', 'Support Shahin via SupportKori');

  const iframeEl = iframeContainer.querySelector('iframe');
  if (iframeEl && !iframeEl.getAttribute('title')) {
    iframeEl.setAttribute('title', 'Support Shahin on SupportKori');
  }

  // Add a quick top-right close & external link bar inside the popup container if not present
  if (!iframeContainer.querySelector('.sk-widget-close-bar')) {
    const closeBar = document.createElement('div');
    closeBar.className = 'sk-widget-close-bar';

    const directLink = document.createElement('a');
    directLink.href = cfg.profileUrl;
    directLink.target = '_blank';
    directLink.rel = 'noopener noreferrer';
    directLink.className = 'sk-widget-action-chip';
    directLink.setAttribute('data-testid', 'supportkori-popup-direct-link');
    directLink.textContent = 'supportkori.com ↗';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sk-widget-action-chip';
    closeBtn.setAttribute('aria-label', 'Close Support Shahin popup');
    closeBtn.setAttribute('data-testid', 'supportkori-popup-close-btn');
    closeBtn.textContent = '✕';
    closeBtn.onclick = (ev) => {
      ev.stopPropagation();
      if (iframeContainer?.classList.contains('open')) {
        iframeContainer.classList.remove('open');
      }
    };

    closeBar.appendChild(directLink);
    closeBar.appendChild(closeBtn);
    iframeContainer.appendChild(closeBar);
  }
}

/**
 * Opens (or toggles) the SupportKori floating popup widget from any button
 * on the Developer Page or Front Page.
 */
export function openSupportKoriPopup(): void {
  ensureSupportKoriWidgetMounted();
  if (typeof document === 'undefined') return;

  const container = document.querySelector<HTMLElement>('.sk-widget-iframe-container');
  if (!container) return;

  if (!container.classList.contains('open')) {
    const frame = container.querySelector<HTMLIFrameElement>('iframe');
    if (frame && !frame.getAttribute('src')) {
      const lazySrc = frame.getAttribute('data-src') || container.dataset.iframeSrc;
      if (lazySrc) frame.setAttribute('src', lazySrc);
    }
    container.classList.add('open');
  } else {
    container.classList.remove('open');
  }
}
