import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaFile, FaTimes, FaSpinner } from 'react-icons/fa';
import { tasksAPI } from '../services/api';
import { toast } from 'react-toastify';

const FileUpload = ({ taskId, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB limit');
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            await tasksAPI.uploadAttachment(taskId, file);
            toast.success('File uploaded successfully');
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }, [taskId, onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false
    });

    return (
        <div className="file-upload-container">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center justify-center text-primary">
                        <FaSpinner className="animate-spin text-2xl mb-2" />
                        <span className="text-sm font-medium">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                        <FaCloudUploadAlt className="text-3xl mb-2" />
                        <span className="text-sm">
                            {isDragActive ? 'Drop file here' : 'Drag & drop file or click to browse'}
                        </span>
                        <span className="text-xs mt-1 text-gray-400">Max size: 10MB</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
