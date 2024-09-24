import Utils from './utils.class';

type Field = (number | null)[][];
type AnimationProperty = 'top' | 'left';

const moveAnimationOptions: KeyframeAnimationOptions = {
    duration: 150,
    fill: 'forwards'
};

const mergeAnimationOptions: KeyframeAnimationOptions = {
    duration: 200,
    easing: 'ease'
};

export default class Game {
    #TILE_OFFSET_PX = 10;
    #isUiBlocked = false;
    #score = 0;
    #fieldEl: HTMLElement;
    #fieldElSize: number;
    #tileSize: number;

    #field: Field = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];

    #keyBindings: { [key: string]: Function };

    constructor() {
        this.#fieldEl = document.getElementById('field')!;
        this.#fieldElSize = this.#fieldEl.getBoundingClientRect().width;
        this.#tileSize = (this.#fieldElSize - (this.#TILE_OFFSET_PX * (this.#field.length + 1))) / this.#field.length;

        this.#keyBindings = {
            'ArrowDown': this.#moveDown.bind(this),
            'ArrowUp': this.#moveUp.bind(this),
            'ArrowLeft': this.#moveLeft.bind(this),
            'ArrowRight': this.#moveRight.bind(this)
        };
    }

    init() {
        this.#generateRandomTile();
        this.#generateRandomTile();

        this.#buildBackgroundGrid();
        this.#buildTiles();

        document.addEventListener('keydown', (e) => {
            if (this.#isUiBlocked) return;

            const func = this.#keyBindings[e.code];

            e.preventDefault();

            if (func)
                func()?.then(() => {
                    [].forEach.call(document.querySelectorAll('.tile'), (e: HTMLDivElement) => {
                        e.parentNode!.removeChild(e);
                    });

                    this.#buildTiles();
                });
        });
    }

    #updateScore(valueToAdd: number) {
        const scoreEl = document.querySelector<HTMLSpanElement>('#score-number');
        if (!scoreEl) return;

        this.#score += valueToAdd;
        scoreEl.innerText = this.#score.toString();
    }

    #generateRandomTile() {
        const emptyCells: { x: number, y: number }[] = [];

        this.#field.forEach((row, rowIndex) => {
            row.forEach((col, colIndex) => {
                if (!col) {
                    emptyCells.push({ x: rowIndex, y: colIndex });
                }
            });
        });

        const min = 0;
        const max = emptyCells.length - 1;
        const randomEmptyCell = emptyCells[Math.floor(Math.random() * (max - min) + min)];

        if (randomEmptyCell) {
            this.#field[randomEmptyCell.x][randomEmptyCell.y] = Utils.getRandomTileValue();
        }
    }

    #buildTiles() {
        this.#field.forEach((row, rowIndex) => {
            row.forEach((el, colIndex) => {
                if (!el) return;

                const div = document.createElement('div');
                div.classList.add('tile');
                div.style.width = `${this.#tileSize}px`;
                div.style.height = `${this.#tileSize}px`;

                const top = (this.#tileSize * rowIndex) + this.#TILE_OFFSET_PX * (rowIndex + 1);
                const left = (this.#tileSize * colIndex) + this.#TILE_OFFSET_PX * (colIndex + 1);

                div.style.left = `${left}px`;
                div.style.top = `${top}px`;

                div.dataset['row'] = rowIndex.toString();
                div.dataset['col'] = colIndex.toString();

                div.innerText = el.toString();
                this.#fieldEl.appendChild(div);
            });
        });
    }

    #buildBackgroundGrid() {
        this.#field.forEach((row, rowIndex) => {
            row.forEach((el, colIndex) => {
                const div = document.createElement('div');
                div.classList.add('bgTile');
                div.style.width = `${this.#tileSize}px`;
                div.style.height = `${this.#tileSize}px`;

                const top = (this.#tileSize * rowIndex) + this.#TILE_OFFSET_PX * (rowIndex + 1);
                const left = (this.#tileSize * colIndex) + this.#TILE_OFFSET_PX * (colIndex + 1);

                div.style.left = `${left}px`;
                div.style.top = `${top}px`;

                this.#fieldEl.appendChild(div);
            });
        });
    }

    #animateMove(
        div: HTMLDivElement,
        property: AnimationProperty,
        value: number,
        callback: Function
    ) {
        this.#isUiBlocked = true;
    
        div
            .animate({ [property]: `${value}px` }, moveAnimationOptions)
            .finished
            .then(() => {
                this.#isUiBlocked = false;
                callback();
            });
    }
    
    #animateMerge(
        div: HTMLDivElement,
        property: AnimationProperty,
        value: number,
        mergedValue: number,
        callback: Function
    ) {
        this.#isUiBlocked = true;
    
        div
            .animate({ [property]: `${value}px` }, moveAnimationOptions)
            .finished
            .then(() => {
                div.innerText = mergedValue.toString();
                div
                    .animate({ transform: 'scale(1.1)' }, mergeAnimationOptions)
                    .finished
                    .then(() => {
                        this.#isUiBlocked = false;
                        callback(null);
                    });
            });
    }

    #moveLeft() {
        const promises: Promise<unknown>[] = [];
        let isDidAnyActions = false;
    
        for (let rowIndex = 0; rowIndex < this.#field.length; rowIndex++) {
            for (let colIndex = 0; colIndex <= this.#field.length - 1; colIndex++) {
    
                for (let i = colIndex + 1; i <= this.#field.length - 1; i++) {
                    if (!this.#field[rowIndex][i]) continue;
    
                    const div = document.querySelector<HTMLDivElement>(`[data-row="${rowIndex}"][data-col="${i}"]`)!;
                    if (!div) return;
    
                    if (!this.#field[rowIndex][colIndex]) {
                        this.#isUiBlocked = true;
                        const p = new Promise((resolve) => {
                            const left = (this.#tileSize * colIndex) + this.#TILE_OFFSET_PX * (colIndex + 1);
                            div.dataset['col'] = colIndex.toString();
    
                            this.#animateMove(div, 'left', left, resolve);
    
                            this.#field[rowIndex][colIndex] = this.#field[rowIndex][i];
                            this.#field[rowIndex][i] = null;
                        });
    
                        isDidAnyActions = true;
                        promises.push(p);
                        continue;
                    }
    
                    if (this.#field[rowIndex][colIndex] === this.#field[rowIndex][i]) {
                        const p = new Promise((resolve) => {
                            const left = (this.#tileSize * colIndex) + this.#TILE_OFFSET_PX * (colIndex + 1);
                            div.dataset['col'] = colIndex.toString();
    
                            const mergedValue = this.#field[rowIndex][i]! * 2;
                            this.#animateMerge(div, 'left', left, mergedValue, resolve);
    
                            this.#field[rowIndex][colIndex] = mergedValue;
                            this.#field[rowIndex][i] = null;
                            this.#updateScore(mergedValue);
                        });
    
                        isDidAnyActions = true;
                        promises.push(p);
                        break;
                    }
                    else break;
                }
            }
        }
    
        if (isDidAnyActions) {
            this.#generateRandomTile();
        }
    
        return Promise.all(promises);
    }

    #moveRight() {
        const promises: Promise<unknown>[] = [];
        let isDidAnyActions = false;
    
        for (let rowIndex = 0; rowIndex < this.#field.length; rowIndex++) {
            for (let colIndex = this.#field.length - 1; colIndex >= 0; colIndex--) {
    
                for (let i = colIndex - 1; i >= 0; i--) {
                    if (!this.#field[rowIndex][i]) continue;
    
                    const div = document.querySelector<HTMLDivElement>(`[data-row="${rowIndex}"][data-col="${i}"]`)!;
                    if (!div) return;
    
                    if (!this.#field[rowIndex][colIndex]) {
                        this.#isUiBlocked = true;
                        const p = new Promise((resolve) => {
                            const left = (this.#tileSize * colIndex) + this.#TILE_OFFSET_PX * (colIndex + 1);
                            div.dataset['col'] = colIndex.toString();
    
                            this.#animateMove(div, 'left', left, resolve);
    
                            this.#field[rowIndex][colIndex] = this.#field[rowIndex][i];
                            this.#field[rowIndex][i] = null;
                        });
    
                        isDidAnyActions = true;
                        promises.push(p);
                        continue;
                    }
    
                    if (this.#field[rowIndex][colIndex] === this.#field[rowIndex][i]) {
                        const p = new Promise((resolve) => {
                            const left = (this.#tileSize * colIndex) + this.#TILE_OFFSET_PX * (colIndex + 1);
                            div.dataset['col'] = colIndex.toString();
    
                            const mergedValue = this.#field[rowIndex][i]! * 2;
                            this.#animateMerge(div, 'left', left, mergedValue, resolve);
    
                            this.#field[rowIndex][colIndex] = mergedValue;
                            this.#field[rowIndex][i] = null;
                            this.#updateScore(mergedValue);
                        });
    
                        isDidAnyActions = true;
                        promises.push(p);
                        break;
                    }
                    else break;
                }
            }
        }
    
        if (isDidAnyActions) {
            this.#generateRandomTile();
        }
    
        return Promise.all(promises);
    }

    #moveDown() {
        const promises: Promise<unknown>[] = [];
        let isDidAnyActions = false;
    
        for (let colIndex = 0; colIndex < this.#field.length; colIndex++) {
            for (let rowIndex = this.#field.length - 1; rowIndex >= 0; rowIndex--) {
    
                for (let i = rowIndex - 1; i >= 0; i--) {
                    if (!this.#field[i][colIndex]) continue;
    
                    const div = document.querySelector<HTMLDivElement>(`[data-row="${i}"][data-col="${colIndex}"]`)!;
                    if (!div) return;
    
                    if (!this.#field[rowIndex][colIndex]) {
                        this.#isUiBlocked = true;
                        const p = new Promise((resolve) => {
                            const top = (this.#tileSize * rowIndex) + this.#TILE_OFFSET_PX * (rowIndex + 1);
                            div.dataset['row'] = rowIndex.toString();
    
                            this.#animateMove(div, 'top', top, resolve);
    
                            this.#field[rowIndex][colIndex] = this.#field[i][colIndex];
                            this.#field[i][colIndex] = null;
                        });
    
                        isDidAnyActions = true;
                        promises.push(p);
                        continue;
                    }
    
                    if (this.#field[rowIndex][colIndex] === this.#field[i][colIndex]) {
                        const p = new Promise((resolve) => {
                            const top = (this.#tileSize * rowIndex) + this.#TILE_OFFSET_PX * (rowIndex + 1);
                            div.dataset['row'] = rowIndex.toString();
    
                            const mergedValue = this.#field[i][colIndex]! * 2;
                            this.#animateMerge(div, 'top', top, mergedValue, resolve);
    
                            this.#field[rowIndex][colIndex] = mergedValue;
                            this.#field[i][colIndex] = null;
                            this.#updateScore(mergedValue);
                        });
    
                        isDidAnyActions = true;
                        promises.push(p);
                        break;
                    }
                    else break;
                }
            }
        }
    
        if (isDidAnyActions) {
            this.#generateRandomTile();
        }
    
        return Promise.all(promises);
    }

    #moveUp() {
        const promises: Promise<unknown>[] = [];
        let isDidAnyActions = false;
    
        for (let colIndex = 0; colIndex < this.#field.length; colIndex++) {
            for (let rowIndex = 0; rowIndex <= this.#field.length - 1; rowIndex++) {
    
                for (let i = rowIndex + 1; i <= this.#field.length - 1; i++) {
                    if (!this.#field[i][colIndex]) continue;
    
                    const div = document.querySelector<HTMLDivElement>(`[data-row="${i}"][data-col="${colIndex}"]`)!;
                    if (!div) return;
    
                    if (!this.#field[rowIndex][colIndex]) {
                        this.#isUiBlocked = true;
                        const p = new Promise((resolve) => {
                            const top = (this.#tileSize * rowIndex) + this.#TILE_OFFSET_PX * (rowIndex + 1);
                            div.dataset['row'] = rowIndex.toString();
    
                            this.#animateMove(div, 'top', top, resolve);
    
                            this.#field[rowIndex][colIndex] = this.#field[i][colIndex];
                            this.#field[i][colIndex] = null;
                        });
    
                        isDidAnyActions = true;
                        promises.push(p);
                        continue;
                    }
    
                    if (this.#field[rowIndex][colIndex] === this.#field[i][colIndex]) {
                        const p = new Promise((resolve) => {
                            const top = (this.#tileSize * rowIndex) + this.#TILE_OFFSET_PX * (rowIndex + 1);
                            div.dataset['row'] = rowIndex.toString();
    
                            const mergedValue = this.#field[i][colIndex]! * 2;
                            this.#animateMerge(div, 'top', top, mergedValue, resolve);
    
                            this.#field[rowIndex][colIndex] = mergedValue;
                            this.#field[i][colIndex] = null;
                            this.#updateScore(mergedValue);
                        });
    
                        isDidAnyActions = true;
                        promises.push(p);
                        break;
                    }
                    else break;
                }
            }
        }
    
        if (isDidAnyActions) {
            this.#generateRandomTile();
        }
    
        return Promise.all(promises);
    }
}
