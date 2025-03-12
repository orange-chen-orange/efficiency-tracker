import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import '../css/App.css';
import DailySchedule from './components/DailySchedule';
import SettingsPage from './components/settings/SettingsPage';
import History from './components/History';
import HistoryDetail from './components/HistoryDetail';

function App() {
  // Clean up future dates data when the application starts
  useEffect(() => {
    const cleanupFutureDates = () => {
      try {
        const savedHistory = localStorage.getItem('taskHistory');
        if (savedHistory) {
          const historyData = JSON.parse(savedHistory);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let hasChanges = false;
          const cleanedHistory = {};
          
          Object.keys(historyData).forEach(dateStr => {
            try {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime()) && date < today) {
                cleanedHistory[dateStr] = historyData[dateStr];
              } else {
                console.log(`[App] Deleted future date data: ${dateStr}`);
                hasChanges = true;
              }
            } catch (e) {
              console.error(`[App] Error processing date ${dateStr}:`, e);
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            localStorage.setItem('taskHistory', JSON.stringify(cleanedHistory));
            console.log('[App] Cleared future dates from history data');
            
            // Trigger storage event to notify other components to refresh data
            if (window.dispatchEvent) {
              window.dispatchEvent(new Event('storage'));
            }
          }
        }
      } catch (error) {
        console.error('[App] Error clearing future date data:', error);
      }
    };
    
    // Execute cleanup
    cleanupFutureDates();
  }, []);
  
  return (
    <Router>
      <div className="App">
        <nav className="app-nav">
          <ul>
            <li>
              <Link to="/">Schedule</Link>
            </li>
            <li>
              <Link to="/history">History</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </nav>
        
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:date" element={<HistoryDetail />} />
          <Route path="/" element={<DailySchedule />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
