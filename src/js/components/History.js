import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomCalendar from './Calendar';
import { cleanupFutureDates } from '../utils/storageCleanup';
import '../../css/History.css';

// 获取本地日期字符串的辅助函数
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function History() {
  const [filteredHistoryData, setFilteredHistoryData] = useState({});
  const navigate = useNavigate();
  
  // Clean up future dates in history data
  const cleanupAndFilterHistoryData = () => {
    const now = new Date();
    const todayISO = getLocalDateString(now);
    console.log('历史组件中的今天日期:', {
      '本地时间': now.toString(),
      '本地日期': todayISO,
      '时区偏移(分钟)': now.getTimezoneOffset()
    });
    
    const cleanedData = cleanupFutureDates();
    console.log('清理后的历史数据日期:', Object.keys(cleanedData));
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