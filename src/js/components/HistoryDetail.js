import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TimeSlot from './TimeSlot';
import DailyTaskSlot from './DailyTaskSlot';
import '../../css/HistoryDetail.css';

function HistoryDetail() {
  const { date } = useParams();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if date is today or future date
  useEffect(() => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate >= today) {
      setError('Can only view task records for past dates');
      setLoading(false);
      return;
    }
    
    try {
      const savedHistory = localStorage.getItem('taskHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (parsedHistory[date]) {
          setHistoryData(parsedHistory[date]);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading history data:', error);
      setLoading(false);
    }
  }, [date]);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="history-detail-container">
        <h1>Task Records for {date}</h1>
        <div className="error-message">
          {error}
        </div>
        <Link to="/history" className="back-btn">Back to History</Link>
      </div>
    );
  }
  
  if (!historyData) {
    return (
      <div className="history-detail-container">
        <h1>Task Records for {date}</h1>
        <div className="no-data-message">
          No task records found for this day
        </div>
        <Link to="/history" className="back-btn">Back to History</Link>
      </div>
    );
  }
  
  // Render read-only version of time slots
  const renderTimeSlots = () => {
    const timeSlotRows = [];
    
    // Get user settings for time range and segments
    const segmentsPerHour = historyData.timeSlots[0]?.length || 3;
    
    // Add header row
    timeSlotRows.push(
      <div className="history-schedule-row history-header-row" key="header">
        <div className="history-hour-label">Time</div>
        {Array.from({ length: segmentsPerHour }, (_, i) => {
          const minutesPerSegment = 60 / segmentsPerHour;
          const startMinute = Math.floor(i * minutesPerSegment);
          const endMinute = Math.floor((i + 1) * minutesPerSegment);
          return (
            <div className="history-segment-header" key={`segment-${i}`}>
              {startMinute}-{endMinute} min
            </div>
          );
        })}
      </div>
    );
    
    // Iterate through time slot data
    historyData.timeSlots.forEach((hourSlots, hourIndex) => {
      // Get hour
      const hourDisplay = hourSlots[0]?.time.split(':')[0] || hourIndex;
      
      timeSlotRows.push(
        <div className="history-schedule-row" key={hourIndex}>
          <div className="history-hour-label">{hourDisplay}:00</div>
          {hourSlots.map((slot, segmentIndex) => (
            <div className="history-time-slot" key={`${hourIndex}-${segmentIndex}`}>
              <div className="history-time-slot-content">
                {slot.task.split('\n').map((taskItem, taskIndex) => (
                  <div className="history-task-item" key={taskIndex}>
                    {taskItem}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    });
    
    return timeSlotRows;
  };

  return (
    <div className="history-detail-container">
      <h1>Task Records for {date}</h1>
      
      <div className="history-stats">
        <p>Total Tasks: {historyData.stats.total}</p>
        <p>Completed: {historyData.stats.completed}</p>
        <p>Failed: {historyData.stats.failed}</p>
        <p>Pending: {historyData.stats.initial}</p>
      </div>
      
      <div className="history-daily-task">
        <h2>Daily Tasks</h2>
        <DailyTaskSlot
          time="Daily Tasks"
          task={historyData.dailyTask}
          isReadOnly={true}
        />
      </div>
      
      <div className="history-schedule">
        <h2>Time Schedule</h2>
        <div className="history-schedule-container">
          {renderTimeSlots()}
        </div>
      </div>
      
      <Link to="/history" className="back-btn">Back to History</Link>
    </div>
  );
}

export default HistoryDetail; 