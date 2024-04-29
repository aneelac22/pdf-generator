import fse from 'fs-extra';
import { sanitizeFilepath } from '../browser/helpers';
import { CacheKey } from '../common/types';
import crypto from 'crypto';
import { apiLogger } from '../common/logging';

// 10 minutes cache
const CACHE_TIMEOUT = 10 * 60 * 1000;

export type ReportStorage = {
  [reportHash: string]: {
    filename: string;
    expiration: number;
  };
};

export class ReportCache {
  /**
   * Handles the caching mechanisms for PDFs.
   */
  cache: ReportStorage;

  constructor() {
    this.cache = {};
  }

  /**
   * Create a SHA1 hash of the template to condense entry sizes
   */
  createCacheKey(cacheKeyObject: CacheKey) {
    apiLogger.debug(`Request to hash : ${JSON.stringify(cacheKeyObject)}`);
    try {
      return crypto
        .createHash('sha1')
        .update(JSON.stringify(cacheKeyObject))
        .digest('hex');
    } catch (error) {
      throw new Error(
        `Unable to create cache key for ${JSON.stringify(
          cacheKeyObject
        )}! ${error}`
      );
    }
  }

  /**
   * Remove items from the report cache after a CACHE_TIMEOUT period
   */
  cleanStaleCache(hash: string, fileName: string) {
    setTimeout(() => {
      apiLogger.debug('Calling clean stale cache for: ', fileName);
      delete this.cache[hash];
      fse.unlink(sanitizeFilepath(fileName), (err) => {
        if (err) {
          apiLogger.warning(`Failed to unlink ${fileName}: ${err}`);
        }
      });
    }, CACHE_TIMEOUT);
  }

  /**
   *  Search the cache for a matching key and return it if found.
   *  An expired entry that is found will be removed and will need to be regenerated.
   */
  fetch(hash: string) {
    const entry = this.cache[hash];
    if (!entry) {
      apiLogger.debug(`No such entry ${hash} in cache`);
      return;
    }
    const fileName = entry.filename;
    // do not return if file does not exist
    if (!fse.existsSync(fileName)) {
      return;
    }
    if (entry.expiration < Date.now()) {
      delete this.cache[hash];
      fse.unlink(sanitizeFilepath(fileName), (err) => {
        if (err) {
          apiLogger.warning(`Failed to unlink ${fileName}: ${err}`);
        }
      });
      return;
    }

    return entry.filename;
  }

  /**
   *  Add the hash as a key to the report cache with a file location and expiration timestamp
   */
  fill(hash: string, filename: string) {
    const entry = this.cache[hash];
    if (entry) {
      apiLogger.debug(`found ${entry} in cache`);
      return;
    }

    // add 10 minutes cache expiration
    const expiration = new Date(Date.now() + CACHE_TIMEOUT);
    this.cache[hash] = {
      expiration: expiration.getTime(),
      filename,
    };
    apiLogger.debug(`Added ${hash} to cache`);
    apiLogger.debug(
      `Current cache state ${JSON.stringify(this.cache, null, 2)}`
    );
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.cleanStaleCache(hash, filename);
  }
}
