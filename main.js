let currentExpression = '';
let lastInputType = '';
let isOn = false;
let isError = false;
let isBlinking = false;

const displayInput = document.querySelector('.display-input');
const buttonsContainer = document.querySelector('.buttons-container');
buttonsContainer.addEventListener('click', handleButtonClick);

function handleButtonClick(e) {
    const button = e.target.closest('button');
    if (!button) return;

    const isNumber = button.dataset.number;
    const isOperator = button.dataset.operator;
    const action = button.dataset.action;

    if (isBlinking) return;

    if (action === 'power') {
        togglePower();
        return;
    }

    if (!isOn) return;

    if (isError) {
        if (!(isNumber || action === 'open-paren' || isOperator === '+' || isOperator === '-')) return;
        resetExpression();
        isError = false;
    }

    if (lastInputType === "EQUALS") {
        if (isNumber || action === 'open-paren') resetExpression();
    }

    if (isNumber) handleNumber(isNumber);
    else if (isOperator) handleOperator(isOperator);
    else if (action) handleAction(action);

    updateDisplay();
}

function handleNumber(number) {
    if (currentExpression === '' && number === '00') return;
    currentExpression += number;
    lastInputType = "NUMBER";
}

function handleOperator(operator) {
    if (lastInputType === "OPERATOR") {
        currentExpression = currentExpression.slice(0, -1) + operator;
    } else if (lastInputType === "OPEN_PAREN" || currentExpression === '') {
        if (["+", "-"].includes(operator)) currentExpression += operator;
        else return;
    } else {
        currentExpression += operator;
    }
    lastInputType = "OPERATOR";
}

function handleAction(action) {
    switch(action) {
        case 'equals':
            if(currentExpression === '') return;
            evaluateExpression();
            lastInputType = "EQUALS";
            break;
        case 'clear':
            resetExpression();
            break;
        case 'decimal':
            handleDecimal();
            lastInputType = "NUMBER";
            break;
        case 'open-paren':
            if (lastInputType === 'NUMBER' || lastInputType === 'CLOSE_PAREN') return;
            currentExpression += '(';
            lastInputType = 'OPEN_PAREN';
            break;
        case 'close-paren':
            if (['OPERATOR', 'OPEN_PAREN', ''].includes(lastInputType)) return;
            currentExpression += ')';
            lastInputType = 'CLOSE_PAREN';
            break;
        case 'delete':
            if(currentExpression.length > 0) currentExpression = currentExpression.slice(0, -1);
            lastInputType = currentExpression ? getLastCharType() : '';
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

function updateDisplay() {
    displayInput.value = currentExpression.replace(/\*/g,'×').replace(/\//g,'÷');
}

function getLastCharType() {
    if (!currentExpression) return '';
    const lastChar = currentExpression.slice(-1);
    if (/\d/.test(lastChar)) return 'NUMBER';
    if (lastChar === ')') return 'CLOSE_PAREN';
    if (lastChar === '(') return 'OPEN_PAREN';
    if ("+-*/".includes(lastChar)) return 'OPERATOR';
    return '';
}

function togglePower() {
    isOn = !isOn;
    isError = false;
    isBlinking = true;
    const text = isOn ? 'ON' : 'OFF';
    let blinkCount = 0;
    const blinkLimit = 6;

    const interval = setInterval(() => {
        displayInput.value = (blinkCount % 2 === 0) ? text : '';
        blinkCount++;
        if (blinkCount > blinkLimit) {
            clearInterval(interval);
            isBlinking = false;
            resetExpression();
            updateDisplay();
        }
    }, 500);
}

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
        isError = true;
        lastInputType = "ERROR";
    }
}

function tokenize(expr) {
    const tokens = [];
    let i = 0;
    const numbers = "0123456789.";

    while(i<expr.length){
        let char=expr[i];
        if(char===' '){i++; continue;}
        if(numbers.includes(char) || ((char==='-'||char==='+') && (i===0||expr[i-1]==='('||"+-*/".includes(expr[i-1])))){
            let numStr=char;i++;
            while(i<expr.length && numbers.includes(expr[i])) numStr+=expr[i++];
            tokens.push(numStr); continue;
        }
        if("+-*/()".includes(char)){tokens.push(char); i++; continue;}
        i++;
    }
    return tokens;
}

function shuntingYard(tokens){
    const output=[], ops=[];
    for(const token of tokens){
        if(!isNaN(token)) output.push(token);
        else if(token==='(') ops.push(token);
        else if(token===')'){
            while(ops.length && ops[ops.length-1]!=='(') output.push(ops.pop());
            if(!ops.length) throw new Error("Mismatched parentheses");
            ops.pop();
        } else if("+-*/".includes(token)){
            while(ops.length && ops[ops.length-1]!=='(' && isHigherPrecedence(token, ops[ops.length-1])) output.push(ops.pop());
            ops.push(token);
        }
    }
    while(ops.length){
        const op=ops.pop();
        if(op==='('||op===')') throw new Error("Mismatched parentheses");
        output.push(op);
    }
    return output;
}

function calculateRPN(rpn){
    const stack=[];
    for(const token of rpn){
        if(!isNaN(token)) stack.push(parseFloat(token));
        else{
            if(stack.length<2) throw new Error("Invalid expression");
            const b=stack.pop(), a=stack.pop();
            stack.push(applyOperator(a,b,token));
        }
    }
    if(stack.length!==1) throw new Error("Invalid expression");
    return stack[0];
}

function applyOperator(a,b,op){
    switch(op){
        case '+': return a+b;
        case '-': return a-b;
        case '*': return a*b;
        case '/': if(b===0) throw new Error("Division by zero"); return a/b;
        default: throw new Error("Invalid operator");
    }
}

function getPrecedence(op){
    return "*/".includes(op)?2: "+-".includes(op)?1:0;
}

function isHigherPrecedence(a,b){
    return getPrecedence(b)>=getPrecedence(a);
}

function findLastOperatorIndex(){
    return Math.max(...['+','-','*','/'].map(op=>currentExpression.lastIndexOf(op)));
}
