import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomCalendar from './Calendar';
import '../../css/History.css';

function History() {
  const [historyData, setHistoryData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  
  // 加载历史数据
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('taskHistory');
      if (savedHistory) {
        setHistoryData(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('加载历史数据时出错:', error);
    }
  }, []);
  
  // 获取日期列表并按日期排序（最新的在前面），并过滤掉未来的日期
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 设置为今天的开始时间
  
  const sortedDates = Object.keys(historyData)
    .filter(dateStr => {
      const date = new Date(dateStr);
      return date <= today; // 只保留今天和过去的日期
    })
    .sort((a, b) => new Date(b) - new Date(a));
  
  // 处理日期点击
  const handleDateClick = (date) => {
    setSelectedDate(date === selectedDate ? null : date);
  };
  
  // 处理日历日期选择
  const handleCalendarSelect = (date) => {
    // 检查选择的日期是否是未来日期
    const selectedDate = new Date(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // 如果是未来日期，不进行选择
    if (selectedDate > currentDate) {
      alert('不能查看未来日期的任务记录');
      return;
    }
    
    setSelectedDate(date);
    
    // 如果选择的日期不在历史记录中，则滚动到日期列表顶部
    if (!historyData[date]) {
      const dateList = document.querySelector('.date-list');
      if (dateList) {
        dateList.scrollTop = 0;
      }
    }
  };
  
  // 渲染日期列表
  const renderDateList = () => {
    if (sortedDates.length === 0) {
      return <p className="no-data">暂无历史记录</p>;
    }
    
    return (
      <div className="date-list">
        {sortedDates.map(date => {
          const data = historyData[date];
          const isSelected = date === selectedDate;
          
          return (
            <div 
              key={date} 
              className={`date-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleDateClick(date)}
            >
              <div className="date-header">
                <span className="date">{date}</span>
                <span className="stats">
                  完成: {data.stats?.completed || 0}/{data.stats?.total || 0}
                </span>
              </div>
              
              {isSelected && (
                <div className="date-details">
                  <div className="stats-detail">
                    <div>总任务: {data.stats?.total || 0}</div>
                    <div>已完成: {data.stats?.completed || 0}</div>
                    <div>未完成: {data.stats?.failed || 0}</div>
                    <div>待处理: {data.stats?.initial || 0}</div>
                  </div>
                  <Link to={`/history/${date}`} className="view-details-btn">
                    查看详细时间表
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="history-container">
      <h1>任务历史记录</h1>
      
      {/* 添加日历组件 */}
      <CustomCalendar 
        historyData={historyData} 
        onDateSelect={handleCalendarSelect} 
      />
      
      {renderDateList()}
      
      <div className="navigation">
        <Link to="/" className="nav-link">返回主页</Link>
      </div>
    </div>
  );
}

export default History; 