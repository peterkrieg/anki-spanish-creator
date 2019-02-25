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

const filePath = process.argv[2];

if (!filePath) throw new Error('must specify file path to find csv of words');

async function fetchWords () {
	try {
		const file = await readFile(filePath, { encoding: 'utf8' });
		const lines = file.split('\n').filter(filterCsvLine);

		// sometimes translations can have multiple spanish words as meanings
		// but there can only be one for prounciation
		// syntax of csv allows for >> to denote this
		// for example, mustache, el bigote / mostacho >> mostacho
		const words = lines.map(line => {
			let spanishPronunciationWord;
			let lineSplit = line.split(',').map(str => str.trim());

			if (line.includes('>>')) {
				spanishPronunciationWord = line.split('>>')[1].trim();
				lineSplit[1] = lineSplit[1].split('>>')[0].trim();
			}
			else {
				// sometimes, spanish translation should be taken as whole fragment
				// example: cuerpo humano
				// otherwise, takes last word, like "nino" from "el nino"
				const shouldTakeWholeFragment = lineSplit[1].includes('<') && lineSplit[1].includes('>');

				spanishPronunciationWord = shouldTakeWholeFragment
					? (lineSplit[1].split('<')[1].split('>')[0])
					: (lineSplit[1].split(' ').reduce((a, b, c, arr) => arr[arr.length - 1]));
			}

			return {
				english: lineSplit[0],
				spanish: lineSplit[1].replace(/[<>]/g, ''),
				spanishPronunciationWord: spanishPronunciationWord.trim()
			};
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
	try {
	// establish connections to RMQs, etc
		await init();

		const pairs = await fetchWords();
		console.log(pairs);

		pairs.forEach(pair => {
			Publisher.sendToQueue(wordPairQueueName, pair);
		});
		console.log(`${pairs.length} words sent to queue!`);

		await Publisher.closeConnection();
	}
	catch (err) {
		console.log('error sending words to queue', err);
	}
})();
