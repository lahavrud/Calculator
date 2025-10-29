let currentExpression = '';
let lastInputType = '';

const displayInput = document.querySelector('.display-input')


const buttonsContainer = document.querySelector('.buttons-container')


function clickOnButton(e){

    const clickedElement = e.target;
    
    const button = clickedElement.closest('button');
    if (!button){
        return;
    }

    if (currentExpression.length == 16){
        console.log('Exceeded length of equation')
        return;
    }

    if (button.hasAttribute('data-number')) {
        if(lastInputType === "CLOSE_PAREN"){
            return;
        }
        lastInputType = "NUMBER";
        currentExpression += button.dataset.number
    } 
    else if (button.hasAttribute('data-operator')) {
        if (lastInputType === "OPERATOR"){
            currentExpression = currentExpression.slice(0,-1) + button.dataset.operator;
        }
        else {
            lastInputType = "OPERATOR";
            currentExpression += button.dataset.operator
        }

    }
    else if (button.hasAttribute('data-action')) {
        const actionType = button.dataset.action;
        if ( actionType === 'equals') {
            lastInputType = "EQUALS";
            tokenize(currentExpression);
        }
        else if(actionType === 'clear') {
            currentExpression = '';
        }
        else if(actionType === 'decimal'){
                handleDecimalPoint()
            }
        else if(actionType === 'open-paren'){ 
            if(lastInputType === 'NUMBER') {
                return;
            }
            currentExpression += '(';
            lastInputType = "OPEN_PAREN"; 
        }
        else if(actionType === 'close-paren'){
            //logic for adding to current-expretion
            currentExpression += ')';
            lastInputType = "CLOSE_PAREN"; 
        }
    }

    updateDisplay();
}

//helper functions

function updateDisplay(){
    let displayString = currentExpression;
    displayString = displayString.replace(/\*/g, 'x'); 
    displayString = displayString.replace(/\//g, '÷');
    displayInput.value = displayString;
}


function handleDecimalPoint(){
    if (lastInputType === 'OPERATOR' || currentExpression === ''){
                currentExpression += "0.";
                lastInputType = 'NUMBER';
    }
    else {
        const lastOpIndex = lastIndexOfOperator();
        const lastNum = currentExpression.substring(lastOpIndex+1);
        if (!lastNum.includes('.')){
            currentExpression += '.';
        }    
    } 
}

function lastIndexOfOperator(){
    const operators = ['+', '-', '*', '/'];
    let lastOperatorIndex = -1;
    for (const op of operators){
        const index = currentExpression.lastIndexOf(op);
        if (index > lastOperatorIndex){
            lastOperatorIndex = index;
        }
    }
    return lastOperatorIndex;
}

buttonsContainer.addEventListener('click', (e) => clickOnButton(e))

function tokenize(expr){
    const tokens = [];
    let i=0;
    const numbersAndDot = "0123456789.";
    const operators = "+-*/";
    while (i < expr.length){
        const char = expr[i];

        if(char === ' '){
            i++;
            continue;
        }
        if(numbersAndDot.includes(char)) {
            let curNum = '';
            while (i < expr.length && numbersAndDot.includes(expr[i])) {
                curNum += expr[i];
                i++;
            }
            tokens.push(curNum);
        }
        else if(operators.includes(char)){
            tokens.push(char);
            i++;
        }
        else {
            i++;
        }
    }
    return tokens;
}
