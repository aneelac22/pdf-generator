import { Kafka, SASLOptions } from 'kafkajs';
import config from '../common/config';
import { apiLogger } from './logging';
import PdfCache from '../browser/helpers';
import { KafkaBroker } from 'app-common-js';
import * as fs from 'fs';

const kafkaSocketAddresses = (brokers: KafkaBroker[]) => {
  const socketAddresses: string[] = [];
  brokers.map((v: KafkaBroker) => {
    apiLogger.debug(v);
    socketAddresses.push(`${v.hostname}:${v.port}`);
  });
  return socketAddresses;
};

export const getKafkaSSL = (brokers: KafkaBroker[]) => {
  if (brokers[0].cacert) {
    return true;
  }
  return false;
};

// Insanity: https://github.com/tulios/kafkajs/issues/1314
export const getKafkaSASL = (brokers: KafkaBroker[]) => {
  const cfg = brokers[0];
  if (cfg.authtype !== undefined) {
    switch (cfg.sasl.saslMechanism) {
      case 'plain': {
        const sasl: SASLOptions = {
          username: cfg.sasl.username,
          password: cfg.sasl.password,
          mechanism: 'plain',
        };
        return sasl;
      }
      case 'SCRAM-SHA-256': {
        const sasl: SASLOptions = {
          username: cfg.sasl.username,
          password: cfg.sasl.password,
          mechanism: 'scram-sha-256',
        };
        return sasl;
      }
      case 'SCRAM-SHA-512': {
        const sasl: SASLOptions = {
          username: cfg.sasl.username,
          password: cfg.sasl.password,
          mechanism: 'scram-sha-512',
        };
        return sasl;
      }
    }
  }

  return undefined;
};

const KafkaClient = () => {
  const brokers = config?.kafka.brokers;
  const sasl = getKafkaSASL(brokers);
  const ssl = getKafkaSSL(brokers);
  if (ssl && sasl) {
    apiLogger.debug('sasl');
    return new Kafka({
      clientId: 'crc-pdf-gen',
      brokers: kafkaSocketAddresses(brokers),
      ssl: {
        ca: [fs.readFileSync('/tmp/kafkaca')],
      },
      sasl: sasl,
    });
  }
  apiLogger.debug('no ssl');
  return new Kafka({
    clientId: 'crc-pdf-gen',
    brokers: kafkaSocketAddresses(brokers),
    ssl: false,
  });
};

const pdfCache = PdfCache.getInstance();

export async function produceMessage(topic: string, message: unknown) {
  const kafka = KafkaClient();
  const producer = kafka.producer();

  await producer.connect();
  await producer.send({
    topic: topic,
    messages: [{ value: JSON.stringify(message) }],
  });

  await producer.disconnect();
}
export async function consumeMessages(topic: string) {
  const kafka = KafkaClient();
  const consumer = kafka.consumer({ groupId: 'test-group' });

  await consumer.connect();
  await consumer.subscribe({ topic: topic, fromBeginning: true });

  await consumer.run({
    // ESlint is upset here but it has to be async due to kafkajs
    // eslint-disable-next-line @typescript-eslint/require-await
    eachMessage: async ({ message }) => {
      apiLogger.debug({
        value: message.value,
      });
      const cacheObject = JSON.parse(message.value?.toString() as string);
      pdfCache.setItem(cacheObject?.id, {
        status: cacheObject.status,
        filepath: cacheObject.filepath,
      });
    },
  });
}
