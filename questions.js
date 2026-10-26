// Генерация примеров MathTron: 100 задач и сложность по уровню

const QUESTIONS_PER_GAME = 100;

const DIFFICULTY = {
    easy: { max: 50, minTerms: 2, maxTerms: 2, parens: false },
    medium: { max: 100, minTerms: 2, maxTerms: 3, parens: false },
    hard: { max: 500, minTerms: 3, maxTerms: 3, parens: true },
    mega: { max: 999, minTerms: 3, maxTerms: 4, parens: true }
};

const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };
const MAX_ANSWER = 99999;

function randInt(min, max) {
    if (max < min) {
        [min, max] = [max, min];
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function num(value) {
    return { t: 'n', v: value };
}

function bin(op, left, right) {
    return { t: 'op', o: op, l: left, r: right };
}

function evalNode(node) {
    if (node.t === 'n') {
        return node.v;
    }
    const left = evalNode(node.l);
    const right = evalNode(node.r);
    switch (node.o) {
        case '+':
            return left + right;
        case '-':
            return left - right;
        case '*':
            return left * right;
        case '/':
            return left / right;
        default:
            return NaN;
    }
}

function formatNode(node, parentPrec, isRight, parentOp) {
    if (parentPrec === undefined) {
        parentPrec = 0;
    }
    if (node.t === 'n') {
        return String(node.v);
    }
    const prec = PREC[node.o];
    const inner = `${formatNode(node.l, prec, false, node.o)} ${SYM[node.o]} ${formatNode(node.r, prec, true, node.o)}`;
    const wrap = prec < parentPrec || (isRight && prec <= parentPrec && (parentOp === '-' || parentOp === '/'));
    return wrap ? `(${inner})` : inner;
}

function baseRange(numberType, max) {
    switch (numberType) {
        case 'single':
            return [1, 9];
        case 'double':
            return [10, 99];
        case 'triple':
            return [100, 999];
        case 'mixed':
        default:
            return [1, Math.max(9, max)];
    }
}

function pickNum(ctx, kind) {
    let min = ctx.range[0];
    let max = ctx.range[1];

    if (kind === 'tiny') {
        return randInt(2, 9);
    }
    if (kind === 'factor') {
        if (ctx.terms >= 4) {
            return randInt(2, 9);
        }
        if (ctx.terms === 3) {
            return randInt(2, ctx.numberType === 'triple' ? 12 : 15);
        }
        if (ctx.numberType === 'triple') {
            return randInt(2, 12);
        }
        return randInt(2, Math.min(20, max));
    }
    if (kind === 'divisor') {
        return randInt(2, ctx.difficulty === 'easy' ? 9 : 12);
    }

    if (ctx.numberType === 'mixed') {
        const roll = Math.random();
        if (ctx.difficulty === 'mega' && roll > 0.65) {
            min = 100;
            max = 999;
        } else if (roll > 0.4) {
            min = 10;
            max = Math.min(99, Math.max(10, ctx.max));
        } else {
            min = 2;
            max = 9;
        }
    }

    if (min > max) {
        min = max;
    }
    return randInt(min, max);
}

function makeQuestion(tree, operation) {
    const answer = evalNode(tree);
    if (!Number.isInteger(answer) || answer < 0 || answer > MAX_ANSWER) {
        return null;
    }
    return {
        text: formatNode(tree),
        answer,
        operation
    };
}

function genAdd2(ctx) {
    return makeQuestion(bin('+', num(pickNum(ctx)), num(pickNum(ctx))), 'add');
}

function genAdd3(ctx) {
    return makeQuestion(
        bin('+', bin('+', num(pickNum(ctx)), num(pickNum(ctx))), num(pickNum(ctx))),
        'add'
    );
}

function genAdd4(ctx) {
    return makeQuestion(
        bin('+', bin('+', num(pickNum(ctx)), num(pickNum(ctx))), bin('+', num(pickNum(ctx)), num(pickNum(ctx)))),
        'add'
    );
}

function genSub2(ctx) {
    let a = pickNum(ctx);
    let b = pickNum(ctx);
    if (a < b) {
        [a, b] = [b, a];
    }
    return makeQuestion(bin('-', num(a), num(b)), 'subtract');
}

function genSub3(ctx) {
    const b = pickNum(ctx);
    const c = pickNum(ctx);
    const a = b + c + pickNum(ctx, 'tiny');
    return makeQuestion(bin('-', bin('-', num(a), num(b)), num(c)), 'subtract');
}

function genSubParen(ctx) {
    const b = pickNum(ctx);
    const c = pickNum(ctx);
    const a = b + c + pickNum(ctx, 'tiny');
    return makeQuestion(bin('-', num(a), bin('+', num(b), num(c))), 'subtract');
}

function genMul2(ctx) {
    const a = pickNum(ctx);
    const b = pickNum(ctx, 'factor');
    return makeQuestion(bin('*', num(a), num(b)), 'multiply');
}

function genMul3(ctx) {
    return makeQuestion(
        bin('*', bin('*', num(pickNum(ctx, 'factor')), num(pickNum(ctx, 'tiny'))), num(pickNum(ctx, 'tiny'))),
        'multiply'
    );
}

function genMulDistributive(ctx) {
    const a = pickNum(ctx, 'tiny');
    const b = pickNum(ctx);
    const c = pickNum(ctx, 'tiny');
    return makeQuestion(bin('*', bin('+', num(a), num(b)), num(c)), 'multiply');
}

function genDiv2(ctx) {
    const divisor = pickNum(ctx, 'divisor');
    let quotient;
    if (ctx.numberType === 'triple') {
        quotient = randInt(10, 80);
    } else if (ctx.numberType === 'double') {
        quotient = randInt(10, 99);
    } else if (ctx.numberType === 'mixed') {
        quotient = randInt(2, Math.max(9, Math.min(40, ctx.max)));
    } else {
        quotient = randInt(2, 9);
    }
    return makeQuestion(bin('/', num(divisor * quotient), num(divisor)), 'divide');
}

function genDiv3(ctx) {
    const c = pickNum(ctx, 'divisor');
    const b = pickNum(ctx, 'tiny');
    const a = pickNum(ctx, 'tiny');
    return makeQuestion(bin('/', bin('*', num(a), num(b * c)), num(c)), 'divide');
}

function genMixedAddMul(ctx) {
    const b = pickNum(ctx, 'factor');
    const c = pickNum(ctx, 'tiny');
    const a = pickNum(ctx);
    return makeQuestion(bin('+', num(a), bin('*', num(b), num(c))), 'mixed');
}

function genMixedMulAdd(ctx) {
    const a = pickNum(ctx, 'factor');
    const b = pickNum(ctx, 'tiny');
    const c = pickNum(ctx);
    return makeQuestion(bin('+', bin('*', num(a), num(b)), num(c)), 'mixed');
}

function genMixedMulSub(ctx) {
    const a = pickNum(ctx, 'factor');
    const b = pickNum(ctx, 'tiny');
    const product = a * b;
    const c = randInt(1, Math.max(1, product - 1));
    return makeQuestion(bin('-', bin('*', num(a), num(b)), num(c)), 'mixed');
}

function genMixedAddSub(ctx) {
    const a = pickNum(ctx);
    const b = pickNum(ctx);
    const c = pickNum(ctx);
    const tree = Math.random() > 0.5
        ? bin('-', bin('+', num(a), num(b)), num(Math.min(c, a + b)))
        : bin('+', num(Math.max(a, b + c)), bin('-', num(Math.max(b, c)), num(Math.min(b, c))));
    return makeQuestion(tree, 'mixed');
}

function genParenAddMul(ctx) {
    const a = pickNum(ctx);
    const b = pickNum(ctx, 'tiny');
    const c = pickNum(ctx, 'tiny');
    return makeQuestion(bin('*', bin('+', num(a), num(b)), num(c)), 'mixed');
}

function genMulParenAdd(ctx) {
    const a = pickNum(ctx, 'tiny');
    const b = pickNum(ctx);
    const c = pickNum(ctx, 'tiny');
    return makeQuestion(bin('*', num(a), bin('+', num(b), num(c))), 'mixed');
}

function genParenAddDiv(ctx) {
    const c = pickNum(ctx, 'divisor');
    const k = pickNum(ctx, 'tiny');
    const a = pickNum(ctx, 'tiny');
    const b = k * c - a;
    if (b <= 0) {
        return null;
    }
    return makeQuestion(bin('/', bin('+', num(a), num(b)), num(c)), 'mixed');
}

function genMulDiv(ctx) {
    const c = pickNum(ctx, 'divisor');
    const a = pickNum(ctx, 'factor');
    const b = pickNum(ctx, 'tiny') * c;
    return makeQuestion(bin('/', bin('*', num(a), num(b)), num(c)), 'mixed');
}

function genFourAddMulSub(ctx) {
    const b = pickNum(ctx, 'tiny');
    const c = pickNum(ctx, 'tiny');
    const a = pickNum(ctx);
    const product = b * c;
    const d = randInt(0, product + a);
    return makeQuestion(bin('-', bin('+', num(a), bin('*', num(b), num(c))), num(d)), 'mixed');
}

function genFourParenMulSub(ctx) {
    const a = pickNum(ctx, 'tiny');
    const b = pickNum(ctx, 'tiny');
    const c = pickNum(ctx, 'tiny');
    const inner = (a + b) * c;
    const d = randInt(0, inner);
    return makeQuestion(bin('-', bin('*', bin('+', num(a), num(b)), num(c)), num(d)), 'mixed');
}

function genFourMulAddMul(ctx) {
    const a = pickNum(ctx, 'tiny');
    const b = pickNum(ctx, 'tiny');
    const c = pickNum(ctx, 'tiny');
    const d = pickNum(ctx, 'tiny');
    return makeQuestion(bin('+', bin('*', num(a), num(b)), bin('*', num(c), num(d))), 'mixed');
}

function genFourParenBoth(ctx) {
    const a = pickNum(ctx, 'tiny');
    const b = pickNum(ctx, 'tiny');
    const c = pickNum(ctx, 'tiny');
    const d = pickNum(ctx, 'tiny');
    return makeQuestion(bin('*', bin('+', num(a), num(b)), bin('+', num(c), num(d))), 'mixed');
}

function genFourMulParenSub(ctx) {
    const a = pickNum(ctx, 'tiny');
    const b = pickNum(ctx);
    const c = pickNum(ctx, 'tiny');
    const inner = a * (b + c);
    const d = randInt(0, inner);
    return makeQuestion(bin('-', bin('*', num(a), bin('+', num(b), num(c))), num(d)), 'mixed');
}

function patternsFor(operation, difficulty, terms, parens) {
    if (operation === 'add') {
        if (terms >= 4) {
            return [genAdd4, genAdd3];
        }
        if (terms === 3) {
            return [genAdd3];
        }
        return [genAdd2];
    }
    if (operation === 'subtract') {
        if (terms >= 3 && parens) {
            return [genSub3, genSubParen];
        }
        if (terms >= 3) {
            return [genSub3];
        }
        return [genSub2];
    }
    if (operation === 'multiply') {
        if (terms >= 3 && parens) {
            return [genMul3, genMulDistributive];
        }
        if (terms >= 3) {
            return [genMul3];
        }
        return [genMul2];
    }
    if (operation === 'divide') {
        if (terms >= 3) {
            return [genDiv3, genDiv2];
        }
        return [genDiv2];
    }

    if (terms <= 2) {
        return [genAdd2, genSub2, genMul2, genDiv2];
    }

    const mixed = [genMixedAddMul, genMixedMulAdd, genMixedMulSub, genMixedAddSub, genMulDiv];
    if (parens) {
        mixed.push(genParenAddMul, genMulParenAdd, genParenAddDiv);
    }
    if (terms >= 4) {
        mixed.push(genFourAddMulSub, genFourParenMulSub, genFourMulAddMul, genFourParenBoth, genFourMulParenSub);
    }
    return mixed;
}

function buildContext(operation, difficulty, numberType) {
    const config = DIFFICULTY[difficulty] || DIFFICULTY.easy;
    const terms = randInt(config.minTerms, config.maxTerms);
    return {
        operation,
        difficulty,
        numberType,
        max: config.max,
        terms,
        parens: config.parens,
        range: baseRange(numberType, config.max)
    };
}

function generateQuestion(operation, difficulty, numberType) {
    const op = operation === 'mixed' ? 'mixed' : operation;
    for (let attempt = 0; attempt < 40; attempt++) {
        const ctx = buildContext(op, difficulty, numberType);
        const question = randFrom(patternsFor(op, difficulty, ctx.terms, ctx.parens))(ctx);
        if (question) {
            return question;
        }
    }
    return genAdd2(buildContext('add', 'easy', 'single'));
}

function generateQuestionSet(count, operation, difficulty, numberType) {
    const items = [];
    const seen = new Set();
    let guard = 0;
    while (items.length < count && guard < count * 25) {
        guard += 1;
        const question = generateQuestion(operation, difficulty, numberType);
        if (!question || seen.has(question.text)) {
            continue;
        }
        seen.add(question.text);
        items.push(question);
    }
    while (items.length < count) {
        items.push(generateQuestion(operation, difficulty, numberType));
    }
    return items;
}

function generateAnswers(correct, difficulty) {
    const answers = [correct];
    const max = (DIFFICULTY[difficulty] || DIFFICULTY.easy).max;
    const offsets = [1, -1, 2, -2, 5, -5, 10, -10, 20, -20, 100, -100];
    const distractors = offsets
        .map((offset) => correct + offset)
        .concat([
            Math.abs(correct * 2),
            Math.abs(Math.floor(correct / 2)),
            Math.abs(correct + randInt(1, 9)),
            Math.abs(correct - randInt(1, 9)),
            Math.abs(correct + max),
            Math.max(0, correct - max)
        ]);

    for (const value of distractors) {
        if (answers.length >= 6) {
            break;
        }
        if (Number.isInteger(value) && value >= 0 && value !== correct && !answers.includes(value)) {
            answers.push(value);
        }
    }

    let safety = 0;
    while (answers.length < 6 && safety < 80) {
        safety += 1;
        const wrong = Math.max(0, correct + randInt(-Math.max(12, max), Math.max(12, max)));
        if (Number.isInteger(wrong) && wrong !== correct && !answers.includes(wrong)) {
            answers.push(wrong);
        }
    }

    return answers.sort(() => Math.random() - 0.5);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QUESTIONS_PER_GAME,
        DIFFICULTY,
        generateQuestion,
        generateQuestionSet,
        generateAnswers,
        evalNode,
        formatNode
    };
}
