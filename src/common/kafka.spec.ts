import config from './config';
import { getKafkaSASL, getKafkaSSL } from './kafka';
import { SASLOptions } from 'kafkajs';

describe('stage config', () => {
  it('should have ssl and ca configs', () => {
    const brokers = config?.kafka.brokers;
    expect(brokers[0].securityProtocol).toContain('SSL');
    const ssl = getKafkaSSL(brokers);
    expect(ssl).toBe(true);
    const saslOpts = getKafkaSASL(brokers);
    const sasl: SASLOptions = {
      username: brokers[0].sasl.username,
      password: brokers[0].sasl.password,
      mechanism: 'scram-sha-512',
    };
    expect(saslOpts).toEqual(sasl);
  });
});
