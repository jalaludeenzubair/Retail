import amqp, { Channel, ChannelModel } from "amqplib";
export class Producer {
  private static instance: Producer | null = null;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor() {
    if (Producer.instance) {
      throw new Error("Producer is already initialized");
    }
    Producer.instance = this;
  }

  static getInstance() {
    if (Producer.instance) {
      Producer.instance = new Producer();
    }

    return Producer.instance;
  }
  private async connect() {
    if (this.channel) return;

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
  }

  public async sendMessage<T>(queueName: string, data: T) {
    await this.connect();

    if (!this.channel) {
      throw new Error("Channel not found");
    }

    await this.channel.assertQueue(queueName, {
      durable: true,
    });

    const payload = Buffer.from(JSON.stringify(data));

    this.channel.sendToQueue(queueName, payload, {
      persistent: true,
    });
  }
  public async close() {
    await this.connection?.close();
    await this.channel?.close();

    this.connection = null;
    this.channel = null;
  }
}
