import { _decorator, CCFloat, Component, Label, Node, UITransform, warn } from 'cc';
import { EDITOR } from 'cc/env';
import { MeasureFn, TextWrap, WrapOptions } from './TextWrap';
const { ccclass, property, executeInEditMode, requireComponent, disallowMultiple, menu } = _decorator;

/**
 * Tu ngat dong cho Label chua chu khong dung khoang trang de tach tu.
 *
 * Chay qua TextWrap nen xu ly duoc MOI he chu da dang ky — hien la Myanmar va Khmer,
 * cong Latin/Vietnamese/CJK. Dat canh cc.Label chu khong thay the no.
 *
 * Engine ngat dong theo CHAR_SET trong cocos/2d/utils/text-utils.ts. Myanmar va Khmer
 * khong nam trong bang do nen moi ky tu bi coi la mot tu rieng va dong bi cat vao giua
 * cum ky tu. Component nay tu do chu, tu chen '\n' vao dung cho ngat cum, roi gan chuoi
 * da ngat vao Label. Vi moi dong deu <= maxWidth nen fragmentText cua engine khong con
 * gi de ngat nua — moi che do Overflow deu chay dung.
 *
 * Cach dung:
 *   - Gan component vao node co san Label, dat text qua thuoc tinh `text` (KHONG
 *     dat truc tiep `Label.string`, se bi ghi de o lan refresh sau).
 *   - Tu code:  node.getComponent(UILabel).text = '...';
 *
 * Chi ho tro font TTF / system font. BitmapFont phai do theo xAdvance cua fnt nen
 * component se canh bao va do tam bang canvas (ket qua gan dung).
 */
@ccclass('UILabel')
@requireComponent(Label)
@disallowMultiple
@executeInEditMode(true)
@menu('CustomUI/UILabel')
export class UILabel extends Component {

    @property
    private _text: string = '';

    /** Van ban goc, chua ngat dong. */
    @property({ multiline: true, displayName: 'Text' })
    public get text(): string {
        return this._text;
    }
    public set text(value: string) {
        value = value || '';
        if (value === this._text) return;
        this._text = value;
        this.refresh();
    }

    @property({
        type: CCFloat,
        tooltip: 'Be rong toi da cua mot dong (px). <= 0 thi lay width cua UITransform.',
    })
    public maxWidth: number = 0;

    @property({
        type: CCFloat,
        tooltip: 'Tru hao vai px de phong lech giua phep do cua script va cua engine.',
    })
    public safety: number = 2;

    @property({
        tooltip: 'Khmer: neu chuoi da co san ZWSP (U+200B) danh dau ranh gioi tu thi '
            + 'chi ngat o do, khong tach cum. Tat neu chuoi co ZWSP rac.',
    })
    public preferZwsp: boolean = true;

    private _label: Label = null;
    private _transform: UITransform = null;
    private _lastKey: string = '';
    private _warnedNoWidth: boolean = false;

    // -----------------------------------------------------------------------
    // Vong doi
    // -----------------------------------------------------------------------

    protected onLoad(): void {
        this._label = this.getComponent(Label);
        this._transform = this.getComponent(UITransform);
        // Lay chuoi dang co tren Label lam text goc neu chua nhap gi
        if (!this._text && this._label) this._text = this._label.string;
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.SIZE_CHANGED, this.refresh, this);
        this.refresh();
        // Font TTF co the chua load xong o frame dau -> do lai mot lan nua
        if (!EDITOR) {
            this.scheduleOnce(() => {
                this.markDirty();
                this.refresh();
            }, 0);
        }
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.SIZE_CHANGED, this.refresh, this);
    }

    // -----------------------------------------------------------------------
    // API
    // -----------------------------------------------------------------------

    /** Tinh lai ngat dong va gan vao Label. Goi tay sau khi doi fontSize/font. */
    public refresh(): void {
        const label = this._label || (this._label = this.getComponent(Label));
        if (!label) return;

        const width = this._resolveMaxWidth();
        if (width <= 0) {
            label.string = this._text;
            return;
        }

        const fontDesc = UILabel._getFontDesc(label);

        // Bo qua neu khong co gi thay doi — refresh bi goi moi lan SIZE_CHANGED
        const key = `${fontDesc}|${width}|${this.preferZwsp}|${this._text}`;
        if (key === this._lastKey) return;
        this._lastKey = key;

        const options: WrapOptions = { preferZwsp: this.preferZwsp };
        label.string = TextWrap.wrap(this._text, width, UILabel._measurer(fontDesc), options);
    }

    /** Ep tinh lai o lan refresh sau, ke ca khi khong co gi doi. */
    public markDirty(): void {
        this._lastKey = '';
    }

    private _resolveMaxWidth(): number {
        if (this.maxWidth > 0) return this.maxWidth - this.safety;

        // Overflow.NONE thi Label tu gian theo noi dung: lay width cua node lam
        // rang buoc se sinh vong lap SIZE_CHANGED -> bat buoc phai dat maxWidth.
        if (this._label && this._label.overflow === Label.Overflow.NONE) {
            if (!this._warnedNoWidth) {
                this._warnedNoWidth = true;
                warn(`[UILabel] ${this.node.name}: Label dang o Overflow.NONE, `
                    + 'phai dat maxWidth > 0 thi moi ngat dong duoc.');
            }
            return 0;
        }

        const tf = this._transform || (this._transform = this.getComponent(UITransform));
        return tf ? tf.width - this.safety : 0;
    }

    // -----------------------------------------------------------------------
    // Do chu — dung dung font desc ma engine dung, xem
    // cocos/2d/assembler/label/text-processing.ts::_getFontDesc
    // -----------------------------------------------------------------------

    private static _ctx: CanvasRenderingContext2D = null;
    private static _cache: Map<string, number> = new Map();

    private static _getFontDesc(label: Label): string {
        let family = 'Arial';
        if (label.useSystemFont) {
            family = label.fontFamily || 'Arial';
        } else if (label.font) {
            // TTFFont._nativeAsset tra ve ten font family da dang ky
            family = (label.font as any)._nativeAsset || 'Arial';
        }

        let desc = `${label.fontSize}px ${family}`;
        if (label.isBold) desc = `bold ${desc}`;
        if (label.isItalic) desc = `italic ${desc}`;
        return desc;
    }

    private static _measurer(fontDesc: string): MeasureFn {
        if (!UILabel._ctx) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            UILabel._ctx = canvas.getContext('2d');
        }
        const ctx = UILabel._ctx;
        const cache = UILabel._cache;

        return (text: string): number => {
            const key = fontDesc + '\u0000' + text;
            const hit = cache.get(key);
            if (hit !== undefined) return hit;

            if (cache.size > 4000) cache.clear();
            // Dat lai moi lan do: ctx dung chung, component khac co the da doi font
            ctx.font = fontDesc;
            const width = ctx.measureText(text).width || 0;
            cache.set(key, width);
            return width;
        };
    }
}
