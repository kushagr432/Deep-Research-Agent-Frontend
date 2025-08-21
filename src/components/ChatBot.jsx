import { Bot, FileText, Loader2, Search, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI research assistant. How can I help you today?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [generateReport, setGenerateReport] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const payload = {
        user_query: inputValue,
        deep_research: deepResearch,
        generate_report: deepResearch && generateReport,
        session_id: sessionId
      };

      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle the response based on the actual API response format
      let botContent = 'I received your query. Let me process that for you.';
      let isDeepResearchResponse = false;
      let hasReportGenerated = false;
      let pdfPath = null;

      if (data.response) {
        botContent = data.response;
      } else if (data.response) {
        botContent = data.response;
      }

      // Check if deep research was performed
      if (data.deep_research !== undefined) {
        isDeepResearchResponse = data.deep_research;
      }

      // Check if report was generated
      if (data.report_generated !== undefined) {
        hasReportGenerated = data.report_generated;
      }

      // Get PDF path if available and extract filename
      if (data.pdf_report_path) {
        // Remove "reports\\" prefix and get just the filename
        const fullPath = data.pdf_report_path;
        const fileName = fullPath.replace(/^reports\\/, '');
        pdfPath = fileName;
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botContent,
        timestamp: new Date().toLocaleTimeString(),
        isDeepResearch: isDeepResearchResponse,
        hasReport: hasReportGenerated,
        pdfPath: pdfPath
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Sorry, I encountered an error while processing your request. Please try again.';
      
      // Handle specific CORS or network errors
      if (error.message.includes('405')) {
        errorMessage = 'Server method not allowed. Please check if the API endpoint supports POST requests.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error: The server needs to allow cross-origin requests from this domain.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to the server. Please check if the API server is running.';
      }

      const errorMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDownloadReport = async (fileName) => {
    if (fileName) {
      try {
        // Call the download-report API endpoint with just the filename
        const response = await fetch(`http://localhost:8000/download-report/${fileName}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`);
        }

        // Get the blob from the response
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download error:', error);
        // Show error message to user
        const errorMsg = {
          id: Date.now() + 1,
          type: 'bot',
          content: `Failed to download report: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
          isError: true
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <Bot className="bot-icon" />
          <div className="header-text">
            <h2>AI Research Assistant</h2>
            <p>- Kushagr Jain</p>
          </div>
        </div>
        <div className="session-info">
          Session: {sessionId}
        </div>
      </div>

      <div className="options-panel">
        <div className="option-group">
          <label className="option-label">
            <input
              type="checkbox"
              checked={deepResearch}
              onChange={(e) => setDeepResearch(e.target.checked)}
            />
            <Search className="option-icon" />
            Deep Research
          </label>
          {deepResearch && (
            <label className="option-label sub-option">
              <input
                type="checkbox"
                checked={generateReport}
                onChange={(e) => setGenerateReport(e.target.checked)}
              />
              <FileText className="option-icon" />
              Generate PDF Report
            </label>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'bot' ? <Bot className="avatar-icon" /> : <User className="avatar-icon" />}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-meta">
                <span className="timestamp">{message.timestamp}</span>
                {message.isDeepResearch && (
                  <span className="badge deep-research">
                    <Search className="badge-icon" />
                    Deep Research
                  </span>
                )}
                {message.hasReport && (
                  <span className="badge report">
                    <FileText className="badge-icon" />
                    PDF Report
                  </span>
                )}
                {message.pdfPath && (
                  <button 
                    className="download-button"
                    onClick={() => handleDownloadReport(message.pdfPath)}
                    title={`Download: ${message.pdfPath}`}
                  >
                    <FileText className="download-icon" />
                    Download {message.pdfPath.length > 20 ? message.pdfPath.substring(0, 20) + '...' : message.pdfPath}
                  </button>
                )}
                {message.isError && (
                  <span className="badge error">Error</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-avatar">
              <Bot className="avatar-icon" />
            </div>
            <div className="message-content">
              <div className="loading-indicator">
                <Loader2 className="loading-icon" />
                <span>Processing your request...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your research question here..."
            rows="1"
            className="message-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? <Loader2 className="send-icon loading" /> : <Send className="send-icon" />}
          </button>
        </div>
        <div className="input-footer">
          <span className="hint">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
