'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Clock, Hash, Trash2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

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

interface DocumentListProps {
  refreshTrigger?: number;
  onDocumentDeleted?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ refreshTrigger, onDocumentDeleted }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [docDetails, setDocDetails] = useState<{ [key: string]: DocumentDetails }>({});

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/v1/documents/');
      setDocuments(response.data.documents || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeletingId(documentId);
      await axios.delete(`http://localhost:8000/api/v1/documents/${documentId}`);
      setDocuments(documents.filter(doc => doc.document_id !== documentId));
      setShowDeleteConfirm(null);
      onDocumentDeleted?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setLoading(true);
      await axios.delete('http://localhost:8000/api/v1/documents/');
      setDocuments([]);
      setShowDeleteAllConfirm(false);
      onDocumentDeleted?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete all documents');
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

  const toggleExpanded = (documentId: string) => {
    if (expandedDoc === documentId) {
      setExpandedDoc(null);
    } else {
      setExpandedDoc(documentId);
      if (!docDetails[documentId]) {
        fetchDocumentDetails(documentId);
      }
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={fetchDocuments}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="mr-2" size={20} />
            Uploaded Documents ({documents.length})
          </h3>
          {documents.length > 0 && (            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="btn-secondary text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
            >
              <Trash2 size={16} className="mr-1" />
              Delete All
            </button>
          )}
        </div>        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No documents uploaded yet.</p>
            <p className="text-sm">Upload some documents to build your knowledge base!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <button
                        onClick={() => toggleExpanded(doc.document_id)}
                        className="mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {expandedDoc === doc.document_id ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>                      <FileText size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">{doc.filename}</h4>
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        {doc.content_type}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4 ml-6">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatDate(doc.upload_timestamp)}
                      </div>
                      <div className="flex items-center">
                        <Hash size={14} className="mr-1" />
                        {doc.total_chunks} chunks
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowDeleteConfirm(doc.document_id)}
                      disabled={deletingId === doc.document_id}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete document"
                    >
                      {deletingId === doc.document_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>                {/* Expanded content */}
                {expandedDoc === doc.document_id && docDetails[doc.document_id] && (
                  <div className="mt-4 ml-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Characters:</span> {docDetails[doc.document_id].document.total_characters}
                      </div>
                      <div>
                        <span className="font-medium">Embeddings:</span> {docDetails[doc.document_id].chunks_with_embeddings}/{docDetails[doc.document_id].chunks} chunks
                      </div>
                      <div>
                        <span className="font-medium">Preview:</span>
                        <div className="mt-1 p-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-200">
                          {docDetails[doc.document_id].document.original_text}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-400 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Document</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this document? This action cannot be undone and will remove all associated chunks and embeddings.
            </p>            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(showDeleteConfirm)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-400 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete All Documents</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>all {documents.length} documents</strong>? This action cannot be undone and will completely clear your knowledge base.
            </p>            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="btn-danger"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
