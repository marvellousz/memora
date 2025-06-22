'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calendar, Package, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

interface Document {
  document_id: string;
  filename: string;
  upload_timestamp: string;
  total_chunks: number;
  content_type: string;
}

interface DocumentDetails {
  document: {
    _id: string;
    filename: string;
    content_type: string;
    total_chunks: number;
    upload_timestamp: string;
    original_text: string;
    total_characters: number;
  };
  chunks: number;
  chunks_with_embeddings: number;
}

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [docDetails, setDocDetails] = useState<{ [key: string]: DocumentDetails }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/v1/documents/');
      setDocuments(response.data.documents || []);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentDetails = async (documentId: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/documents/${documentId}`);
      setDocDetails(prev => ({
        ...prev,
        [documentId]: response.data
      }));
    } catch (error: any) {
      console.error('Failed to fetch document details:', error);
    }
  };

  const toggleExpand = async (documentId: string) => {
    if (expandedDoc === documentId) {
      setExpandedDoc(null);
    } else {
      setExpandedDoc(documentId);
      if (!docDetails[documentId]) {
        await fetchDocumentDetails(documentId);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (characters: number) => {
    if (characters < 1000) return `${characters} chars`;
    if (characters < 1000000) return `${(characters / 1000).toFixed(1)}K chars`;
    return `${(characters / 1000000).toFixed(1)}M chars`;
  };

  if (loading && documents.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Package className="mr-2" size={20} />
          Uploaded Documents ({documents.length})
        </h3>
        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No documents uploaded yet.</p>
          <p className="text-sm mt-1">Upload your first document above to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.document_id} className="border border-gray-200 rounded-lg">
              {/* Document Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => toggleExpand(doc.document_id)}
              >
                <div className="flex items-center space-x-3">
                  {expandedDoc === doc.document_id ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <FileText size={16} className="text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-sm text-gray-500">
                      {doc.total_chunks} chunks • {doc.content_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Calendar size={14} className="mr-1" />
                    {formatDate(doc.upload_timestamp)}
                  </p>
                </div>
              </div>

              {/* Document Details (Expanded) */}
              {expandedDoc === doc.document_id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  {docDetails[doc.document_id] ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Document ID:</span>
                          <p className="text-gray-600 font-mono text-xs mt-1">
                            {docDetails[doc.document_id].document._id}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">File Size:</span>
                          <p className="text-gray-600 mt-1">
                            {formatFileSize(docDetails[doc.document_id].document.total_characters)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Total Chunks:</span>
                          <p className="text-gray-600 mt-1">
                            {docDetails[doc.document_id].chunks}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Embeddings:</span>
                          <p className="text-gray-600 mt-1">
                            {docDetails[doc.document_id].chunks_with_embeddings}/{docDetails[doc.document_id].chunks}
                            {docDetails[doc.document_id].chunks_with_embeddings === docDetails[doc.document_id].chunks && (
                              <span className="text-green-600 ml-1">✓</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Content Preview */}
                      {docDetails[doc.document_id].document.original_text && (
                        <div>
                          <span className="font-medium text-gray-700 block mb-2">Content Preview:</span>
                          <div className="bg-white border border-gray-200 rounded p-3 max-h-40 overflow-y-auto">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {docDetails[doc.document_id].document.original_text}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Loading details...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
