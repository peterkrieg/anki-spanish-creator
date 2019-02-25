/*
  Is responsible for very first step of fetching words from CSV
  and sending to rabbitmq queue "word-pairs"
*/
const fs = require('fs');
const { promisify } = require('util');

const [readFile, writeFile] = [fs.readFile, fs.writeFile].map(promisify);

const publisherClass = require('./class/Publisher');

const Publisher = new publisherClass();
const wordPairQueueName = 'word-pairs';

async function fetchWords () {
	try {
		const file = await readFile('./words.csv', { encoding: 'utf8' });
		const lines = file.split('\n').filter(filterCsvLine)
			// .slice(0, 100);

		const words = lines.map(line => {
			const lineSplit = line.split(',').map(str => str.trim());

			return { englishWord: lineSplit[0], spanishWord: lineSplit[1] };
		});
		return words;
	}
	catch (err) {
		throw new Error(`error fetching words: ${err}`);
	}

	// only return lines that don't start with comment ("//"), or aren't empty
	function filterCsvLine (line) {
		return !line.trim().startsWith('//') && line.trim();
	}
}


async function init () {
	await Publisher.init();
}

// MAIN SCRIPT
(async () => {
	// establish connections to RMQs, etc
	await init();

	const pairs = await fetchWords();

	pairs.forEach(pair => {
		Publisher.sendToQueue(wordPairQueueName, pair);
	});
	console.log(`${pairs.length} words sent to queue!`);

	await Publisher.closeConnection();
})();
