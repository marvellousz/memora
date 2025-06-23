'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, MessageCircle, BookOpen, Clock, Trash2 } from 'lucide-react';
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

interface QuestionAnswerPair {
  question: string;
  answer: string;
  timestamp: string;
}

const AskForm: React.FC<AskFormProps> = ({ onQuestionSubmit }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QuestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topK, setTopK] = useState(3);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [questionAnswerHistory, setQuestionAnswerHistory] = useState<QuestionAnswerPair[]>([]);
  // Load previous questions from localStorage on mount (handle SSR)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('previousQuestions');
      if (stored) {
        setPreviousQuestions(JSON.parse(stored));
      }
      const storedHistory = localStorage.getItem('questionAnswerHistory');
      if (storedHistory) {
        setQuestionAnswerHistory(JSON.parse(storedHistory));
      }
    }
  }, []);
  // Save previous questions to localStorage whenever they change (skip initial empty array)
  useEffect(() => {
    if (typeof window !== 'undefined' && previousQuestions.length > 0) {
      localStorage.setItem('previousQuestions', JSON.stringify(previousQuestions));
    }
  }, [previousQuestions]);

  // Save question-answer history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && questionAnswerHistory.length > 0) {
      localStorage.setItem('questionAnswerHistory', JSON.stringify(questionAnswerHistory));
    }
  }, [questionAnswerHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    onQuestionSubmit?.(question);

    // Add to previous questions
    setPreviousQuestions((prev) => {
      const updated = [question.trim(), ...prev.filter(q => q !== question.trim())].slice(0, 10);
      return updated;
    });

    try {
      const response = await axios.post('http://localhost:8000/api/v1/ask/', {
        question: question.trim(),
        top_k: topK,
      });

      setResponse(response.data);
      
      // Add to question-answer history
      setQuestionAnswerHistory((prev) => {
        const newPair: QuestionAnswerPair = {
          question: question.trim(),
          answer: response.data.answer,
          timestamp: new Date().toISOString()
        };
        return [newPair, ...prev.filter(pair => pair.question !== question.trim())].slice(0, 10);
      });
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

  const deleteQuestionAnswer = (indexToDelete: number) => {
    setQuestionAnswerHistory((prev) => {
      const updated = prev.filter((_, index) => index !== indexToDelete);
      return updated;
    });
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
          </div>        </form>
      </div>

      {/* Error Display */}
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
            
            <div className="prose prose-gray max-w-none text-gray-900 dark:text-white">
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
            </div>          )}
        </div>
      )}

      {/* Question & Answer History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <BookOpen className="mr-2" size={20} />
          Question & Answer History
        </h3>
        {questionAnswerHistory.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No questions asked yet.</p>
        ) : (
          <div className="space-y-4">            {questionAnswerHistory.map((pair, idx) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      className="text-left text-blue-600 dark:text-blue-300 hover:underline font-medium"
                      onClick={() => setQuestion(pair.question)}
                      type="button"
                    >
                      Q: {pair.question}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {new Date(pair.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteQuestionAnswer(idx)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                    title="Delete this question-answer pair"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  <ReactMarkdown>{pair.answer}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AskForm;
