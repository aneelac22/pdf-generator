import WP from 'workerpool';
import { MaxWorkers } from '../browser/helpers';
import { apiLogger } from '../common/logging';

const createWorker = () => {
  apiLogger.debug(`New worker created`);
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const pool = WP.pool('./dist/puppeteerWorker.js', {
  maxWorkers: MaxWorkers,
  workerType: 'process',
  onCreateWorker: createWorker,
});

export default pool;
