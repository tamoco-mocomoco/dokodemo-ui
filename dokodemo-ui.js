/**
 * <dokodemo-ui> - ドラッグで自由に移動できるWeb Component
 *
 * 使い方:
 * <dokodemo-ui>
 *   <button>移動できるボタン</button>
 * </dokodemo-ui>
 *
 * オプション:
 * - closable: バツボタンを表示して非表示にできるようにする
 *   <dokodemo-ui closable>...</dokodemo-ui>
 * - position: 初期位置を指定（top-left, top-right, bottom-left, bottom-right, center）
 *   <dokodemo-ui position="bottom-right">...</dokodemo-ui>
 * - padding: 角からの距離（デフォルト: 20px）
 *   <dokodemo-ui position="bottom-right" padding="30">...</dokodemo-ui>
 * - x, y: 初期位置を直接指定（単位はpx）※positionより優先
 *   <dokodemo-ui x="100" y="200">...</dokodemo-ui>
 */
// dokodemo-ui 固有の属性名（プレフィックスなし）
const DOKODEMO_ATTRIBUTE_NAMES = new Set([
    "closable",
    "close-style",
    "close-position",
    "close-color",
    "resizable",
    "position",
    "padding",
    "x",
    "y",
    "target",
    "mode",
]);
// 転送しない属性（HTML標準属性）
const NON_FORWARDED_ATTRIBUTES = new Set([
    "hidden",
    "style",
    "class",
    "id",
    "slot",
    "tabindex",
]);
// dokodemo-ui 固有の属性かどうか判定
function isDokodemoAttribute(name) {
    // dokodemo-* プレフィックス付き
    if (name.startsWith("dokodemo-"))
        return true;
    // プレフィックスなしでも既知の属性名ならtrue
    return DOKODEMO_ATTRIBUTE_NAMES.has(name);
}
// 転送すべき属性かどうか判定
function shouldForwardAttribute(name) {
    // dokodemo-ui 固有の属性は転送しない
    if (isDokodemoAttribute(name))
        return false;
    // HTML標準属性は転送しない
    if (NON_FORWARDED_ATTRIBUTES.has(name))
        return false;
    return true;
}
class DokodemoUI extends HTMLElement {
    static get observedAttributes() {
        return ["closable"];
    }
    // ヘルパー: dokodemo-* プレフィックス付きまたはレガシー属性を取得
    getDokodemoAttr(name) {
        return this.getAttribute(`dokodemo-${name}`) ?? this.getAttribute(name);
    }
    hasDokodemoAttr(name) {
        return this.hasAttribute(`dokodemo-${name}`) || this.hasAttribute(name);
    }
    get closable() {
        return this.hasDokodemoAttr("closable");
    }
    set closable(value) {
        if (value) {
            this.setAttribute("dokodemo-closable", "");
        }
        else {
            this.removeAttribute("dokodemo-closable");
            this.removeAttribute("closable");
        }
    }
    get position() {
        return this.getDokodemoAttr("position");
    }
    set position(value) {
        if (value) {
            this.setAttribute("dokodemo-position", value);
        }
        else {
            this.removeAttribute("dokodemo-position");
            this.removeAttribute("position");
        }
    }
    get padding() {
        return parseInt(this.getDokodemoAttr("padding") || "20", 10);
    }
    set padding(value) {
        this.setAttribute("dokodemo-padding", String(value));
    }
    get closeColor() {
        return this.getDokodemoAttr("close-color") || "#ff5f57";
    }
    set closeColor(value) {
        this.setAttribute("dokodemo-close-color", value);
    }
    get closeStyle() {
        return this.getDokodemoAttr("close-style") || "circle";
    }
    set closeStyle(value) {
        this.setAttribute("dokodemo-close-style", value);
    }
    get closePosition() {
        return this.getDokodemoAttr("close-position") || "inside";
    }
    set closePosition(value) {
        this.setAttribute("dokodemo-close-position", value);
    }
    get resizable() {
        return this.hasDokodemoAttr("resizable");
    }
    set resizable(value) {
        if (value) {
            this.setAttribute("dokodemo-resizable", "");
        }
        else {
            this.removeAttribute("dokodemo-resizable");
            this.removeAttribute("resizable");
        }
    }
    get x() {
        const attr = this.getDokodemoAttr("x");
        return attr ? parseInt(attr, 10) : null;
    }
    set x(value) {
        if (value !== null) {
            this.setAttribute("dokodemo-x", String(value));
            this.style.left = `${value}px`;
        }
        else {
            this.removeAttribute("dokodemo-x");
            this.removeAttribute("x");
        }
    }
    get y() {
        const attr = this.getDokodemoAttr("y");
        return attr ? parseInt(attr, 10) : null;
    }
    set y(value) {
        if (value !== null) {
            this.setAttribute("dokodemo-y", String(value));
            this.style.top = `${value}px`;
        }
        else {
            this.removeAttribute("dokodemo-y");
            this.removeAttribute("y");
        }
    }
    get target() {
        return this.getDokodemoAttr("target");
    }
    set target(value) {
        if (value) {
            this.setAttribute("dokodemo-target", value);
        }
        else {
            this.removeAttribute("dokodemo-target");
            this.removeAttribute("target");
        }
    }
    get mode() {
        return this.getDokodemoAttr("mode") || "internal";
    }
    set mode(value) {
        this.setAttribute("dokodemo-mode", value);
    }
    get isExternalMode() {
        return this.mode === "external" && this.target !== null;
    }
    constructor() {
        super();
        this.isDragging = false;
        this.isResizing = false;
        this.hasMoved = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.resizeStartX = 0;
        this.resizeStartY = 0;
        this.resizeStartWidth = 0;
        this.resizeStartHeight = 0;
        this.positionInitialized = false;
        this.iframePointerEvents = new Map();
        this.edgeSize = 8; // 端からの距離（px）
        this.targetElement = null;
        this.externalObserver = null;
        this.externalResizeObserver = null;
        this.attributeForwardObserver = null;
        this.syncWithTarget = () => {
            if (!this.targetElement)
                return;
            const rect = this.targetElement.getBoundingClientRect();
            this.style.left = `${rect.left}px`;
            this.style.top = `${rect.top}px`;
            this.style.width = `${rect.width}px`;
            this.style.height = `${rect.height}px`;
        };
        this.onMouseMoveForCursor = (e) => {
            if (this.isDragging || this.isResizing)
                return;
            if (this.isNearEdge(e.clientX, e.clientY)) {
                this.style.cursor = "grab";
            }
            else {
                this.style.cursor = "";
            }
        };
        this.onMouseLeaveForCursor = () => {
            if (!this.isDragging) {
                this.style.cursor = "";
            }
        };
        this.onClickCapture = (e) => {
            // 閉じるボタンのクリックは常に許可
            const path = e.composedPath();
            const isCloseButton = path.some((el) => el instanceof HTMLElement && el.classList.contains("close-button"));
            if (isCloseButton)
                return;
            if (this.hasMoved) {
                e.stopPropagation();
                e.preventDefault();
                this.hasMoved = false;
            }
        };
        this.onMouseDown = (e) => {
            // 内部の入力要素などはドラッグを開始しない
            if (this.shouldIgnoreEvent(e))
                return;
            // 端からのみドラッグ可能
            const path = e.composedPath();
            const isEdgeOverlay = path.some((el) => el instanceof HTMLElement && el.classList.contains("edge-overlay"));
            if (!isEdgeOverlay && !this.isNearEdge(e.clientX, e.clientY))
                return;
            e.preventDefault();
            this.startDrag(e.clientX, e.clientY);
            document.addEventListener("mousemove", this.onMouseMove);
            document.addEventListener("mouseup", this.onMouseUp);
        };
        this.onTouchStart = (e) => {
            if (this.shouldIgnoreEvent(e))
                return;
            const touch = e.touches[0];
            // 端からのみドラッグ可能
            const path = e.composedPath();
            const isEdgeOverlay = path.some((el) => el instanceof HTMLElement && el.classList.contains("edge-overlay"));
            if (!isEdgeOverlay && !this.isNearEdge(touch.clientX, touch.clientY))
                return;
            this.startDrag(touch.clientX, touch.clientY);
            document.addEventListener("touchmove", this.onTouchMove, {
                passive: false,
            });
            document.addEventListener("touchend", this.onTouchEnd);
        };
        this.onMouseMove = (e) => {
            if (!this.isDragging)
                return;
            e.preventDefault();
            this.updatePosition(e.clientX, e.clientY);
        };
        this.onTouchMove = (e) => {
            if (!this.isDragging)
                return;
            e.preventDefault();
            const touch = e.touches[0];
            this.updatePosition(touch.clientX, touch.clientY);
        };
        this.onMouseUp = () => {
            this.endDrag();
            document.removeEventListener("mousemove", this.onMouseMove);
            document.removeEventListener("mouseup", this.onMouseUp);
        };
        this.onTouchEnd = () => {
            this.endDrag();
            document.removeEventListener("touchmove", this.onTouchMove);
            document.removeEventListener("touchend", this.onTouchEnd);
        };
        this.onResizeMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startResize(e.clientX, e.clientY);
            document.addEventListener("mousemove", this.onResizeMouseMove);
            document.addEventListener("mouseup", this.onResizeMouseUp);
        };
        this.onResizeTouchStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const touch = e.touches[0];
            this.startResize(touch.clientX, touch.clientY);
            document.addEventListener("touchmove", this.onResizeTouchMove, {
                passive: false,
            });
            document.addEventListener("touchend", this.onResizeTouchEnd);
        };
        this.onResizeMouseMove = (e) => {
            if (!this.isResizing)
                return;
            e.preventDefault();
            this.updateSize(e.clientX, e.clientY);
        };
        this.onResizeTouchMove = (e) => {
            if (!this.isResizing)
                return;
            e.preventDefault();
            const touch = e.touches[0];
            this.updateSize(touch.clientX, touch.clientY);
        };
        this.onResizeMouseUp = () => {
            this.endResize();
            document.removeEventListener("mousemove", this.onResizeMouseMove);
            document.removeEventListener("mouseup", this.onResizeMouseUp);
        };
        this.onResizeTouchEnd = () => {
            this.endResize();
            document.removeEventListener("touchmove", this.onResizeTouchMove);
            document.removeEventListener("touchend", this.onResizeTouchEnd);
        };
        this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
        // 既知の属性にプレフィックスを自動付与
        this.normalizeAttributes();
        if (this.isExternalMode) {
            this.setupExternalMode();
        }
        else {
            this.render();
            this.setupDrag();
            this.setupCloseButton();
            this.setupResize();
        }
    }
    // 既知の属性を dokodemo-* プレフィックス付きに正規化（元の属性は削除）
    normalizeAttributes() {
        for (const name of DOKODEMO_ATTRIBUTE_NAMES) {
            if (this.hasAttribute(name)) {
                const value = this.getAttribute(name);
                if (!this.hasAttribute(`dokodemo-${name}`)) {
                    this.setAttribute(`dokodemo-${name}`, value || "");
                }
                this.removeAttribute(name);
            }
        }
    }
    setupExternalMode() {
        // ターゲット要素を取得（まだなければ待機）
        this.findTargetElement();
        if (!this.targetElement) {
            // 要素がまだ存在しない場合、MutationObserverで監視
            this.externalObserver = new MutationObserver(() => {
                if (this.findTargetElement()) {
                    this.externalObserver?.disconnect();
                    this.initExternalOverlay();
                }
            });
            this.externalObserver.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }
        else {
            this.initExternalOverlay();
        }
    }
    findTargetElement() {
        if (!this.target)
            return false;
        this.targetElement = document.querySelector(this.target);
        return this.targetElement !== null;
    }
    initExternalOverlay() {
        if (!this.targetElement || !this.shadowRoot)
            return;
        // オーバーレイとしてレンダリング
        this.renderExternalOverlay();
        this.syncWithTarget();
        // ターゲット要素のサイズ変化を監視
        this.externalResizeObserver = new ResizeObserver(() => {
            this.syncWithTarget();
        });
        this.externalResizeObserver.observe(this.targetElement);
        // ウィンドウリサイズにも対応
        window.addEventListener("resize", this.syncWithTarget);
        // 属性転送: 初期属性を転送
        this.forwardAllAttributes();
        // 属性転送: 属性変更を監視して転送
        this.attributeForwardObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "attributes" && mutation.attributeName) {
                    this.forwardAttribute(mutation.attributeName);
                }
            }
        });
        this.attributeForwardObserver.observe(this, { attributes: true });
        this.setupDrag();
        this.setupCloseButton();
    }
    // 全属性を転送
    forwardAllAttributes() {
        if (!this.targetElement)
            return;
        for (const attr of Array.from(this.attributes)) {
            this.forwardAttribute(attr.name);
        }
    }
    // 単一属性を転送
    forwardAttribute(name) {
        if (!this.targetElement)
            return;
        if (!shouldForwardAttribute(name))
            return;
        const value = this.getAttribute(name);
        if (value !== null) {
            this.targetElement.setAttribute(name, value);
        }
        else {
            this.targetElement.removeAttribute(name);
        }
    }
    renderExternalOverlay() {
        if (!this.shadowRoot)
            return;
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          user-select: none;
          z-index: 10000;
          pointer-events: none;
        }
        :host(.dragging) {
          cursor: grabbing !important;
        }
        :host([hidden]) {
          display: none !important;
        }
        .container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .edge-overlay {
          position: absolute;
          pointer-events: auto;
          cursor: grab;
        }
        .edge-overlay:active {
          cursor: grabbing;
        }
        .edge-top {
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
        }
        .edge-bottom {
          bottom: 0;
          left: 0;
          right: 0;
          height: 8px;
        }
        .edge-left {
          top: 0;
          bottom: 0;
          left: 0;
          width: 8px;
        }
        .edge-right {
          top: 0;
          bottom: 0;
          right: 0;
          width: 8px;
        }
        .close-button {
          position: absolute;
          top: -8px;
          right: -8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s, opacity 0.1s;
          pointer-events: auto;
        }
        .close-button.circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${this.closeColor};
          color: white;
          font-size: 14px;
          line-height: 1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .close-button.circle:hover {
          filter: brightness(0.85);
          transform: scale(1.1);
        }
        .close-button.simple {
          width: 20px;
          height: 20px;
          top: 4px;
          right: 4px;
          background: transparent;
          color: ${this.closeColor};
          font-size: 18px;
          font-weight: bold;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          border-radius: 4px;
        }
        .close-button.simple.outside {
          top: -20px;
          right: -20px;
        }
        .close-button.simple:hover {
          opacity: 0.7;
          transform: scale(1.1);
        }
      </style>
      <div class="container">
        <div class="edge-overlay edge-top"></div>
        <div class="edge-overlay edge-bottom"></div>
        <div class="edge-overlay edge-left"></div>
        <div class="edge-overlay edge-right"></div>
        ${this.closable
            ? `<button class="close-button ${this.closeStyle}${this.closePosition === "outside" ? " outside" : ""}" aria-label="閉じる">×</button>`
            : ""}
      </div>
    `;
    }
    attributeChangedCallback() {
        this.render();
        this.setupCloseButton();
    }
    render() {
        if (!this.shadowRoot)
            return;
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          user-select: none;
          z-index: 9999;
        }
        :host(.dragging) {
          cursor: grabbing !important;
        }
        :host([hidden]) {
          display: none !important;
        }
        .container {
          display: inline-block;
          position: relative;
        }
        :host([resizable]) {
          display: block;
        }
        :host([resizable]) .container {
          width: 100%;
          height: 100%;
          display: block;
        }
        :host([resizable]) ::slotted(*) {
          width: 100%;
          height: 100%;
        }
        .resize-handle {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 16px;
          height: 16px;
          cursor: nwse-resize;
          background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.3) 50%);
          border-radius: 0 0 4px 0;
        }
        .resize-handle:hover {
          background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.5) 50%);
        }
        .edge-overlay {
          position: absolute;
          pointer-events: auto;
          cursor: grab;
        }
        .edge-overlay:active {
          cursor: grabbing;
        }
        .edge-top {
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
        }
        .edge-bottom {
          bottom: 0;
          left: 0;
          right: 0;
          height: 8px;
        }
        .edge-left {
          top: 0;
          bottom: 0;
          left: 0;
          width: 8px;
        }
        .edge-right {
          top: 0;
          bottom: 0;
          right: 0;
          width: 8px;
        }
        .close-button {
          position: absolute;
          top: -8px;
          right: -8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s, opacity 0.1s;
        }
        .close-button.circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${this.closeColor};
          color: white;
          font-size: 14px;
          line-height: 1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .close-button.circle:hover {
          filter: brightness(0.85);
          transform: scale(1.1);
        }
        .close-button.simple {
          width: 20px;
          height: 20px;
          top: 4px;
          right: 4px;
          background: transparent;
          color: ${this.closeColor};
          font-size: 18px;
          font-weight: bold;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          pointer-events: auto;
          border-radius: 4px;
        }
        .close-button.simple.outside {
          top: -20px;
          right: -20px;
        }
        .close-button.simple:hover {
          opacity: 0.7;
          transform: scale(1.1);
        }
      </style>
      <div class="container">
        <slot></slot>
        <div class="edge-overlay edge-top"></div>
        <div class="edge-overlay edge-bottom"></div>
        <div class="edge-overlay edge-left"></div>
        <div class="edge-overlay edge-right"></div>
        ${this.closable
            ? `<button class="close-button ${this.closeStyle}${this.closePosition === "outside" ? " outside" : ""}" aria-label="閉じる">×</button>`
            : ""}
        ${this.resizable ? '<div class="resize-handle"></div>' : ""}
      </div>
    `;
        // 初期位置を設定
        this.initializePosition();
    }
    initializePosition() {
        if (this.positionInitialized)
            return;
        this.positionInitialized = true;
        // x, y が指定されていればそれを使用
        if (this.x !== null && this.y !== null) {
            this.style.left = `${this.x}px`;
            this.style.top = `${this.y}px`;
            return;
        }
        // position が指定されていれば計算
        if (this.position) {
            // 要素のサイズを取得するために一度表示
            requestAnimationFrame(() => {
                this.applyPosition();
            });
            return;
        }
        // デフォルト位置
        this.style.left = "100px";
        this.style.top = "100px";
    }
    applyPosition() {
        const padding = `${this.padding}px`;
        // 全ての位置プロパティをリセット
        this.style.left = "";
        this.style.right = "";
        this.style.top = "";
        this.style.bottom = "";
        switch (this.position) {
            case "top-left":
                this.style.left = padding;
                this.style.top = padding;
                break;
            case "top-right":
                this.style.right = padding;
                this.style.top = padding;
                break;
            case "bottom-left":
                this.style.left = padding;
                this.style.bottom = padding;
                break;
            case "bottom-right":
                this.style.right = padding;
                this.style.bottom = padding;
                break;
            case "center":
                // center は計算が必要なので left/top を使用
                const rect = this.getBoundingClientRect();
                const width = rect.width || 100;
                const height = rect.height || 50;
                this.style.left = `${(window.innerWidth - width) / 2}px`;
                this.style.top = `${(window.innerHeight - height) / 2}px`;
                break;
            default:
                this.style.left = padding;
                this.style.top = padding;
        }
    }
    setupDrag() {
        this.addEventListener("mousedown", this.onMouseDown);
        this.addEventListener("touchstart", this.onTouchStart, { passive: false });
        this.addEventListener("mousemove", this.onMouseMoveForCursor);
        this.addEventListener("mouseleave", this.onMouseLeaveForCursor);
        // ドラッグ後のクリックを無効化
        this.addEventListener("click", this.onClickCapture, true);
    }
    isNearEdge(clientX, clientY) {
        const rect = this.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        // 端からedgeSize px以内かチェック
        const nearLeft = x < this.edgeSize;
        const nearRight = x > rect.width - this.edgeSize;
        const nearTop = y < this.edgeSize;
        const nearBottom = y > rect.height - this.edgeSize;
        return nearLeft || nearRight || nearTop || nearBottom;
    }
    shouldIgnoreEvent(e) {
        // composedPath() でShadow DOM内の実際のターゲットを取得
        const path = e.composedPath();
        for (const el of path) {
            if (!(el instanceof HTMLElement))
                continue;
            // input, textarea, select はドラッグ対象外
            const ignoreTags = ["INPUT", "TEXTAREA", "SELECT"];
            if (ignoreTags.includes(el.tagName))
                return true;
            // 閉じるボタンはドラッグ対象外
            if (el.classList.contains("close-button"))
                return true;
            // リサイズハンドルはドラッグ対象外
            if (el.classList.contains("resize-handle"))
                return true;
        }
        return false;
    }
    setupCloseButton() {
        if (!this.shadowRoot || !this.closable)
            return;
        const closeButton = this.shadowRoot.querySelector(".close-button");
        if (closeButton) {
            closeButton.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this.isExternalMode && this.targetElement) {
                    // 外部モード: ターゲット要素を非表示
                    this.targetElement.style.setProperty("display", "none", "important");
                    this.hidden = true;
                }
                else {
                    this.hidden = true;
                }
                this.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            });
        }
    }
    show() {
        this.hidden = false;
        if (this.isExternalMode && this.targetElement) {
            this.targetElement.style.removeProperty("display");
            // 位置を同期
            requestAnimationFrame(() => this.syncWithTarget());
        }
    }
    hide() {
        this.hidden = true;
        if (this.isExternalMode && this.targetElement) {
            this.targetElement.style.setProperty("display", "none", "important");
        }
    }
    startDrag(clientX, clientY) {
        this.isDragging = true;
        this.hasMoved = false;
        this.classList.add("dragging");
        this.disableIframePointerEvents();
        const rect = this.getBoundingClientRect();
        this.dragOffsetX = clientX - rect.left;
        this.dragOffsetY = clientY - rect.top;
    }
    disableIframePointerEvents() {
        const iframes = this.querySelectorAll("iframe");
        iframes.forEach((iframe) => {
            // 元の値を保存
            this.iframePointerEvents.set(iframe, iframe.style.pointerEvents);
            iframe.style.pointerEvents = "none";
        });
    }
    restoreIframePointerEvents() {
        this.iframePointerEvents.forEach((originalValue, iframe) => {
            iframe.style.pointerEvents = originalValue;
        });
        this.iframePointerEvents.clear();
    }
    updatePosition(clientX, clientY) {
        this.hasMoved = true;
        const newX = clientX - this.dragOffsetX;
        const newY = clientY - this.dragOffsetY;
        if (this.isExternalMode && this.targetElement) {
            // 外部モード: ターゲット要素の位置を直接更新
            const targetWidth = this.targetElement.offsetWidth;
            const targetHeight = this.targetElement.offsetHeight;
            // 画面外に出ないように制限
            const maxX = window.innerWidth - targetWidth;
            const maxY = window.innerHeight - targetHeight;
            const clampedX = Math.max(0, Math.min(newX, maxX));
            const clampedY = Math.max(0, Math.min(newY, maxY));
            // right/bottom で位置を更新（!important で上書き）
            const newRight = window.innerWidth - clampedX - targetWidth;
            const newBottom = window.innerHeight - clampedY - targetHeight;
            this.targetElement.style.setProperty("right", `${newRight}px`, "important");
            this.targetElement.style.setProperty("bottom", `${newBottom}px`, "important");
            this.targetElement.style.setProperty("left", "auto", "important");
            this.targetElement.style.setProperty("top", "auto", "important");
            // オーバーレイも追従
            this.style.left = `${clampedX}px`;
            this.style.top = `${clampedY}px`;
        }
        else {
            // 通常モード: 自身の位置を更新
            this.style.right = "";
            this.style.bottom = "";
            // 画面外に出ないように制限
            const maxX = window.innerWidth - this.offsetWidth;
            const maxY = window.innerHeight - this.offsetHeight;
            this.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            this.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        }
    }
    endDrag() {
        this.isDragging = false;
        this.classList.remove("dragging");
        this.restoreIframePointerEvents();
    }
    setupResize() {
        if (!this.shadowRoot || !this.resizable)
            return;
        const handle = this.shadowRoot.querySelector(".resize-handle");
        if (!handle)
            return;
        handle.addEventListener("mousedown", this.onResizeMouseDown);
        handle.addEventListener("touchstart", this.onResizeTouchStart, { passive: false });
    }
    startResize(clientX, clientY) {
        this.isResizing = true;
        this.resizeStartX = clientX;
        this.resizeStartY = clientY;
        this.resizeStartWidth = this.offsetWidth;
        this.resizeStartHeight = this.offsetHeight;
        this.disableIframePointerEvents();
    }
    updateSize(clientX, clientY) {
        const deltaX = clientX - this.resizeStartX;
        const deltaY = clientY - this.resizeStartY;
        const newWidth = Math.max(100, this.resizeStartWidth + deltaX);
        const newHeight = Math.max(80, this.resizeStartHeight + deltaY);
        this.style.width = `${newWidth}px`;
        this.style.height = `${newHeight}px`;
    }
    endResize() {
        this.isResizing = false;
        this.restoreIframePointerEvents();
    }
    disconnectedCallback() {
        this.removeEventListener("mousedown", this.onMouseDown);
        this.removeEventListener("touchstart", this.onTouchStart);
        this.removeEventListener("mousemove", this.onMouseMoveForCursor);
        this.removeEventListener("mouseleave", this.onMouseLeaveForCursor);
        // 外部モードのクリーンアップ
        if (this.externalObserver) {
            this.externalObserver.disconnect();
            this.externalObserver = null;
        }
        if (this.externalResizeObserver) {
            this.externalResizeObserver.disconnect();
            this.externalResizeObserver = null;
        }
        if (this.attributeForwardObserver) {
            this.attributeForwardObserver.disconnect();
            this.attributeForwardObserver = null;
        }
        window.removeEventListener("resize", this.syncWithTarget);
    }
}
customElements.define("dokodemo-ui", DokodemoUI);
export { DokodemoUI };
