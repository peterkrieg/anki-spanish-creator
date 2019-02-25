// reads from "word-sentences" rmq and creates anki card for each pair of words

const request = require('request').defaults({ json: true });

const queueName = 'word-sentences';
const ConsumerClass = require('./class/Consumer');

const consumer = new ConsumerClass(queueName);

const { promisify } = require('util');

const requestPromise = promisify(request);

const numPrefetch = 1;
let channel;

// constants which will be put into config / env variables or something later
const ankiConnectConfig = {
	deckName: 'Spanish Nouns',
	modelName: 'Basic (and reversed card) - spanish',
	url: 'http://localhost:8765',
};

const spanishDictConfig = {
	key: '494e1f0d93abd4cffaa8d5781d05dd9c',
	urlPrefix: 'https://audio1.spanishdict.com/audio',
	// lang can be 'es' for spain pronunciation, or 'latam' or latin america pronunciation
	lang: 'es',
};


(async () => {
	channel = await consumer.initChannel(numPrefetch);
	console.log('finished init consumer channel.');
	channel.consume(queueName, handleMessage);
})();

async function handleMessage (message) {
	console.log('message received');
	try {
		const messageBody = JSON.parse(message.content.toString()).message;

		const ankiBody = createAnkiBody(messageBody);

		const requestOptions = { json: true, uri: ankiConnectConfig.url, body: ankiBody };
		const resp = await requestPromise(requestOptions);
		console.log('created card for', messageBody.spanishWord);
		channel.ack(message);
	}
	catch (err) {
		console.log('ERROR', err);
	}
}


function createAnkiBody (message) {
	const { englishWord, spanishWord, sentences } = message;
	const spanishDictAudioUrl = `${spanishDictConfig.urlPrefix}?lang=${spanishDictConfig.lang}&text=${encodeURI(spanishWord)}&key=${spanishDictConfig.key}`;

	// replaces words of spanish word with underscore ("el nino" => "el_nino")
	const audioFileName = `${spanishWord.replace(/\ /g, '_')}.mp3`;

	function createSentenceFields (sents) {
		const fields = {};

		sents.forEach((sentence, index) => {
			fields[`spanishSentence${index + 1}`] = sentence.spanishSentence;
			fields[`englishSentence${index + 1}`] = sentence.englishSentence;
		});

		return fields;
	}
	const sentenceFields = createSentenceFields(sentences);


	const ankiConnectBody = {
		action: 'addNote',
		version: 6,
		params: {
			note: {
				deckName: ankiConnectConfig.deckName,
				modelName: ankiConnectConfig.modelName,
				fields: {
					Front: spanishWord,
					Back: englishWord,
					...sentenceFields,
				},
				options: {
					allowDuplicate: false,
				},
				tags: [],
				audio: {
					url: spanishDictAudioUrl,
					filename: audioFileName,
					fields: ['Front'],
				},
			},
		},
	};

	return ankiConnectBody;
}


