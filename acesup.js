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
        // hint highlight state
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
        // clear any hint state on reset
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
        this.stackElements = [
            document.getElementById("stack-1"),
            document.getElementById("stack-2"),
            document.getElementById("stack-3"),
            document.getElementById("stack-4")
        ];
        this.stockElement = document.getElementById("stockpile");
        this.messageArea = document.getElementById("message-area");
        // timeout handle for autoclearing hint highlight
        this.hintTimeout = null;
        // highlight state for stockpile when hint suggests dealing
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
    }

    deal() {
        if (this.deck.isEmpty()) {
            return;
        }

        if (this.gameState.gameWon || this.gameState.gameLost) {
            return;
        }

        this.gameState.startGame();
        this.clearHintHighlight();

        for (let i = 0; i < 4; i++) {
            if (!this.deck.isEmpty()) {
                const card = this.deck.drawCard();
                this.ensureCardFaceUp(card);
                this.tableau.addCardToStack(i, card);
            }
        }

        this.gameState.clearSelection();
        this.render();
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
        if (topCard !== card) {
            return false;
        }
        return this.tableau.isStackEmpty(toStack);
    }

    removeCard(stackIndex) {
        const topCard = this.tableau.getTopCard(stackIndex);
        if (!topCard) {
            return false;
        }
        if (topCard.getRank() === 'A') {
            return false;
        }
        if (this.canRemove(topCard, stackIndex)) {
            this.tableau.removeTopCard(stackIndex);
            this.gameState.incrementMoves();
            this.render();
            this.checkEndgameConditions();
            return true;
        }
        return false;
    }

    moveCard(fromStack, toStack) {
        const card = this.tableau.getTopCard(fromStack);
        if (this.canMove(card, fromStack, toStack)) {
            const movedCard = this.tableau.removeTopCard(fromStack);
            this.tableau.addCardToStack(toStack, movedCard);
            this.gameState.incrementMoves();
            this.render();
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

        const topCard = this.tableau.getTopCard(stackIndex);

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
        this.messageArea.className = ""; // reset
        this.messageArea.classList.add(type); // success / failure
        this.messageArea.textContent = text;
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

    ensureCardFaceDown(card) {
        if (card.getVisible()) {
            card.flip();
        }
    }

    // clear any active hint highlight and timeout
    clearHintHighlight() {
        if (this.hintTimeout) {
            clearTimeout(this.hintTimeout);
            this.hintTimeout = null;
        }
        this.gameState.hintCard = null;
        this.gameState.hintStack = null;
        this.hintStockpile = false;
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
                    // apply hint highlight if this is the hinted card
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
            // if hint is suggesting to deal, highlight stockpile
            if (this.hintStockpile) {
                stockImg.classList.add("hint-card");
            }
            this.stockElement.appendChild(stockImg);
            this.stockElement.style.cursor = "pointer";
        } else {
            this.stockElement.classList.add("empty");
            this.stockElement.textContent = "Empty";
            this.stockElement.style.cursor = "default";
        }
    }

    showHint() {
        // clear previous hint highlight if any
        this.clearHintHighlight();

        for (let i = 0; i < 4; i++) {
            const topCard = this.tableau.getTopCard(i);
            if (topCard && this.canRemove(topCard, i)) {
                // highlight the suggested removable card
                this.gameState.hintCard = topCard;
                this.gameState.hintStack = i;
                this.render();
                // auto-clear highlight after a short duration
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
                        // highlight the card to move
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
        // if we get here, highlight the stockpile
        if (!this.deck.isEmpty()) {
            this.hintStockpile = true;
            this.render();
            this.hintTimeout = setTimeout(() => {
                this.clearHintHighlight();
                this.render();
            }, 2000);
        }
    }

    undo() {
        this.showMessage("Undo feature not yet implemented", "info");
    }

    redo() {
        this.showMessage("Redo feature not yet implemented", "info");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const game = new Game();
});
