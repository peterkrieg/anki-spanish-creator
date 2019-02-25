/* eslint-disable import/newline-after-import */

/*
	fetches sentences for word-pairs by running headless browser
	publishes to "word-sentences" rmq when finished
*/

const wordPairQueueName = 'word-pairs';
const sentenceQueueName = 'word-sentences';

const cluster = require('cluster');
const ConsumerClass = require('./class/Consumer');
const consumer = new ConsumerClass(wordPairQueueName);
const BrowserClass = require('./class/Browser');
const fetchProxies = require('./fetchProxies');
const PublisherClass = require('./class/Publisher');
const publisher = new PublisherClass();

// temporarily set to 1 for testing
const numCPUs = 3;
const numPrefetch = 1;

(async () => {
	const proxies = await fetchProxies();

	if (cluster.isMaster) {
		console.log(`Master ${process.pid} is running`);

		// Fork workers.
		for (let i = 0; i < numCPUs; i++) {
			const worker = cluster.fork();
			worker.on('disconnect', () => console.log('worker disconnected'));

			const numProxies = proxies.length;

			const proxyIndex = i < numProxies ? i : i % numProxies;
			const proxy = proxies[proxyIndex];
			console.log(proxy);

			worker.send({ proxy });
		}

		cluster.on('exit', (worker, code, signal) => {
			console.log(`worker ${worker.process.pid} died`);
		});
	}
	else {
		process.on('message', workerProcess);
	}
})();


// takes in initMessage of { proxy: '182.52.51.5:59259' }
async function workerProcess (initMessage) {
	console.log('worker process');
	const { proxy } = initMessage;

	const browser = new BrowserClass(proxy);

	console.log(`Worker ${process.pid} started`);

	process.on('error', err => {
		console.log('ERROR', err);
	});

	const channel = await consumer.initChannel(numPrefetch);
	await browser.init();
	await publisher.init();

	console.log('established channel and browser for process id:', process.pid);

	const processId = process.pid;

	channel.consume(wordPairQueueName, msg => {
		handleMessage(msg, processId);
	});

	// receives message which is english/spanish word
	async function handleMessage (message, id) {
		console.log('handle message');
		const pair = JSON.parse(message.content.toString()).message;

		const wordForUrl = pair.spanishPronunciationWord;
		const url = `https://www.spanishdict.com/examples/${encodeURI(wordForUrl)}`;

		const sentences = await browser.fetchSentences(url);

		const sentenceMessage = { ...pair, sentences };
		console.log(sentenceMessage);

		// send to sentences queue
		publisher.sendToQueue(sentenceQueueName, sentenceMessage);

		channel.ack(message);
	}

	function wait (msToWait) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, msToWait);
		});
	}
}


