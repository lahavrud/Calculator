// ========================
// 1. STATE & ELEMENTS
// ========================

let currentExpression = '';
let lastInputType = '';

const displayInput = document.querySelector('.display-input');
const buttonsContainer = document.querySelector('.buttons-container');

buttonsContainer.addEventListener('click', handleButtonClick);

// ========================
// 2. EVENT HANDLING
// ========================

function handleButtonClick(e) {
    const button = e.target.closest('button');
    if (!button) return;

    if (lastInputType === "ERROR") resetExpression();

    if (button.dataset.number) handleNumber(button.dataset.number);
    else if (button.dataset.operator) handleOperator(button.dataset.operator);
    else if (button.dataset.action) handleAction(button.dataset.action);

    updateDisplay();
    updateLastInputType();
}

// ========================
// 3. INPUT HANDLERS
// ========================

function handleNumber(number) {
    if (lastInputType === "CLOSE_PAREN") return;
    currentExpression += number;
}

function handleOperator(operator) {
    if (lastInputType === "OPERATOR") {
        currentExpression = currentExpression.slice(0, -1) + operator;
    } else if (lastInputType === "OPEN_PAREN" || currentExpression === '') {
        if (["+", "-"].includes(operator)) currentExpression += operator;
    } else {
        currentExpression += operator;
    }
}

function handleAction(action) {
    switch (action) {
        case 'equals':
            evaluateExpression();
            break;
        case 'clear':
            resetExpression();
            break;
        case 'decimal':
            handleDecimal();
            break;
        case 'open-paren':
            if (lastInputType === 'NUMBER' || lastInputType === 'CLOSE_PAREN') return;
            currentExpression += '(';
            break;
        case 'close-paren':
            if (['OPERATOR', 'OPEN_PAREN'].includes(lastInputType) || currentExpression === '') return;
            currentExpression += ')';
            break;
        case 'delete':
            if (currentExpression.length > 0) currentExpression = currentExpression.slice(0, -1);
            break;
    }
}

function handleDecimal() {
    const lastOpIndex = findLastOperatorIndex();
    const lastNumber = currentExpression.substring(lastOpIndex + 1);
    if (!lastNumber.includes('.')) {
        if (lastNumber === '' || lastInputType === 'OPERATOR') currentExpression += '0.';
        else currentExpression += '.';
    }
}

function resetExpression() {
    currentExpression = '';
    lastInputType = '';
}

function updateLastInputType() {
    if (!currentExpression) {
        lastInputType = '';
        return;
    }
    const lastChar = currentExpression.slice(-1);
    if (/\d/.test(lastChar)) lastInputType = 'NUMBER';
    else if (lastChar === ')') lastInputType = 'CLOSE_PAREN';
    else if (lastChar === '(') lastInputType = 'OPEN_PAREN';
    else if ("+-*/".includes(lastChar)) lastInputType = 'OPERATOR';
    else lastInputType = '';
}

// ========================
// 4. DISPLAY LOGIC
// ========================

function updateDisplay() {
    displayInput.value = currentExpression.replace(/\*/g, '×').replace(/\//g, '÷');
}

// ========================
// 5. EXPRESSION LOGIC
// ========================

function evaluateExpression() {
    try {
        const tokens = tokenize(currentExpression);
        const rpn = shuntingYard(tokens);
        if (!rpn.length && currentExpression !== '') throw new Error("Syntax Error");
        const result = calculateRPN(rpn);
        currentExpression = String(result);
    } catch (error) {
        console.error("Calculation Error:", error.message);
        currentExpression = "Error";
        lastInputType = "ERROR";
    }
}

// Tokenize with handling for + / - at beginning or after '('
function tokenize(expr) {
    const tokens = [];
    let i = 0;
    const numbers = "0123456789.";

    while (i < expr.length) {
        let char = expr[i];

        if (char === ' ') { i++; continue; }

        if (numbers.includes(char) || 
           ((char === '-' || char === '+') && (i === 0 || expr[i - 1] === '(' || "+-*/".includes(expr[i - 1])))) {
            let numStr = char;
            i++;
            while (i < expr.length && numbers.includes(expr[i])) {
                numStr += expr[i++];
            }
            tokens.push(numStr);
            continue;
        }

        if ("+-*/()".includes(char)) {
            tokens.push(char);
            i++;
            continue;
        }

        i++;
    }

    return tokens;
}

// Shunting Yard Algorithm
function shuntingYard(tokens) {
    const output = [];
    const ops = [];

    for (const token of tokens) {
        if (!isNaN(token)) output.push(token);
        else if (token === '(') ops.push(token);
        else if (token === ')') {
            while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop());
            if (!ops.length) throw new Error("Mismatched parentheses");
            ops.pop();
        } else if ("+-*/".includes(token)) {
            while (ops.length && ops[ops.length - 1] !== '(' && isHigherPrecedence(token, ops[ops.length - 1])) {
                output.push(ops.pop());
            }
            ops.push(token);
        }
    }

    while (ops.length) {
        const op = ops.pop();
        if (op === '(' || op === ')') throw new Error("Mismatched parentheses");
        output.push(op);
    }

    return output;
}

function calculateRPN(rpn) {
    const stack = [];

    for (const token of rpn) {
        if (!isNaN(token)) stack.push(parseFloat(token));
        else {
            if (stack.length < 2) throw new Error("Invalid expression");
            const b = stack.pop();
            const a = stack.pop();
            stack.push(applyOperator(a, b, token));
        }
    }

    if (stack.length !== 1) throw new Error("Invalid expression");
    return stack[0];
}

function applyOperator(a, b, op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': 
            if (b === 0) throw new Error("Division by zero");
            return a / b;
        default: throw new Error("Invalid operator");
    }
}

function getPrecedence(op) {
    return "*/".includes(op) ? 2 : "+-".includes(op) ? 1 : 0;
}

function isHigherPrecedence(a, b) {
    return getPrecedence(b) >= getPrecedence(a);
}

function findLastOperatorIndex() {
    return Math.max(...['+', '-', '*', '/'].map(op => currentExpression.lastIndexOf(op)));
}
