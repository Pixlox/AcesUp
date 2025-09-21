class Tableau {
    constructor(numStacks = 4) {
        this.stacks = Array.from({ length: numStacks }, () => []);
    }

    addCardToStack(stackIndex, card) {
        this.stacks[stackIndex].push(card);
    }

    getStack(stackIndex) {
        return this.stacks[stackIndex];
    }

    clear() {
        this.stacks.forEach(stack => stack.length = 0);
    }
}

class Stock {
    constructor(cards = []) {
        this.cards = cards;
    }

    dealOne() {
        return this.cards.shift();
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    size() {
        return this.cards.length;
    }

    setCards(cards) {
        this.cards = cards;
    }
}

class Game {
    constructor() {
        this.deck = new Deck();
        this.tableau = new Tableau();
        this.stock = new Stock();
        this.stackElement = [
            document.getElementById("stack-1"),
            document.getElementById("stack-2"),
            document.getElementById("stack-3"),
            document.getElementById("stack-4")
        ];
        this.stockElement = document.getElementById("stockpile");
        document.getElementById("newgame-btn").addEventListener("click", () => this.newGame());
        this.stockElement.addEventListener("click", () => this.deal());
        this.newGame();
    }

    newGame() {
        this.deck = new Deck();
        this.tableau.clear();
        this.stock.setCards([]);
        for (let i = 0; i < 4; i++) {
            const card = this.deck.drawCard();
            if (card) {
                // Ensure card is face up
                while (!card.getVisible()) card.flip();
                this.tableau.addCardToStack(i, card);
            }
        }
        const remaining = [];
        while (!this.deck.isEmpty()) {
            const card = this.deck.drawCard();
            // Ensure card is face down
            while (card.getVisible()) card.flip();
            remaining.push(card);
        }
        this.stock.setCards(remaining);
        this.render();
    }

    deal() {
        for (let i = 0; i < 4; i++) {
            if (!this.stock.isEmpty()) {
                const card = this.stock.dealOne();
                // Ensure card is face up
                while (!card.getVisible()) card.flip();
                this.tableau.addCardToStack(i, card);
            }
        }
        this.render();
    }

    render() {
        for (let i = 0; i < 4; i++) {
            const stackEl = this.stackElement[i];
            stackEl.innerHTML = "";
            const stack = this.tableau.getStack(i);
            stack.forEach((card, index) => {
                const cardEl = document.createElement("img");
                if (card.getVisible()) {
                    cardEl.src = `assets/${card.getRank()}${card.getSuit()}.png`;
                } else {
                    cardEl.src = "assets/cardBackRed.png";
                }
                cardEl.classList.add("card");
                cardEl.style.top = `${index * 28}px`;
                cardEl.style.zIndex = index;
                stackEl.appendChild(cardEl);
            });
        }
        // Render stockpile as a card back if not empty, otherwise show 'Empty'
        this.stockElement.innerHTML = "";
        if (!this.stock.isEmpty()) {
            const stockImg = document.createElement("img");
            stockImg.src = "assets/cardBackRed.png";
            stockImg.alt = "Stockpile";
            this.stockElement.classList.remove("empty");
            this.stockElement.appendChild(stockImg);
        } else {
            this.stockElement.classList.add("empty");
            this.stockElement.textContent = "Empty";
        }
    }
}

// --- Initialise the game when the page loads ---
window.addEventListener("DOMContentLoaded", () => {
    const game = new Game();
});
