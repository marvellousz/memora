'use client';

import { useState } from 'react';
import { Brain, Database, Upload, MessageCircle, BarChart3, FileText } from 'lucide-react';
import UploadForm from './components/UploadForm';
import AskForm from './components/AskForm';
import Results from './components/Results';
import DocumentList from './components/DocumentListWithDelete';
import ThemeToggle from './components/ThemeToggle';

type TabType = 'upload' | 'documents' | 'ask' | 'results';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [refreshDocuments, setRefreshDocuments] = useState(0);

  const handleUploadSuccess = (data: any) => {
    console.log('Upload success:', data);
    // Trigger document list refresh
    setRefreshDocuments(prev => prev + 1);
    // Optionally switch to documents tab to show the new upload
    setActiveTab('documents');
  };
  const tabs = [
    { id: 'upload' as TabType, label: 'Upload Documents', icon: Upload },
    { id: 'documents' as TabType, label: 'View Documents', icon: FileText },
    { id: 'ask' as TabType, label: 'Ask Questions', icon: MessageCircle },
    { id: 'results' as TabType, label: 'System Status', icon: BarChart3 },
  ];  const handleDocumentDeleted = () => {
    // Trigger document list refresh
    setRefreshDocuments(prev => prev + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadForm onUploadSuccess={handleUploadSuccess} />;
      case 'documents':
        return <DocumentList refreshTrigger={refreshDocuments} onDocumentDeleted={handleDocumentDeleted} />;
      case 'ask':
        return <AskForm onQuestionSubmit={(question) => console.log('Question:', question)} />;
      case 'results':
        return <Results />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">              <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Memora</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered personal knowledge base</p>
              </div>
            </div>
              <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Database className="mr-1" size={16} />
                <span>Local & Private</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}                  className={`
                    flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
      </nav>      {/* Main Content - flex-1 to take remaining space */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>      {/* Footer - will always be at bottom */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Memora v1.0.0</p>
            <p className="mt-1">
              Built with Next.js, FastAPI, FAISS, and local AI models
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
