class Card {
	#suit
	#rank
	#value
	#faceUp
	#color
	
	constructor(suit, rank, vis=false) {
		/*Create an object of class Card; provide suit, rank, [visible]*/
		this.#suit = suit;
		this.#rank = rank;
		this.#faceUp = vis;
		this.#setColor(); 
		
		switch(this.#rank) {
			case 'J':
				this.#value = 11;
				break;
			case 'Q':
				this.#value = 12;
				break;
			case 'K':
				this.#value = 13;
				break;
			case 'A':
				this.#value = 14;
				break;
			default:
				this.#value = parseInt(this.#rank);
		}
	}

	#setColor() {
		if (this.#suit[0] == "H" || this.#suit[0] == "D") {
			this.#color = "red";
		}
		else {
			this.#color = "black";
		}
	}

	flip() {
		/*Inverts the card's visibility*/
		this.#faceUp = !this.#faceUp;
	}

	getVisible() {
		/*Returns a Boolean; True if the card face is visible*/
		return this.#faceUp;
	}
	getValue() {
		/*Returns the card's equivalent integer value; Ace is 14*/
		return this.#value;
	}

	getRank() {
		/*Returns the card's rank*/
		return this.#rank;
	}
	
	getSuit() {
		/*Returns the card's suit*/
		return this.#suit;
	}

	getColor() {
		/*Returns the card's color*/
		return this.#color;
	}

	getImageRef() {
		/*Returns a string containing a local filename for the card*/
		return `${this.#rank + this.#suit}.png`;
	}
}
