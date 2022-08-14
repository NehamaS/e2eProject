import { Kafka } from "kafkajs";

import { ValidateKafka } from "../common/sip/validators/kafka.validator";
import { Context } from "../common/context";
import { ControlSession, UserSession, KafkaEvent, KafkaMessageParams } from "../common/sip/dto/controlSession";
import { LOGGER } from "./logger.service";

const kafka = new Kafka({
	clientId: "my-app",
	brokers: ["10.106.9.232:9092"],
});

let consumer: any = {};
let producer: any = {};
let admin: any = {};

export class KafkaAction {
	constructor() {
		producer = kafka.producer();
		consumer = kafka.consumer({ groupId: "test-group" });
		admin = kafka.admin();
	}

	public async kafkaTopicDelete(topic: string): Promise<void> {
		await admin.deleteTopics({
			topics: [topic],
		});
	}

	public async kafkaConsumer(
		session: ControlSession | UserSession,
		event: KafkaEvent,
		context: Context
	): Promise<any> {
		const validateKafka = new ValidateKafka();

		try {
			await consumer.connect();
			await consumer.subscribe({ topic: session.meetingId, fromBeginning: true });
			let resolveOnConsumption: (message: any) => void;
			let rejectOnError: (e: Error) => void;

			const returnThisPromise = new Promise<any>((resolve, reject) => {
				resolveOnConsumption = resolve;
				rejectOnError = reject;
			}).finally(() => consumer.disconnect()); // disconnection is done here, reason why is explained below

			await consumer.run({
				eachMessage: async ({ message, partition, topic }) => {
					console.log({
						partition,
						offset: message.offset,
						value: message.value.toString(),
					});

					if (message.offset === event.offset) {
						await validateKafka.validateKafka(
							session,
							event.eventName,
							JSON.parse(message.value.toString()),
							context
						);
						await resolveOnConsumption(message);
					} else {
						const e = new Error("message offset was not found");
						await rejectOnError(e);
					}
				},
			});
			return returnThisPromise;
		} catch (e) {
			LOGGER.error({ test: context.currentTest, action: context.currentTest, err: e.message });
			console.assert(false, `[${context.currentTest}] kafkaConsumer, error: ${e.message}`);
			expect(e).handleException();
		}
	}

	public async kafkaProducer(
		topicName: string,
		session: ControlSession | UserSession,
		event: KafkaEvent,
		context: Context
	): Promise<void> {
		const validateKafka = new ValidateKafka();
		const value: KafkaMessageParams | undefined = await validateKafka.buildKafkaMessage(
			session,
			event.eventName,
			context
		);
		await producer.connect();
		await producer.send({
			topic: topicName,
			messages: [{ value: JSON.stringify(value) }],
		});
	}
}
