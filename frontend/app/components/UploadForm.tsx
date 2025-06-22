'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface UploadFormProps {
  onUploadSuccess?: (data: any) => void;
}

interface UploadResult {
  success: boolean;
  document_id?: string;
  filename?: string;
  chunks_created?: number;
  message?: string;
  error?: string;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [filename, setFilename] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);      const response = await axios.post('http://localhost:8000/api/v1/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Automatically generate embeddings for the uploaded document
      if (response.data.document_id) {
        try {
          await axios.post('http://localhost:8000/api/v1/embed/', {
            document_id: response.data.document_id,
            force_reembed: false
          });
        } catch (embedError) {
          console.warn('Failed to generate embeddings:', embedError);
        }
      }

      const uploadResult: UploadResult = {
        success: true,
        ...response.data,
      };

      setResult(uploadResult);
      onUploadSuccess?.(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Upload failed';
      setResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();      formData.append('text_content', textContent);
      formData.append('filename', filename || 'manual_entry.txt');      const response = await axios.post('http://localhost:8000/api/v1/upload/', formData);

      // Automatically generate embeddings for the uploaded document
      if (response.data.document_id) {
        try {
          await axios.post('http://localhost:8000/api/v1/embed/', {
            document_id: response.data.document_id,
            force_reembed: false
          });
        } catch (embedError) {
          console.warn('Failed to generate embeddings:', embedError);
        }
      }

      const uploadResult: UploadResult = {
        success: true,
        ...response.data,
      };

      setResult(uploadResult);
      setTextContent('');
      setFilename('');
      onUploadSuccess?.(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Upload failed';
      setResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-6">
      {/* File Upload */}      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Upload className="mr-2" size={20} />
          Upload Document
        </h3>
        
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Uploading and processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FileText className="text-gray-400 dark:text-gray-500 mb-2" size={32} />
              {isDragActive ? (
                <p className="text-blue-600 dark:text-blue-400">Drop the file here...</p>
              ) : (
                <div>                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag & drop a PDF or text file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Supported formats: PDF, TXT
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Text Input */}
      <div className="card">        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <FileText className="mr-2" size={20} />
          Or Enter Text Manually
        </h3>
        
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div>
            <label htmlFor="filename" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filename (optional)
            </label>
            <input
              id="filename"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="my-notes.txt"
              className="input-field"
              disabled={uploading}
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter your text content here..."
              rows={6}
              className="input-field resize-vertical"
              disabled={uploading}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={!textContent.trim() || uploading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2" size={16} />
                Upload Text
              </>
            )}
          </button>
        </form>
      </div>

      {/* Upload Result */}
      {result && (
        <div className={`card ${result.success ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-start">
            {result.success ? (
              <CheckCircle className="text-green-600 mt-0.5 mr-3" size={20} />
            ) : (
              <AlertCircle className="text-red-600 mt-0.5 mr-3" size={20} />
            )}
            
            <div className="flex-1">
              <h4 className={`font-medium ${result.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                {result.success ? 'Upload Successful!' : 'Upload Failed'}
              </h4>
              
              {result.success ? (                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p><strong>File:</strong> {result.filename}</p>
                  <p><strong>Document ID:</strong> {result.document_id}</p>
                  <p><strong>Chunks created:</strong> {result.chunks_created}</p>
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    Next step: Generate embeddings for this document to enable searching.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{result.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
