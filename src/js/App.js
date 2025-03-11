import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import '../css/App.css';
import DailySchedule from './components/DailySchedule';
import SettingsPage from './components/settings/SettingsPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="app-nav">
          <ul>
            <li>
              <Link to="/">Schedule</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </nav>
        
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<DailySchedule />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
