import amqp, { Channel, ChannelModel } from "amqplib";

export class Consumer {
  private static instance: Consumer | null = null;
  private channel: Channel | null = null;
  private connection: ChannelModel | null = null;
  constructor() {
    if (Consumer.instance) {
      throw new Error("Consumer is already initialized");
    }
    Consumer.instance = this;
  }
  static getInstance() {
    if (!Consumer.instance) {
      Consumer.instance = new Consumer();
    }
    return Consumer.instance;
  }
  private async connect() {
    if (this.channel) return this.channel;
    const url = process.env.RABBITMQ_URL ?? "amqp://user:root@localhost:5672";
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    this.connection.on("close", () => {
      this.channel = null;
      this.connection = null;
      console.error("RabbitMQ connection closed");
    });

    this.connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
    });
    return this.channel;
  }
  public async consume(queueName: string, registry: Record<string, Function>) {
    const channel = await this.connect();

    if (!channel) {
      throw new Error("Channel not found");
    }

    await channel.assertQueue(queueName, { durable: true });
    console.log(
      `[CONSUMER] Waiting for messages in queue: ${queueName}. To exit, press Ctrl+C`,
    );

    channel.consume(
      queueName,
      (msg) => {
        if (msg !== null) {
          const messageContent = JSON.parse(msg.content.toString());
          console.log("[CONSUMER] Received message:", messageContent);

          const callback = registry[messageContent.type];

          if (!callback) {
            console.log(
              `[CONSUMER] No callback found for message type: ${messageContent.type}`,
            );
            return;
          }

          callback(messageContent);

          channel.ack(msg);
        }
      },
      {
        noAck: false,
      },
    );
  }
}
