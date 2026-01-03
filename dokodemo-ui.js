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
class DokodemoUI extends HTMLElement {
    static get observedAttributes() {
        return ["closable"];
    }
    get closable() {
        return this.hasAttribute("closable");
    }
    set closable(value) {
        if (value) {
            this.setAttribute("closable", "");
        }
        else {
            this.removeAttribute("closable");
        }
    }
    get position() {
        return this.getAttribute("position");
    }
    set position(value) {
        if (value) {
            this.setAttribute("position", value);
        }
        else {
            this.removeAttribute("position");
        }
    }
    get padding() {
        return parseInt(this.getAttribute("padding") || "20", 10);
    }
    set padding(value) {
        this.setAttribute("padding", String(value));
    }
    get closeColor() {
        return this.getAttribute("close-color") || "#ff5f57";
    }
    set closeColor(value) {
        this.setAttribute("close-color", value);
    }
    get closeStyle() {
        return this.getAttribute("close-style") || "circle";
    }
    set closeStyle(value) {
        this.setAttribute("close-style", value);
    }
    get closePosition() {
        return this.getAttribute("close-position") || "inside";
    }
    set closePosition(value) {
        this.setAttribute("close-position", value);
    }
    get resizable() {
        return this.hasAttribute("resizable");
    }
    set resizable(value) {
        if (value) {
            this.setAttribute("resizable", "");
        }
        else {
            this.removeAttribute("resizable");
        }
    }
    get x() {
        const attr = this.getAttribute("x");
        return attr ? parseInt(attr, 10) : null;
    }
    set x(value) {
        if (value !== null) {
            this.setAttribute("x", String(value));
            this.style.left = `${value}px`;
        }
        else {
            this.removeAttribute("x");
        }
    }
    get y() {
        const attr = this.getAttribute("y");
        return attr ? parseInt(attr, 10) : null;
    }
    set y(value) {
        if (value !== null) {
            this.setAttribute("y", String(value));
            this.style.top = `${value}px`;
        }
        else {
            this.removeAttribute("y");
        }
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
            document.addEventListener("touchmove", this.onTouchMove, { passive: false });
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
            document.addEventListener("touchmove", this.onResizeTouchMove, { passive: false });
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
        this.render();
        this.setupDrag();
        this.setupCloseButton();
        this.setupResize();
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
          background: rgba(0,0,0,0.1);
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
        ${this.closable ? `<button class="close-button ${this.closeStyle}${this.closePosition === 'outside' ? ' outside' : ''}" aria-label="閉じる">×</button>` : ''}
        ${this.resizable ? '<div class="resize-handle"></div>' : ''}
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
                this.hidden = true;
                this.dispatchEvent(new CustomEvent("close", { bubbles: true }));
            });
        }
    }
    show() {
        this.hidden = false;
    }
    hide() {
        this.hidden = true;
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
        // ドラッグ中は left/top を使用（right/bottom をクリア）
        this.style.right = "";
        this.style.bottom = "";
        const newX = clientX - this.dragOffsetX;
        const newY = clientY - this.dragOffsetY;
        // 画面外に出ないように制限
        const maxX = window.innerWidth - this.offsetWidth;
        const maxY = window.innerHeight - this.offsetHeight;
        this.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
        this.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
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
    }
}
customElements.define("dokodemo-ui", DokodemoUI);
export { DokodemoUI };
