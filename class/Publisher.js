// publishes to RMQ queue
const amqplib = require('amqplib');
const uuidv1 = require('uuid/v1');

class Publisher {
	constructor () {
		let connection;
		let channel;
	}

	async init () {
		try {
			this.connection = await amqplib.connect('amqp://localhost');
			this.channel = await this.connection.createChannel();
		} catch(err) {
			console.log('error initializing rmq publisher', err);
		}
	}

	// receives message, converts it to string
	async sendToQueue (queueName, message) {
		// looks like RMQ has no concept of response for publishing
		const bufferMessage = Buffer.from(JSON.stringify({ message, id: uuidv1() }));
		this.channel.sendToQueue(queueName, bufferMessage);
	}

	async closeConnection () {
		// waiting for channel to close first will make sure there are no messages in process of sending
		await this.channel.close();
		await this.connection.close();
	}
}

module.exports = Publisher;
