/**
 * Loi word wrap dung chung cho cac he chu KHONG dung khoang trang de tach tu.
 *
 * Engine ngat dong theo CHAR_SET trong cocos/2d/utils/text-utils.ts. Myanmar va
 * Khmer khong nam trong bang do nen moi ky tu bi coi la mot tu rieng, dong bi cat
 * vao giua cum ky tu va chu vo hoan toan. Module nay tach van ban thanh cac "atom"
 * — don vi nho nhat khong duoc cat doi — roi xep tham lam vao tung dong.
 *
 * Moi he chu dang ky mot ScriptSegmenter. Hien co Myanmar va Khmer; them Lao/Thai
 * chi can push them mot segmenter vao TextWrap.segmenters.
 *
 * Facade theo tung ngon ngu: MyanmarWrap, KhmerWrap.
 *
 * LUU Y: moi lop ky tu deu viet bang \u escape. File nay toan dau ket hop va ky tu
 * vo hinh, viet truc tiep se khong doc/sua duoc va de bi hong khi doi encoding.
 */

// ---------------------------------------------------------------------------
// Bang ky tu dung chung
// ---------------------------------------------------------------------------

/** U+200D ZERO WIDTH JOINER. */
const ZWJ = '\u200D';

/**
 * U+200B ZERO WIDTH SPACE. Van ban Khmer thuong da chen san ky tu nay o ranh gioi
 * TU THAT SU — quy hon nhieu so voi ngat theo cum, nen duoc uu tien khi co.
 */
export const ZWSP = '\u200B';

/** Khoang trang — khop dung isUnicodeSpace cua engine, cong them ZWSP. */
const RE_SPACE = new RegExp('['
    + '\\t\\n\\u000B\\f\\r \\u0085\\u00A0\\u1680'
    + '\\u2000-\\u200A\\u200B\\u2028\\u2029\\u202F\\u205F\\u3000'
    + ']');

/**
 * Chu cai Latin / Vietnamese / Greek / Cyrillic / Armenian… — gom thanh mot tu.
 * Co ke ca dau ket hop de "e" + U+0301 khong bi tach lam hai atom.
 */
const RE_WORD = new RegExp('['
    + '0-9A-Za-z\\u00AA\\u00B5\\u00BA'
    + '\\u00C0-\\u02AF'   // Latin-1 Supplement, Latin Extended-A/B, IPA
    + '\\u0300-\\u036F'   // dau ket hop
    + '\\u0370-\\u058F'   // Greek, Cyrillic, Armenian
    + '\\u1E00-\\u1EFF'   // Latin Extended Additional (tieng Viet nam o day)
    + '\\u2C60-\\u2C7F\\uA720-\\uA7FF'
    + ']');

/** CJK / Kana / Hangul — moi ky tu tu ngat dong duoc. */
const RE_CJK = new RegExp('['
    + '\\u2E80-\\u303E\\u3041-\\u33FF\\u3400-\\u4DBF\\u4E00-\\u9FFF'
    + '\\uA000-\\uA4CF\\uAC00-\\uD7AF\\uF900-\\uFAFF\\uFE30-\\uFE4F'
    + '\\uFF00-\\uFF60\\uFFE0-\\uFFE6'
    + ']');

/** Khong duoc DUNG DAU dong — dinh vao cum phia truoc. */
const RE_NO_START = new RegExp('['
    + '!,.:;\'")\\]}%?>~\\-/'
    + '\\u00BB\\u2019\\u201D\\u2026\\u2013\\u2014'
    + '\\u0EAF\\u0EC6'    // Lao: ellipsis, dau lap ໆ
    + '\\u104A\\u104B'    // Myanmar: dau phay, dau cham
    + '\\u17D4-\\u17DA'   // Khmer: khan, bariyoosan, camnuc pii kuuh, lek too…
    + '\\u3001\\u3002\\u300B\\u300D\\u300F\\u3011\\u3015'
    + '\\uFF01\\uFF09\\uFF0C\\uFF0E\\uFF1A\\uFF1B\\uFF1F\\uFF5D'
    + ']');

/** Khong duoc DUNG CUOI dong — day xuong dinh vao cum phia sau. */
const RE_NO_END = new RegExp('['
    + '(\\[{<'
    + '\\u00AB\\u2018\\u201C'
    + '\\u300A\\u300C\\u300E\\u3010\\u3014'
    + '\\uFF08\\uFF3B\\uFF5B'
    + ']');

/** Dau ket hop (combining marks) — khong bao gio tach khoi ky tu goc. */
const RE_MARK = new RegExp('['
    + '\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u0610-\\u061A'
    + '\\u064B-\\u065F\\u0670\\u06D6-\\u06DC'
    + '\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E'   // Thai
    // Lao: ke ca nguyen am chiem cho (U+0EB0 ະ, U+0EB2 າ, U+0EB3 ຳ, U+0EBD ຽ) — chung
    // ve ra co be rong that nhung khong bao gio dung mot minh hay mo dau mot dong
    + '\\u0EB0-\\u0EBD\\u0EC8-\\u0ECD'
    + '\\u102B-\\u103E'                         // Myanmar: nguyen am, medial, asat, virama
    + '\\u1056-\\u1059\\u105E-\\u1060\\u1062-\\u1064\\u1067-\\u106D'
    + '\\u1071-\\u1074\\u1082-\\u108D\\u108F\\u109A-\\u109D'
    + '\\u17B4-\\u17D3\\u17DD'                  // Khmer: nguyen am, shifter, coeng, atthacan
    + '\\u1AB0-\\u1AFF\\u1DC0-\\u1DFF\\u20D0-\\u20F0'
    + '\\uA9E5\\uAA7B-\\uAA7D'
    + '\\uFE00-\\uFE0F\\uFE20-\\uFE2F'          // variation selector, half marks
    + '\\u200C'                                 // ZWNJ
    + ']');

/**
 * Dau CHONG: ky tu ngay SAU no bi keo xuong duoi chan chu truoc, thanh mot glyph
 * duy nhat. Cat vao day la vo chu — U+1039 virama (Myanmar), U+17D2 coeng (Khmer).
 */
const RE_STACKER = new RegExp('[\\u1039\\u17D2]');

/**
 * Nguyen am DUNG TRUOC: luu truoc phu am trong chuoi va cung ve ben trai phu am khi
 * ve. Ky tu ngay SAU no la phu am cua chinh no — Lao U+0EC0-U+0EC4, Thai U+0E40-U+0E44.
 */
const RE_PREVOWEL = new RegExp('[\\u0E40-\\u0E44\\u0EC0-\\u0EC4]');

// ---------------------------------------------------------------------------
// Kieu du lieu
// ---------------------------------------------------------------------------

/** Ham do be rong mot chuoi, tinh bang px. */
export type MeasureFn = (text: string) => number;

export interface WrapOptions {
    /**
     * Neu doan van da co san ZWSP (U+200B) danh dau ranh gioi tu thi CHI ngat o do,
     * bo qua viec tach cum. Van ban Khmer chuan thuong co san. Mac dinh: true.
     */
    preferZwsp?: boolean;
}

/** Bo tach cum cho mot he chu khong dung khoang trang. */
export interface ScriptSegmenter {
    /** Ten he chu, chi de debug. */
    name: string;
    /** Khop mot ky tu bat ky thuoc he chu nay. */
    match: RegExp;
    /** Tach mot cum lien tuc thanh cac don vi khong duoc cat doi. */
    segment: (run: string) => string[];
}

interface Atom {
    text: string;
    /** true = cum khoang trang, bi nuot khi roi vao cuoi dong. */
    space: boolean;
}

// ---------------------------------------------------------------------------
// Segmenter dung chung cho cac he chu Brahmic
// ---------------------------------------------------------------------------

export interface ClusterRules {
    name: string;
    /** Moi ky tu thuoc he chu. */
    all: RegExp;
    /** Ky tu MO DAU duoc mot cum: phu am, nguyen am doc lap, chu so, ky hieu. */
    initial: RegExp;
    /**
     * Neu ky tu LIEN TRUOC khop cai nay thi khong duoc mo cum moi tai day. Dung cho
     * dau chong (U+1039 virama, U+17D2 coeng) va cho nguyen am dung truoc cua Lao.
     */
    noBreakAfter: RegExp;
    /**
     * Neu ky tu KE TIEP khop cai nay thi ky tu hien tai van thuoc cum truoc.
     * Myanmar dung cho U+103A asat (phu am cuoi). Khmer khong can.
     */
    trailing?: RegExp;
    /** Chu so — day chu so lien nhau giu nguyen khoi. */
    digit: RegExp;
    /**
     * Gop mot cum "tran" (phu am khong co dau nguyen am nao) vao cum dung truoc.
     * Cum tran hau nhu luon la phu am cuoi cua am tiet truoc — Khmer can, Myanmar
     * da co asat lo viec nay roi.
     */
    mergeBare?: RegExp;
}

/** Dung mot ScriptSegmenter tu bo luat tach cum. */
export function makeClusterSegmenter(rules: ClusterRules): ScriptSegmenter {
    const segment = (run: string): string[] => {
        if (run.length <= 1) return run ? [run] : [];

        const out: string[] = [];
        let start = 0;

        for (let i = 1; i < run.length; i++) {
            const cur = run[i];

            // Dau phu, dau nguyen am, medial… -> luon thuoc ve cum dang chay
            if (!rules.initial.test(cur)) continue;

            // Dung ngay sau dau chong / nguyen am dung truoc => van thuoc cum dang chay
            if (rules.noBreakAfter.test(run[i - 1])) continue;

            // Ky tu ke tiep bao rang cur van thuoc cum truoc (asat / dau chong)
            const next = run[i + 1];
            if (next !== undefined && rules.trailing && rules.trailing.test(next)) continue;

            // Day chu so lien nhau giu nguyen khoi
            if (rules.digit.test(cur) && rules.digit.test(run[i - 1])) continue;

            out.push(run.slice(start, i));
            start = i;
        }
        out.push(run.slice(start));

        if (!rules.mergeBare || out.length < 2) return out;

        // Cum "tran" = khong chua dau nguyen am nao -> nhap vao cum dung truoc
        const merged: string[] = [out[0]];
        for (let i = 1; i < out.length; i++) {
            if (!rules.mergeBare.test(out[i])) {
                merged[merged.length - 1] += out[i];
            } else {
                merged.push(out[i]);
            }
        }

        // Cum tran o dau chuoi khong co gi de nhap nguoc -> nhap xuoi vao cum sau.
        // Chi ap dung khi cum dau van con tro tron: neu no da hut duoc phu am cuoi nao
        // thi tu no da la mot am tiet hoan chinh roi (vd 'or' trong 'orkun').
        if (merged.length > 1 && merged[0] === out[0] && !rules.mergeBare.test(merged[0])) {
            merged[1] = merged[0] + merged[1];
            merged.shift();
        }
        return merged;
    };

    return { name: rules.name, match: rules.all, segment };
}

// ---------------------------------------------------------------------------
// Myanmar (Burmese)
// ---------------------------------------------------------------------------

/**
 * Luat tach am tiet theo sylbreak (Ye Kyaw Thu): bat dau am tiet moi truoc mot
 * phu am / nguyen am doc lap, TRU KHI ky tu truoc la U+1039 (virama — dang bi chong
 * duoi) hoac ky tu sau la U+103A (asat — phu am cuoi) hay U+1039 (mo cum chong).
 */
export const MyanmarSegmenter: ScriptSegmenter = makeClusterSegmenter({
    name: 'Myanmar',
    // U+1000-U+109F, Extended-A U+A9E0-U+A9FF, Extended-B U+AA60-U+AA7F
    all: new RegExp('[\\u1000-\\u109F\\uA9E0-\\uA9FF\\uAA60-\\uAA7F]'),
    // Co tinh loai U+104A va U+104B — hai dau cau nay luon dinh vao am tiet truoc
    initial: new RegExp('['
        + '\\u1000-\\u102A'   // phu am U+1000-U+1021 + nguyen am doc lap U+1023-U+102A
        + '\\u103F'           // great sa
        + '\\u1040-\\u1049'   // chu so Myanmar
        + '\\u104C-\\u104F'   // ky hieu
        + '\\u1050-\\u1055'   // phu am / nguyen am Pali-Sanskrit
        + '\\u105A-\\u105D'   // Mon
        + '\\u1061\\u1065\\u1066\\u106E-\\u1070' // Sgaw Karen, Pwo Karen
        + '\\u1075-\\u1081\\u108E'               // Shan, Rumai Palaung
        + '\\u1090-\\u1099'   // chu so Shan
        + '\\uA9E0-\\uA9E4\\uA9E6-\\uA9FE'       // Extended-A (bo U+A9E5 la dau phu)
        + '\\uAA60-\\uAA7A\\uAA7E-\\uAA7F'       // Extended-B (bo U+AA7B-U+AA7D la dau phu)
        + ']'),
    noBreakAfter: new RegExp('[\\u1039]'),
    trailing: new RegExp('[\\u103A\\u1039]'),
    digit: new RegExp('[\\u1040-\\u1049\\u1090-\\u1099\\uA9F0-\\uA9F9]'),
});

// ---------------------------------------------------------------------------
// Khmer (Cambodia)
// ---------------------------------------------------------------------------

/**
 * Khmer khong co dau tuong duong asat cua Myanmar, nen ranh gioi TU that su chi
 * xac dinh duoc bang tu dien (ICU dung dictionary + quy hoach dong). O day ngat
 * theo CUM CHINH TA (orthographic cluster):
 *
 *   cum = phu am goc + [U+17D2 coeng + phu am]* + [shifter] + [nguyen am] + [dau]
 *
 * Bat dau cum moi truoc mot phu am / nguyen am doc lap, TRU KHI ky tu truoc la
 * U+17D2 (coeng — dang bi keo xuong duoi chan chu truoc).
 *
 * Cach nay bao dam khong bao gio cat vao giua mot glyph, nhung van co the ngat
 * giua hai am tiet cua cung mot tu. Hai lop giam thieu:
 *   1. Neu chuoi co san ZWSP (U+200B) thi chi ngat o do — xem WrapOptions.preferZwsp.
 *   2. Cum "tran" (phu am khong mang dau nguyen am nao) hau nhu luon la phu am cuoi
 *      cua am tiet truoc, nen duoc nhap nguoc vao cum do. Vi du kh-mae + r ->
 *      'ខ្មែរ' giu nguyen mot khoi thay vi tach thanh 'ខ្មែ' | 'រ'.
 * Muon chuan tuyet doi thi thay segment bang tu dien — xem KhmerWrap.setWordSegmenter.
 */
export const KhmerSegmenter: ScriptSegmenter = makeClusterSegmenter({
    name: 'Khmer',
    // U+1780-U+17FF, Khmer Symbols U+19E0-U+19FF
    all: new RegExp('[\\u1780-\\u17FF\\u19E0-\\u19FF]'),
    // Co tinh loai U+17D4-U+17DA — dau cau, luon dinh vao cum truoc
    initial: new RegExp('['
        + '\\u1780-\\u17A2'   // phu am
        + '\\u17A3-\\u17B3'   // nguyen am doc lap
        + '\\u17DB\\u17DC'    // riel, avakrahasanya
        + '\\u17E0-\\u17E9'   // chu so Khmer
        + '\\u17F0-\\u17F9'   // ky hieu boi toan
        + '\\u19E0-\\u19FF'   // ky hieu lich am
        + ']'),
    noBreakAfter: new RegExp('[\\u17D2]'),
    digit: new RegExp('[\\u17E0-\\u17E9]'),
    // Cum co "chat" = co it nhat mot dau nguyen am / dau am (U+17B6-U+17D1),
    // hoac la chu so / ky hieu. Nguoc lai la cum tran -> gop nguoc.
    mergeBare: new RegExp('[\\u17B6-\\u17D1\\u17DD\\u17E0-\\u17E9\\u17F0-\\u17F9\\u19E0-\\u19FF]'),
});

// ---------------------------------------------------------------------------
// Lao
// ---------------------------------------------------------------------------

/**
 * Lao cung khong dung khoang trang de tach tu (khoang trang chi dat giua cac menh de),
 * va cung can tu dien moi biet ranh gioi tu that su. O day ngat theo CUM CHINH TA.
 *
 * Khac Myanmar/Khmer o hai diem, ca hai deu duoc xu ly rieng:
 *
 *   1. NGUYEN AM DUNG TRUOC — U+0EC0-U+0EC4 (ເ ແ ໂ ໃ ໄ) nam TRUOC phu am trong chuoi
 *      va ve ra ben trai phu am. Cum bat dau tu nguyen am nay, va tuyet doi khong duoc
 *      ngat giua no voi phu am dung sau (xem noBreakAfter + RE_PREVOWEL).
 *
 *   2. NGUYEN AM CACH (U+0EB0 ະ, U+0EB2 າ, U+0EB3 ຳ, U+0EBD ຽ) la ky tu chiem cho chu
 *      khong phai dau ket hop, nhung van khong duoc mo dau mot cum -> loai khoi initial.
 *
 * Them mot luat nua cho Lao: phu am dung ngay sau dau nguyen am / dau thanh KHONG mo cum
 * moi, vi no la phu am cuoi cua am tiet do — hoac la mot phan cua nguyen am ghep kieu
 * ເ-ືອ. Nho vay 'ເມືອງ' giu nguyen mot khoi thay vi tach thanh 'ເມື' | 'ອງ'.
 */
export const LaoSegmenter: ScriptSegmenter = makeClusterSegmenter({
    name: 'Lao',
    all: new RegExp('[\\u0E80-\\u0EFF]'),
    // Chi phu am, nguyen am dung truoc va chu so moi mo duoc cum.
    // Loai U+0EAF (ellipsis) va U+0EC6 (dau lap) — chung dinh vao cum truoc.
    initial: new RegExp('['
        + '\\u0E81-\\u0EAE'   // phu am ກ-ຮ (co vai o trong, vo hai)
        + '\\u0EC0-\\u0EC4'   // nguyen am dung truoc ເ ແ ໂ ໃ ໄ
        + '\\u0ED0-\\u0ED9'   // chu so Lao
        + '\\u0EDC-\\u0EDF'   // phu am ghep ໜ ໝ ໞ ໟ
        + ']'),
    // Sau nguyen am dung truoc la phu am cua chinh no; sau dau nguyen am / virama /
    // dau thanh la phu am cuoi cua am tiet do.
    noBreakAfter: new RegExp('[\\u0EC0-\\u0EC4\\u0EB1\\u0EB4-\\u0EBC\\u0EC8-\\u0ECD]'),
    digit: new RegExp('[\\u0ED0-\\u0ED9]'),
    // Cum co "chat" = co nguyen am, dau thanh, dau lap hoac la chu so.
    mergeBare: new RegExp('[\\u0EB0-\\u0EBD\\u0EC0-\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9]'),
});

// ---------------------------------------------------------------------------
// TextWrap
// ---------------------------------------------------------------------------

export class TextWrap {

    /** Cac he chu duoc tach theo cum. Them Thai thi push vao day. */
    public static segmenters: ScriptSegmenter[] = [MyanmarSegmenter, KhmerSegmenter, LaoSegmenter];

    /**
     * Chen dau ngat vao moi vi tri duoc phep xuong dong, khong can do chu.
     * Huu ich de debug hoac de day chuoi cho mot layout engine khac xu ly.
     */
    public static insertBreaks(text: string, separator: string = ZWSP, options?: WrapOptions): string {
        const parts: string[] = [];
        for (const paragraph of text.split(/\r\n|[\r\n]/)) {
            const atoms = TextWrap._tokenize(paragraph, TextWrap._zwspOnly(paragraph, options));
            parts.push(atoms.map((a) => a.text).join(separator));
        }
        return parts.join('\n');
    }

    /**
     * Ngat dong, tra ve mang tung dong.
     * @param text     van ban goc (duoc phep chua '\n')
     * @param maxWidth be rong toi da cua mot dong, tinh bang px
     * @param measure  ham do be rong — phai dung dung font/size cua Label
     */
    public static wrapLines(text: string, maxWidth: number, measure: MeasureFn, options?: WrapOptions): string[] {
        if (!text) return [''];

        const lines: string[] = [];
        for (const paragraph of text.split(/\r\n|[\r\n]/)) {
            if (!paragraph) {
                lines.push('');
                continue;
            }
            const atoms = TextWrap._tokenize(paragraph, TextWrap._zwspOnly(paragraph, options));
            TextWrap._layout(atoms, maxWidth, measure, lines);
        }
        return lines;
    }

    /** Nhu wrapLines nhung tra ve mot chuoi da noi bang '\n'. */
    public static wrap(text: string, maxWidth: number, measure: MeasureFn, options?: WrapOptions): string {
        return TextWrap.wrapLines(text, maxWidth, measure, options).join('\n');
    }

    // -----------------------------------------------------------------------
    // Noi bo
    // -----------------------------------------------------------------------

    /** Doan van da tu danh dau ranh gioi tu bang ZWSP thi khong tach cum nua. */
    private static _zwspOnly(paragraph: string, options?: WrapOptions): boolean {
        const prefer = !options || options.preferZwsp !== false;
        return prefer && paragraph.indexOf(ZWSP) >= 0;
    }

    /** Doc mot cluster: ky tu goc + dau ket hop + dau chong + surrogate pair + ZWJ. */
    private static _readCluster(text: string, from: number): { text: string, next: number } {
        let i = from;
        let size = text.codePointAt(i) > 0xFFFF ? 2 : 1;
        let cluster = text.slice(i, i + size);
        i += size;

        // Nguyen am dung truoc (Lao/Thai) khong tu dung mot minh -> nuot luon phu am sau no
        if (RE_PREVOWEL.test(cluster) && i < text.length) {
            size = text.codePointAt(i) > 0xFFFF ? 2 : 1;
            cluster += text.slice(i, i + size);
            i += size;
        }

        while (i < text.length) {
            const ch = text[i];

            if (RE_MARK.test(ch)) {
                cluster += ch;
                i++;
                // Sau dau chong la mot phu am bi keo xuong duoi -> nuot luon
                if (RE_STACKER.test(ch) && i < text.length) {
                    size = text.codePointAt(i) > 0xFFFF ? 2 : 1;
                    cluster += text.slice(i, i + size);
                    i += size;
                }
                continue;
            }

            if (ch === ZWJ) {
                // ZWJ noi hai ky tu thanh mot glyph (emoji ghep) -> nuot luon ky tu sau
                cluster += ch;
                i++;
                if (i < text.length) {
                    size = text.codePointAt(i) > 0xFFFF ? 2 : 1;
                    cluster += text.slice(i, i + size);
                    i += size;
                }
                continue;
            }

            break;
        }
        return { text: cluster, next: i };
    }

    /** Bam mot doan (khong chua '\n') thanh mang atom. */
    private static _tokenize(paragraph: string, zwspOnly: boolean): Atom[] {
        const atoms: Atom[] = [];
        // Ky tu cam dung cuoi dong, dang cho dan vao atom ke tiep
        let glue = '';

        const emit = (raw: string): void => {
            let text = raw;
            if (glue) {
                text = glue + text;
                glue = '';
            }

            const prev = atoms[atoms.length - 1];
            const head = text[0];
            // Cam dung dau dong (hoac la dau ket hop mo coi) -> nhap vao atom chu lien truoc
            if (prev && !prev.space && (RE_NO_START.test(head) || RE_MARK.test(head))) {
                prev.text += text;
                return;
            }
            // Cam dung cuoi dong -> giu lai, cho atom sau
            if (text.length === 1 && RE_NO_END.test(text)) {
                glue = text;
                return;
            }
            atoms.push({ text, space: false });
        };

        let i = 0;
        while (i < paragraph.length) {
            const ch = paragraph[i];

            // 1. Khoang trang (ke ca ZWSP)
            if (RE_SPACE.test(ch)) {
                let j = i;
                while (j < paragraph.length && RE_SPACE.test(paragraph[j])) j++;
                if (glue) {
                    // Dau mo ngoac dung truoc khoang trang thi coi nhu chu binh thuong
                    atoms.push({ text: glue, space: false });
                    glue = '';
                }
                atoms.push({ text: paragraph.slice(i, j), space: true });
                i = j;
                continue;
            }

            // 2. He chu khong dung khoang trang -> tach theo cum
            const script = TextWrap._scriptOf(ch);
            if (script) {
                let j = i;
                while (j < paragraph.length && script.match.test(paragraph[j])) j++;
                const run = paragraph.slice(i, j);
                if (zwspOnly) {
                    emit(run);
                } else {
                    const clusters = script.segment(run);
                    for (let k = 0; k < clusters.length; k++) emit(clusters[k]);
                }
                i = j;
                continue;
            }

            // 3. Tu Latin / Vietnamese / Cyrillic…
            if (RE_WORD.test(ch)) {
                let j = i;
                while (j < paragraph.length && RE_WORD.test(paragraph[j])) j++;
                emit(paragraph.slice(i, j));
                i = j;
                continue;
            }

            // 4. CJK: moi ky tu mot atom
            if (RE_CJK.test(ch)) {
                emit(ch);
                i++;
                continue;
            }

            // 5. Dau cau, ky hieu, emoji…
            const cluster = TextWrap._readCluster(paragraph, i);
            emit(cluster.text);
            i = cluster.next;
        }

        if (glue) atoms.push({ text: glue, space: false });
        return atoms;
    }

    private static _scriptOf(ch: string): ScriptSegmenter | null {
        const list = TextWrap.segmenters;
        for (let i = 0; i < list.length; i++) {
            if (list[i].match.test(ch)) return list[i];
        }
        return null;
    }

    /** Xep atom vao cac dong theo thuat toan tham lam. */
    private static _layout(atoms: Atom[], maxWidth: number, measure: MeasureFn, out: string[]): void {
        const startCount = out.length;
        let line = '';
        let pendingSpace = '';

        for (let i = 0; i < atoms.length; i++) {
            const atom = atoms[i];

            if (atom.space) {
                // Khoang trang dau dong bi bo; o giua thi cho xem co atom ke tiep khong
                if (line) pendingSpace += atom.text;
                continue;
            }

            if (line) {
                const candidate = line + pendingSpace + atom.text;
                if (measure(candidate) <= maxWidth) {
                    line = candidate;
                    pendingSpace = '';
                    continue;
                }
                // Khong vua -> chot dong hien tai, khoang trang thua bi nuot
                out.push(line);
                line = '';
                pendingSpace = '';
            }

            // Atom mo dau dong moi
            if (measure(atom.text) <= maxWidth) {
                line = atom.text;
                continue;
            }

            // Mot atom don le con dai hon ca dong -> buoc phai cat cung theo cluster
            const pieces = TextWrap._hardSplit(atom.text, maxWidth, measure);
            for (let k = 0; k < pieces.length - 1; k++) out.push(pieces[k]);
            line = pieces[pieces.length - 1];
        }

        if (line || out.length === startCount) out.push(line);
    }

    /** Cat cuong buc theo cluster — van khong tach dau/dau chong khoi ky tu goc. */
    private static _hardSplit(text: string, maxWidth: number, measure: MeasureFn): string[] {
        const out: string[] = [];
        let cur = '';
        let i = 0;

        while (i < text.length) {
            const cluster = TextWrap._readCluster(text, i);
            i = cluster.next;

            const next = cur + cluster.text;
            if (cur && measure(next) > maxWidth) {
                out.push(cur);
                cur = cluster.text;
            } else {
                cur = next;
            }
        }

        out.push(cur);
        return out;
    }
}
