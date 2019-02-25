function wait (msToWait) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, msToWait);
	});
}

module.exports = { wait };
