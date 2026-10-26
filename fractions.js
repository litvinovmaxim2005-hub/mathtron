// Дроби и смешанные числа в духе учебника 5 класса

const RELATED_DENOMS = [
    [2, 4], [2, 6], [2, 8], [2, 10], [3, 6], [3, 9], [3, 12], [3, 15],
    [4, 8], [4, 12], [4, 16], [4, 24], [5, 10], [5, 15], [5, 20],
    [6, 12], [6, 18], [6, 24], [7, 14], [7, 21], [8, 16], [8, 24],
    [9, 18], [9, 36], [10, 20], [10, 30], [12, 24], [12, 36]
];

const SAME_DENOMS_EASY = [2, 3, 4, 5, 6, 8, 10, 12];
const SAME_DENOMS_HARD = [7, 9, 11, 14, 15, 16, 17, 18, 21, 24];

function randInt(min, max) {
    if (max < min) {
        [min, max] = [max, min];
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        const t = a % b;
        a = b;
        b = t;
    }
    return a || 1;
}

function frac(n, d) {
    if (d === 0 || !Number.isInteger(n) || !Number.isInteger(d)) {
        return null;
    }
    if (d < 0) {
        n = -n;
        d = -d;
    }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
}

function fAdd(a, b) {
    return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

function fSub(a, b) {
    return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

function fMul(a, b) {
    return frac(a.n * b.n, a.d * b.d);
}

function mixedToFrac(whole, n, d) {
    const sign = whole < 0 || n < 0 ? -1 : 1;
    return frac(sign * (Math.abs(whole) * d + Math.abs(n)), d);
}

function toMixed(f) {
    const sign = f.n < 0 ? -1 : 1;
    const n = Math.abs(f.n);
    return {
        sign,
        whole: Math.floor(n / f.d),
        n: n % f.d,
        d: f.d
    };
}

function formatMixed(f) {
    if (!f) {
        return '';
    }
    const m = toMixed(f);
    const sign = m.sign < 0 ? '−' : '';
    if (m.n === 0) {
        return sign + String(m.whole);
    }
    if (m.whole === 0) {
        return sign + `${m.n}/${m.d}`;
    }
    return sign + `${m.whole} ${m.n}/${m.d}`;
}

function formatRawMixed(whole, n, d) {
    if (!n) {
        return String(whole);
    }
    if (!whole) {
        return `${n}/${d}`;
    }
    return `${whole} ${n}/${d}`;
}

function formatRawFracHtml(whole, n, d) {
    if (!n) {
        return `<span class="int">${whole}</span>`;
    }
    const piece = `<span class="frac"><span class="n">${n}</span><span class="d">${d}</span></span>`;
    if (!whole) {
        return piece;
    }
    return `<span class="mixed"><span class="w">${whole}</span>${piece}</span>`;
}

function formatFracHtml(f) {
    const m = toMixed(f);
    const sign = m.sign < 0 ? '<span class="op-sign">−</span>' : '';
    const piece = `<span class="frac"><span class="n">${m.n}</span><span class="d">${m.d}</span></span>`;
    if (m.n === 0) {
        return `${sign}<span class="int">${m.whole}</span>`;
    }
    if (m.whole === 0) {
        return `${sign}${piece}`;
    }
    return `${sign}<span class="mixed"><span class="w">${m.whole}</span>${piece}</span>`;
}

function joinExprHtml(parts) {
    return `<span class="expr">${parts.join('')}</span>`;
}

function opHtml(symbol) {
    return `<span class="op-sign">${symbol}</span>`;
}

function parseFractionInput(raw) {
    if (raw == null) {
        return null;
    }
    const str = String(raw).trim().replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, ' ');
    if (!str) {
        return null;
    }

    const mixed = str.match(/^(-)?\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
        const whole = parseInt(mixed[2], 10);
        const n = parseInt(mixed[3], 10);
        const d = parseInt(mixed[4], 10);
        const f = mixedToFrac(whole, n, d);
        if (!f) {
            return null;
        }
        if (mixed[1]) {
            return frac(-f.n, f.d);
        }
        return f;
    }

    const proper = str.match(/^(-)?\s*(\d+)\s*\/\s*(\d+)$/);
    if (proper) {
        const f = frac(parseInt(proper[2], 10), parseInt(proper[3], 10));
        if (!f) {
            return null;
        }
        return proper[1] ? frac(-f.n, f.d) : f;
    }

    const integer = str.match(/^(-)?\s*(\d+)$/);
    if (integer) {
        const value = parseInt(integer[2], 10);
        return frac(integer[1] ? -value : value, 1);
    }

    return null;
}

function coerceFrac(value) {
    if (value == null || value === '') {
        return null;
    }
    if (typeof value === 'object' && Number.isInteger(value.n) && Number.isInteger(value.d)) {
        return frac(value.n, value.d);
    }
    if (typeof value === 'number' && Number.isInteger(value)) {
        return frac(value, 1);
    }
    if (typeof value === 'string') {
        return parseFractionInput(value);
    }
    return null;
}

function answersEqual(user, correct) {
    const a = coerceFrac(user);
    const b = coerceFrac(correct);
    return Boolean(a && b && a.n === b.n && a.d === b.d);
}

function isNiceFrac(f) {
    return Boolean(f && Number.isInteger(f.n) && Number.isInteger(f.d) && f.d > 0 && f.d <= 120 && Math.abs(f.n) <= 2000);
}

function pickRelatedDenoms() {
    return RELATED_DENOMS[Math.floor(Math.random() * RELATED_DENOMS.length)].slice();
}

function wholeRange(difficulty) {
    if (difficulty === 'easy') {
        return [1, 12];
    }
    if (difficulty === 'medium') {
        return [2, 28];
    }
    return [5, 48];
}

function pickProper(d) {
    return randInt(1, d - 1);
}

function hintForAnswer(answerFrac, kind, unknown) {
    const examples = [
        { mixed: '7 2/5', improper: '37/5', proper: '5/12', integer: '15' },
        { mixed: '3 1/4', improper: '13/4', proper: '2/9', integer: '8' },
        { mixed: '11 3/8', improper: '91/8', proper: '7/10', integer: '21' }
    ];
    const sample = examples.find((item) => {
        const values = [item.mixed, item.improper, item.proper, item.integer];
        return values.every((v) => !answersEqual(v, answerFrac));
    }) || examples[0];

    const mixed = toMixed(answerFrac);
    if (kind === 'equation') {
        return {
            placeholder: `найди ${unknown}`,
            hint: `Найди ${unknown}. Дробь: ${sample.proper}. Смешанное: целая, пробел, дробь (${sample.mixed}). Поля ниже: целая / числ. / знам.`
        };
    }
    if (kind === 'word') {
        return {
            placeholder: `например ${sample.proper}`,
            hint: `Ответ — дробь или смешанное число. Пример: ${sample.proper} или ${sample.mixed}.`
        };
    }
    if (mixed.n === 0) {
        return {
            placeholder: `например ${sample.integer}`,
            hint: `Введи целое число, например ${sample.integer}. Можно через поле «целая».`
        };
    }
    if (mixed.whole === 0) {
        return {
            placeholder: `например ${sample.proper}`,
            hint: `Обыкновенная дробь: числитель / знаменатель, например ${sample.proper}. Целую оставь пустой.`
        };
    }
    return {
        placeholder: `например ${sample.mixed}`,
        hint: `Смешанное число: целая, пробел, дробь. Пример: ${sample.mixed}. Можно неправильную дробь: ${sample.improper}.`
    };
}

function makeFracQuestion(spec) {
    const answer = spec.answer;
    if (!isNiceFrac(answer) || answer.n < 0) {
        return null;
    }
    const kind = spec.kind || 'fraction';
    const help = hintForAnswer(answer, kind, spec.unknown);
    return {
        text: spec.text,
        html: spec.html,
        prompt: spec.prompt || '',
        answer,
        answerText: formatMixed(answer),
        kind,
        unknown: spec.unknown || null,
        placeholder: help.placeholder,
        hint: help.hint,
        operation: spec.operation
    };
}

function genSameDenomAdd(difficulty) {
    const d = randFrom(difficulty === 'easy' ? SAME_DENOMS_EASY : SAME_DENOMS_EASY.concat(SAME_DENOMS_HARD));
    const a = pickProper(d);
    const b = pickProper(d);
    const fa = frac(a, d);
    const fb = frac(b, d);
    return makeFracQuestion({
        prompt: 'Найдите сумму:',
        text: `${a}/${d} + ${b}/${d}`,
        html: joinExprHtml([formatRawFracHtml(0, a, d), opHtml('+'), formatRawFracHtml(0, b, d)]),
        answer: fAdd(fa, fb),
        operation: 'add'
    });
}

function genMixedAdd(difficulty) {
    const related = difficulty === 'easy'
        ? (() => { const d = randFrom(SAME_DENOMS_EASY); return [d, d]; })()
        : pickRelatedDenoms();
    const [d1, d2] = related;
    const [wMin, wMax] = wholeRange(difficulty);
    const w1 = randInt(wMin, wMax);
    const w2 = randInt(1, Math.max(2, Math.floor(wMax / 2)));
    const n1 = pickProper(d1);
    const n2 = pickProper(d2);
    const fa = mixedToFrac(w1, n1, d1);
    const fb = mixedToFrac(w2, n2, d2);
    return makeFracQuestion({
        prompt: 'Найдите сумму:',
        text: `${formatRawMixed(w1, n1, d1)} + ${formatRawMixed(w2, n2, d2)}`,
        html: joinExprHtml([formatRawFracHtml(w1, n1, d1), opHtml('+'), formatRawFracHtml(w2, n2, d2)]),
        answer: fAdd(fa, fb),
        operation: 'add'
    });
}

function genMixedSub(difficulty) {
    const related = difficulty === 'easy'
        ? (() => { const d = randFrom(SAME_DENOMS_EASY); return [d, d]; })()
        : pickRelatedDenoms();
    const [d1, d2] = related;
    const [wMin, wMax] = wholeRange(difficulty);
    const w2 = randInt(1, Math.max(2, Math.floor(wMax / 2)));
    const n2 = pickProper(d2);
    const fb = mixedToFrac(w2, n2, d2);
    const w1 = randInt(Math.max(w2 + 1, wMin), wMax + 4);
    const n1 = pickProper(d1);
    const fa = mixedToFrac(w1, n1, d1);
    const answer = fSub(fa, fb);
    if (!answer || answer.n < 0) {
        return null;
    }
    return makeFracQuestion({
        prompt: 'Найдите разность:',
        text: `${formatRawMixed(w1, n1, d1)} − ${formatRawMixed(w2, n2, d2)}`,
        html: joinExprHtml([formatRawFracHtml(w1, n1, d1), opHtml('−'), formatRawFracHtml(w2, n2, d2)]),
        answer,
        operation: 'subtract'
    });
}

function genUnitMinusFrac(difficulty) {
    const d = randFrom(difficulty === 'easy' ? SAME_DENOMS_EASY : SAME_DENOMS_EASY.concat(SAME_DENOMS_HARD));
    const n = pickProper(d);
    const fb = frac(n, d);
    return makeFracQuestion({
        prompt: 'Найдите разность:',
        text: `1 − ${n}/${d}`,
        html: joinExprHtml(['<span class="int">1</span>', opHtml('−'), formatRawFracHtml(0, n, d)]),
        answer: fSub(frac(1, 1), fb),
        operation: 'subtract'
    });
}

function genEquationFindUnknown(difficulty) {
    const unknown = randFrom(['y', 'm', 'l']);
    const pattern = randFrom(['oneMinus', 'onePlus', 'leftPlus']);

    if (pattern === 'oneMinus') {
        const d = randFrom(SAME_DENOMS_EASY.concat([12, 15, 20, 24, 30]));
        const n = pickProper(d);
        const extraN = pickProper(d);
        const extra = frac(extraN, d);
        const right = fAdd(frac(n, d), extra);
        const y = fSub(frac(1, 1), right);
        if (!y || y.n <= 0) {
            return null;
        }
        const text = `1 − ${unknown} = ${n}/${d} + ${extraN}/${d}`;
        return makeFracQuestion({
            prompt: 'Решите уравнение:',
            text,
            html: joinExprHtml([
                '<span class="int">1</span>',
                opHtml('−'),
                `<span class="unknown">${unknown}</span>`,
                opHtml('='),
                formatRawFracHtml(0, n, d),
                opHtml('+'),
                formatRawFracHtml(0, extraN, d)
            ]),
            answer: y,
            kind: 'equation',
            unknown,
            operation: 'subtract'
        });
    }

    if (pattern === 'onePlus') {
        const [d1, d2] = pickRelatedDenoms();
        const a = frac(pickProper(d1), d1);
        const b = frac(pickProper(d2), d2);
        const sum = fAdd(a, b);
        const m = fSub(sum, frac(1, 1));
        if (!m || m.n <= 0) {
            const a2 = mixedToFrac(randInt(1, 3), pickProper(d1), d1);
            const b2 = mixedToFrac(randInt(1, 3), pickProper(d2), d2);
            const sum2 = fAdd(a2, b2);
            const m2 = fSub(sum2, frac(1, 1));
            if (!m2 || m2.n <= 0) {
                return null;
            }
            return makeFracQuestion({
                prompt: 'Решите уравнение:',
                text: `1 + ${unknown} = ${formatMixed(a2)} + ${formatMixed(b2)}`,
                html: joinExprHtml([
                    '<span class="int">1</span>',
                    opHtml('+'),
                    `<span class="unknown">${unknown}</span>`,
                    opHtml('='),
                    formatFracHtml(a2),
                    opHtml('+'),
                    formatFracHtml(b2)
                ]),
                answer: m2,
                kind: 'equation',
                unknown,
                operation: 'add'
            });
        }
        return makeFracQuestion({
            prompt: 'Решите уравнение:',
            text: `1 + ${unknown} = ${formatMixed(a)} + ${formatMixed(b)}`,
            html: joinExprHtml([
                '<span class="int">1</span>',
                opHtml('+'),
                `<span class="unknown">${unknown}</span>`,
                opHtml('='),
                formatFracHtml(a),
                opHtml('+'),
                formatFracHtml(b)
            ]),
            answer: m,
            kind: 'equation',
            unknown,
            operation: 'add'
        });
    }

    const [d1, d2] = pickRelatedDenoms();
    const [wMin, wMax] = wholeRange(difficulty);
    const known = mixedToFrac(randInt(1, 6), pickProper(d1), d1);
    const total = mixedToFrac(randInt(Math.max(wMin, 4), wMax), pickProper(d2), d2);
    const left = fSub(total, known);
    if (!left || left.n <= 0) {
        return null;
    }
    return makeFracQuestion({
        prompt: 'Решите уравнение:',
        text: `${unknown} + ${formatMixed(known)} = ${formatMixed(total)}`,
        html: joinExprHtml([
            `<span class="unknown">${unknown}</span>`,
            opHtml('+'),
            formatFracHtml(known),
            opHtml('='),
            formatFracHtml(total)
        ]),
        answer: left,
        kind: 'equation',
        unknown,
        operation: 'add'
    });
}

function genFracChain(difficulty) {
    const [d1, d2] = pickRelatedDenoms();
    const d3 = randFrom([d1, d2]);
    const [wMin, wMax] = wholeRange(difficulty);
    const wa = randInt(wMin, wMax);
    const na = pickProper(d1);
    const wb = randInt(1, 8);
    const nb = pickProper(d2);
    const wc = randInt(1, 8);
    const nc = pickProper(d3);
    const a = mixedToFrac(wa, na, d1);
    const b = mixedToFrac(wb, nb, d2);
    const c = mixedToFrac(wc, nc, d3);
    const sum = fAdd(a, b);
    const answer = fSub(sum, c);
    if (!answer || answer.n < 0) {
        return null;
    }
    return makeFracQuestion({
        prompt: 'Выполните действия:',
        text: `${formatRawMixed(wa, na, d1)} + ${formatRawMixed(wb, nb, d2)} − ${formatRawMixed(wc, nc, d3)}`,
        html: joinExprHtml([
            formatRawFracHtml(wa, na, d1),
            opHtml('+'),
            formatRawFracHtml(wb, nb, d2),
            opHtml('−'),
            formatRawFracHtml(wc, nc, d3)
        ]),
        answer,
        operation: 'mixed'
    });
}

function genFracMul(difficulty) {
    const d = randFrom(SAME_DENOMS_EASY);
    const n = pickProper(d);
    const k = difficulty === 'easy' ? randInt(2, 6) : randInt(2, 12);
    const fa = frac(n, d);
    return makeFracQuestion({
        prompt: 'Найдите произведение:',
        text: `${n}/${d} × ${k}`,
        html: joinExprHtml([formatRawFracHtml(0, n, d), opHtml('×'), `<span class="int">${k}</span>`]),
        answer: fMul(fa, frac(k, 1)),
        operation: 'multiply'
    });
}

function genFracDiv(difficulty) {
    const d = randFrom(SAME_DENOMS_EASY.concat([12, 15, 16]));
    const n = pickProper(d);
    const k = difficulty === 'easy' ? randInt(2, 5) : randInt(2, 9);
    const w = randInt(1, 8);
    const fa = mixedToFrac(w, n, d);
    const answer = fMul(fa, frac(1, k));
    return makeFracQuestion({
        prompt: 'Найдите частное:',
        text: `${formatRawMixed(w, n, d)} ÷ ${k}`,
        html: joinExprHtml([formatRawFracHtml(w, n, d), opHtml('÷'), `<span class="int">${k}</span>`]),
        answer,
        operation: 'divide'
    });
}

function genReservoir() {
    const pairs = [
        [7, 20, 17, 30],
        [3, 10, 1, 5],
        [5, 12, 1, 4],
        [2, 15, 4, 9],
        [5, 8, 1, 6],
        [3, 8, 5, 12],
        [7, 15, 1, 6],
        [4, 9, 1, 6]
    ];
    const [n1, d1, n2, d2] = randFrom(pairs);
    const a = frac(n1, d1);
    const b = frac(n2, d2);
    const answer = fAdd(a, b);
    if (!answer || answer.n <= 0 || answer.n >= answer.d) {
        return null;
    }
    return makeFracQuestion({
        prompt: 'Задача:',
        text: `Один насос заполнил ${n1}/${d1} бака, а другой — ${n2}/${d2}. Какая часть бака заполнена?`,
        html: `<span class="word-q">Один насос заполнил ${formatRawFracHtml(0, n1, d1)} бака, а другой — ${formatRawFracHtml(0, n2, d2)}. Какая часть бака заполнена?</span>`,
        answer,
        kind: 'word',
        operation: 'add'
    });
}

function fractionGenerators(operation, difficulty) {
    if (operation === 'add') {
        if (difficulty === 'easy') {
            return [genSameDenomAdd, genMixedAdd];
        }
        return [genMixedAdd, genSameDenomAdd];
    }
    if (operation === 'subtract') {
        if (difficulty === 'easy') {
            return [genMixedSub, genUnitMinusFrac];
        }
        return [genMixedSub, genUnitMinusFrac];
    }
    if (operation === 'multiply') {
        return [genFracMul];
    }
    if (operation === 'divide') {
        return [genFracDiv];
    }

    const mixed = [genMixedAdd, genMixedSub, genSameDenomAdd, genUnitMinusFrac];
    if (difficulty !== 'easy') {
        mixed.push(genEquationFindUnknown, genFracChain, genFracMul);
    }
    if (difficulty === 'hard' || difficulty === 'mega') {
        mixed.push(genReservoir, genFracDiv, genEquationFindUnknown);
    }
    if (difficulty === 'mega') {
        mixed.push(genFracChain, genReservoir);
    }
    return mixed;
}

function generateFractionQuestion(operation, difficulty) {
    const gens = fractionGenerators(operation, difficulty);
    for (let attempt = 0; attempt < 50; attempt++) {
        const question = randFrom(gens)(difficulty);
        if (question) {
            return question;
        }
    }
    return genSameDenomAdd('easy');
}

function generateFractionChoices(correct) {
    const choices = [];
    const seen = new Set([`${correct.n}/${correct.d}`]);

    function push(f) {
        if (!isNiceFrac(f) || f.n < 0) {
            return;
        }
        const key = `${f.n}/${f.d}`;
        if (seen.has(key) || choices.length >= 5) {
            return;
        }
        seen.add(key);
        choices.push({
            text: formatMixed(f),
            html: formatFracHtml(f),
            frac: f
        });
    }

    push(fAdd(correct, frac(1, correct.d)));
    push(fSub(correct, frac(1, correct.d)));
    push(fAdd(correct, frac(1, 1)));
    push(fSub(correct, frac(1, 1)));
    push(frac(correct.n + 1, correct.d));
    push(frac(Math.max(0, correct.n - 1), correct.d));
    push(frac(correct.d, Math.max(1, correct.n) || 1));
    const mixed = toMixed(correct);
    if (mixed.n) {
        push(frac(mixed.whole * mixed.d + mixed.n + mixed.d, mixed.d));
        push(frac(mixed.whole, 1));
        push(frac(mixed.n, mixed.d));
    }

    let safety = 0;
    while (choices.length < 5 && safety < 40) {
        safety += 1;
        push(frac(Math.abs(correct.n + randInt(-6, 6)), correct.d + randInt(0, 4) || 1));
    }

    const all = [{ text: formatMixed(correct), html: formatFracHtml(correct), frac: correct }, ...choices]
        .slice(0, 6);
    return all.sort(() => Math.random() - 0.5);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        gcd,
        frac,
        fAdd,
        fSub,
        mixedToFrac,
        formatMixed,
        formatFracHtml,
        parseFractionInput,
        coerceFrac,
        answersEqual,
        generateFractionQuestion,
        generateFractionChoices
    };
}
