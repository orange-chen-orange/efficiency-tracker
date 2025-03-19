import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TimeSlot from './TimeSlot';
import DailyTaskSlot from './DailyTaskSlot';
import '../../css/HistoryDetail.css';

// 获取本地日期字符串的辅助函数
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function HistoryDetail() {
  const { date } = useParams();
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 获取用户设置
  const getUserSettings = () => {
    let startHour = 0;
    let endHour = 24;
    let segmentsPerHour = 3;
    
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        startHour = settings.startHour;
        endHour = settings.endHour;
        segmentsPerHour = settings.segmentsPerHour;
      }
    } catch (error) {
      console.error('Reading settings error:', error);
    }
    
    return { startHour, endHour, segmentsPerHour };
  };
  
  // Check if date is today or future date
  useEffect(() => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('历史详情组件中的日期信息:', {
      '选择的日期': date,
      '解析后的日期': selectedDate.toString(),
      '今天日期': today.toString(),
      '今天本地日期': getLocalDateString(today)
    });
    
    if (selectedDate >= today) {
      setError('Can only view task records for past dates');
      setLoading(false);
      return;
    }
    
    try {
      const savedHistory = localStorage.getItem('taskHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        console.log('历史数据中的日期:', Object.keys(parsedHistory));
        if (parsedHistory[date]) {
          setHistoryData(parsedHistory[date]);
          console.log(`找到${date}的历史数据:`, parsedHistory[date]);
        } else {
          console.log(`未找到${date}的历史数据`);
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
    
    // 获取用户设置的时间范围
    const { startHour, endHour, segmentsPerHour } = getUserSettings();
    
    // 检查时间槽数据的格式
    if (!historyData.timeSlots) {
      return (
        <div className="no-data-message">
          No time slots data available for this day
        </div>
      );
    }
    
    // 判断数据是数组格式还是对象格式
    const isArrayFormat = Array.isArray(historyData.timeSlots);
    
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
    
    // 根据数据格式不同，采用不同的渲染方式
    if (isArrayFormat) {
      // 数组格式 (新版本) - 只渲染用户设置的时间范围内的数据
      for (let hour = startHour; hour < endHour; hour++) {
        // 确保该小时的数据存在
        if (!historyData.timeSlots[hour] || historyData.timeSlots[hour].length === 0) {
          console.log(`小时 ${hour} 没有时间槽数据，跳过`);
          continue;
        }
        
        const hourSlots = historyData.timeSlots[hour];
        
        timeSlotRows.push(
          <div className="history-schedule-row" key={hour}>
            <div className="history-hour-label">{hour}:00</div>
            {hourSlots.map((slot, segmentIndex) => {
              // 过滤出有效的任务项
              const taskItems = slot.task ? slot.task.split('\n').filter(item => item.trim() !== '') : [];
              
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
                <div className={`time-slot read-only status-${slotStatus}`} key={`${hour}-${segmentIndex}`}>
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
      }
    } else {
      // 对象格式 (旧版本) - 收集所有时间槽并按小时分组
      const hourGroups = {};
      
      // 收集所有时间槽并按小时分组
      Object.values(historyData.timeSlots).forEach(slot => {
        const hour = parseInt(slot.time.split(':')[0], 10);
        
        // 只处理在用户设置范围内的时间槽
        if (hour >= startHour && hour < endHour) {
          if (!hourGroups[hour]) {
            hourGroups[hour] = [];
          }
          hourGroups[hour].push(slot);
        }
      });
      
      // 按小时顺序渲染
      Object.keys(hourGroups)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(hour => {
          const hourSlots = hourGroups[hour];
          
          timeSlotRows.push(
            <div className="history-schedule-row" key={hour}>
              <div className="history-hour-label">{hour}:00</div>
              {hourSlots.map((slot, segmentIndex) => {
                // 过滤出有效的任务项
                const taskItems = slot.task ? slot.task.split('\n').filter(item => item.trim() !== '') : [];
                
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
                  <div className={`time-slot read-only status-${slotStatus}`} key={`${hour}-${segmentIndex}`}>
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
    }
    
    return timeSlotRows;
  };

  return (
    <div className="history-detail-container">
      <h1>Task Records for {date}</h1>
      
      <div className="history-stats">
        <p>Total Tasks: {historyData.stats?.total || 0}</p>
        <p>Completed: {historyData.stats?.completed || 0}</p>
        <p>Failed: {historyData.stats?.failed || 0}</p>
        <p>Pending: {historyData.stats?.initial || 0}</p>
      </div>
      
      <div className="history-daily-task">
        <h2>Daily Tasks</h2>
        <DailyTaskSlot
          time="Daily Tasks"
          task={historyData.dailyTasks || ''}
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