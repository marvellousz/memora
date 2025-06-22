'use client';

import React, { useState, useEffect } from 'react';
import { Database, FileText, Zap, Brain, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface SystemStatus {
  database: {
    total_documents: number;
    total_chunks: number;
    chunks_with_embeddings: number;
  };
  embeddings: {
    model_loaded: boolean;
    model_name: string;
    dimension: number;
  };
  faiss_index: {
    total_vectors: number;
    dimension: number;
    index_type: string;
  };
  llm: {
    model_path: string;
    is_loaded: boolean;
    is_available: boolean;
    context_window: number;
  };
  system_ready: boolean;
}

interface Document {
  document_id: string;
  filename: string;
  upload_timestamp: string;
  total_chunks: number;
  content_type: string;
}

const Results: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embeddingStatus, setEmbeddingStatus] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch system status
      const statusResponse = await axios.get('http://localhost:8000/api/v1/status/');
      setSystemStatus(statusResponse.data);

      // Fetch documents list
      const documentsResponse = await axios.get('http://localhost:8000/api/v1/documents/');
      setDocuments(documentsResponse.data.documents || []);

      // Fetch embedding status
      const embeddingResponse = await axios.get('http://localhost:8000/api/v1/embed/status/');
      setEmbeddingStatus(embeddingResponse.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (isGood: boolean) => {
    return isGood ? (
      <CheckCircle className="text-green-500" size={20} />
    ) : (
      <AlertCircle className="text-red-500" size={20} />
    );
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center text-gray-600 dark:text-gray-300">
          <RefreshCw className="animate-spin mr-3" size={24} />
          Loading system information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">        <div className="flex items-center text-red-700 dark:text-red-400">
          <AlertCircle className="mr-3" size={24} />
          <div>
            <h3 className="font-medium">Error Loading System Status</h3>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 px-3 py-1 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Brain className="mr-2" size={24} />
            System Status
          </h2>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center text-sm"
          >
            <RefreshCw className="mr-2" size={16} />
            Refresh
          </button>
        </div>

        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database Status */}            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Database className="mr-2 text-blue-600 dark:text-blue-400" size={20} />
                  <span className="font-medium">Database</span>
                </div>
                {getStatusIcon(systemStatus.database.total_documents > 0)}
              </div>              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>Documents: {systemStatus.database.total_documents}</div>
                <div>Chunks: {systemStatus.database.total_chunks}</div>
                <div>Embedded: {systemStatus.database.chunks_with_embeddings}</div>
              </div>
            </div>

            {/* Embeddings Status */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Zap className="mr-2 text-yellow-600 dark:text-yellow-400" size={20} />
                  <span className="font-medium">Embeddings</span>
                </div>
                {getStatusIcon(systemStatus.embeddings.model_loaded)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>Model: {systemStatus.embeddings.model_name || 'Not loaded'}</div>
                <div>Dimension: {systemStatus.embeddings.dimension}</div>
                <div>Status: {systemStatus.embeddings.model_loaded ? 'Loaded' : 'Not loaded'}</div>
              </div>
            </div>            {/* FAISS Index Status */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Database className="mr-2 text-purple-600 dark:text-purple-400" size={20} />
                  <span className="font-medium">Vector Index</span>
                </div>
                {getStatusIcon(systemStatus.faiss_index.total_vectors > 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>Vectors: {systemStatus.faiss_index.total_vectors}</div>
                <div>Dimension: {systemStatus.faiss_index.dimension}</div>
                <div>Type: {systemStatus.faiss_index.index_type}</div>
              </div>
            </div>            {/* LLM Status */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Brain className="mr-2 text-green-600 dark:text-green-400" size={20} />
                  <span className="font-medium">LLM</span>
                </div>
                {getStatusIcon(systemStatus.llm.is_loaded && systemStatus.llm.is_available)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>Status: {systemStatus.llm.is_loaded ? 'Loaded' : 'Not loaded'}</div>
                <div>Available: {systemStatus.llm.is_available ? 'Yes' : 'No'}</div>
                <div>Context: {systemStatus.llm.context_window || 'Unknown'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Overall System Status */}
        {systemStatus && (          <div className="mt-6 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center">
              {getStatusIcon(systemStatus.system_ready)}
              <span className={`ml-2 font-medium ${
                systemStatus.system_ready ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                System is {systemStatus.system_ready ? 'Ready' : 'Not Ready'}
              </span>
            </div>
            {!systemStatus.system_ready && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Some components are not ready. Please check the individual status above.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="card">        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FileText className="mr-2" size={20} />
          Uploaded Documents ({documents.length})
        </h3>        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="mx-auto mb-4" size={48} />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center flex-1">
                  <FileText className="mr-3 text-gray-400 dark:text-gray-500" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{doc.filename}</h4>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="mr-4">
                        Uploaded: {formatTimestamp(doc.upload_timestamp)}
                      </span>
                      <span className="mr-4">
                        Chunks: {doc.total_chunks}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                        {doc.content_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>      {/* Embedding Status */}
      {embeddingStatus && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Zap className="mr-2" size={20} />
            Embedding Status
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Pending:</span> {embeddingStatus.pending_chunks || 0}
              </div>
              <div>
                <span className="font-medium">Processing:</span> {embeddingStatus.processing || false ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {embeddingStatus.last_update ? formatTimestamp(embeddingStatus.last_update) : 'Never'}
              </div>
              <div>
                <span className="font-medium">Queue Status:</span> {embeddingStatus.queue_status || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
