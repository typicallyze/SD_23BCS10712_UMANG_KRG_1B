import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Link, Plus } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [padId, setPadId] = useState('');

  const handleCreateNew = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Document', content: '# Welcome to your Collaborative Pad!\nStart typing here...' }),
      });
      const data = await res.json();
      navigate(`/pad/${data.id}`);
    } catch (err) {
      console.error('Failed to create new pad:', err);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (padId.trim()) {
      navigate(`/pad/${padId}`);
    }
  };

  return (
    <div className="home-container animate-fade-in">
      <div className="hero-box">
        <h1 className="hero-title">Collaborative <span className="brand-accent">Markdown</span></h1>
        <p className="hero-subtitle">Real-time Markdown editor powered by WebSockets.</p>
        
        <div className="action-form">
          <button className="btn-primary" onClick={handleCreateNew} style={{ justifyContent: 'center' }}>
            <Plus size={20} /> New Document
          </button>
          
          <div className="divider">OR</div>
          
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Enter Room Code (e.g. class4A)" 
              className="input-field"
              value={padId}
              onChange={e => setPadId(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              <Link size={20} /> Join / Create
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
