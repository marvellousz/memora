'use client';

import React, { useState } from 'react';
import { Search, Loader2, MessageCircle, BookOpen, Clock } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface AskFormProps {
  onQuestionSubmit?: (question: string) => void;
}

interface RetrievedChunk {
  chunk_id: string;
  content: string;
  filename: string;
  chunk_index: number;
  similarity_score: number;
  timestamp?: string;
}

interface QuestionResponse {
  answer: string;
  retrieved_chunks: RetrievedChunk[];
  confidence?: number;
}

const AskForm: React.FC<AskFormProps> = ({ onQuestionSubmit }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QuestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topK, setTopK] = useState(3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    onQuestionSubmit?.(question);

    try {
      const response = await axios.post('http://localhost:8000/api/v1/ask/', {
        question: question.trim(),
        top_k: topK,
      });

      setResponse(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get answer';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatConfidence = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    return `${Math.round(confidence)}%`;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Question Form */}
      <div className="card">        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <MessageCircle className="mr-2" size={20} />
          Ask a Question
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to know about your documents?"
              rows={3}
              className="input-field resize-vertical"
              disabled={loading}
              required
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1">              <label htmlFor="topK" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of chunks to retrieve
              </label>
              <select
                id="topK"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="input-field"
                disabled={loading}
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            
            <div className="flex-shrink-0 pt-6">
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2" size={16} />
                    Ask
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>      {/* Error Display */}
      {error && (
        <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center text-red-700 dark:text-red-400">
            <MessageCircle className="mr-2" size={20} />
            <div>
              <h4 className="font-medium">Error</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Answer Display */}
      {response && (
        <div className="space-y-4">
          {/* Answer */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <MessageCircle className="mr-2" size={20} />
                Answer
              </h3>{response.confidence && (
                <span className="text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded">
                  Confidence: {formatConfidence(response.confidence)}
                </span>
              )}
            </div>
            
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>{response.answer}</ReactMarkdown>
            </div>
          </div>

          {/* Retrieved Chunks */}
          {response.retrieved_chunks.length > 0 && (
            <div className="card">              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BookOpen className="mr-2" size={20} />
                Source Information ({response.retrieved_chunks.length} chunks)
              </h3>
              
              <div className="space-y-4">
                {response.retrieved_chunks.map((chunk, index) => (                  <div
                    key={chunk.chunk_id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium mr-2">#{index + 1}</span>
                        <span className="mr-2">{chunk.filename}</span>
                        <span className="mr-2">Chunk {chunk.chunk_index}</span>
                        {chunk.timestamp && (
                          <span className="flex items-center">
                            <Clock className="mr-1" size={12} />
                            {formatTimestamp(chunk.timestamp)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded">
                        {Math.round(chunk.similarity_score * 100)}% match
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {chunk.content.length > 300 
                        ? `${chunk.content.substring(0, 300)}...` 
                        : chunk.content
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AskForm;
