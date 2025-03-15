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
    
    if (selectedDate > today) {
      setError('Can only view task records for today or past dates');
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
          {hourSlots.map((slot, segmentIndex) => {
            // 过滤出有效的任务项
            const taskItems = slot.task.split('\n').filter(item => item.trim() !== '');
            
            // 确定时间段的整体状态
            let slotStatus = 'initial';
            
            if (taskItems.length > 0) {
              const statuses = taskItems.map(item => {
                const statusMatch = item.match(/\[STATUS:(.*?)\]/);
                return statusMatch ? statusMatch[1] : 'initial';
              });
              
              const hasCompleted = statuses.includes('completed');
              const hasFailed = statuses.includes('failed');
              const hasInitial = statuses.includes('initial');
              
              if (hasCompleted && !hasFailed && !hasInitial) {
                slotStatus = 'completed';
              } else if (hasFailed && !hasCompleted && !hasInitial) {
                slotStatus = 'failed';
              } else if (hasInitial && !hasCompleted && !hasFailed) {
                slotStatus = 'initial';
              } else if (taskItems.length > 0) {
                slotStatus = 'mixed';
              }
            }
            
            return (
              <div className={`time-slot read-only status-${slotStatus}`} key={`${hourIndex}-${segmentIndex}`}>
                <div className="time-display">{slot.time}</div>
                <div className="task-container">
                  {taskItems.length > 0 && (
                    <div className="tasks-list">
                      {taskItems.map((taskItem, taskIndex) => {
                        // 提取任务状态
                        let taskStatus = 'initial';
                        let taskContent = taskItem;
                        
                        const statusMatch = taskItem.match(/\[STATUS:(.*?)\]/);
                        if (statusMatch) {
                          taskStatus = statusMatch[1];
                          taskContent = taskItem.replace(/\[STATUS:.*?\]/, '').trim();
                        }
                        
                        // 只有当任务内容不为空时才渲染
                        if (taskContent.trim() !== '') {
                          return (
                            <div 
                              className={`task-item status-${taskStatus}`} 
                              key={taskIndex}
                            >
                              <div className="task-content">
                                {taskContent}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
          task={historyData.dailyTasks}
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