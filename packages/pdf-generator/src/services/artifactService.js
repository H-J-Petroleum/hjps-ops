const fs = require('fs');
const path = require('path');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');
const ConfigManager = require('./configManager');

class ArtifactService {
  constructor() {
    this.configManager = new ConfigManager();
    this.storageConfig = this.configManager.getStorageConfig();
    this.provider = this.storageConfig.provider;
    if (this.provider === 's3') {
      const params = {
        region: this.storageConfig.region,
        forcePathStyle: this.storageConfig.forcePathStyle
      };
      if (this.storageConfig.endpoint) params.endpoint = this.storageConfig.endpoint;
      if (this.storageConfig.accessKeyId && this.storageConfig.secretAccessKey) {
        params.credentials = {
          accessKeyId: this.storageConfig.accessKeyId,
          secretAccessKey: this.storageConfig.secretAccessKey
        };
      }
      this.s3 = new S3Client(params);
    }
  }

  async uploadPDF({ buffer, approvalId, pdfType }) {
    const baseName = `field-tickets/${approvalId || 'unknown'}/${Date.now()}-${pdfType || 'ticket'}.pdf`;
    if (this.provider === 's3') {
      return this.uploadToS3(buffer, baseName);
    }
    return this.saveLocal(buffer, baseName);
  }

  async uploadToS3(buffer, key) {
    if (!this.storageConfig.bucket) throw new Error('S3 bucket not configured');
    await this.s3.send(new PutObjectCommand({
      Bucket: this.storageConfig.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf'
    }));
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.storageConfig.bucket, Key: key }),
      { expiresIn: this.storageConfig.presignExpirySeconds }
    );
    logger.info('Uploaded PDF to S3', { key });
    return { provider: 's3', key, url };
  }

  async saveLocal(buffer, key) {
    const filePath = path.join(process.cwd(), this.storageConfig.localDir, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    // Served by express static under /files
    const urlPath = `/files/${key}`.replace(/\\/g, '/');
    logger.info('Saved PDF locally', { filePath });
    return { provider: 'local', key, url: urlPath };
  }
}

module.exports = ArtifactService;

