class Deck {
	#deck
	
	constructor() {
		/*Initialises a new shuffled deck of 52 cards*/
		this.#deck = [];
		this.createDeck();
		this.shuffle();
	}

	createDeck() {
		/*Creates an array of 52 Card objects*/
		const suits = ['H', 'S', 'C', 'D'];
		const faces = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 13; j++) {
				this.#deck.push(new Card(suits[i], faces[j]));
			}
		}
	}

	shuffle() {
		/*Randomly shuffles the deck*/
		for (let i = this.getSize() - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			var temp = this.#deck[i];
			this.#deck[i] = this.#deck[j];
			this.#deck[j] = temp;
		}
	}

	getSize() {
		/*Returns the number of elements in the deck*/
		return this.#deck.length;
	}

	isEmpty() {
		/*Returns a Boolean; True if the deck is currently empty*/
		return this.getSize() < 1;
	}

	viewTop() {
		/*Returns the topmost card without removing it from the deck, or null if the deck is empty*/
		if (!this.isEmpty()) {
			return this.#deck[this.getSize() - 1]
		}
		else {
			return null;
		}
	}

	drawCard() {
		/*Returns the topmost card in the deck, or null if the deck is empty*/
		if (!this.isEmpty()) {
			return this.#deck.pop();
		}
		else {
			return null;
		}
	}

	addCardToTop(card) {
		// adds the card to the top of the deck
		this.#deck.push(card);
	}
}