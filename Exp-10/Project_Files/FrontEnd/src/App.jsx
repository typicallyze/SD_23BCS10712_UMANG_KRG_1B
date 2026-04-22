import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import Home from './pages/Home';
import Editor from './pages/Editor';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="navbar-brand">
            <PenTool size={24} />
            Collab<span className="brand-accent">Pad</span>
          </Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pad/:id" element={<Editor />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
