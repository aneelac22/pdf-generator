import config from './config';
import { getKafkaSASL, getKafkaSSL } from './kafka';
import { SASLOptions } from 'kafkajs';
import * as fs from 'fs';

describe('stage', () => {
  it('should have ssl and ca configs', () => {
    const brokers = config?.kafka.brokers;
    const ssl = getKafkaSSL(brokers);
    expect(ssl).toBe(true);
    const saslOpts = getKafkaSASL(brokers);
    const sasl: SASLOptions = {
      username: brokers[0].sasl.username,
      password: brokers[0].sasl.password,
      mechanism: 'scram-sha-512',
    };
    expect(saslOpts).toEqual(sasl);
    expect(brokers[0].cacert).toEqual('ca');
    const cert = fs.readFileSync('/tmp/kafkaca', 'utf-8');
    expect(cert.toString()).toEqual('ca');
  });
});
