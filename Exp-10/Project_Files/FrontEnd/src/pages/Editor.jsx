import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import ReactMarkdown from 'react-markdown';

export default function Editor() {
  const { id } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    // 1. Fetch initial content
    fetch(`http://localhost:3000/api/documents/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setContent(data.content);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to connect to backend.');
        setLoading(false);
      });

    // 2. Setup Socket
    socketRef.current = io('http://localhost:3000');
    
    socketRef.current.emit('join-document', id);

    socketRef.current.on('receive-changes', (newContent) => {
      setContent(newContent);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [id]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    socketRef.current.emit('send-changes', { documentId: id, content: val });
  };

  if (loading) {
    return (
      <div className="flex-center animate-fade-in" style={{ flex: 1 }}>
        <div className="loader"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading Workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex-center animate-fade-in" style={{ flex: 1 }}>
          <h2 style={{ color: '#fb7185' }}>Error</h2>
          <p>{error}</p>
        </div>
    );
  }

  return (
    <div className="editor-layout animate-fade-in">
      <div className="editor-pane">
        <div className="pane-header">Markdown Input</div>
        <textarea 
          className="markdown-input" 
          value={content} 
          onChange={handleChange}
          placeholder="Start typing your markdown..."
          spellCheck="false"
        />
      </div>
      
      <div className="preview-pane">
        <div className="pane-header" style={{ background: '#161921' }}>Preview</div>
        <div className="markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
