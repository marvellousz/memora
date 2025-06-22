import React, { useState } from 'react';
import Head from 'next/head';
import { Brain, Database, Upload, MessageCircle, BarChart3 } from 'lucide-react';
import UploadForm from '../components/UploadForm';
import AskForm from '../components/AskForm';
import Results from '../components/Results';

type TabType = 'upload' | 'ask' | 'results';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');

  const tabs = [
    { id: 'upload' as TabType, label: 'Upload Documents', icon: Upload },
    { id: 'ask' as TabType, label: 'Ask Questions', icon: MessageCircle },
    { id: 'results' as TabType, label: 'System Status', icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadForm onUploadSuccess={(data) => console.log('Upload success:', data)} />;
      case 'ask':
        return <AskForm onQuestionSubmit={(question) => console.log('Question:', question)} />;
      case 'results':
        return <Results />;
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Personal Knowledge Base</title>
        <meta name="description" content="AI-powered personal knowledge base with semantic search" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Brain className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Personal Knowledge Base</h1>
                  <p className="text-sm text-gray-500">AI-powered semantic search</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Database className="mr-1" size={16} />
                  <span>Local & Private</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id 
                        ? 'border-primary-500 text-primary-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="mr-2" size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-500">
              <p>Personal Knowledge Base v1.0.0</p>
              <p className="mt-1">
                Built with Next.js, FastAPI, FAISS, and local AI models
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
