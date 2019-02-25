// used to fetch proxy list from pubproxy api
// I gave up on proxy stuff after a while
// spanishdict uses sophos web protection, which detects a lot of proxies
// also brought up new issues like much slower load times

const request = require('request').defaults({ json: true });
const queryString = require('query-string');

const { promisify } = require('util');

const requestPromise = promisify(request);

const pubProxyApiPrefix = 'http://pubproxy.com/api/proxy';

// if true, it won't make requests to pub proxy api
// and will just use ones in memory
// set to false to force to fetch new ones from api
const useCachedProxies = true;

const pubProxyOptions = {
	limit: 20,
	format: 'json',
	http: true,
	country: 'US',
	type: 'http',
	https: true,
	level: 'elite',
	speed: 5,
};

// these are cached to avoid rate-limiting from pub proxy api
const cachedProxies = [
	'197.188.222.163:61636',
	'195.55.108.26:3128',
	'88.135.83.99:8080',
	'118.175.195.150:35235',
	'94.187.61.154:8080',
	'67.60.137.219:35979',


	// '50.31.14.151:8128',
	// '50.31.14.142:8132',
	// '50.233.12.118:8080',
	// '165.138.46.24:8080',
	// '74.104.182.178:8080',
	// '64.8.171.140:3128',
	// '50.31.14.151:8151',
	// '50.31.14.151:8144',
	// '66.82.144.29:8080',
	// '64.33.161.46:8080',
	// '50.31.14.142:8154',
	// '198.97.37.89:8080',
	// '50.31.14.142:8130',
	// '50.31.14.151:8134',
	// '159.69.36.200:3128',
	// '52.56.127.240:8080',
	// '50.31.14.151:8121',
	// '50.31.14.142:8138',
	// '50.31.14.142:8131',
	// '50.224.173.179:8080',
];


const pubProxyApiUrl = `${pubProxyApiPrefix}?${queryString.stringify(pubProxyOptions)}`;

async function fetchProxies () {
	if (useCachedProxies) {
		return cachedProxies;
	}

	const proxyResponse = await requestPromise(pubProxyApiUrl);
	const proxies = proxyResponse.body.data.map(obj => obj.ipPort);

	return proxies;
}

module.exports = fetchProxies;
