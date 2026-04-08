/**
 * FloatingTool.js - Remote-controlled Floating Action Button System
 * Version: 1.1.0
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CHỈ CẦN SỬA PHẦN "=== CẤU HÌNH ===" BÊN DƯỚI (3 dòng)   ║
 * ║  Sau đó upload lên GitHub/server — XONG, không cần đổi nữa ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Cách nhúng vào bất kỳ website:
 *   <script src="https://yourcdn.com/floating-tool.js"></script>
 */

(function () {
  "use strict";

  // ╔══════════════════════════════════════════════════════════════╗
  // ║                    === CẤU HÌNH ===                         ║
  // ║         Chỉ cần sửa 3 dòng này rồi không đụng nữa          ║
  // ╚══════════════════════════════════════════════════════════════╝

  const API_BASE  = "https://studyflow.work.gd/floatingapp/backend";   // ← URL thư mục backend của bạn
  const API_TOKEN = "Danhdz611@@";       // ← Token trong config/db.php
  const POLL_MS   = 30000;                          // ← Đồng bộ mỗi X ms (30000 = 30s)

  // ══════════════════════════════════════════════════════════════
  //  PHẦN CÒN LẠI: KHÔNG CẦN SỬA
  // ══════════════════════════════════════════════════════════════

  const CONFIG = {
    API_BASE, API_TOKEN,
    API_ENDPOINT:  "/api/config.php",
    POLL_INTERVAL: POLL_MS,
    CACHE_KEY:     "ft_config_v2",
    POSITION_KEY:  "ft_position",
    THEME_KEY:     "ft_theme",
  };

  const STYLES = `
    :host { all: initial; position: fixed; z-index: 2147483647; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    #ft-container { position: fixed; z-index: 2147483647; user-select: none; touch-action: none; }
    #ft-main-btn {
      width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 22px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 20px rgba(102,126,234,0.5);
      transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); opacity: 0.88; position: relative; overflow: hidden;
    }
    #ft-main-btn:hover { opacity: 1; transform: scale(1.1); box-shadow: 0 6px 28px rgba(102,126,234,0.65); }
    #ft-main-btn.active { transform: scale(0.92) rotate(45deg); opacity: 1; }
    #ft-main-btn.dragging { opacity: 0.7; transform: scale(1.15); cursor: grabbing; }
    #ft-main-btn .ft-icon { font-size: 22px; line-height: 1; }
    #ft-menu {
      position: absolute; bottom: 68px; right: 0; width: 320px; border-radius: 20px;
      background: rgba(15,15,25,0.93); backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05) inset;
      overflow: hidden; transform-origin: bottom right;
      transform: scale(0.85) translateY(12px); opacity: 0; pointer-events: none;
      transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    #ft-menu.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }
    #ft-container.snap-left #ft-menu { right: auto; left: 0; transform-origin: bottom left; }
    .ft-menu-header { padding: 15px 18px 11px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; }
    .ft-menu-title { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
    .ft-header-right { display: flex; align-items: center; gap: 8px; }
    .ft-sync-dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; animation: ft-pulse 2s infinite; flex-shrink: 0; }
    .ft-sync-dot.error { background: #ef4444; animation: none; }
    .ft-sync-dot.loading { background: #f59e0b; }
    @keyframes ft-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.75)} }
    .ft-theme-toggle { width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.2s; }
    .ft-theme-toggle:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .ft-section { padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .ft-section:last-child { border-bottom: none; }
    .ft-section-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.28); padding: 0 10px 6px; }
    .ft-actions-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; padding: 0 2px; }
    .ft-action-btn { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 4px 8px; border-radius: 12px; border: none; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); cursor: pointer; transition: all 0.2s; text-align: center; font-family: inherit; }
    .ft-action-btn:hover { background: rgba(255,255,255,0.14); color: #fff; transform: translateY(-1px); }
    .ft-action-btn.active-toggle { background: rgba(102,126,234,0.3); border: 1px solid rgba(102,126,234,0.5); color: #a5b4fc; }
    .ft-action-btn .ft-btn-icon { font-size: 20px; line-height: 1; }
    .ft-action-btn .ft-btn-label { font-size: 10px; font-weight: 500; }
    .ft-search-box { padding: 0 6px; }
    .ft-search-wrap { position: relative; display: flex; align-items: center; background: rgba(255,255,255,0.08); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); transition: border-color 0.2s; }
    .ft-search-wrap:focus-within { border-color: rgba(102,126,234,0.6); }
    .ft-search-icon { padding: 0 10px; color: rgba(255,255,255,0.35); font-size: 14px; flex-shrink: 0; }
    #ft-search-input { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 13px; padding: 9px 4px; font-family: inherit; }
    #ft-search-input::placeholder { color: rgba(255,255,255,0.3); }
    .ft-search-nav { display: flex; align-items: center; gap: 2px; padding: 0 6px; }
    .ft-search-count { font-size: 11px; color: rgba(255,255,255,0.4); min-width: 36px; text-align: center; }
    .ft-search-nav-btn { width: 26px; height: 26px; border-radius: 6px; border: none; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .ft-search-nav-btn:hover { background: rgba(255,255,255,0.18); color: #fff; }
    .ft-translate-wrap { padding: 0 6px; display: flex; align-items: center; gap: 8px; }
    #ft-lang-select { flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 13px; padding: 8px 12px; outline: none; cursor: pointer; font-family: inherit; }
    #ft-lang-select option { background: #1a1a2e; color: #fff; }
    .ft-translate-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
    .ft-translate-btn:hover { transform: scale(1.08); }
    .ft-custom-btns { display: flex; flex-direction: column; gap: 4px; padding: 0 6px; }
    .ft-custom-btn { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; border: none; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); cursor: pointer; font-size: 13px; font-family: inherit; text-align: left; transition: all 0.2s; width: 100%; }
    .ft-custom-btn:hover { background: rgba(255,255,255,0.13); color: #fff; transform: translateX(2px); }
    .ft-custom-btn .ft-cb-icon { font-size: 18px; flex-shrink: 0; }
    .ft-custom-btn .ft-cb-label { flex: 1; font-weight: 500; }
    .ft-custom-btn .ft-cb-arrow { font-size: 11px; color: rgba(255,255,255,0.3); }
    .ft-scroll-row { display: flex; gap: 6px; padding: 0 6px; }
    .ft-scroll-btn { flex: 1; padding: 8px; border-radius: 10px; border: none; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: inherit; transition: all 0.2s; }
    .ft-scroll-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
    #ft-toast { position: fixed; bottom: 80px; right: 16px; background: rgba(20,20,35,0.96); color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); transform: translateY(20px); opacity: 0; transition: all 0.3s; z-index: 2147483646; pointer-events: none; font-family: 'Segoe UI', system-ui, sans-serif; }
    #ft-toast.show { transform: translateY(0); opacity: 1; }
    .ft-tooltip { position: absolute; right: 66px; top: 50%; transform: translateY(-50%); background: rgba(15,15,25,0.92); color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 12px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.2s; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); font-family: 'Segoe UI', system-ui, sans-serif; }
    #ft-container:hover .ft-tooltip { opacity: 1; }
    .ft-light #ft-menu { background: rgba(248,250,255,0.97); border-color: rgba(0,0,0,0.1); }
    .ft-light .ft-menu-title { color: rgba(0,0,0,0.4); }
    .ft-light .ft-section { border-color: rgba(0,0,0,0.06); }
    .ft-light .ft-section-label { color: rgba(0,0,0,0.3); }
    .ft-light .ft-action-btn { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.75); }
    .ft-light .ft-action-btn:hover { background: rgba(0,0,0,0.09); color: #000; }
    .ft-light .ft-search-wrap { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); }
    .ft-light #ft-search-input { color: #000; }
    .ft-light .ft-search-nav-btn { background: rgba(0,0,0,0.06); }
    .ft-light #ft-lang-select { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.1); color: #000; }
    .ft-light #ft-lang-select option { background: #f0f4ff; color: #000; }
    .ft-light .ft-custom-btn { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.8); }
    .ft-light .ft-scroll-btn { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.6); }
    .ft-light .ft-theme-toggle { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.5); }
    .ft-light .ft-search-count { color: rgba(0,0,0,0.4); }
  `;

  const PAGE_STYLES = `
    .ft-highlight { background: #fef08a !important; color: #000 !important; border-radius: 2px; }
    .ft-search-highlight { background: #f97316 !important; color: #fff !important; border-radius: 2px; }
    .ft-search-highlight.current { background: #dc2626 !important; outline: 2px solid #dc2626; }
  `;

  const LANGUAGES = [
    {code:"en",name:"🇺🇸 English"},{code:"vi",name:"🇻🇳 Tiếng Việt"},
    {code:"zh-CN",name:"🇨🇳 中文"},{code:"ja",name:"🇯🇵 日本語"},
    {code:"ko",name:"🇰🇷 한국어"},{code:"fr",name:"🇫🇷 Français"},
    {code:"de",name:"🇩🇪 Deutsch"},{code:"es",name:"🇪🇸 Español"},
    {code:"ru",name:"🇷🇺 Русский"},{code:"th",name:"🇹🇭 ภาษาไทย"},
    {code:"id",name:"🇮🇩 Bahasa Indonesia"},
  ];

  class FloatingTool {
    constructor() {
      this.isOpen=false; this.isDragging=false;
      this.dragOffset={x:0,y:0}; this._lastButtons=[];
      this.position=this._loadPos();
      this.theme=localStorage.getItem(CONFIG.THEME_KEY)||"dark";
      this.highlightMode=false;
      this.searchMatches=[]; this.searchIndex=0;
      this._configHash=null;
      this._injectPageStyles();
      this._create();
      this._fetchConfig(true);
      this._startPoll();
    }

    _injectPageStyles() {
      if (document.getElementById("ft-page-styles")) return;
      const s=document.createElement("style"); s.id="ft-page-styles"; s.textContent=PAGE_STYLES;
      document.head.appendChild(s);
    }

    _create() {
      this.host=document.createElement("div"); this.host.id="ft-widget-host";
      this.shadow=this.host.attachShadow({mode:"open"});
      const sheet=document.createElement("style"); sheet.textContent=STYLES;
      this.shadow.appendChild(sheet);
      this.container=document.createElement("div"); this.container.id="ft-container";
      this._applyPos(); this.shadow.appendChild(this.container);
      this.tooltip=document.createElement("div"); this.tooltip.className="ft-tooltip"; this.tooltip.textContent="Công cụ";
      this.container.appendChild(this.tooltip);
      this.mainBtn=document.createElement("button"); this.mainBtn.id="ft-main-btn"; this.mainBtn.setAttribute("aria-label","FloatingTool");
      this.mainBtn.innerHTML='<span class="ft-icon">⚡</span>';
      this.container.appendChild(this.mainBtn);
      this.menu=document.createElement("div"); this.menu.id="ft-menu";
      this.container.appendChild(this.menu);
      this.toast=document.createElement("div"); this.toast.id="ft-toast";
      this.shadow.appendChild(this.toast);
      this._buildMenu([]); this._bindEvents();
      document.body.appendChild(this.host);
    }

    _buildMenu(buttons) {
      const lght=this.theme==="light";
      this.menu.innerHTML=`
        <div class="ft-menu-header">
          <span class="ft-menu-title">Floating Tool</span>
          <div class="ft-header-right">
            <div class="ft-sync-dot loading" id="ft-sync-dot" title="Đang kết nối..."></div>
            <button class="ft-theme-toggle" id="ft-theme-btn">${lght?"🌙":"☀️"}</button>
          </div>
        </div>
        <div class="ft-section">
          <div class="ft-section-label">Công cụ nhanh</div>
          <div class="ft-actions-grid">
            <button class="ft-action-btn" id="ft-highlight-btn"><span class="ft-btn-icon">🖍️</span><span class="ft-btn-label">Highlight</span></button>
            <button class="ft-action-btn" id="ft-search-toggle-btn"><span class="ft-btn-icon">🔍</span><span class="ft-btn-label">Tìm kiếm</span></button>
            <button class="ft-action-btn" id="ft-translate-toggle-btn"><span class="ft-btn-icon">🌐</span><span class="ft-btn-label">Dịch</span></button>
            <button class="ft-action-btn" id="ft-darkmode-btn"><span class="ft-btn-icon">🌓</span><span class="ft-btn-label">Dark</span></button>
          </div>
        </div>
        <div class="ft-section" id="ft-search-section" style="display:none">
          <div class="ft-section-label">Tìm kiếm trên trang</div>
          <div class="ft-search-box">
            <div class="ft-search-wrap">
              <span class="ft-search-icon">🔍</span>
              <input type="text" id="ft-search-input" placeholder="Nhập từ cần tìm..." autocomplete="off"/>
              <div class="ft-search-nav">
                <span class="ft-search-count" id="ft-search-count">0/0</span>
                <button class="ft-search-nav-btn" id="ft-search-prev">▲</button>
                <button class="ft-search-nav-btn" id="ft-search-next">▼</button>
              </div>
            </div>
          </div>
        </div>
        <div class="ft-section" id="ft-translate-section" style="display:none">
          <div class="ft-section-label">Dịch trang</div>
          <div class="ft-translate-wrap">
            <select id="ft-lang-select">${LANGUAGES.map(l=>`<option value="${l.code}">${l.name}</option>`).join("")}</select>
            <button class="ft-translate-btn" id="ft-do-translate">→</button>
          </div>
        </div>
        <div class="ft-section">
          <div class="ft-section-label">Điều hướng</div>
          <div class="ft-scroll-row">
            <button class="ft-scroll-btn" id="ft-scroll-top">⬆️ Lên đầu</button>
            <button class="ft-scroll-btn" id="ft-scroll-bottom">⬇️ Xuống cuối</button>
          </div>
        </div>
        ${buttons.length?`<div class="ft-section"><div class="ft-section-label">Liên kết & Công cụ</div><div class="ft-custom-btns">${buttons.map(b=>`<button class="ft-custom-btn" data-action="${this._esc(b.action_type)}" data-value="${this._esc(b.action_value)}"><span class="ft-cb-icon">${this._esc(b.icon)}</span><span class="ft-cb-label">${this._esc(b.name)}</span><span class="ft-cb-arrow">›</span></button>`).join("")}</div></div>`:""}
      `;
      this.container.classList.toggle("ft-light",lght);
      this._bindMenuEvents();
    }

    _syncDot(state) {
      const d=this.shadow.getElementById("ft-sync-dot"); if(!d) return;
      d.className="ft-sync-dot"+(state!=="ok"?" "+state:"");
      d.title={ok:"✅ Đồng bộ với server",error:"❌ Mất kết nối server",loading:"🔄 Đang đồng bộ..."}[state]||"";
    }

    _bindEvents() {
      this.mainBtn.addEventListener("click",()=>{ if(!this.isDragging) this.toggleMenu(); });
      document.addEventListener("click",e=>{ if(!this.host.contains(e.target)&&this.isOpen) this.closeMenu(); });
      this.mainBtn.addEventListener("mousedown",e=>this._dragStart(e));
      this.mainBtn.addEventListener("touchstart",e=>this._dragStart(e),{passive:false});
      document.addEventListener("mousemove",e=>this._dragMove(e));
      document.addEventListener("touchmove",e=>this._dragMove(e),{passive:false});
      document.addEventListener("mouseup",()=>this._dragEnd());
      document.addEventListener("touchend",()=>this._dragEnd());
      document.addEventListener("mouseup",e=>this._onHighlight(e));
    }

    _bindMenuEvents() {
      const $=id=>this.shadow.getElementById(id);
      $("ft-theme-btn")?.addEventListener("click",()=>{ this.theme=this.theme==="dark"?"light":"dark"; localStorage.setItem(CONFIG.THEME_KEY,this.theme); this._buildMenu(this._lastButtons); });
      $("ft-highlight-btn")?.addEventListener("click",()=>{ this.highlightMode=!this.highlightMode; $("ft-highlight-btn").classList.toggle("active-toggle",this.highlightMode); this._toast(this.highlightMode?"🖍️ Highlight BẬT — bôi đen text":"Highlight TẮT"); });
      $("ft-search-toggle-btn")?.addEventListener("click",()=>{ const s=$("ft-search-section"),o=s.style.display==="none"; s.style.display=o?"block":"none"; $("ft-search-toggle-btn").classList.toggle("active-toggle",o); if(o) setTimeout(()=>$("ft-search-input")?.focus(),80); });
      $("ft-search-input")?.addEventListener("input",e=>this._search(e.target.value));
      $("ft-search-input")?.addEventListener("keydown",e=>{ if(e.key==="Enter") this._sNext(); if(e.key==="Escape"){e.target.value="";this._clearSearch();} });
      $("ft-search-prev")?.addEventListener("click",()=>this._sPrev());
      $("ft-search-next")?.addEventListener("click",()=>this._sNext());
      $("ft-translate-toggle-btn")?.addEventListener("click",()=>{ const s=$("ft-translate-section"),o=s.style.display==="none"; s.style.display=o?"block":"none"; $("ft-translate-toggle-btn").classList.toggle("active-toggle",o); });
      $("ft-do-translate")?.addEventListener("click",()=>this._translate($("ft-lang-select").value));
      $("ft-darkmode-btn")?.addEventListener("click",()=>this._darkMode());
      $("ft-scroll-top")?.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
      $("ft-scroll-bottom")?.addEventListener("click",()=>window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}));
      this.shadow.querySelectorAll(".ft-custom-btn").forEach(b=>b.addEventListener("click",()=>this._run(b.dataset.action,b.dataset.value)));
    }

    _pos(e) { return e.touches?.[0]?{x:e.touches[0].clientX,y:e.touches[0].clientY}:{x:e.clientX,y:e.clientY}; }
    _dragStart(e) { const p=this._pos(e),r=this.container.getBoundingClientRect(); this.dragOffset={x:p.x-r.left,y:p.y-r.top}; this._dragTimer=setTimeout(()=>{ this.isDragging=true; this.mainBtn.classList.add("dragging"); this.closeMenu(); },150); }
    _dragMove(e) { if(!this.isDragging) return; e.preventDefault(); const p=this._pos(e); this.position={x:Math.max(4,Math.min(p.x-this.dragOffset.x,window.innerWidth-60)),y:Math.max(4,Math.min(p.y-this.dragOffset.y,window.innerHeight-60))}; this._applyPos(); }
    _dragEnd() { clearTimeout(this._dragTimer); if(this.isDragging){ this._snap(); this.mainBtn.classList.remove("dragging"); setTimeout(()=>{this.isDragging=false;},50); } }
    _snap() { const sl=(this.position.x+28)<window.innerWidth/2; this.position.x=sl?12:window.innerWidth-68; this.container.classList.toggle("snap-left",sl); this.container.style.transition="left 0.3s,top 0.3s"; this._applyPos(); this._savePos(); setTimeout(()=>{this.container.style.transition="";},350); }
    _applyPos() { this.container.style.left=this.position.x+"px"; this.container.style.top=this.position.y+"px"; }
    _loadPos() { try{ const p=JSON.parse(localStorage.getItem(CONFIG.POSITION_KEY)); if(p?.x&&p?.y) return p; }catch(_){} return {x:window.innerWidth-72,y:window.innerHeight-80}; }
    _savePos() { localStorage.setItem(CONFIG.POSITION_KEY,JSON.stringify(this.position)); }

    toggleMenu() { this.isOpen?this.closeMenu():this.openMenu(); }
    openMenu()   { this.isOpen=true;  this.menu.classList.add("open");    this.mainBtn.classList.add("active"); }
    closeMenu()  { this.isOpen=false; this.menu.classList.remove("open"); this.mainBtn.classList.remove("active"); }

    _onHighlight(e) { if(!this.highlightMode||this.host.contains(e.target)) return; const sel=window.getSelection(); if(!sel||sel.isCollapsed) return; try{ const r=sel.getRangeAt(0),sp=document.createElement("span"); sp.className="ft-highlight"; r.surroundContents(sp); sel.removeAllRanges(); }catch(_){} }

    _search(q) {
      this._clearSearch();
      if(!q||q.trim().length<2){ this.shadow.getElementById("ft-search-count").textContent="0/0"; return; }
      const rx=new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi");
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>{ const t=n.parentNode?.tagName; if(["SCRIPT","STYLE","NOSCRIPT"].includes(t)) return NodeFilter.FILTER_REJECT; if(n.parentNode?.closest("#ft-widget-host")) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; }});
      const nodes=[]; let n; while((n=walker.nextNode())) nodes.push(n);
      this.searchMatches=[];
      nodes.forEach(node=>{ if(!rx.test(node.nodeValue)) return; rx.lastIndex=0; const frag=document.createDocumentFragment(); let last=0,m; while((m=rx.exec(node.nodeValue))){ if(m.index>last) frag.appendChild(document.createTextNode(node.nodeValue.slice(last,m.index))); const mk=document.createElement("mark"); mk.className="ft-search-highlight"; mk.textContent=m[0]; frag.appendChild(mk); this.searchMatches.push(mk); last=m.index+m[0].length; rx.lastIndex=m.index+m[0].length; } if(last<node.nodeValue.length) frag.appendChild(document.createTextNode(node.nodeValue.slice(last))); node.parentNode.replaceChild(frag,node); rx.lastIndex=0; });
      this.searchIndex=0; this._hlCur(); this._updCnt();
    }
    _clearSearch() { document.querySelectorAll(".ft-search-highlight").forEach(el=>{ el.parentNode?.replaceChild(document.createTextNode(el.textContent),el); el.parentNode?.normalize(); }); this.searchMatches=[]; this.searchIndex=0; }
    _hlCur() { this.searchMatches.forEach((m,i)=>m.classList.toggle("current",i===this.searchIndex)); this.searchMatches[this.searchIndex]?.scrollIntoView({behavior:"smooth",block:"center"}); }
    _sNext() { if(!this.searchMatches.length) return; this.searchIndex=(this.searchIndex+1)%this.searchMatches.length; this._hlCur(); this._updCnt(); }
    _sPrev() { if(!this.searchMatches.length) return; this.searchIndex=(this.searchIndex-1+this.searchMatches.length)%this.searchMatches.length; this._hlCur(); this._updCnt(); }
    _updCnt() { const e=this.shadow.getElementById("ft-search-count"); if(e) e.textContent=this.searchMatches.length?`${this.searchIndex+1}/${this.searchMatches.length}`:"0/0"; }

    _translate(lang) {
      if(!window.googleTranslateLoaded){ window.googleTranslateElementInit=()=>{ new google.translate.TranslateElement({pageLanguage:"auto",autoDisplay:false},"google_translate_element"); window.googleTranslateLoaded=true; this._gtSwitch(lang); }; if(!document.getElementById("google_translate_element")){ const d=document.createElement("div"); d.id="google_translate_element"; d.style.cssText="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;"; document.body.appendChild(d); } const s=document.createElement("script"); s.src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"; document.body.appendChild(s); this._toast("🌐 Đang tải bộ dịch..."); } else { this._gtSwitch(lang); }
    }
    _gtSwitch(lang,t=0) { const c=document.querySelector(".goog-te-combo"); if(c){ c.value=lang; c.dispatchEvent(new Event("change")); this._toast("🌐 Đã dịch: "+(LANGUAGES.find(l=>l.code===lang)?.name||lang)); } else if(t<20) setTimeout(()=>this._gtSwitch(lang,t+1),300); }

    _darkMode() { const id="ft-page-dark",ex=document.getElementById(id); if(ex){ex.remove();this._toast("☀️ Dark mode TẮT");}else{const s=document.createElement("style");s.id=id;s.textContent="html{filter:invert(1) hue-rotate(180deg)!important}img,video,canvas,iframe{filter:invert(1) hue-rotate(180deg)!important}#ft-widget-host{filter:none!important}";document.head.appendChild(s);this._toast("🌙 Dark mode BẬT");} }

    _run(type,value) { if(!value) return; try{ if(type==="link") window.open(value,"_blank","noopener,noreferrer"); else if(type==="js")(new Function(value))(); }catch(e){this._toast("⚠️ Lỗi: "+e.message);} }

    // ── Core: fetch config, rebuild on change ────────────────────
    async _fetchConfig(first=false) {
      if(first) this._syncDot("loading");
      try {
        const res=await fetch(`${CONFIG.API_BASE}${CONFIG.API_ENDPOINT}?_=${Date.now()}`,{
          headers:{"X-FT-Token":CONFIG.API_TOKEN,"Accept":"application/json"},
          cache:"no-store"
        });
        if(!res.ok) throw new Error("HTTP "+res.status);
        const data=await res.json();
        if(data.error) throw new Error(data.error);

        // Only rebuild if data actually changed
        const hash=JSON.stringify({b:data.buttons,s:data.settings});
        if(hash!==this._configHash){
          this._configHash=hash;
          this._applyConfig(data);
          if(!first) this._toast("🔄 Widget đã cập nhật từ server");
        }
        this._syncDot("ok");
        localStorage.setItem(CONFIG.CACHE_KEY,JSON.stringify({ts:Date.now(),data}));
      } catch(err) {
        console.warn("[FloatingTool]",err.message);
        this._syncDot("error");
        if(first) this._loadCache();
      }
    }

    _loadCache() { try{ const c=JSON.parse(localStorage.getItem(CONFIG.CACHE_KEY)); if(c?.data&&Date.now()-c.ts<3600000) this._applyConfig(c.data); }catch(_){} }

    _applyConfig(data) {
      const s=data.settings||{};
      const btns=(data.buttons||[]).filter(b=>b.is_active==1||b.is_active===true);
      this._lastButtons=btns;
      this._buildMenu(btns);
      if(s.btn_color) this.mainBtn.style.background=s.btn_color;
      if(s.btn_icon){ const ic=this.mainBtn.querySelector(".ft-icon"); if(ic) ic.textContent=s.btn_icon; }
      if(s.tooltip_text) this.tooltip.textContent=s.tooltip_text;
      if(s.enable_translate==="0"){ const t=this.shadow.getElementById("ft-translate-toggle-btn"); if(t) t.style.display="none"; }
      if(s.enable_highlight==="0"){ const h=this.shadow.getElementById("ft-highlight-btn"); if(h) h.style.display="none"; }
    }

    _startPoll() { setInterval(()=>this._fetchConfig(false),CONFIG.POLL_INTERVAL); }

    _toast(msg,ms=2500) { this.toast.textContent=msg; this.toast.classList.add("show"); clearTimeout(this._tt); this._tt=setTimeout(()=>this.toast.classList.remove("show"),ms); }
    _esc(v) { return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;"); }
  }

  function boot() { if(window.__ft) return; window.__ft=new FloatingTool(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else setTimeout(boot,50);
})();
