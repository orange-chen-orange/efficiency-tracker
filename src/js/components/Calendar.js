import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../css/CustomCalendar.css';

// 获取本地日期字符串的辅助函数
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 自定义导航按钮样式
const navigationStyles = {
  navigationButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    opacity: 1,
    cursor: 'default'
  }
};

function CustomCalendar({ historyData, onDateSelect }) {
  // 设置初始值为今天，而不是昨天
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [value, setValue] = useState(today);
  const [markedDates, setMarkedDates] = useState({});
  const calendarRef = useRef(null);
  
  // 直接修改禁用按钮的样式
  useEffect(() => {
    const applyStylesToDisabledButtons = () => {
      if (calendarRef.current) {
        const container = calendarRef.current.querySelector('.react-calendar__navigation');
        if (container) {
          const disabledButtons = container.querySelectorAll('button:disabled');
          disabledButtons.forEach(button => {
            button.style.backgroundColor = '#2196F3';
            button.style.color = 'white';
            button.style.opacity = '1';
          });
        }
      }
    };
    
    // 初始应用样式
    applyStylesToDisabledButtons();
    
    // 创建一个MutationObserver来监听DOM变化
    const observer = new MutationObserver(applyStylesToDisabledButtons);
    
    if (calendarRef.current) {
      observer.observe(calendarRef.current, { 
        attributes: true, 
        childList: true, 
        subtree: true 
      });
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // 当历史数据变化时，更新标记日期
  useEffect(() => {
    if (historyData) {
      console.log('日历组件收到的历史数据日期:', Object.keys(historyData));
      
      const marked = {};
      const now = new Date();
      const todayISO = getLocalDateString(now);
      console.log('日历组件中的今天日期:', {
        '本地时间': now.toString(),
        'ISO日期': todayISO,
        '时区偏移(分钟)': now.getTimezoneOffset()
      });
      
      Object.keys(historyData).forEach(dateStr => {
        // 标记所有日期，包括今天和未来日期
        const data = historyData[dateStr];
        marked[dateStr] = {
          hasData: true,
          stats: data.stats || { completed: 0, total: 0 }
        };
        console.log(`标记日期: ${dateStr}, 数据:`, data.stats);
      });
      setMarkedDates(marked);
    }
  }, [historyData]);
  
  // 处理日期变化
  const handleDateChange = (date) => {
    // 检查选择的日期是否有历史数据
    const formattedDate = formatDate(date);
    if (!markedDates[formattedDate] || !markedDates[formattedDate].hasData) {
      alert(`${formattedDate} 没有任务记录`);
      return;
    }
    
    setValue(date);
    
    // 调用父组件的回调函数
    if (onDateSelect) {
      onDateSelect(formattedDate);
    }
  };
  
  // 格式化日期为 YYYY-MM-DD
  const formatDate = (date) => {
    return getLocalDateString(date);
  };
  
  // 自定义日期渲染
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const formattedDate = formatDate(date);
    const dateData = markedDates[formattedDate];
    
    if (!dateData || !dateData.hasData) return null;
    
    // 获取任务统计数据
    const { completed = 0, total = 0, failed = 0, initial = 0 } = dateData.stats || {};
    
    // 确保数据有效
    if (total <= 0) return null;
    
    // 计算各类任务的百分比
    const completedPercentage = Math.round((completed / total) * 100);
    const initialPercentage = Math.round((initial / total) * 100);
    const failedPercentage = Math.round((failed / total) * 100);
    
    // 确保总百分比为100%（处理舍入误差）
    const totalPercentage = completedPercentage + initialPercentage + failedPercentage;
    let adjustedCompletedPercentage = completedPercentage;
    let adjustedInitialPercentage = initialPercentage;
    let adjustedFailedPercentage = failedPercentage;
    
    if (totalPercentage !== 100 && total > 0) {
      const diff = 100 - totalPercentage;
      // 将差值添加到最大的类别中
      if (completed >= initial && completed >= failed) {
        adjustedCompletedPercentage += diff;
      } else if (initial >= completed && initial >= failed) {
        adjustedInitialPercentage += diff;
      } else {
        adjustedFailedPercentage += diff;
      }
    }
    
    return (
      <div className="date-marker">
        {/* 完成任务指示器（绿色） */}
        {adjustedCompletedPercentage > 0 && (
          <div 
            className="completion-indicator completed"
            style={{ 
              width: `${adjustedCompletedPercentage}%`,
              backgroundColor: '#4CAF50', // 绿色
              height: '100%',
              float: 'left'
            }}
          />
        )}
        
        {/* 待处理任务指示器（黄色） */}
        {adjustedInitialPercentage > 0 && (
          <div 
            className="completion-indicator initial"
            style={{ 
              width: `${adjustedInitialPercentage}%`,
              backgroundColor: '#FFC107', // 黄色
              height: '100%',
              float: 'left'
            }}
          />
        )}
        
        {/* 未完成任务指示器（红色） */}
        {adjustedFailedPercentage > 0 && (
          <div 
            className="completion-indicator failed"
            style={{ 
              width: `${adjustedFailedPercentage}%`,
              backgroundColor: '#F44336', // 红色
              height: '100%',
              float: 'left'
            }}
          />
        )}
      </div>
    );
  };
  
  // 自定义日期类名
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const formattedDate = formatDate(date);
    return markedDates[formattedDate] && markedDates[formattedDate].hasData ? 'has-data' : null;
  };
  
  // 禁用日期函数
  const tileDisabled = ({ date, view }) => {
    // 只在月视图中禁用日期
    if (view !== 'month') return false;
    
    const formattedDate = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 只禁用未来日期，允许选择今天和过去的日期
    if (date > today) {
      return true;
    }
    
    // 如果日期没有数据，也禁用
    return !markedDates[formattedDate] || !markedDates[formattedDate].hasData;
  };
  
  return (
    <div className="custom-calendar-container" ref={calendarRef}>
      <Calendar
        onChange={handleDateChange}
        value={value}
        tileContent={tileContent}
        tileClassName={tileClassName}
        activeStartDate={today}
        showNeighboringMonth={false}
        minDetail="month"
        next2Label={null}
        prev2Label={null}
        tileDisabled={tileDisabled}
      />
    </div>
  );
}

export default CustomCalendar; 