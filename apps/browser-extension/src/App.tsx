import { Play, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import './App.css';
import { ScrapedProduct, ExtensionMessage } from './types';

function App() {
  const [status, setStatus] = useState('Ready');
  const [pageType, setPageType] = useState<'pdp' | 'category' | 'unknown'>('unknown');
  const [scrapeCount, setScrapeCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [recentScrape, setRecentScrape] = useState<ScrapedProduct | null>(null);
  const [error, setError] = useState('');

  const refreshPageInfo = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_INFO' }, (response) => {
          if (response?.type) setPageType(response.type);
        });
      }
    });
  };

  useEffect(() => {
    refreshPageInfo();
    // Re-check on tab focus/update
    const tabUpdateListener = () => refreshPageInfo();
    chrome.tabs.onUpdated.addListener(tabUpdateListener);
    chrome.tabs.onActivated.addListener(tabUpdateListener);
    return () => {
      chrome.tabs.onUpdated.removeListener(tabUpdateListener);
      chrome.tabs.onActivated.removeListener(tabUpdateListener);
    };
  }, []);

  const handleManualScrape = () => {
    setStatus('Scraping...');
    setScrapeCount(0);
    setProgress(0);
    setError('');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const type = pageType === 'category' ? 'SCRAPE_CATEGORY_PAGE' : 'SCRAPE_CURRENT_PAGE';
        chrome.tabs.sendMessage(tabs[0].id, { type }, (response) => {
          if (response?.error) {
            setError(response.error);
            setStatus('Error');
          }
        });
      }
    });
  };

  useEffect(() => {
    const listener = (message: ExtensionMessage) => {
      if (message.type === 'SCRAPE_SUCCESS') {
        setStatus('Ready');
        setProgress(100);
        setRecentScrape(message.data);
        if (message.data.count) setScrapeCount(message.data.count);
      }
      if (message.type === 'SCRAPE_ERROR') {
        setStatus('Error');
        setError(message.error || 'An unexpected error occurred.');
      }
      if (message.type === 'MODEL_PROGRESS') {
        setStatus(message.data.status);
        setProgress(message.data.progress);
        if (message.data.status.toLowerCase().includes('error')) {
          setStatus('Error');
          setError(message.data.status);
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const isModelLoading = status !== 'Ready' && status !== 'Error' && status !== 'Scraping...';
  const canScrape = (pageType === 'pdp' || pageType === 'category') && status === 'Ready';

  return (
    <div className="popup-container">
      <div className="mesh-bg">
        <div className="mesh-1"></div>
        <div className="mesh-2"></div>
      </div>

      <div className="content-wrapper">
        <div className="header">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <Activity size={20} color="white" />
            </div>
            <h1 className="logo-text">StyleSwipe <span className="logo-accent">Pro</span></h1>
          </div>
        </div>

        <div className="info-card">
          <div className="card-header">
            <span className="card-label">Neural Scraper</span>
            <span className={`status-badge ${status !== 'Ready' && status !== 'Error' ? 'status-active' : (status === 'Error' ? 'status-error' : 'status-ready')}`}>
              {status}
            </span>
          </div>
          <p className="card-desc">
            {pageType === 'category' ? 'Category page detected. Batch mode active.' :
              pageType === 'pdp' ? 'Product page detected. Single mode active.' :
                'Navigate to Myntra to begin scraping.'}
          </p>
          <div className={`status-progress-container ${isModelLoading ? 'active' : ''}`}>
            <div className="status-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <button
          onClick={handleManualScrape}
          disabled={!canScrape}
          className="scrape-btn"
        >
          <Play size={20} />
          {pageType === 'category' ? 'Batch Neural Scrape' : 'Manual Neural Scrape'}
        </button>

        {error && (
          <div className="error-area">
            <AlertCircle size={20} color="#EF4444" />
            <p className="error-text">{error}</p>
          </div>
        )}

        {recentScrape && (
          <div className="success-card">
            <div className="success-header">
              <CheckCircle size={16} />
              <span>{scrapeCount > 0 ? `Synced ${scrapeCount} Products` : 'Sync Successful'}</span>
            </div>
            <div className="product-info">
              <img
                src={recentScrape.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200'}
                alt="Preview"
                className="product-img"
              />
              <div className="product-details">
                <h3 className="product-title">{recentScrape.title}</h3>
                <p className="product-brand">{recentScrape.brand}</p>
                <span className="product-price">₹{recentScrape.price}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
