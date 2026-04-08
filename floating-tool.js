/**
 * FloatingTool.js - Remote-controlled Floating Action Button System
 * Version: 1.0.0
 * Author: FloatingTool System
 * License: MIT
 *
 * Usage: <script src="https://yourdomain.com/floating-tool.js"></script>
 */

(function () {
  "use strict";

  // ============================================================
  // CONFIGURATION - Change API_BASE to your server URL
  // ============================================================
  const CONFIG = {
    API_BASE: "https://studyflow.work.gd/floatingapp/backend", // ← Đổi thành URL server của bạn
    API_ENDPOINT: "/api/config.php",
    API_TOKEN: "Danhdz611@@", // ← Phải khớp với backend
    POLL_INTERVAL: 30000, // 30 giây fetch lại config
    CACHE_KEY: "ft_config_cache",
    CACHE_TTL: 60000, // 1 phút cache
    POSITION_KEY: "ft_position",
    THEME_KEY: "ft_theme",
  };

  // ============================================================
  // STYLES - Full CSS embedded (Shadow DOM isolation)
  // ============================================================
  const STYLES = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ── FAB Container ── */
    #ft-container {
      position: fixed;
      z-index: 2147483647;
      user-select: none;
      touch-action: none;
    }

    /* ── Main Button ── */
    #ft-main-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      opacity: 0.85;
      position: relative;
      overflow: hidden;
    }

    #ft-main-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      opacity: 0;
      transition: opacity 0.2s;
    }

    #ft-main-btn:hover {
      opacity: 1;
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(102, 126, 234, 0.65);
    }

    #ft-main-btn:hover::before { opacity: 1; }

    #ft-main-btn.active {
      transform: scale(0.92) rotate(45deg);
      opacity: 1;
    }

    #ft-main-btn .ft-icon {
      transition: transform 0.3s;
      font-size: 22px;
      line-height: 1;
    }

    /* ── Drag indicator ── */
    #ft-main-btn.dragging {
      opacity: 0.7;
      transform: scale(1.15);
      cursor: grabbing;
    }

    /* ── Menu Panel ── */
    #ft-menu {
      position: absolute;
      bottom: 68px;
      right: 0;
      width: 320px;
      border-radius: 20px;
      background: rgba(15, 15, 25, 0.92);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow:
        0 24px 64px rgba(0,0,0,0.4),
        0 0 0 1px rgba(255,255,255,0.05) inset,
        0 1px 0 rgba(255,255,255,0.1) inset;
      padding: 0;
      overflow: hidden;
      transform-origin: bottom right;
      transform: scale(0.85) translateY(12px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    #ft-menu.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* Left-side menu adjustment */
    #ft-container.snap-left #ft-menu {
      right: auto;
      left: 0;
      transform-origin: bottom left;
    }

    /* ── Menu Header ── */
    .ft-menu-header {
      padding: 16px 18px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ft-menu-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
    }

    .ft-theme-toggle {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      transition: all 0.2s;
    }

    .ft-theme-toggle:hover {
      background: rgba(255,255,255,0.15);
      color: #fff;
    }

    /* ── Section ── */
    .ft-section {
      padding: 10px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .ft-section:last-child { border-bottom: none; }

    .ft-section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      padding: 0 10px 6px;
    }

    /* ── Action Buttons Grid ── */
    .ft-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      padding: 0 2px;
    }

    .ft-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      padding: 10px 4px 8px;
      border-radius: 12px;
      border: none;
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      transition: all 0.2s;
      font-size: 11px;
      line-height: 1.2;
      text-align: center;
      word-break: break-word;
    }

    .ft-action-btn:hover {
      background: rgba(255,255,255,0.14);
      color: #fff;
      transform: translateY(-1px);
    }

    .ft-action-btn.active-toggle {
      background: rgba(102, 126, 234, 0.3);
      border: 1px solid rgba(102, 126, 234, 0.5);
      color: #a5b4fc;
    }

    .ft-action-btn .ft-btn-icon {
      font-size: 20px;
      line-height: 1;
    }

    .ft-action-btn .ft-btn-label {
      font-size: 10px;
      font-weight: 500;
    }

    /* ── Search Box ── */
    .ft-search-box {
      padding: 0 6px;
    }

    .ft-search-wrap {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(255,255,255,0.08);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1);
      transition: border-color 0.2s;
    }

    .ft-search-wrap:focus-within {
      border-color: rgba(102, 126, 234, 0.6);
    }

    .ft-search-icon {
      padding: 0 10px;
      color: rgba(255,255,255,0.35);
      font-size: 14px;
      flex-shrink: 0;
    }

    #ft-search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #fff;
      font-size: 13px;
      padding: 9px 4px;
      font-family: inherit;
    }

    #ft-search-input::placeholder { color: rgba(255,255,255,0.3); }

    .ft-search-nav {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 0 6px;
    }

    .ft-search-count {
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      min-width: 36px;
      text-align: center;
    }

    .ft-search-nav-btn {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: none;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .ft-search-nav-btn:hover {
      background: rgba(255,255,255,0.18);
      color: #fff;
    }

    /* ── Translate ── */
    .ft-translate-wrap {
      padding: 0 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #ft-lang-select {
      flex: 1;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #fff;
      font-size: 13px;
      padding: 8px 12px;
      outline: none;
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    #ft-lang-select:focus { border-color: rgba(102,126,234,0.6); }
    #ft-lang-select option { background: #1a1a2e; color: #fff; }

    .ft-translate-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .ft-translate-btn:hover { transform: scale(1.08); }

    /* ── Custom Buttons ── */
    .ft-custom-btns {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 6px;
    }

    .ft-custom-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      border: none;
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.85);
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      text-align: left;
      transition: all 0.2s;
      width: 100%;
    }

    .ft-custom-btn:hover {
      background: rgba(255,255,255,0.12);
      color: #fff;
      transform: translateX(2px);
    }

    .ft-custom-btn .ft-cb-icon { font-size: 18px; flex-shrink: 0; }
    .ft-custom-btn .ft-cb-label { flex: 1; font-weight: 500; }
    .ft-custom-btn .ft-cb-arrow { font-size: 11px; color: rgba(255,255,255,0.3); }

    /* ── Scroll Buttons ── */
    .ft-scroll-row {
      display: flex;
      gap: 6px;
      padding: 0 6px;
    }

    .ft-scroll-btn {
      flex: 1;
      padding: 8px;
      border-radius: 10px;
      border: none;
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: inherit;
      transition: all 0.2s;
    }

    .ft-scroll-btn:hover {
      background: rgba(255,255,255,0.14);
      color: #fff;
    }

    /* ── Highlight overlay (injected into page) ── */
    .ft-highlight-active-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fbbf24;
      animation: ft-pulse 1.5s infinite;
      position: absolute;
      top: 8px;
      right: 8px;
    }

    @keyframes ft-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    /* ── Toast notification ── */
    #ft-toast {
      position: fixed;
      bottom: 80px;
      right: 16px;
      background: rgba(20,20,35,0.95);
      color: #fff;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 13px;
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 2147483646;
      pointer-events: none;
    }

    #ft-toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    /* ── Tooltip ── */
    .ft-tooltip {
      position: absolute;
      right: 68px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(15,15,25,0.92);
      color: #fff;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
    }

    #ft-container:hover .ft-tooltip:not(.hidden) {
      opacity: 1;
    }

    .ft-tooltip.hidden { display: none; }

    /* ── Light Theme ── */
    .ft-light #ft-menu {
      background: rgba(248, 250, 255, 0.95);
      border-color: rgba(0,0,0,0.1);
      box-shadow: 0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05) inset;
    }

    .ft-light .ft-menu-title { color: rgba(0,0,0,0.4); }
    .ft-light .ft-theme-toggle { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.5); }
    .ft-light .ft-theme-toggle:hover { background: rgba(0,0,0,0.12); color: #000; }
    .ft-light .ft-section { border-color: rgba(0,0,0,0.06); }
    .ft-light .ft-section-label { color: rgba(0,0,0,0.3); }
    .ft-light .ft-action-btn { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.75); }
    .ft-light .ft-action-btn:hover { background: rgba(0,0,0,0.09); color: #000; }
    .ft-light .ft-search-wrap { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); }
    .ft-light #ft-search-input { color: #000; }
    .ft-light #ft-search-input::placeholder { color: rgba(0,0,0,0.3); }
    .ft-light .ft-search-icon { color: rgba(0,0,0,0.35); }
    .ft-light .ft-search-nav-btn { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.5); }
    .ft-light #ft-lang-select { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.1); color: #000; }
    .ft-light #ft-lang-select option { background: #f0f4ff; color: #000; }
    .ft-light .ft-custom-btn { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.8); }
    .ft-light .ft-custom-btn:hover { background: rgba(0,0,0,0.09); }
    .ft-light .ft-scroll-btn { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.6); }
    .ft-light .ft-scroll-btn:hover { background: rgba(0,0,0,0.09); color: #000; }
    .ft-light .ft-search-count { color: rgba(0,0,0,0.4); }
    .ft-light .ft-cb-arrow { color: rgba(0,0,0,0.3); }
  `;

  // ============================================================
  // HIGHLIGHT STYLES (injected into main page)
  // ============================================================
  const PAGE_STYLES = `
    .ft-highlight { background: #fef08a !important; color: #000 !important; border-radius: 2px; }
    .ft-search-highlight { background: #f97316 !important; color: #fff !important; border-radius: 2px; }
    .ft-search-highlight.current { background: #dc2626 !important; outline: 2px solid #dc2626; }
  `;

  // ============================================================
  // LANGUAGES for Google Translate
  // ============================================================
  const LANGUAGES = [
    { code: "en", name: "🇺🇸 English" },
    { code: "vi", name: "🇻🇳 Tiếng Việt" },
    { code: "zh-CN", name: "🇨🇳 中文" },
    { code: "ja", name: "🇯🇵 日本語" },
    { code: "ko", name: "🇰🇷 한국어" },
    { code: "fr", name: "🇫🇷 Français" },
    { code: "de", name: "🇩🇪 Deutsch" },
    { code: "es", name: "🇪🇸 Español" },
    { code: "pt", name: "🇵🇹 Português" },
    { code: "ru", name: "🇷🇺 Русский" },
    { code: "ar", name: "🇸🇦 العربية" },
    { code: "th", name: "🇹🇭 ภาษาไทย" },
    { code: "id", name: "🇮🇩 Bahasa Indonesia" },
  ];

  // ============================================================
  // MAIN CLASS
  // ============================================================
  class FloatingTool {
    constructor() {
      this.config = null;
      this.isOpen = false;
      this.isDragging = false;
      this.dragOffset = { x: 0, y: 0 };
      this.position = this._loadPosition();
      this.theme = localStorage.getItem(CONFIG.THEME_KEY) || "dark";
      this.highlightMode = false;
      this.searchMatches = [];
      this.searchIndex = 0;
      this.pollTimer = null;

      this._injectPageStyles();
      this._createWidget();
      this._fetchConfig();
      this._startPolling();
    }

    // ── Inject page-level styles (for highlight) ──────────────
    _injectPageStyles() {
      if (document.getElementById("ft-page-styles")) return;
      const style = document.createElement("style");
      style.id = "ft-page-styles";
      style.textContent = PAGE_STYLES;
      document.head.appendChild(style);
    }

    // ── Build Shadow DOM widget ───────────────────────────────
    _createWidget() {
      this.host = document.createElement("div");
      this.host.id = "ft-widget-host";
      this.shadow = this.host.attachShadow({ mode: "open" });

      // Style sheet
      const sheet = document.createElement("style");
      sheet.textContent = STYLES;
      this.shadow.appendChild(sheet);

      // Container
      this.container = document.createElement("div");
      this.container.id = "ft-container";
      this._applyPosition();
      this.shadow.appendChild(this.container);

      // Tooltip
      this.tooltip = document.createElement("div");
      this.tooltip.className = "ft-tooltip hidden";
      this.tooltip.textContent = "Công cụ";
      this.container.appendChild(this.tooltip);

      // Main button
      this.mainBtn = document.createElement("button");
      this.mainBtn.id = "ft-main-btn";
      this.mainBtn.setAttribute("aria-label", "Floating Tool Menu");
      this.mainBtn.innerHTML = `<span class="ft-icon">⚡</span>`;
      this.container.appendChild(this.mainBtn);

      // Menu
      this.menu = document.createElement("div");
      this.menu.id = "ft-menu";
      this.container.appendChild(this.menu);

      // Toast
      this.toast = document.createElement("div");
      this.toast.id = "ft-toast";
      this.shadow.appendChild(this.toast);

      this._buildMenu();
      this._bindEvents();

      document.body.appendChild(this.host);
    }

    // ── Build menu HTML ───────────────────────────────────────
    _buildMenu(remoteButtons = []) {
      const isLight = this.theme === "light";
      this.menu.innerHTML = `
        <!-- Header -->
        <div class="ft-menu-header">
          <span class="ft-menu-title">Floating Tool</span>
          <button class="ft-theme-toggle" id="ft-theme-btn" title="Đổi theme">
            ${isLight ? "🌙" : "☀️"}
          </button>
        </div>

        <!-- Quick Actions -->
        <div class="ft-section">
          <div class="ft-section-label">Công cụ nhanh</div>
          <div class="ft-actions-grid">
            <button class="ft-action-btn" id="ft-highlight-btn" title="Highlight text">
              <span class="ft-btn-icon">🖍️</span>
              <span class="ft-btn-label">Highlight</span>
            </button>
            <button class="ft-action-btn" id="ft-search-toggle-btn" title="Tìm kiếm">
              <span class="ft-btn-icon">🔍</span>
              <span class="ft-btn-label">Tìm kiếm</span>
            </button>
            <button class="ft-action-btn" id="ft-translate-toggle-btn" title="Dịch trang">
              <span class="ft-btn-icon">🌐</span>
              <span class="ft-btn-label">Dịch</span>
            </button>
            <button class="ft-action-btn" id="ft-darkmode-btn" title="Dark mode trang">
              <span class="ft-btn-icon">🌓</span>
              <span class="ft-btn-label">Dark Mode</span>
            </button>
          </div>
        </div>

        <!-- Search Panel (hidden by default) -->
        <div class="ft-section" id="ft-search-section" style="display:none">
          <div class="ft-section-label">Tìm kiếm trên trang</div>
          <div class="ft-search-box">
            <div class="ft-search-wrap">
              <span class="ft-search-icon">🔍</span>
              <input type="text" id="ft-search-input" placeholder="Nhập từ cần tìm..." autocomplete="off" />
              <div class="ft-search-nav">
                <span class="ft-search-count" id="ft-search-count">0/0</span>
                <button class="ft-search-nav-btn" id="ft-search-prev">▲</button>
                <button class="ft-search-nav-btn" id="ft-search-next">▼</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Translate Panel (hidden by default) -->
        <div class="ft-section" id="ft-translate-section" style="display:none">
          <div class="ft-section-label">Dịch trang</div>
          <div class="ft-translate-wrap">
            <select id="ft-lang-select">
              ${LANGUAGES.map(
                (l) =>
                  `<option value="${l.code}">${l.name}</option>`
              ).join("")}
            </select>
            <button class="ft-translate-btn" id="ft-do-translate">→</button>
          </div>
        </div>

        <!-- Scroll Navigation -->
        <div class="ft-section">
          <div class="ft-section-label">Điều hướng</div>
          <div class="ft-scroll-row">
            <button class="ft-scroll-btn" id="ft-scroll-top">⬆️ Lên đầu</button>
            <button class="ft-scroll-btn" id="ft-scroll-bottom">⬇️ Xuống cuối</button>
          </div>
        </div>

        <!-- Custom Buttons from API -->
        ${
          remoteButtons.length > 0
            ? `
          <div class="ft-section">
            <div class="ft-section-label">Liên kết & Công cụ</div>
            <div class="ft-custom-btns" id="ft-custom-btns">
              ${remoteButtons
                .map(
                  (btn) => `
                <button class="ft-custom-btn" data-action="${this._escape(btn.action_type)}" data-value="${this._escape(btn.action_value)}" title="${this._escape(btn.name)}">
                  <span class="ft-cb-icon">${this._escape(btn.icon)}</span>
                  <span class="ft-cb-label">${this._escape(btn.name)}</span>
                  <span class="ft-cb-arrow">›</span>
                </button>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      `;

      this._applyThemeClass();
      this._bindMenuEvents();
    }

    // ── Apply theme ───────────────────────────────────────────
    _applyThemeClass() {
      if (this.theme === "light") {
        this.container.classList.add("ft-light");
      } else {
        this.container.classList.remove("ft-light");
      }
    }

    // ── Bind global events ────────────────────────────────────
    _bindEvents() {
      // Toggle menu
      this.mainBtn.addEventListener("click", (e) => {
        if (this.isDragging) return;
        this.toggleMenu();
      });

      // Close on outside click
      document.addEventListener("click", (e) => {
        if (!this.host.contains(e.target) && this.isOpen) {
          this.closeMenu();
        }
      });

      // Drag & Drop
      this.mainBtn.addEventListener("mousedown", this._onDragStart.bind(this));
      this.mainBtn.addEventListener("touchstart", this._onDragStart.bind(this), { passive: false });

      document.addEventListener("mousemove", this._onDragMove.bind(this));
      document.addEventListener("touchmove", this._onDragMove.bind(this), { passive: false });

      document.addEventListener("mouseup", this._onDragEnd.bind(this));
      document.addEventListener("touchend", this._onDragEnd.bind(this));

      // Highlight mode: mouseup on page text
      document.addEventListener("mouseup", this._onHighlight.bind(this));

      // Tooltip
      this.mainBtn.addEventListener("mouseenter", () => {
        if (!this.isOpen) this.tooltip.classList.remove("hidden");
      });
      this.mainBtn.addEventListener("mouseleave", () => {
        this.tooltip.classList.add("hidden");
      });
    }

    // ── Bind menu-internal events ─────────────────────────────
    _bindMenuEvents() {
      const $ = (id) => this.shadow.getElementById(id);

      // Theme toggle
      const themeBtn = $("ft-theme-btn");
      if (themeBtn) {
        themeBtn.addEventListener("click", () => {
          this.theme = this.theme === "dark" ? "light" : "dark";
          localStorage.setItem(CONFIG.THEME_KEY, this.theme);
          this._buildMenu(this._lastButtons || []);
        });
      }

      // Highlight toggle
      const hlBtn = $("ft-highlight-btn");
      if (hlBtn) {
        hlBtn.addEventListener("click", () => {
          this.highlightMode = !this.highlightMode;
          hlBtn.classList.toggle("active-toggle", this.highlightMode);
          this._showToast(this.highlightMode ? "✏️ Chế độ highlight BẬT – bôi đen text để highlight" : "Chế độ highlight TẮT");
        });
      }

      // Search toggle
      const searchToggle = $("ft-search-toggle-btn");
      const searchSection = $("ft-search-section");
      if (searchToggle && searchSection) {
        searchToggle.addEventListener("click", () => {
          const open = searchSection.style.display === "none";
          searchSection.style.display = open ? "block" : "none";
          searchToggle.classList.toggle("active-toggle", open);
          if (open) {
            setTimeout(() => {
              const inp = $("ft-search-input");
              if (inp) inp.focus();
            }, 100);
          }
        });
      }

      // Search input
      const searchInput = $("ft-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", () => this._doSearch(searchInput.value));
        searchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this._searchNext();
          if (e.key === "Escape") searchInput.value = "" || this._clearSearch();
        });
      }

      const prevBtn = $("ft-search-prev");
      const nextBtn = $("ft-search-next");
      if (prevBtn) prevBtn.addEventListener("click", () => this._searchPrev());
      if (nextBtn) nextBtn.addEventListener("click", () => this._searchNext());

      // Translate toggle
      const transToggle = $("ft-translate-toggle-btn");
      const transSection = $("ft-translate-section");
      if (transToggle && transSection) {
        transToggle.addEventListener("click", () => {
          const open = transSection.style.display === "none";
          transSection.style.display = open ? "block" : "none";
          transToggle.classList.toggle("active-toggle", open);
        });
      }

      // Do translate
      const doTransBtn = $("ft-do-translate");
      const langSelect = $("ft-lang-select");
      if (doTransBtn && langSelect) {
        doTransBtn.addEventListener("click", () => {
          this._translatePage(langSelect.value);
        });
      }

      // Dark mode for host page
      const darkBtn = $("ft-darkmode-btn");
      if (darkBtn) {
        darkBtn.addEventListener("click", () => this._togglePageDarkMode());
      }

      // Scroll buttons
      const scrollTop = $("ft-scroll-top");
      const scrollBot = $("ft-scroll-bottom");
      if (scrollTop) scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
      if (scrollBot) scrollBot.addEventListener("click", () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));

      // Custom buttons
      const customBtns = this.shadow.querySelectorAll(".ft-custom-btn");
      customBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const actionType = btn.dataset.action;
          const actionValue = btn.dataset.value;
          this._executeAction(actionType, actionValue);
        });
      });
    }

    // ── Drag & Drop ───────────────────────────────────────────
    _getEventPos(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    _onDragStart(e) {
      const pos = this._getEventPos(e);
      const rect = this.container.getBoundingClientRect();
      this.dragOffset = { x: pos.x - rect.left, y: pos.y - rect.top };
      this._dragStartPos = pos;
      this._dragMoved = false;
      this._dragTimer = setTimeout(() => {
        this.isDragging = true;
        this.mainBtn.classList.add("dragging");
        this.closeMenu();
        this.tooltip.classList.add("hidden");
      }, 150);
    }

    _onDragMove(e) {
      if (!this.isDragging) return;
      e.preventDefault();
      this._dragMoved = true;
      const pos = this._getEventPos(e);
      const x = pos.x - this.dragOffset.x;
      const y = pos.y - this.dragOffset.y;

      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;

      this.position = {
        x: Math.max(4, Math.min(x, maxX)),
        y: Math.max(4, Math.min(y, maxY)),
      };
      this._applyPosition();
    }

    _onDragEnd() {
      clearTimeout(this._dragTimer);
      if (this.isDragging) {
        this._snapToEdge();
        this.mainBtn.classList.remove("dragging");
        setTimeout(() => { this.isDragging = false; }, 50);
      }
    }

    _snapToEdge() {
      const cx = this.position.x + 28;
      const midX = window.innerWidth / 2;
      const snapX = cx < midX ? 12 : window.innerWidth - 68;
      this.position.x = snapX;

      if (snapX < midX) {
        this.container.classList.add("snap-left");
      } else {
        this.container.classList.remove("snap-left");
      }

      this.container.style.transition = "left 0.3s, top 0.3s";
      this._applyPosition();
      this._savePosition();
      setTimeout(() => { this.container.style.transition = ""; }, 350);
    }

    _applyPosition() {
      this.container.style.left = this.position.x + "px";
      this.container.style.top = this.position.y + "px";
    }

    _loadPosition() {
      try {
        const p = JSON.parse(localStorage.getItem(CONFIG.POSITION_KEY));
        if (p && p.x && p.y) return p;
      } catch (_) {}
      return { x: window.innerWidth - 72, y: window.innerHeight - 80 };
    }

    _savePosition() {
      localStorage.setItem(CONFIG.POSITION_KEY, JSON.stringify(this.position));
    }

    // ── Menu toggle ───────────────────────────────────────────
    toggleMenu() {
      this.isOpen ? this.closeMenu() : this.openMenu();
    }

    openMenu() {
      this.isOpen = true;
      this.menu.classList.add("open");
      this.mainBtn.classList.add("active");
      this.tooltip.classList.add("hidden");
    }

    closeMenu() {
      this.isOpen = false;
      this.menu.classList.remove("open");
      this.mainBtn.classList.remove("active");
    }

    // ── Highlight feature ─────────────────────────────────────
    _onHighlight(e) {
      if (!this.highlightMode) return;
      if (this.host.contains(e.target)) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

      try {
        const range = sel.getRangeAt(0);
        const span = document.createElement("span");
        span.className = "ft-highlight";
        range.surroundContents(span);
        sel.removeAllRanges();
      } catch (_) {
        // Handle multi-element selections
        this._showToast("⚠️ Không thể highlight vùng này");
      }
    }

    // ── Search feature ────────────────────────────────────────
    _doSearch(query) {
      this._clearSearch();
      if (!query || query.trim().length < 2) {
        this.shadow.getElementById("ft-search-count").textContent = "0/0";
        return;
      }

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName;
            if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(tag)) return NodeFilter.FILTER_REJECT;
            if (parent.closest("#ft-widget-host")) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const regex = new RegExp(this._escapeRegex(query.trim()), "gi");
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) textNodes.push(node);

      this.searchMatches = [];
      textNodes.forEach((textNode) => {
        if (!regex.test(textNode.nodeValue)) return;
        regex.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(textNode.nodeValue))) {
          if (match.index > lastIndex) {
            frag.appendChild(document.createTextNode(textNode.nodeValue.slice(lastIndex, match.index)));
          }
          const span = document.createElement("mark");
          span.className = "ft-search-highlight";
          span.textContent = match[0];
          frag.appendChild(span);
          this.searchMatches.push(span);
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < textNode.nodeValue.length) {
          frag.appendChild(document.createTextNode(textNode.nodeValue.slice(lastIndex)));
        }
        textNode.parentNode.replaceChild(frag, textNode);
        regex.lastIndex = 0;
      });

      this.searchIndex = 0;
      this._highlightCurrentMatch();
      this._updateSearchCount();
    }

    _clearSearch() {
      document.querySelectorAll(".ft-search-highlight").forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(el.textContent), el);
          parent.normalize();
        }
      });
      this.searchMatches = [];
      this.searchIndex = 0;
    }

    _highlightCurrentMatch() {
      this.searchMatches.forEach((m, i) => {
        m.classList.toggle("current", i === this.searchIndex);
      });
      if (this.searchMatches[this.searchIndex]) {
        this.searchMatches[this.searchIndex].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    _searchNext() {
      if (!this.searchMatches.length) return;
      this.searchIndex = (this.searchIndex + 1) % this.searchMatches.length;
      this._highlightCurrentMatch();
      this._updateSearchCount();
    }

    _searchPrev() {
      if (!this.searchMatches.length) return;
      this.searchIndex = (this.searchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
      this._highlightCurrentMatch();
      this._updateSearchCount();
    }

    _updateSearchCount() {
      const el = this.shadow.getElementById("ft-search-count");
      if (el) {
        el.textContent = this.searchMatches.length
          ? `${this.searchIndex + 1}/${this.searchMatches.length}`
          : "0/0";
      }
    }

    // ── Google Translate (inline) ─────────────────────────────
    _translatePage(lang) {
      // Method 1: Use Google Translate element API (no redirect)
      if (!window.googleTranslateLoaded) {
        const meta = document.createElement("meta");
        meta.name = "google";
        meta.content = "notranslate";
        // Remove notranslate meta if exists
        const existing = document.querySelector('meta[name="google"]');
        if (existing) existing.remove();

        // Load Google Translate script
        window.googleTranslateElementInit = () => {
          new google.translate.TranslateElement(
            {
              pageLanguage: "auto",
              includedLanguages: LANGUAGES.map((l) => l.code).join(","),
              layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            "google_translate_element"
          );
          window.googleTranslateLoaded = true;
          this._switchGoogleTranslateTo(lang);
        };

        // Hidden container
        if (!document.getElementById("google_translate_element")) {
          const div = document.createElement("div");
          div.id = "google_translate_element";
          div.style.cssText = "position:fixed;top:-999px;left:-999px;width:1px;height:1px;overflow:hidden;";
          document.body.appendChild(div);
        }

        const script = document.createElement("script");
        script.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`;
        document.body.appendChild(script);
        this._showToast("🌐 Đang tải bộ dịch...");
      } else {
        this._switchGoogleTranslateTo(lang);
      }
    }

    _switchGoogleTranslateTo(lang) {
      // Click the appropriate language in Google Translate widget
      const trySwitch = (attempts = 0) => {
        const combo = document.querySelector(".goog-te-combo");
        if (combo) {
          combo.value = lang;
          combo.dispatchEvent(new Event("change"));
          this._showToast(`🌐 Đã dịch sang: ${LANGUAGES.find((l) => l.code === lang)?.name || lang}`);
        } else if (attempts < 20) {
          setTimeout(() => trySwitch(attempts + 1), 300);
        }
      };
      trySwitch();
    }

    // ── Dark mode for host page ───────────────────────────────
    _togglePageDarkMode() {
      const id = "ft-page-dark-mode";
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
        this._showToast("☀️ Dark mode TẮT");
      } else {
        const style = document.createElement("style");
        style.id = id;
        style.textContent = `
          html { filter: invert(1) hue-rotate(180deg) !important; }
          img, video, canvas, iframe { filter: invert(1) hue-rotate(180deg) !important; }
          #ft-widget-host { filter: none !important; }
        `;
        document.head.appendChild(style);
        this._showToast("🌙 Dark mode BẬT");
      }
    }

    // ── Execute custom button action ──────────────────────────
    _executeAction(type, value) {
      if (!value) return;
      try {
        if (type === "link") {
          window.open(value, "_blank", "noopener,noreferrer");
        } else if (type === "js") {
          // Safely execute JS action
          const fn = new Function(value);
          fn();
        }
      } catch (err) {
        this._showToast("⚠️ Lỗi thực thi: " + err.message);
        console.warn("[FloatingTool] Action error:", err);
      }
    }

    // ── Fetch config from API ─────────────────────────────────
    async _fetchConfig() {
      try {
        const url = `${CONFIG.API_BASE}${CONFIG.API_ENDPOINT}?t=${Date.now()}`;
        const res = await fetch(url, {
          headers: {
            "X-FT-Token": CONFIG.API_TOKEN,
            "Accept": "application/json",
          },
          cache: "no-cache",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        this.config = data;
        this._applyConfig(data);

        // Cache
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch (err) {
        console.warn("[FloatingTool] API fetch failed:", err.message);
        // Try cache
        this._loadFromCache();
      }
    }

    _loadFromCache() {
      try {
        const cached = JSON.parse(localStorage.getItem(CONFIG.CACHE_KEY));
        if (cached && Date.now() - cached.ts < CONFIG.CACHE_TTL * 10) {
          this._applyConfig(cached.data);
        }
      } catch (_) {}
    }

    _applyConfig(data) {
      const settings = data.settings || {};
      const buttons = (data.buttons || []).filter((b) => b.is_active == 1 || b.is_active === true);

      this._lastButtons = buttons;

      // Apply custom color
      if (settings.btn_color) {
        this.mainBtn.style.background = settings.btn_color;
      }

      // Apply custom icon
      if (settings.btn_icon) {
        const iconEl = this.mainBtn.querySelector(".ft-icon");
        if (iconEl) iconEl.textContent = settings.btn_icon;
      }

      // Apply tooltip text
      if (settings.tooltip_text) {
        this.tooltip.textContent = settings.tooltip_text;
      }

      // Rebuild menu with remote buttons
      this._buildMenu(buttons);

      // Apply feature toggles
      if (settings.enable_translate === "0") {
        const tb = this.shadow.getElementById("ft-translate-toggle-btn");
        if (tb) tb.style.display = "none";
      }
      if (settings.enable_highlight === "0") {
        const hb = this.shadow.getElementById("ft-highlight-btn");
        if (hb) hb.style.display = "none";
      }
    }

    // ── Polling ───────────────────────────────────────────────
    _startPolling() {
      this.pollTimer = setInterval(() => {
        this._fetchConfig();
      }, CONFIG.POLL_INTERVAL);
    }

    // ── Utility ───────────────────────────────────────────────
    _showToast(msg, duration = 2500) {
      this.toast.textContent = msg;
      this.toast.classList.add("show");
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        this.toast.classList.remove("show");
      }, duration);
    }

    _escape(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    }

    _escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }

  // ============================================================
  // INIT - Run when DOM ready
  // ============================================================
  function init() {
    if (window.__floatingToolInstance) return;
    window.__floatingToolInstance = new FloatingTool();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // Small delay to avoid conflicts with other scripts
    setTimeout(init, 100);
  }
})();
