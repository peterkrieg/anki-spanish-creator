
// used to scrape some words off of memrise deck
// this is just a one-time script that shouldn't be needed again
const Browser = require('../class/Browser');
const fs = require('fs');

const browser = new Browser();

const urlBase = 'https://www.memrise.com/course/203799/5000-most-frequent-spanish-words/';
let startIndex = 1;
const numPages = 50; // num pages of memrise deck.  50 pages of 100 words, 5000 words total

const allWords = [];

(async () => {
	await browser.init();


	for (let i = startIndex; i <= 50; i++) {
		console.time(`fetching batch ${i}`)
		const words = await fetchBatch(i);
		console.timeEnd(`fetching batch ${i}`)


		allWords.push(...words);
	}

	// at this point, allWords is populated with all data we want
	console.log(`finished fetching ${allWords.length} words total`);
	fs.writeFileSync('./words.json', JSON.stringify(allWords));
})()

async function fetchBatch(batchIndex) {
	const url = urlBase + batchIndex;

	await browser.page.goto(url, { waitUntil: 'load', timeout: 0 });

	const words = await browser.page.evaluate((batchIndex) => {
		return Array.from(document.querySelectorAll('.things .thing')).map((columnNode, nodeIndex) => {
				const spanishWord = columnNode.querySelector('.col_a').innerText
				const englishWord = columnNode.querySelector('.col_b').innerText

				// const num = (batchIndex > 1 ? batchIndex * 100 : 0) + nodeIndex + 1;

				// num 1-5000 for frequency of word
				const num = (batchIndex - 1) * 100 + nodeIndex + 1;

				return {
					english: englishWord, spanish: spanishWord, spanishProunciationWord: spanishWord, num
				};
			});
	}, batchIndex);
	return words;
}