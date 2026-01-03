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
type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
declare class DokodemoUI extends HTMLElement {
    private isDragging;
    private isResizing;
    private hasMoved;
    private dragOffsetX;
    private dragOffsetY;
    private resizeStartX;
    private resizeStartY;
    private resizeStartWidth;
    private resizeStartHeight;
    private positionInitialized;
    private iframePointerEvents;
    private edgeSize;
    static get observedAttributes(): string[];
    get closable(): boolean;
    set closable(value: boolean);
    get position(): Position | null;
    set position(value: Position | null);
    get padding(): number;
    set padding(value: number);
    get closeColor(): string;
    set closeColor(value: string);
    get closeStyle(): "circle" | "simple";
    set closeStyle(value: "circle" | "simple");
    get closePosition(): "inside" | "outside";
    set closePosition(value: "inside" | "outside");
    get resizable(): boolean;
    set resizable(value: boolean);
    get x(): number | null;
    set x(value: number | null);
    get y(): number | null;
    set y(value: number | null);
    constructor();
    connectedCallback(): void;
    attributeChangedCallback(): void;
    private render;
    private initializePosition;
    private applyPosition;
    private setupDrag;
    private isNearEdge;
    private onMouseMoveForCursor;
    private onMouseLeaveForCursor;
    private onClickCapture;
    private onMouseDown;
    private onTouchStart;
    private shouldIgnoreEvent;
    private setupCloseButton;
    show(): void;
    hide(): void;
    private startDrag;
    private disableIframePointerEvents;
    private restoreIframePointerEvents;
    private onMouseMove;
    private onTouchMove;
    private updatePosition;
    private onMouseUp;
    private onTouchEnd;
    private endDrag;
    private setupResize;
    private onResizeMouseDown;
    private onResizeTouchStart;
    private startResize;
    private onResizeMouseMove;
    private onResizeTouchMove;
    private updateSize;
    private onResizeMouseUp;
    private onResizeTouchEnd;
    private endResize;
    disconnectedCallback(): void;
}
export { DokodemoUI };
