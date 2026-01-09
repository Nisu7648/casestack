const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================
// FILE STORAGE SERVICE
// Supports both S3 (production) and Local (development)
// ============================================

class FileStorageService {
  constructor() {
    this.storageType = process.env.STORAGE_TYPE || 'local'; // 'local' or 's3'
    
    if (this.storageType === 's3') {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      this.bucketName = process.env.S3_BUCKET_NAME || 'casestack-files';
    } else {
      // Local storage
      this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  // Configure multer for file uploads
  getMulterConfig() {
    if (this.storageType === 's3') {
      // For S3, use memory storage (we'll upload to S3 manually)
      return multer({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 100 * 1024 * 1024 // 100MB limit
        },
        fileFilter: (req, file, cb) => {
          const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip'
          ];
          
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type. Only PDF, XLSX, DOCX, and ZIP allowed.'));
          }
        }
      });
    } else {
      // For local storage
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;
          cb(null, uniqueName);
        }
      });

      return multer({
        storage,
        limits: {
          fileSize: 100 * 1024 * 1024 // 100MB limit
        },
        fileFilter: (req, file, cb) => {
          const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip'
          ];
          
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type. Only PDF, XLSX, DOCX, and ZIP allowed.'));
          }
        }
      });
    }
  }

  // Upload file
  async uploadFile(file, firmId, caseId) {
    const fileHash = this.calculateFileHash(file.buffer || fs.readFileSync(file.path));
    const fileName = file.originalname;
    const fileSize = file.size;

    if (this.storageType === 's3') {
      // Upload to S3
      const key = `${firmId}/${caseId}/${Date.now()}-${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          firmId,
          caseId,
          originalName: fileName,
          fileHash
        }
      });

      await this.s3Client.send(command);

      return {
        storageUrl: `s3://${this.bucketName}/${key}`,
        storagePath: key,
        fileName,
        fileSize,
        fileHash
      };
    } else {
      // Local storage (file already saved by multer)
      return {
        storageUrl: `file://${file.path}`,
        storagePath: file.path,
        fileName,
        fileSize,
        fileHash
      };
    }
  }

  // Get download URL
  async getDownloadUrl(storagePath) {
    if (this.storageType === 's3') {
      // Generate presigned URL for S3
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
      return url;
    } else {
      // For local storage, return file path (will be served by Express)
      return `/files/${path.basename(storagePath)}`;
    }
  }

  // Download file stream
  async getFileStream(storagePath) {
    if (this.storageType === 's3') {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath
      });

      const response = await this.s3Client.send(command);
      return response.Body;
    } else {
      return fs.createReadStream(storagePath);
    }
  }

  // Calculate SHA-256 hash
  calculateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Delete file
  async deleteFile(storagePath) {
    if (this.storageType === 's3') {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storagePath
      });
      await this.s3Client.send(command);
    } else {
      if (fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
      }
    }
  }

  // Verify file integrity
  verifyFileIntegrity(file, expectedHash) {
    const actualHash = this.calculateFileHash(file.buffer || fs.readFileSync(file.path));
    return actualHash === expectedHash;
  }
}

module.exports = new FileStorageService();
