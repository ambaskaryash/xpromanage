const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-zip-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, documents, and archives are allowed.'), false);
    }
};

// Multer configuration for memory storage (will upload to S3)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// Upload file to S3
const uploadToS3 = async (file, folder = 'attachments') => {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private' // Files are private by default
    };

    try {
        const result = await s3.upload(params).promise();
        return {
            url: result.Location,
            key: result.Key,
            bucket: result.Bucket
        };
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw new Error('Failed to upload file to S3');
    }
};

// Delete file from S3
const deleteFromS3 = async (key) => {
    // Security: Validate the key to prevent path traversal attacks
    if (!key || typeof key !== 'string') {
        throw new Error('Invalid file key');
    }

    // Prevent path traversal attempts
    if (key.includes('..') || key.includes('//') || key.startsWith('/')) {
        throw new Error('Invalid file key: path traversal detected');
    }

    // Ensure the key matches expected pattern (folder/uuid.extension)
    const validKeyPattern = /^[a-zA-Z0-9_-]+\/[a-f0-9-]+\.[a-zA-Z0-9]+$/;
    if (!validKeyPattern.test(key)) {
        throw new Error('Invalid file key format');
    }

    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
    };

    try {
        await s3.deleteObject(params).promise();
        return true;
    } catch (error) {
        console.error('S3 Delete Error:', error);
        throw new Error('Failed to delete file from S3');
    }
};

// Get signed URL for private file access
const getSignedUrl = (key, expiresIn = 3600) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: expiresIn // URL expires in 1 hour by default
    };

    return s3.getSignedUrl('getObject', params);
};

// Get presigned URL for direct upload from client
const getPresignedUploadUrl = (fileName, fileType, folder = 'attachments') => {
    const fileExtension = path.extname(fileName);
    const key = `${folder}/${uuidv4()}${fileExtension}`;

    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: 300, // URL expires in 5 minutes
        ContentType: fileType,
        ACL: 'private'
    };

    const uploadUrl = s3.getSignedUrl('putObject', params);

    return {
        uploadUrl,
        key,
        url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
    };
};

module.exports = {
    upload,
    uploadToS3,
    deleteFromS3,
    getSignedUrl,
    getPresignedUploadUrl,
    s3
};
