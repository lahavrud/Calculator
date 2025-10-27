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

    if (button.hasAttribute('data-number')) {
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
        }
        else if(actionType === 'clear') {
            currentExpression = '';
        }
        else if(actionType === 'decimal'){
                handleDecimalPoint()
            }

        }
        else {
            console.log("action");
        }
    updateDisplay();
}

//helper functions

function updateDisplay(){
    displayInput.value = currentExpression;
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