import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard/:handle" element={<Dashboard />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default App;