import * as Minio from 'minio';
import { apiLogger } from './logging';
import config from './config';

export const MinioClient = () => {
  if (config?.objectStore.tls) {
    apiLogger.debug('s3 config');
    return new Minio.Client({
      endPoint: config?.objectStore.buckets[0].endpoint,
      accessKey: config?.objectStore.buckets[0].accessKey,
      secretKey: config?.objectStore.buckets[0].secretKey,
    });
  }
  apiLogger.debug('minio config');
  return new Minio.Client({
    endPoint: config?.objectStore.buckets[0].endpoint,
    port: config?.objectStore.port,
    useSSL: config?.objectStore.tls,
    accessKey: config?.objectStore.buckets[0].accessKey,
    secretKey: config?.objectStore.buckets[0].secretKey,
  });
};

export const uploadPDF = async (id: string, path: string) => {
  const bucket = config?.objectStore.buckets[0].name;
  apiLogger.debug(`${JSON.stringify(config?.objectStore)}`);
  const mc = MinioClient();
  apiLogger.debug(mc);
  try {
    const exists = await mc.bucketExists(bucket);
    if (!exists) {
      apiLogger.debug('Creating a new bucket');
      await mc.makeBucket(bucket, 'us-east-1');
    }
    const metadata = {
      'Content-Type': 'application/pdf',
    };
    await mc.fPutObject(bucket, `${id}.pdf`, path, metadata);
    apiLogger.debug(`PDF uploaded to ${bucket} as ${id}.pdf`);
  } catch (error: unknown) {
    apiLogger.debug(`${error}`);
  }
};

export const downloadPDF = async (id: string) => {
  const bucket = config?.objectStore.buckets[0].name;
  const mc = MinioClient();
  apiLogger.debug(mc);
  try {
    const stream = await mc.getObject(bucket, `${id}.pdf`);
    apiLogger.debug(`PDF found downloading as ${id}.pdf`);
    return stream;
  } catch (error: unknown) {
    apiLogger.debug(`${error}`);
  }
};
