module.exports = {
  provider: process.env.HJ_STORAGE_PROVIDER || 'hubspot', // 'hubspot' | 's3' | 'local'
  bucket: process.env.HJ_ARTIFACTS_BUCKET || process.env.S3_BUCKET,
  region: process.env.HJ_S3_REGION || process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.HJ_S3_ENDPOINT || process.env.S3_ENDPOINT, // for MinIO
  accessKeyId: process.env.HJ_S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.HJ_S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY,
  forcePathStyle: (process.env.HJ_S3_FORCE_PATH_STYLE || 'true').toLowerCase() === 'true',
  presignExpirySeconds: parseInt(process.env.HJ_PRESIGN_EXPIRY_SECONDS || '604800', 10), // 7 days
  localDir: process.env.HJ_LOCAL_ARTIFACT_DIR || 'data/artifacts'
};
