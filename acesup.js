class Tableau {
    constructor(numStacks = 4) {
        this.stacks = [];
        for (let i = 0; i < numStacks; i++) {
            this.stacks[i] = [];
        }
    }

    addCardToStack(stackIndex, card) {
        this.stacks[stackIndex].push(card);
    }

    getStack(stackIndex) {
        return this.stacks[stackIndex];
    }

    getTopCard(stackIndex) {
        const stack = this.stacks[stackIndex];
        return stack.length > 0 ? stack[stack.length - 1] : null;
    }

    removeTopCard(stackIndex) {
        return this.stacks[stackIndex].pop();
    }

    isStackEmpty(stackIndex) {
        return this.stacks[stackIndex].length === 0;
    }

    clear() {
        this.stacks.forEach(stack => stack.length = 0);
    }

    getAllCards() {
        return this.stacks.flat();
    }
}

class Move {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

class MoveHistory {
    constructor() {
        this.undoMoves = [];
        this.redoMoves = [];
    }

    addMove(move) {
        this.undoMoves.push(move);
        this.redoMoves = [];
    }

    canUndo() {
        return this.undoMoves.length > 0;
    }

    canRedo() {
        return this.redoMoves.length > 0;
    }

    getUndoMove() {
        if (this.canUndo()) {
            const move = this.undoMoves.pop();
            this.redoMoves.push(move);
            return move;
        }
        return null;
    }

    getRedoMove() {
        if (this.canRedo()) {
            const move = this.redoMoves.pop();
            this.undoMoves.push(move);
            return move;
        }
        return null;
    }

    clear() {
        this.undoMoves = [];
        this.redoMoves = [];
    }
}

class GameState {
    constructor() {
        this.selectedCard = null;
        this.selectedStack = null;
        this.moves = 0;
        this.gameStarted = false;
        this.gameWon = false;
        this.gameLost = false;
        this.startTime = null;
        this.timer = null;
        this.hintCard = null;
        this.hintStack = null;
    }

    reset() {
        this.selectedCard = null;
        this.selectedStack = null;
        this.moves = 0;
        this.gameStarted = false;
        this.gameWon = false;
        this.gameLost = false;
        this.startTime = null;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.hintCard = null;
        this.hintStack = null;
    }

    selectCard(card, stackIndex) {
        this.selectedCard = card;
        this.selectedStack = stackIndex;
    }

    clearSelection() {
        this.selectedCard = null;
        this.selectedStack = null;
    }

    incrementMoves() {
        this.moves++;
        this.updateMovesDisplay();
    }

    decrementMoves() {
        if (this.moves > 0) {
            this.moves--;
            this.updateMovesDisplay();
        }
    }

    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTime = Date.now();
            this.startTimer();
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (!this.gameWon && !this.gameLost) {
                this.updateTimeDisplay();
            }
        }, 1000);
    }

    updateMovesDisplay() {
        const movesElement = document.getElementById('moves');
        if (movesElement) {
            movesElement.textContent = `Moves: ${this.moves}`;
        }
    }

    updateTimeDisplay() {
        const timerElement = document.getElementById('timer');
        if (timerElement && this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            timerElement.textContent = `Time: ${elapsed}s`;
        }
    }
}

class Game {
    constructor() {
        this.deck = new Deck();
        this.tableau = new Tableau();
        this.gameState = new GameState();
        this.moveHistory = new MoveHistory();
        this.stackElements = [
            document.getElementById("stack-1"),
            document.getElementById("stack-2"),
            document.getElementById("stack-3"),
            document.getElementById("stack-4")
        ];
        this.stockElement = document.getElementById("stockpile");
        
        this.messageArea = document.getElementById("message-area");
        this.hintTimeout = null;
        this.hintStockpile = false;

        this.setupEventListeners();
        this.newGame();
    }

    setupEventListeners() {
        document.getElementById("newgame-btn").addEventListener("click", () => this.newGame());
        this.stockElement.addEventListener("click", () => this.deal());
        document.getElementById("hint-btn")?.addEventListener("click", () => this.showHint());
        document.getElementById("undo-btn")?.addEventListener("click", () => this.undo());
        document.getElementById("redo-btn")?.addEventListener("click", () => this.redo());
    }

    newGame() {
        this.gameState.reset();
        this.moveHistory.clear();
        this.clearHintHighlight();
        this.hideMessage();
        this.deck = new Deck();
        this.tableau.clear();

        for (let i = 0; i < 4; i++) {
            const card = this.deck.drawCard();
            if (card) {
                this.ensureCardFaceUp(card);
                this.tableau.addCardToStack(i, card);
            }
        }

        this.render();
        this.gameState.updateMovesDisplay();
        this.gameState.updateTimeDisplay();
        this.updateButtons();
    }

    deal() {
        if (this.deck.isEmpty() || this.gameState.gameWon || this.gameState.gameLost) {
            return;
        }

        this.gameState.startGame();
        this.clearHintHighlight();

        const dealtCards = [];
        
        for (let i = 0; i < 4; i++) {
            if (!this.deck.isEmpty()) {
                const card = this.deck.drawCard();
                this.ensureCardFaceUp(card);
                this.tableau.addCardToStack(i, card);
                dealtCards.push(card);
            }
        }

        if (dealtCards.length > 0) {
            this.moveHistory.addMove(new Move('deal', { cards: dealtCards }));
            this.gameState.incrementMoves();
        }

        this.gameState.clearSelection();
        this.render();
        this.updateButtons();
        this.checkEndgameConditions();
    }

    canRemove(card, stackIndex) {
        const cardSuit = card.getSuit();
        const cardValue = card.getValue();
        for (let i = 0; i < 4; i++) {
            if (i === stackIndex) continue;
            const topCard = this.tableau.getTopCard(i);
            if (topCard && topCard.getSuit() === cardSuit && topCard.getValue() > cardValue) {
                return true;
            }
        }
        return false;
    }

    canMove(card, fromStack, toStack) {
        const topCard = this.tableau.getTopCard(fromStack);
        return topCard === card && this.tableau.isStackEmpty(toStack);
    }

    removeCard(stackIndex) {
        const topCard = this.tableau.getTopCard(stackIndex);
        if (!topCard || topCard.getRank() === 'A') {
            return false;
        }
        if (this.canRemove(topCard, stackIndex)) {
            this.moveHistory.addMove(new Move('remove', { card: topCard, fromStack: stackIndex }));
            this.tableau.removeTopCard(stackIndex);
            this.gameState.incrementMoves();
            this.render();
            this.updateButtons();
            this.checkEndgameConditions();
            return true;
        }
        return false;
    }

    moveCard(fromStack, toStack) {
        const card = this.tableau.getTopCard(fromStack);
        if (this.canMove(card, fromStack, toStack)) {
            this.moveHistory.addMove(new Move('move', { card: card, fromStack: fromStack, toStack: toStack }));
            const movedCard = this.tableau.removeTopCard(fromStack);
            this.tableau.addCardToStack(toStack, movedCard);
            this.gameState.incrementMoves();
            this.render();
            this.updateButtons();
            this.checkEndgameConditions();
            return true;
        }
        return false;
    }

    handleCardClick(card, stackIndex) {
        if (this.gameState.gameWon || this.gameState.gameLost) {
            return;
        }
        this.gameState.startGame();
        this.clearHintHighlight();

        if (!this.gameState.selectedCard) {
            if (this.removeCard(stackIndex)) {
                return;
            }
            this.gameState.selectCard(card, stackIndex);
            this.render();
        } else {
            if (this.gameState.selectedStack === stackIndex) {
                this.gameState.clearSelection();
                this.render();
            } else {
                if (this.tableau.isStackEmpty(stackIndex)) {
                    if (this.moveCard(this.gameState.selectedStack, stackIndex)) {
                        this.gameState.clearSelection();
                    }
                } else {
                    if (this.removeCard(stackIndex)) {
                        this.gameState.clearSelection();
                        return;
                    }
                    this.gameState.selectCard(card, stackIndex);
                    this.render();
                }
            }
        }
    }

    handleEmptyStackClick(stackIndex) {
        if (this.gameState.gameWon || this.gameState.gameLost) {
            return;
        }
        if (this.gameState.selectedCard) {
            if (this.moveCard(this.gameState.selectedStack, stackIndex)) {
                this.gameState.clearSelection();
            }
        }
    }

    undo() {
        const move = this.moveHistory.getUndoMove();
        if (!move) return;
        console.log("undid deal!");
        console.log(move.data);

        switch (move.type) {
            case 'deal':
                for (let i = 3; i >= 0; i--) {
                    if (!this.tableau.isStackEmpty(i)) {
                        const card = this.tableau.removeTopCard(i);
                        this.deck.addCardToTop(card);
                    }
                }
                break;
            case 'remove':
                this.tableau.addCardToStack(move.data.fromStack, move.data.card);
                break;
            case 'move':
                const card = this.tableau.removeTopCard(move.data.toStack);
                this.tableau.addCardToStack(move.data.fromStack, card);
                break;
        }

        this.gameState.decrementMoves();
        this.gameState.clearSelection();
        this.clearHintHighlight();
        this.render();
        this.updateButtons();
        this.checkEndgameConditions();
    }

    redo() {
        const move = this.moveHistory.getRedoMove();
        if (!move) return;

        console.log("redid deal!");
        console.log(move.data);
        
        switch (move.type) {
            case 'deal':
                for (let i = 0; i < 4; i++) {
                    if (!this.deck.isEmpty()) {
                        const card = this.deck.drawCard();
                        this.ensureCardFaceUp(card);
                        this.tableau.addCardToStack(i, card);
                    }
                }
                break;
            case 'remove':
                this.tableau.removeTopCard(move.data.fromStack);
                break;
            case 'move':
                const card = this.tableau.removeTopCard(move.data.fromStack);
                this.tableau.addCardToStack(move.data.toStack, card);
                break;
        }

        this.gameState.incrementMoves();
        this.gameState.clearSelection();
        this.clearHintHighlight();
        this.render();
        this.updateButtons();
        this.checkEndgameConditions();
    }

    checkWin() {
        const allCards = this.tableau.getAllCards();
        if (allCards.length === 4) {
            return allCards.every(card => card.getRank() === 'A');
        }
        return false;
    }

    checkLoss() {
        if (!this.deck.isEmpty()) {
            return false;
        }
        for (let i = 0; i < 4; i++) {
            const topCard = this.tableau.getTopCard(i);
            if (topCard && this.canRemove(topCard, i)) {
                return false;
            }
        }
        for (let fromStack = 0; fromStack < 4; fromStack++) {
            const topCard = this.tableau.getTopCard(fromStack);
            if (topCard) {
                for (let toStack = 0; toStack < 4; toStack++) {
                    if (fromStack !== toStack && this.canMove(topCard, fromStack, toStack)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    checkEndgameConditions() {
        if (this.checkWin()) {
            this.gameState.gameWon = true;
            this.showMessage("Congrats! You won! :D", "success");
        } else if (this.checkLoss()) {
            this.gameState.gameLost = true;
            this.showMessage("Game Over! It's okay, better luck next time :(", "failure");
        }
    }

    showMessage(text, type) {
        this.messageArea.textContent = text;
        this.messageArea.className = "";
        this.messageArea.classList.add(type);
        this.messageArea.classList.remove("hidden");
    }

    hideMessage() {
        this.messageArea.classList.add("hidden");
    }

    ensureCardFaceUp(card) {
        if (!card.getVisible()) {
            card.flip();
        }
    }

    clearHintHighlight() {
        if (this.hintTimeout) {
            clearTimeout(this.hintTimeout);
            this.hintTimeout = null;
        }
        this.gameState.hintCard = null;
        this.gameState.hintStack = null;
        this.hintStockpile = false;
    }

    updateButtons() {
        const undoBtn = document.getElementById("undo-btn");
        const redoBtn = document.getElementById("redo-btn");

        if (undoBtn) {
            if (this.moveHistory.canUndo()) {
                undoBtn.disabled = false;
            } else {
                undoBtn.disabled = true;
            }
        }

        if (redoBtn) {
            if (this.moveHistory.canRedo()) {
                redoBtn.disabled = false;
            } else {
                redoBtn.disabled = true;
            }
        }
    }

    render() {
        for (let i = 0; i < 4; i++) {
            const stackElement = this.stackElements[i];
            stackElement.innerHTML = "";
            const stack = this.tableau.getStack(i);

            if (stack.length === 0) {
                stackElement.addEventListener("click", () => this.handleEmptyStackClick(i));
                const emptyIndicator = document.createElement("div");
                emptyIndicator.classList.add("empty-indicator");
                emptyIndicator.textContent = "Empty";
                stackElement.appendChild(emptyIndicator);
            } else {
                stackElement.style.cursor = "default";
                stack.forEach((card, index) => {
                    const cardElement = document.createElement("img");
                    if (card.getVisible()) {
                        cardElement.src = "assets/" + card.getImageRef();
                    } else {
                        cardElement.src = "assets/cardBackRed.png";
                    }
                    cardElement.classList.add("card");
                    cardElement.style.top = `${index * 28}px`;
                    cardElement.style.zIndex = index;

                    if (this.gameState.selectedCard === card) {
                        cardElement.classList.add("selected-card");
                    }
                    if (this.gameState.hintCard === card) {
                        cardElement.classList.add("hint-card");
                    }

                    if (index === stack.length - 1) {
                        cardElement.style.cursor = "pointer";
                        cardElement.addEventListener("click", () => this.handleCardClick(card, i));
                    }

                    stackElement.appendChild(cardElement);
                });
            }
        }

        this.stockElement.innerHTML = "";
        if (!this.deck.isEmpty()) {

            const stockImg = document.createElement("img");
            stockImg.src = "assets/cardBackRed.png";

            this.stockElement.classList.remove("empty");
            if (this.hintStockpile) {
                stockImg.classList.add("hint-card");
            }
            this.stockElement.appendChild(stockImg);

            this.stockElement.appendChild(count);
            this.stockElement.style.cursor = "pointer";
        } else {
            this.stockElement.classList.add("empty");
            this.stockElement.textContent = "Empty";
            this.stockElement.style.cursor = "default";
        }
    }

    showHint() {
        this.clearHintHighlight();

        for (let i = 0; i < 4; i++) {
            const topCard = this.tableau.getTopCard(i);
            if (topCard && this.canRemove(topCard, i)) {
                this.gameState.hintCard = topCard;
                this.gameState.hintStack = i;
                this.render();
                this.hintTimeout = setTimeout(() => {
                    this.clearHintHighlight();
                    this.render();
                }, 2000);
                return;
            }
        }
        for (let fromStack = 0; fromStack < 4; fromStack++) {
            const topCard = this.tableau.getTopCard(fromStack);
            if (topCard) {
                for (let toStack = 0; toStack < 4; toStack++) {
                    if (fromStack !== toStack && this.canMove(topCard, fromStack, toStack)) {
                        this.gameState.hintCard = topCard;
                        this.gameState.hintStack = fromStack;
                        this.render();
                        this.hintTimeout = setTimeout(() => {
                            this.clearHintHighlight();
                            this.render();
                        }, 2000);
                        return;
                    }
                }
            }
        }
        if (!this.deck.isEmpty()) {
            this.hintStockpile = true;
            this.render();
            this.hintTimeout = setTimeout(() => {
                this.clearHintHighlight();
                this.render();
            }, 2000);
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const game = new Game();
});