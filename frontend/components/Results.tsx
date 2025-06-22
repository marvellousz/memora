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
      const statusResponse = await axios.get('http://localhost:8000/api/v1/system/status/');
      setSystemStatus(statusResponse.data);

      // Fetch documents
      const docsResponse = await axios.get('http://localhost:8000/api/v1/documents/');
      setDocuments(docsResponse.data.documents || []);

      // Fetch embedding status
      const embeddingResponse = await axios.get('http://localhost:8000/api/v1/embed/status/');
      setEmbeddingStatus(embeddingResponse.data);

    } catch (error: any) {
      setError(error.response?.data?.detail || error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generateAllEmbeddings = async () => {
    try {
      setLoading(true);
      await axios.post('http://localhost:8000/api/v1/embed/all/');
      await fetchData(); // Refresh data
    } catch (error: any) {
      setError(error.response?.data?.detail || error.message || 'Failed to generate embeddings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !systemStatus) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin text-primary-600 mr-2" size={20} />
          <span>Loading system status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center text-red-700">
          <AlertCircle className="mr-2" size={20} />
          <div>
            <h4 className="font-medium">Error</h4>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="btn-secondary mt-2 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (isReady: boolean) => isReady ? 'text-green-600' : 'text-red-600';
  const getStatusIcon = (isReady: boolean) => isReady ? CheckCircle : AlertCircle;

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="mr-2" size={20} />
          System Status
        </h3>
        
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Database className="mr-2" size={16} />
                <span className="font-medium text-gray-700">Database</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Documents: {systemStatus.database.total_documents}</div>
                <div>Chunks: {systemStatus.database.total_chunks}</div>
                <div>With embeddings: {systemStatus.database.chunks_with_embeddings}</div>
              </div>
            </div>

            {/* Embeddings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Zap className="mr-2" size={16} />
                <span className="font-medium text-gray-700">Embeddings</span>
                {React.createElement(
                  getStatusIcon(systemStatus.embeddings.model_loaded),
                  { className: `ml-1 ${getStatusColor(systemStatus.embeddings.model_loaded)}`, size: 14 }
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Model: {systemStatus.embeddings.model_name}</div>
                <div>Dimension: {systemStatus.embeddings.dimension}</div>
                <div>Status: {systemStatus.embeddings.model_loaded ? 'Loaded' : 'Not loaded'}</div>
              </div>
            </div>

            {/* FAISS Index */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FileText className="mr-2" size={16} />
                <span className="font-medium text-gray-700">Vector Index</span>
                {React.createElement(
                  getStatusIcon(systemStatus.faiss_index.total_vectors > 0),
                  { className: `ml-1 ${getStatusColor(systemStatus.faiss_index.total_vectors > 0)}`, size: 14 }
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Vectors: {systemStatus.faiss_index.total_vectors}</div>
                <div>Type: {systemStatus.faiss_index.index_type}</div>
                <div>Dimension: {systemStatus.faiss_index.dimension}</div>
              </div>
            </div>

            {/* LLM */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Brain className="mr-2" size={16} />
                <span className="font-medium text-gray-700">LLM</span>
                {React.createElement(
                  getStatusIcon(systemStatus.llm.is_available),
                  { className: `ml-1 ${getStatusColor(systemStatus.llm.is_available)}`, size: 14 }
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Status: {systemStatus.llm.is_available ? 'Available' : 'Not available'}</div>
                <div>Loaded: {systemStatus.llm.is_loaded ? 'Yes' : 'No'}</div>
                <div>Context: {systemStatus.llm.context_window}</div>
              </div>
            </div>
          </div>
        )}

        {/* System Ready Status */}
        <div className={`mt-4 p-3 rounded-lg ${systemStatus?.system_ready ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center">
            {React.createElement(
              getStatusIcon(systemStatus?.system_ready || false),
              { className: `mr-2 ${getStatusColor(systemStatus?.system_ready || false)}`, size: 16 }
            )}
            <span className={`font-medium ${systemStatus?.system_ready ? 'text-green-700' : 'text-yellow-700'}`}>
              {systemStatus?.system_ready ? 'System Ready' : 'System Not Ready'}
            </span>
          </div>
          {!systemStatus?.system_ready && (
            <p className="text-sm text-yellow-600 mt-1">
              Upload documents and generate embeddings, or ensure the LLM model is available.
            </p>
          )}
        </div>
      </div>

      {/* Embedding Status & Actions */}
      {embeddingStatus && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="mr-2" size={20} />
              Embedding Status
            </h3>
            {embeddingStatus.chunks_without_embeddings > 0 && (
              <button
                onClick={generateAllEmbeddings}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <RefreshCw className="animate-spin mr-2" size={16} />
                ) : (
                  <Zap className="mr-2" size={16} />
                )}
                Generate All Embeddings
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">{embeddingStatus.total_chunks}</div>
              <div className="text-sm text-blue-600">Total Chunks</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">{embeddingStatus.chunks_with_embeddings}</div>
              <div className="text-sm text-green-600">With Embeddings</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-700">{embeddingStatus.chunks_without_embeddings}</div>
              <div className="text-sm text-orange-600">Missing Embeddings</div>
            </div>
          </div>

          {embeddingStatus.total_chunks > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${embeddingStatus.embedding_coverage}%` }}
              ></div>
            </div>
          )}
          <div className="text-sm text-gray-600 mt-2">
            Coverage: {Math.round(embeddingStatus.embedding_coverage)}%
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="mr-2" size={20} />
            Documents ({documents.length})
          </h3>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
            Refresh
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto mb-2" size={32} />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload some documents to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.document_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{doc.filename}</h4>
                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                      <div>Uploaded: {new Date(doc.upload_timestamp).toLocaleDateString()}</div>
                      <div>Chunks: {doc.total_chunks} | Type: {doc.content_type}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {doc.document_id.substring(0, 8)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
