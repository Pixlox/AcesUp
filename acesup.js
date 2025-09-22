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

    clear() {
        this.stacks.forEach(stack => stack.length = 0);
    }
}

class Game {
    constructor() {
        this.deck = new Deck();
        this.tableau = new Tableau();
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

        // Deal initial 4 cards to tableau (face up)
        for (let i = 0; i < 4; i++) {
            const card = this.deck.drawCard();
            if (card) {
                this.ensureCardFaceUp(card);
                this.tableau.addCardToStack(i, card);
            }
        }

        // Remaining 48 cards stay in deck as stock (face down)
        this.render();
    }

    deal() {
        // Deal 4 cards from main deck (one to each stack)
        for (let i = 0; i < 4; i++) {
            if (!this.deck.isEmpty()) {
                const card = this.deck.drawCard();
                this.ensureCardFaceUp(card);
                this.tableau.addCardToStack(i, card);
            }
        }
        this.render();
    }

    ensureCardFaceUp(card) {
        if (!card.getVisible()) card.flip();
    }

    ensureCardFaceDown(card) {
        if (card.getVisible()) card.flip();
    }
    
    
    render() {
        // Render tableau stacks
        for (let i = 0; i < 4; i++) {
            const stackElement = this.stackElement[i];
            stackElement.innerHTML = "";
            const stack = this.tableau.getStack(i);

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
                stackElement.appendChild(cardElement);
            });
        }

        // Render stockpile
        this.stockElement.innerHTML = "";
        if (!this.deck.isEmpty()) {
            const stockImg = document.createElement("img");
            stockImg.src = "assets/cardBackRed.png";
            this.stockElement.classList.remove("empty");
            this.stockElement.appendChild(stockImg);
        } else {
            this.stockElement.classList.add("empty");
            this.stockElement.textContent = "Empty";
        }
    }p
}

window.addEventListener("DOMContentLoaded", () => {
    const game = new Game();
});


