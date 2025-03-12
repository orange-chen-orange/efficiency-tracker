import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomCalendar from './Calendar';
import { cleanupFutureDates } from '../utils/storageCleanup';
import '../../css/History.css';

function History() {
  const [filteredHistoryData, setFilteredHistoryData] = useState({});
  const navigate = useNavigate();
  
  // Clean up future dates in history data
  const cleanupAndFilterHistoryData = () => {
    const cleanedData = cleanupFutureDates();
    setFilteredHistoryData(cleanedData);
    return cleanedData;
  };
  
  // Load history data
  useEffect(() => {
    cleanupAndFilterHistoryData();
    
    // Listen for storage events to refresh data when other components update local storage
    const handleStorageChange = (event) => {
      if (event.key === 'taskHistory' || event.key === null) {
        cleanupAndFilterHistoryData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Handle date click event
  const handleDateClick = (date) => {
    if (!filteredHistoryData[date]) {
      alert(`${date} has no task records`);
      return;
    }
    
    // Navigate directly to the detail view page
    navigate(`/history/${date}`);
  };
  
  return (
    <div className="history-container">
      <h1>Task History</h1>
      
      {/* Add calendar component */}
      <CustomCalendar 
        historyData={filteredHistoryData} 
        onDateSelect={handleDateClick} 
      />
      
      <div className="history-info">
        <p className="history-tip">Click on a date in the calendar to view detailed task records</p>
        {Object.keys(filteredHistoryData).length === 0 && (
          <p className="no-data">No history records yet</p>
        )}
      </div>
      
      <div className="navigation">
        <Link to="/" className="nav-link">Return to Home Page</Link>
      </div>
    </div>
  );
}

export default History; 