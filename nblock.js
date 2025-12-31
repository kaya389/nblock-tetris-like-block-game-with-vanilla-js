/*game area*/
let highestScore = Number(localStorage.getItem('highestScore')) || 0;
let isDragging = false;
let isMovedToGameArea = false;
const gameArea = document.querySelector('.game-area');
const smallBlock = [];
let gameAreaRect;
let gridRect;
let score = document.querySelector('.score');
let s = 0;
score.innerHTML = `score: ${s},-------\nhighest score: ${highestScore}`;

for (i = 0; i < 400; i++) {
    const newBlock = document.createElement('div');
    newBlock.className = `small-block-${i} small-block`;
    const R = Math.floor(i/20);
    const C = i%20;
    newBlock.id = `cell-${R}-${C}`;
    smallBlock.push(newBlock);
    gameArea.appendChild(newBlock);
}
for(let i = 5; i<15; i++){
    document.getElementById(`cell-${5}-${i}`).classList.add('border-top');
    document.getElementById(`cell-${14}-${i}`).classList.add('border-bottom');
    document.getElementById(`cell-${i}-${5}`).classList.add('border-left');
    document.getElementById(`cell-${i}-${14}`).classList.add('border-right');
}
for(let i = 0; i<20; i++){
    document.getElementById(`cell-${0}-${i}`).classList.add('border-top');
    document.getElementById(`cell-${19}-${i}`).classList.add('border-bottom');
    document.getElementById(`cell-${i}-${0}`).classList.add('border-left');
    document.getElementById(`cell-${i}-${19}`).classList.add('border-right');
}

function getGridBoundary() {
    const firstBlock = document.querySelector('.small-block-0');
    const lastBlock = document.querySelector('.small-block-399');
    if (!firstBlock || !lastBlock) return null;
    const firstRect = firstBlock.getBoundingClientRect();
    const lastRect = lastBlock.getBoundingClientRect();
    return {
        left: firstRect.left,
        top: firstRect.top,
        right: lastRect.right,
        bottom: lastRect.bottom,
    };
}
/*suggestion area*/
const suggestionAreas = [
    document.querySelector('.suggestion-1'),
    document.querySelector('.suggestion-2'),
    document.querySelector('.suggestion-3')
];
let isArea1Filled, isArea2Filled, isArea3Filled;

function addDrag(element) {
    const suggestionBlockSize = '15px';
    let offsetX, offsetY;
    let initialLeft, initialTop;
    let originAreaID = element.getAttribute('data-origin');
    element.addEventListener('mousedown', (e) => {
        if (element.getAttribute('data-moved-to-game') === 'true') return; //element hareket ettirildi mi?
        if (e.button !== 0) return;
        e.preventDefault();
        initialLeft = element.style.left;
        initialTop = element.style.top;
        const gameBlockSize = element.getAttribute('data-block-size');
        if(gameBlockSize){
            const smallBlocks = element.querySelectorAll('.shape-block');
            smallBlocks.forEach(block=>{
                block.style.width = gameBlockSize;
                block.style.height = gameBlockSize;
            });
        }
        
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        const gridRect = getGridBoundary();
        if (!gridRect) return;
        
        const onMouseMove = (e) => {
            element.style.left = e.pageX - offsetX + 'px';
            element.style.top = e.pageY - offsetY + 'px';
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            const newRect = element.getBoundingClientRect();
            const gridRect = getGridBoundary();
            if (isInsideGameArea(newRect, gridRect)) {
                element.style.display = 'none';

                const anchorElement = document.elementFromPoint(newRect.left, newRect.top);

                element.style.display = '';

                if(anchorElement && anchorElement.id.startsWith('cell-')){
                    const coordsJSON = element.getAttribute('data-coords');
                    const color = element.getAttribute('data-color');
                    if(coordsJSON){
                        const coords = JSON.parse(coordsJSON);
                        const [_, R, C] = anchorElement.id.split('-');
                        const anchorR = parseInt(R);
                        const anchorC = parseInt(C);

                        const placed = applyShapeToGrid(anchorR, anchorC, coords, color);
                        if(!placed){
                            element.style.left = initialLeft;
                            element.style.top = initialTop;
                            const smallBlocks = element.querySelectorAll('div');
                            smallBlocks.forEach(block=>{
                                block.style.width = suggestionBlockSize;
                                block.style.height = suggestionBlockSize;
                            })
                        }
                        if(placed){
                            s = s+10;
                            score.innerHTML = `score: ${s},-------\nhighest score: ${highestScore}`;
                            element.style.display = 'none';
                            element.setAttribute('data-moved-to-game', 'true');
                            element.style.cursor = 'default';
                            if(originAreaID){
                                resetSuggestionArea(parseInt(originAreaID));
                            }
                        }else{
                            element.style.left = initialLeft;
                            element.style.top = initialTop;
                        }
                    }else{
                        element.style.left = initialLeft;
                        element.style.top = initialTop;
                    }
                }else{
                    element.style.left = initialLeft;
                    element.style.top = initialTop;
                }
            } else {
                element.style.left = initialLeft;
                element.style.top = initialTop;
            }
            explodeBlocks();
            explodeMiniZoneBlocks();
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function applyShapeToGrid(R, C, coords, color){
    const gridSize = 20;
    const cellsToColor = [];

    for(const {dr, dc} of coords){
        const finalR = R + dr;
        const finalC = C + dc;

        if(finalR<0 || finalR >= gridSize || finalC < 0 || finalC >= gridSize){
            return false;
        }

        const cell = document.getElementById(`cell-${finalR}-${finalC}`);

        if(!cell || cell.classList.contains('filled')){
            return false;
        }
        cellsToColor.push(cell);
    }

    for(const cell of cellsToColor){
        cell.style.backgroundColor = color;
        cell.classList.add('filled');
    }
    return true;
}

function isInsideGameArea(elementRect, areaRect) {
    const elementCenterY = elementRect.top + elementRect.height / 2;
    const elementCenterX = elementRect.left + elementRect.width / 2;
    return elementCenterX >= areaRect.left && elementCenterX <= areaRect.right && elementCenterY >= areaRect.top && elementCenterY <= areaRect.bottom;
}

function resetSuggestionArea(areaId) {
    if (areaId === 1) isArea1Filled = false;
    if (areaId === 2) isArea2Filled = false;
    if (areaId === 3) isArea3Filled = false;
    if (!isArea1Filled && !isArea2Filled && !isArea3Filled) {
        fillSuggestArea();
    }
}

function stick(number1, number2, length) {
    /*number1=1: vertical, number2=which suggestion area*/
    const sCoords = generateStickCoords(number1, length);
    const coordsJSON = JSON.stringify(sCoords);
    switch (`${number1}-${number2}`) {
        case '1-1':
            const a = document.createElement('div');
            a.classList.add('stick5');
            a.style.display = 'flex';
            a.style.flexDirection = 'column';
            a.style.left = '135px';
            a.style.gap = '1px';
            a.style.position = 'absolute';
            a.style.top = '610px';
            a.style.cursor = 'grab';
            for (let i = 0; i < length; i++) {
                const block = document.createElement('div');
                block.style.width = '15px';
                block.style.height = '15px';
                block.style.background = 'brown';
                block.style.margin = '0';
                block.classList.add('shape-block');
                a.appendChild(block);
            }
            document.body.appendChild(a);
            a.setAttribute('data-origin', 2);
            a.setAttribute('data-filled-area', 2);
            a.setAttribute('data-coords', coordsJSON);
            a.setAttribute('data-color', 'brown');
            a.setAttribute('data-block-size', '24px');
            addDrag(a);
            isArea2Filled = true;
            break;
        case '1-2':
            const b = document.createElement('div');
            b.classList.add('stick5');
            b.style.display = 'flex';
            b.style.flexDirection = 'column';
            b.style.gap = '1px';
            b.style.position = 'absolute';
            b.style.left = '270px'
            b.style.top = '610px';
            b.style.cursor = 'grab';
            for (let i = 0; i < length; i++) {
                const block = document.createElement('div');
                block.style.width = '15px';
                block.style.height = '15px';
                block.style.background = 'brown';
                block.style.margin = '0';
                block.classList.add('shape-block');
                b.appendChild(block);
            }
            document.body.appendChild(b);
            b.setAttribute('data-origin', 1);
            b.setAttribute('data-filled-area', 1);
            b.setAttribute('data-coords', coordsJSON);
            b.setAttribute('data-color', 'brown');
            b.setAttribute('data-block-size', '24px');
            addDrag(b);
            isArea1Filled = true;
            break;
        case '1-3':
            const c = document.createElement('div');
            c.classList.add('stick5');
            c.style.display = 'flex';
            c.style.flexDirection = 'column';
            c.style.gap = '1px';
            c.style.position = 'absolute';
            c.style.left = '404px'
            c.style.top = '610px';
            c.style.cursor = 'grab';
            for (let i = 0; i < length; i++) {
                const block = document.createElement('div');
                block.style.width = '15px';
                block.style.height = '15px';
                block.style.background = 'brown';
                block.style.margin = '0';
                block.classList.add('shape-block');
                c.appendChild(block);
            }
            document.body.appendChild(c);
            c.setAttribute('data-origin', 3);
            c.setAttribute('data-filled-area', 3);
            c.setAttribute('data-coords', coordsJSON);
            c.setAttribute('data-color', 'brown');
            c.setAttribute('data-block-size', '24px');
            addDrag(c);
            isArea3Filled = true;
            break;
        case '2-1':
            const stick5 = document.createElement('div');
            stick5.classList.add('stick5');
            stick5.style.display = 'flex';
            stick5.style.flexDirection = 'row';
            stick5.style.gap = '1px';
            stick5.style.position = 'absolute';
            stick5.style.left = '135px'
            stick5.style.top = '610px';
            stick5.style.cursor = 'grab';
            for (let i = 0; i < length; i++) {
                const block = document.createElement('div');
                block.style.width = '15px';
                block.style.height = '15px';
                block.style.background = 'brown';
                block.classList.add('shape-block');
                block.style.margin = '0';
                stick5.appendChild(block);
            }
            document.body.appendChild(stick5);
            stick5.setAttribute('data-origin', 1);
            stick5.setAttribute('data-filled-area', 1);
            stick5.setAttribute('data-coords', coordsJSON);
            stick5.setAttribute('data-color', 'brown');
            stick5.setAttribute('data-block-size', '24px');
            addDrag(stick5);
            isArea1Filled = true;
            break;
        case '2-2':
            const stick55 = document.createElement('div');
            stick55.classList.add('stick5');
            stick55.style.display = 'flex';
            stick55.style.flexDirection = 'row';
            stick55.style.gap = '1px';
            stick55.style.position = 'absolute';
            stick55.style.left = '270px';
            stick55.style.top = '610px';
            stick55.style.cursor = 'grab';
            for (let i = 0; i < length; i++) {
                const block = document.createElement('div');
                block.style.width = '15px';
                block.style.height = '15px';
                block.style.background = 'brown';
                block.classList.add('shape-block');
                block.style.margin = '0';
                stick55.appendChild(block);
            }
            document.body.appendChild(stick55);
            stick55.setAttribute('data-origin', 2);
            stick55.setAttribute('data-filled-area', 2);
            stick55.setAttribute('data-coords', coordsJSON);
            stick55.setAttribute('data-color', 'brown');
            stick55.setAttribute('data-block-size', '24px');
            addDrag(stick55);
            isArea2Filled = true;
            break;
        case '2-3':
            const stick555 = document.createElement('div');
            stick555.classList.add('stick5');
            stick555.style.display = 'flex';
            stick555.style.flexDirection = 'row';
            stick555.style.gap = '1px';
            stick555.style.position = 'absolute';
            stick555.style.left = '404px';
            stick555.style.top = '610px';
            stick555.style.cursor = 'grab';
            for (let i = 0; i < length; i++) {
                const block = document.createElement('div');
                block.style.width = '15px';
                block.style.height = '15px';
                block.style.background = 'brown';
                block.classList.add('shape-block');
                block.style.margin = '0';
                stick555.appendChild(block);
            }
            document.body.appendChild(stick555);
            stick555.setAttribute('data-origin', 3);
            stick555.setAttribute('data-filled-area', 3);
            stick555.setAttribute('data-coords', coordsJSON);
            stick555.setAttribute('data-color', 'brown');
            stick555.setAttribute('data-block-size', '24px');
            addDrag(stick555);
            isArea3Filled = true;
            break;
    }
}
function generateStickCoords(number1, length){
    const sCoords = [];
    if(number1 === 1){
        for(let i = 0; i<length; i++){
            sCoords.push({dr: i, dc:0});
        }
    }
    if(number1 === 2){
        for(let i = 0; i<length; i++){
            sCoords.push({dr: 0, dc:i});
        }
    }
    return sCoords;
}

function LShape(area, column, length, reverse, orientation) {
    let a = document.createElement('div');
    const LCoords = generateLShapeCoords(column, length, reverse, orientation);
    const coordsJSON = JSON.stringify(LCoords);
    a.classList.add('stickL');
    a.style.display = 'flex';
    if(reverse === 1){
        a.style.alignItems = 'flex-start';
    }
    if (reverse === 2) {
        a.style.alignItems = 'flex-end';
    }
    a.style.flexDirection = 'column';
    a.style.gap = '1px';
    a.style.position = 'absolute';
    a.style.top = '610px';
    a.style.cursor = 'grab';
    let vertical = document.createElement('div');
    vertical.style.display = 'flex';
    vertical.style.gap = '1px';
    vertical.style.flexDirection = 'column';
    for (let i = 0; i < column; i++) {
        let block = document.createElement('div');
        block.style.width = '15px';
        block.style.height = '15px';
        block.style.background = 'brown';
        block.classList.add('shape-block');
        block.style.margin = '0';
        vertical.appendChild(block);
    }
    let horizontal = document.createElement('div');
    horizontal.style.display = 'flex';
    horizontal.style.gap = '1px';
    for (let i = 0; i < length; i++) {
        let block = document.createElement('div');
        block.style.width = '15px';
        block.style.height = '15px';
        block.style.background = 'brown';
        block.classList.add('shape-block');
        block.style.margin = '0';
        horizontal.appendChild(block);
    }
    if (orientation === 1) {
        a.appendChild(vertical);
        a.appendChild(horizontal);
    }
    if (orientation === 2) {
        a.appendChild(horizontal);
        a.appendChild(vertical);
    }
    document.body.appendChild(a);
    if (area === 1) {
        a.style.left = '135px';
        isArea1Filled = true;
        a.setAttribute('data-origin', 1);
        a.setAttribute('data-filled-area', 1);
    }
    if (area === 2) {
        a.style.left = '270px';
        isArea2Filled = true;
        a.setAttribute('data-origin', 2);
        a.setAttribute('data-filled-area', 2);
    }
    if (area === 3) {
        a.style.left = '404px';
        isArea3Filled = true;
        a.setAttribute('data-origin', 3);
        a.setAttribute('data-filled-area', 3);
    }
    a.setAttribute('data-coords', coordsJSON);
    a.setAttribute('data-color', 'brown');
    a.setAttribute('data-block-size', '24px');
    addDrag(a);
}
function generateLShapeCoords(column, length, reverse, orientation){
    const LCoords = [];
    if(orientation === 1 && reverse === 1){
        let i;
        for(i = 0; i<column; i++){
            LCoords.push({dr: i, dc: 0});
        }
        for(let y = 0; y<length; y++){
            LCoords.push({dr: i, dc: y});
        }
    }
    if(orientation === 1 && reverse === 2){
        let i;
        for(i = 0; i<length; i++){
            LCoords.push({dr: column, dc: i});
        }
        for(let y = 0; y<column; y++){
            LCoords.push({dr: y, dc:length-1});
        }
    }
    if(orientation === 2 && reverse === 1){
        for(let i = 0; i<length; i++){
            LCoords.push({dr: 0, dc: i});
        }
        for(let y = 1; y<=column; y++){
            LCoords.push({dr: y, dc: 0});
        }
    }
    if(orientation === 2 && reverse === 2){
        let i;
        for(let i = 0; i<length; i++){
            LCoords.push({dr: 0, dc: i});
        }
        for(let y = 1; y<=column; y++){
            LCoords.push({dr:y, dc:length-1});
        }
    }
    return LCoords;
}

function yamuk(area, base, up, reverse, orientation) {
    const yamukCoords = generateYamukCoords(base, up, reverse, orientation);
    const coordsJSON = JSON.stringify(yamukCoords);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '610px';
    container.style.display = 'flex';
    if (orientation === 1) {
        container.style.flexDirection = 'column';
    }
    if (orientation === 2) {
        container.style.flexDirection = 'row';
    }
    container.style.gap = '1px';
    container.style.cursor = 'grab';
    const topBlock = document.createElement('div');
    topBlock.style.display = 'flex';
    if (reverse === 2) {
        topBlock.style.justifyContent = 'flex-end';
    }
    if(orientation === 1){
        topBlock.style.flexDirection = 'row';
    }
    if (orientation === 2) {
        topBlock.style.flexDirection = 'column';
    }
    topBlock.style.gap = '1px';
    for (let i = 0; i < up; i++) {
        const blok = document.createElement('div');
        blok.style.width = '15px';
        blok.style.height = '15px';
        blok.style.background = 'brown';
        blok.style.margin = '0';
        blok.classList.add('shape-block');
        topBlock.appendChild(blok);
    }
    container.appendChild(topBlock);
    const bottomRow = document.createElement('div');
    bottomRow.style.display = 'flex';
    if(orientation === 1){
        bottomRow.style.flexDirection = 'row';
    }
    if (orientation === 2) {
        bottomRow.style.flexDirection = 'column';
    }
    bottomRow.style.gap = '1px';
    for (let i = 0; i < base; i++) {
        const block = document.createElement('div');
        block.style.width = '15px';
        block.style.height = '15px';
        block.classList.add('shape-block');
        block.style.background = 'brown';
        block.style.margin = '0';
        bottomRow.appendChild(block);
    }
    container.appendChild(bottomRow);
    document.body.appendChild(container);
    if (area === 1) {
        container.style.left = '135px';
        isArea1Filled = true;
        container.setAttribute('data-origin', 1);
        container.setAttribute('data-filled-area', 1);
    }
    if (area === 2) {
        container.style.left = '270px';
        isArea2Filled = true;
        container.setAttribute('data-origin', 2);
        container.setAttribute('data-filled-area', 2);
    }
    if (area === 3) {
        container.style.left = '404px';
        isArea3Filled = true;
        container.setAttribute('data-origin', 3);
        container.setAttribute('data-filled-area', 3);
    }
    container.setAttribute('data-coords', coordsJSON);
    container.setAttribute('data-color', 'brown');
    container.setAttribute('data-block-size', '24px');
    addDrag(container);
}
function generateYamukCoords(base, up, reverse, orientation){
    const yamukCoords = [];
    if(orientation === 1 && reverse === 1){
        
        for(let i = 0; i<up; i++){
            yamukCoords.push({dr: 0, dc:i});
        }
        for(let i = 0; i<base; i++){
            yamukCoords.push({dr: 1, dc: i});
        }
            
    }
    if(orientation === 1 && reverse === 2){
        if(up === base){
            for(let i = 0; i<up; i++){
                yamukCoords.push({dr: 0, dc:i});
            }
            for(let i = 0; i<base; i++){
                yamukCoords.push({dr: 1, dc: i});
            }
        }else if(base<up){
            for(let i = 0; i<base; i++){
                yamukCoords.push({dr: 1, dc:i});
            }
            for(let i = 0; i<up; i++){
                yamukCoords.push({dr: 0, dc:base-i});
            }
        }else{
            for(let i = 0; i<base; i++){
                yamukCoords.push({dr: 1, dc:i});
            }
            for(let i = 0; i<up; i++){
                yamukCoords.push({dr: 0, dc:up-i});
            }
        }
    }
    if(orientation === 2 && reverse === 1){
        for(let i = 0; i<base; i++){
            yamukCoords.push({dr: i, dc: 1});
        }
        for(let i = 0; i<up; i++){
            yamukCoords.push({dr: i, dc: 0});
        }
    }
    if(orientation === 2 && reverse === 2){
        if(base === up){
            for(let i = 0; i<base; i++){
                yamukCoords.push({dr:0, dc:i});
            }
            for(let i = 0; i<up; i++){
                yamukCoords.push({dr:1, dc:i});
            }
        }
        else if(base<up){
            for(let i = 1; i<base+1; i++){
                yamukCoords.push({dr: base-i, dc: 1});
            }
            for(let i = 1; i<up+1; i++){
                yamukCoords.push({dr:up-i, dc:0});
            }
        }else{
            for(let i = 1; i<base+1; i++){
                yamukCoords.push({dr: base-i, dc: 1});
            }
            for(let i = 1; i<up+1; i++){
                yamukCoords.push({dr:base-i, dc:0});
            }
        }
        
    }
    return yamukCoords;
}

function cross(area, base, up, reverse, orientation) {
    const crossCoords = generateCrossCoords(base, up, reverse, orientation);
    const coordsJSON = JSON.stringify(crossCoords);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '610px';
    container.style.display = 'flex';
    if (reverse === 1) {
        container.style.flexDirection = 'column';
    }
    if (reverse === 2) {
        container.style.flexDirection = 'row';
    }
    container.style.gap = '1px';
    container.style.cursor = 'grab';
    const topBlock = document.createElement('div');
    topBlock.style.display = 'flex';
    topBlock.style.gap = '1px';
    if (reverse === 2) {
        topBlock.style.flexDirection = 'column';
    }
    topBlock.style.justifyContent = 'center';
    for (let i = 0; i < up; i++) {
        const blok = document.createElement('div');
        blok.style.width = '15px';
        blok.style.height = '15px';
        blok.style.background = 'brown';
        blok.classList.add('shape-block');
        blok.style.margin = '0';
        topBlock.appendChild(blok);
    }
    const bottomRow = document.createElement('div');
    bottomRow.style.display = 'flex';
    bottomRow.style.gap = '1px';
    bottomRow.style.justifyContent = 'center';
    if (reverse === 2) {
        bottomRow.style.flexDirection = 'column';
    }
    for (let i = 0; i < base; i++) {
        const block = document.createElement('div');
        block.style.width = '15px';
        block.classList.add('shape-block');
        block.style.height = '15px';
        block.style.background = 'brown';
        block.style.margin = '0';
        bottomRow.appendChild(block);
    }
    if (orientation === 1) {
        container.appendChild(topBlock);
        container.appendChild(bottomRow);
    }
    if (orientation === 2) {
        container.appendChild(bottomRow);
        container.appendChild(topBlock);
    }
    document.body.appendChild(container);
    if (area === 1) {
        container.style.left = '135px';
        isArea1Filled = true;
        container.setAttribute('data-origin', 1);
        container.setAttribute('data-filled-area', 1);
    }
    if (area === 2) {
        container.style.left = '270px';
        isArea2Filled = true;
        container.setAttribute('data-origin', 2);
        container.setAttribute('data-filled-area', 2);
    }
    if (area === 3) {
        container.style.left = '404px';
        isArea3Filled = true;
        container.setAttribute('data-origin', 3);
        container.setAttribute('data-filled-area', 3);
    }
    container.setAttribute('data-coords', coordsJSON);
    container.setAttribute('data-color', 'brown');
    container.setAttribute('data-block-size', '24px');
    addDrag(container);
}
function generateCrossCoords(base, up, reverse, orientation){
    const crossCoords = [];
    if(orientation === 1 && reverse === 1){
        for(let i = 0; i<base; i++){
            crossCoords.push({dr: 1, dc: i});
        }
        for(let i = 0; i<up; i++){
            if(up === 1 && base === 5){
                crossCoords.push({dr: 0, dc:2});
            }else{
                crossCoords.push({dr: 0, dc: (base-2) - i});
            }
        }
    }
    if(orientation === 1 && reverse === 2){
        for(let i = 0; i<base; i++){
            crossCoords.push({dr:i , dc:1})
        }
        for(let i = 0; i<up; i++){
            if(up === 1 && base === 5){
                crossCoords.push({dr:2 , dc: 0})
            }else{
                crossCoords.push({dr:(base-2) - i , dc: 0});
            }
        }
    }
    if(orientation === 2 && reverse === 1){
        for(let i = 0; i<base; i++){
            crossCoords.push({dr: 0, dc: i});
        }
        for(let i = 0; i<up; i++){
            if(up === 1 && base === 5){
                crossCoords.push({dr: 1, dc: 2});
            }else{
                crossCoords.push({dr: 1, dc: (base-2) - i});
            }
        }
    }
    if(orientation === 2 && reverse === 2){
        for(let i = 0; i<base; i++){
            crossCoords.push({dr: i, dc: 0});
        }
        for(let i = 0; i<up; i++){
            if(up === 1 && base === 5){
                crossCoords.push({dr: 2, dc: 1});
            }else{
                crossCoords.push({dr:(base-2)-i , dc:1});
            }
        }
    }
    return crossCoords;
}

function square(area, edge) {
    const squareCoords = generateSquareCoords(edge);
    const coordsJSON = JSON.stringify(squareCoords);
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '610px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1px';
    container.style.cursor = 'grab';
    for (let row = 0; row < edge; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.gap = '1px';
        for (let col = 0; col < edge; col++) {
            const block = document.createElement('div');
            block.style.width = '15px';
            block.style.height = '15px';
            block.style.background = 'brown';
            block.classList.add('shape-block');
            block.style.margin = '0';
            rowDiv.appendChild(block);
        }
        container.appendChild(rowDiv);
    }
    document.body.appendChild(container);
    if (area === 1) {
        container.style.left = '135px';
        isArea1Filled = true;
        container.setAttribute('data-origin', 1);
        container.setAttribute('data-filled-area', 1);
    }
    if (area === 2) {
        container.style.left = '270px';
        isArea2Filled = true;
        container.setAttribute('data-origin', 2);
        container.setAttribute('data-filled-area', 2);
    }
    if (area === 3) {
        container.style.left = '404px';
        isArea3Filled = true;
        container.setAttribute('data-origin', 3);
        container.setAttribute('data-filled-area', 3);
    }
    container.setAttribute('data-coords', coordsJSON);
    container.setAttribute('data-color', 'brown');
    container.setAttribute('data-block-size', '24px');
    addDrag(container);
}
function generateSquareCoords(edge){
    const squareCoords = [];
    for(let i = 0; i<edge; i++){
        for(let y = 0; y<edge; y++){
            squareCoords.push({dr:i, dc:y});
        } y = 0;
    }
    return squareCoords;
}

function ZShape(area, left, middle, right, reverse, orientation) {
    const zCoords = generateZShapeCoords(left, middle, right, reverse, orientation);
    const coordsJSON = JSON.stringify(zCoords);
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.position = 'absolute';
    container.style.top = '610px';
    if (orientation === 1) {
        container.style.flexDirection = 'row';
    }
    if (orientation === 2) {
        container.style.flexDirection = 'column';
    }
    container.style.cursor = 'grab';
    container.style.gap = '1px';
    const first = document.createElement('div');
    first.style.gap = '1px';
    first.style.display = 'flex';
    if (orientation === 2) {
        first.style.flexDirection = 'column';
    }
    for (let i = 0; i < left; i++) {
        const block = document.createElement('div');
        block.style.width = '15px';
        block.style.height = '15px';
        block.classList.add('shape-block');
        block.style.background = 'brown';
        block.style.margin = '0';
        first.appendChild(block);
    }
    const center = document.createElement('div');
    center.style.gap = '1px';
    center.style.display = 'flex';
    if (orientation === 1) {
        center.style.flexDirection = 'column';
    }
    if (orientation === 2) {
        center.style.flexDirection = 'row';
    }
    for (let i = 0; i < middle; i++) {
        const block = document.createElement('div');
        block.style.width = '15px';
        block.style.height = '15px';
        block.classList.add('shape-block');
        block.style.background = 'brown';
        block.style.margin = '0';
        center.appendChild(block);
    }
    const last = document.createElement('div');
    last.style.gap = '1px';
    last.style.display = 'flex';
    if (orientation === 2) {
        last.style.flexDirection = 'column';
    }
    last.style.alignItems = 'flex-end';
    for (let i = 0; i < right; i++) {
        const block = document.createElement('div');
        block.style.width = '15px';
        block.style.height = '15px';
        block.style.background = 'brown';
        block.classList.add('shape-block');
        block.style.margin = '0';
        last.appendChild(block);
    }
    if (reverse === 1) {
        container.appendChild(first);
        container.appendChild(center);
        container.appendChild(last);
    }
    if (reverse === 2) {
        container.appendChild(last);
        container.appendChild(center);
        container.appendChild(first);
    }
    document.body.appendChild(container);
    if (area === 1) {
        container.style.left = '135px';
        isArea1Filled = true;
        container.setAttribute('data-origin', 1);
        container.setAttribute('data-filled-area', 1);
    }
    if (area === 2) {
        container.style.left = '270px';
        isArea2Filled = true;
        container.setAttribute('data-origin', 2);
        container.setAttribute('data-filled-area', 2);
    }
    if (area === 3) {
        container.style.left = '404px';
        isArea3Filled = true;
        container.setAttribute('data-origin', 3);
        container.setAttribute('data-filled-area', 3);
    }
    container.setAttribute('data-coords', coordsJSON);
    container.setAttribute('data-color', 'brown');
    container.setAttribute('data-block-size', '24px');
    addDrag(container);
}
function generateZShapeCoords(left, middle, right, reverse, orientation){
    const ZCoords = [];
    if(orientation === 1 && reverse === 1){
        let i;
        for(i = 0; i<left; i++){
            ZCoords.push({dr: 0, dc:i});
        }
        let y;
        for(y = 0; y<middle; y++){
            ZCoords.push({dr: y, dc: i});
        }
        for(let z = 0; z<right; z++){
            ZCoords.push({dr: y-1, dc: i+1});
            i++;
        }
    }
    if(orientation === 1 && reverse === 2){
        let i;
        for(i = 0; i<right; i++){
            ZCoords.push({dr: middle - 1, dc: i});
        }
        let y;
        for(y = 0; y < middle; y++){
            ZCoords.push({dr: y, dc: i});
        }
        for(let z = 0; z<left; z++){
            ZCoords.push({dr: 0, dc: i+1});
            i++;
        }
    }
    if(orientation === 2 && reverse === 1){
        let i;
        for(i = 0; i<left; i++){
            ZCoords.push({dr: i, dc: 0});
        }
        let y;
        for(y = 0; y<middle; y++){
            ZCoords.push({dr: i, dc: y});
        }
        for(let z = 0; z<right; z++){
            ZCoords.push({dr: i+1, dc: y-1});
            i++;
        }
    }
    if(orientation === 2 && reverse === 2){
        let i;
        for(i = 0; i<right; i++){
            ZCoords.push({dr: i, dc: middle - 1});
        }
        let y;
        for(y = 0; y<middle; y++){
            ZCoords.push({dr: i, dc: y});
        }
        for(z = 0; z<left; z++){
            ZCoords.push({dr:i+1 , dc: 0});
            i++;
        }
    }
    return ZCoords;
}

function fillSuggestArea() {
    for (i = 1; i <= 3; i++) {
        if (i === 1 && isArea1Filled) continue;
        if (i === 2 && isArea2Filled) continue;
        if (i === 3 && isArea3Filled) continue;
        let whichShape = Math.floor(Math.random() * 6) + 1;
        if (whichShape === 1) {
            const possibleLShapes = [];
            for (let column = 1; column <= 4; column++) {
                for (let length = 2; length <= 5; length++) {
                    for (let reverse = 1; reverse <= 2; reverse++) {
                        for (let orientation = 1; orientation <= 2; orientation++) {
                            possibleLShapes.push({
                                column,
                                length,
                                reverse,
                                orientation
                            })
                        }
                    }
                }
            }
            let r = Math.floor(Math.random() * possibleLShapes.length);
            let shape = possibleLShapes[r];
            LShape(i, shape.column, shape.length, shape.reverse, shape.orientation);
        }
        if (whichShape === 2) {
            const possibleStick = [];
            for (let number1 = 1; number1 <= 2; number1++) {
                for (let length = 1; length <= 5; length++) {
                    let a = 1;
                    possibleStick.push({
                        number1,
                        a,
                        length
                    });
                }
            }
            let r = Math.floor(Math.random() * possibleStick.length);
            let shape = possibleStick[r];
            stick(shape.number1, i, shape.length)
        }
        if (whichShape === 3) {
            const possibleYamuk = [];
            for (let base = 2; base <= 5; base++) {
                for (let up = 2; up <= 5; up++) {
                    if (base === up) {
                        possibleYamuk.push({
                            area: 1,
                            base,
                            up,
                            reverse: 1,
                            orientation: 1
                        })
                    } else {
                        for (let reverse = 1; reverse <= 2; reverse++) {
                            for (let orientation = 1; orientation <= 2; orientation++) {
                                possibleYamuk.push({
                                    area: i,
                                    base,
                                    up,
                                    reverse,
                                    orientation
                                });
                            }
                        }
                    }
                }
            }
            let r = Math.floor(Math.random() * possibleYamuk.length);
            let shape = possibleYamuk[r];
            yamuk(i, shape.base, shape.up, shape.reverse, shape.orientation);
        }
        if (whichShape === 4) {
            let r = Math.floor(Math.random() * 16) + 1;
            if (r === 1) cross(i, 3, 1, 1, 1);
            if (r === 2) cross(i, 3, 1, 1, 2);
            if (r === 3) cross(i, 3, 1, 2, 1);
            if (r === 4) cross(i, 3, 1, 2, 2);
            if (r === 5) cross(i, 5, 1, 1, 1);
            if (r === 6) cross(i, 5, 1, 1, 2);
            if (r === 7) cross(i, 5, 1, 2, 1);
            if (r === 8) cross(i, 5, 1, 2, 2);
            if (r === 9) cross(i, 5, 3, 1, 1);
            if (r === 10) cross(i, 5, 3, 1, 2);
            if (r === 11) cross(i, 5, 3, 2, 1);
            if (r === 12) cross(i, 5, 3, 2, 2);
            if (r === 13) cross(i, 4, 2, 1, 1);
            if (r === 14) cross(i, 4, 2, 1, 2);
            if (r === 15) cross(i, 4, 2, 2, 1);
            if (r === 16) cross(i, 4, 2, 2, 2);
        }
        if (whichShape === 5) {
            const possibleSquares = [];
            for (let size = 2; size <= 5; size++) {
                possibleSquares.push({
                    size
                });
            }
            let r = Math.floor(Math.random() * possibleSquares.length);
            square(i, possibleSquares[r].size);
        }
        if (whichShape === 6) {
            const z = [];
            for (let middle = 2; middle <= 5; middle++) {
                for (let reverse = 1; reverse <= 2; reverse++) {
                    for (let orientation = 1; orientation <= 2; orientation++) {
                        for (let left = 1; left <= 3; left++) {
                            for (let right = 1; right <= 3; right++) {
                                let a = 1;
                                if (right === 3 && left > 1) {
                                    continue;
                                } else if (left === 3 && right > 1) {
                                    continue;
                                } else {
                                    z.push({
                                        a,
                                        left,
                                        middle,
                                        right,
                                        reverse,
                                        orientation
                                    });
                                }
                            }
                        }
                    }
                }
            }
            let r = Math.floor(Math.random() * z.length);
            let shape = z[r];
            ZShape(i, shape.left, shape.middle, shape.right, shape.reverse, shape.orientation);
        }
    }
}
/*GAME AREA*/

const rows = [];
for(let i = 0; i<20; i++){
    const row = [];
    for(let y = 0; y<20; y++){
        const cell = document.getElementById(`cell-${i}-${y}`);
        row.push(cell);
    }
    rows.push(row);
}
const miniZoneRows = [];
for(let i = 5; i<15; i++){
    const row = [];
    for(let y = 5; y<15; y++){
        const cell = document.getElementById(`cell-${i}-${y}`);
        row.push(cell);
    }
    miniZoneRows.push(row);
}

const columns = [];
for(let i = 0; i<20; i++){
    const column = [];
    for(let y = 0; y<20; y++){
        const cell = document.getElementById(`cell-${y}-${i}`);
        column.push(cell);
    }
    columns.push(column);
}
const miniZoneColumns = [];
for(let i = 5; i<15; i++){
    const column = [];
    for(let y = 5; y<15; y++){
        const cell = document.getElementById(`cell-${y}-${i}`);
        column.push(cell);
    }
    miniZoneColumns.push(column);
}

function explodeBlocks(){
    let a = [];
    let b = 0;
    let c = [];
    let d = 0;
    for(let i = 0; i<20; i++){
        for(let y = 0; y<20; y++){
            if(rows[i][y].classList.contains('filled'))b++;
        }a[i] = b;
        b = 0;
    }
    for(let i = 0; i<20; i++){
        if(a[i] === 20){
            s = s+1000;
            score.innerHTML = `score: ${s},-------\nhighest score: ${highestScore}`;
            for(let y = 0; y<20; y++){
                rows[i][y].style.backgroundColor = '';
                rows[i][y].classList.remove('filled');
            }
        }
    }
    for(let i = 0; i<20; i++){
        for(let y = 0; y<20; y++){
            if(columns[i][y].classList.contains('filled'))d++;
        }c[i] = d;
        d = 0;
    }
    for(let i = 0; i<20; i++){
        if(c[i] === 20){
            s = s+1000;
            score.innerHTML = `score: ${s},-------\nhighest score: ${highestScore}`;
            for(let y = 0; y<20; y++){
                columns[i][y].style.backgroundColor = '';
                columns[i][y].classList.remove('filled');
            }
        }
    }
}
function explodeMiniZoneBlocks(){
    let a = [];
    let b = 0;
    let c = [];
    let d = 0;
    for(let i = 5; i<15; i++){
        for(let y = 5; y<15; y++){
            if(rows[i][y].classList.contains('filled'))b++;
        }a[i] = b;
        b = 0;
    }
    for(let i = 5; i<15; i++){
        if(a[i] === 10){
            s = s+100;
            score.innerHTML = `score: ${s},-------\nhighest score: ${highestScore}`;
            for(let y = 5; y<15; y++){
                rows[i][y].style.backgroundColor = '';
                rows[i][y].classList.remove('filled');
            }
        }
    }
    for(let i = 5; i<15; i++){
        for(let y = 5; y<15; y++){
            if(columns[i][y].classList.contains('filled'))d++;
        }c[i] = d;
        d = 0;
    }
    for(let i = 5; i<15; i++){
        if(c[i] === 10){
            s = s+100;
            score.innerHTML = `score: ${s},-------\nhighest score: ${highestScore}`;
            for(let y = 5; y<15; y++){
                columns[i][y].style.backgroundColor = '';
                columns[i][y].classList.remove('filled');
            }
        }
    }
}
fillSuggestArea();

function pesEdiyorum(){
    if(s > highestScore){
        highestScore = s;
        localStorage.setItem('highestScore', highestScore);
    }
    for(let i = 0; i<400; i++){
        smallBlock[i].classList.remove('filled');
        smallBlock[i].style.backgroundColor = '';
    }
    document.querySelector('.modal').style.display = 'flex';
    document.querySelector('.son-skor').innerHTML = `skor: ${s}`;
}

function nasilOynanir(){
    alert(`Mükremin'in bir kadın olarak tırnakları
        kırılması pahasına sana uzattığı ahşap blokları al ve
        iç kareye ya da dış ateşli kareye yerleştir. İç karede 
        satır ya da sütun doldurursan 100, dış karede
        doldurursan 1000 puan!`)
}

function tekrarOyna(){
    s = 0;
    score.innerHTML = `score: ${s}------\nhighest score: ${highestScore}`;
    document.querySelector('.modal').style.display = 'none';
    fillSuggestArea();
}

function cik(){
    alert("yukardan kapa işte onu da mı ben yapim :d")
}