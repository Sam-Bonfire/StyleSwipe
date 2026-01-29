/// <reference types="chrome" />
import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<string>('Ready');
  const [pageType, setPageType] = useState<'pdp' | 'category' | 'unknown'>('unknown');

  useEffect(() => {
    // Detect page type on load
    const detect = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_INFO" }, (response) => {
          if (response) {
            setPageType(response.type);
          }
        });
      }
    };
    detect();
  }, []);

  const handleScrape = async () => {
    setStatus('Scraping...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    const messageType = pageType === 'category' ? "SCRAPE_CATEGORY_PAGE" : "SCRAPE_CURRENT_PAGE";

    chrome.tabs.sendMessage(tab.id, { type: messageType }, (response) => {
      if (chrome.runtime.lastError) {
        const msg = chrome.runtime.lastError.message || '';
        setStatus('Error: ' + msg);
        return;
      }

      if (response && response.success) {
        setStatus(`Success! ${response.count ? 'Saved ' + response.count + ' products.' : 'Saved to DB.'}`);
      } else {
        setStatus('Failed: ' + (response?.error || 'Unknown error'));
      }
    });
  };

  return (
    <div style={{ width: 300, padding: 20 }}>
      <h3>StyleSwipe Scraper</h3>
      <p style={{ fontSize: 13, marginBottom: 15 }}>
        {pageType === 'category'
          ? 'Found product listing page.'
          : pageType === 'pdp'
            ? 'Found individual product page.'
            : 'Navigate to a Myntra page to start.'}
      </p>

      <button
        onClick={handleScrape}
        disabled={status === 'Scraping...' || pageType === 'unknown'}
        style={{ width: '100%', padding: '10px' }}
      >
        {status === 'Scraping...'
          ? 'Processing...'
          : pageType === 'category'
            ? 'Scrape All Products on Page'
            : 'Scrape This Product'}
      </button>

      <p style={{ marginTop: 15, fontSize: 12, color: status.startsWith('Success') ? 'green' : 'gray' }}>
        Status: {status}
      </p>
    </div>
  )
}

export default App
