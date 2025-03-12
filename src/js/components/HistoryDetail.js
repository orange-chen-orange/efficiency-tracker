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
  
  // 检查日期是否是未来日期
  useEffect(() => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      setError('不能查看未来日期的任务记录');
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
      console.error('加载历史数据时出错:', error);
      setLoading(false);
    }
  }, [date]);
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  if (error) {
    return (
      <div className="history-detail-container">
        <h1>{date} 的任务记录</h1>
        <div className="error-message">
          {error}
        </div>
        <Link to="/history" className="back-btn">返回历史记录</Link>
      </div>
    );
  }
  
  if (!historyData) {
    return (
      <div className="history-detail-container">
        <h1>{date} 的任务记录</h1>
        <div className="no-data-message">
          没有找到这一天的任务记录
        </div>
        <Link to="/history" className="back-btn">返回历史记录</Link>
      </div>
    );
  }
  
  // 渲染只读版本的时间段
  const renderTimeSlots = () => {
    const timeSlotRows = [];
    
    // 获取用户设置的时间范围和分段数
    const segmentsPerHour = historyData.timeSlots[0]?.length || 3;
    
    // 添加头部行
    timeSlotRows.push(
      <div className="history-schedule-row history-header-row" key="header">
        <div className="history-hour-label">时间</div>
        {Array.from({ length: segmentsPerHour }, (_, i) => {
          const minutesPerSegment = 60 / segmentsPerHour;
          const startMinute = Math.floor(i * minutesPerSegment);
          const endMinute = Math.floor((i + 1) * minutesPerSegment);
          return (
            <div className="history-segment-header" key={`segment-${i}`}>
              {startMinute}-{endMinute} 分钟
            </div>
          );
        })}
      </div>
    );
    
    // 遍历时间段数据
    historyData.timeSlots.forEach((hourSlots, hourIndex) => {
      // 获取小时数
      const hourDisplay = hourSlots[0]?.time.split(':')[0] || hourIndex;
      
      timeSlotRows.push(
        <div className="history-schedule-row" key={hourIndex}>
          <div className="history-hour-label">{hourDisplay}:00</div>
          {hourSlots.map((slot, segmentIndex) => (
            <TimeSlot
              key={`${hourIndex}-${segmentIndex}`}
              time={slot.time}
              task={slot.task}
              onTaskChange={() => {}} // 只读模式
              isReadOnly={true}
            />
          ))}
        </div>
      );
    });
    
    return (
      <div className="time-slots-container">
        {timeSlotRows}
      </div>
    );
  };
  
  return (
    <div className="history-detail-container">
      <h1>{date} 的任务记录</h1>
      
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">总任务:</span>
          <span className="stat-value">{historyData.stats?.total || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已完成:</span>
          <span className="stat-value">{historyData.stats?.completed || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">未完成:</span>
          <span className="stat-value">{historyData.stats?.failed || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">待处理:</span>
          <span className="stat-value">{historyData.stats?.initial || 0}</span>
        </div>
      </div>
      
      <div className="history-schedule">
        <div className="daily-task-section">
          <h2>每日任务</h2>
          <DailyTaskSlot
            time="Daily Tasks"
            task={historyData.dailyTasks}
            onTaskChange={() => {}} // 只读模式
            isReadOnly={true}
          />
        </div>
        
        <div className="time-slots-section">
          <h2>时间段任务</h2>
          {renderTimeSlots()}
        </div>
      </div>
      
      <Link to="/history" className="back-btn">返回历史记录</Link>
    </div>
  );
}

export default HistoryDetail; 