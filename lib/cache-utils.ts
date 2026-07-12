import crypto from 'crypto';

export function generateCacheKey(prefix: string, data: any): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  return `${prefix}:${hash}`;
}
