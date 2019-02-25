// class for RMQ consumer

const amqplib = require('amqplib');

class Consumer {
	constructor (queueName) {
		this.queueName = queueName;
	}

	// prefetch should be set to 1 usually
	async initChannel (numPrefetch = 1) {
		const connection = await amqplib.connect('amqp://localhost');

		 const channel = await connection.createChannel();
		 await channel.prefetch(numPrefetch);

		await channel.assertQueue(this.queueName);
		return channel;
	}
}

module.exports = Consumer;
