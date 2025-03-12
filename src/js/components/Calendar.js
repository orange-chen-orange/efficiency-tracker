import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../css/CustomCalendar.css';

function CustomCalendar({ historyData, onDateSelect }) {
  const [value, setValue] = useState(new Date());
  const [markedDates, setMarkedDates] = useState({});
  
  // 当历史数据变化时，更新标记日期
  useEffect(() => {
    if (historyData) {
      const marked = {};
      Object.keys(historyData).forEach(dateStr => {
        const data = historyData[dateStr];
        marked[dateStr] = {
          hasData: true,
          stats: data.stats || { completed: 0, total: 0 }
        };
      });
      setMarkedDates(marked);
    }
  }, [historyData]);
  
  // 处理日期变化
  const handleDateChange = (date) => {
    setValue(date);
    
    // 格式化日期为 YYYY-MM-DD
    const formattedDate = formatDate(date);
    
    // 调用父组件的回调函数
    if (onDateSelect) {
      onDateSelect(formattedDate);
    }
  };
  
  // 格式化日期为 YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 自定义日期渲染
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const formattedDate = formatDate(date);
    const dateData = markedDates[formattedDate];
    
    if (!dateData || !dateData.hasData) return null;
    
    const { completed, total } = dateData.stats;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return (
      <div className="date-marker">
        <div 
          className="completion-indicator" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: percentage >= 80 ? '#4CAF50' : percentage >= 50 ? '#FFC107' : '#F44336'
          }}
        />
      </div>
    );
  };
  
  // 获取今天的日期作为最大可选日期
  const today = new Date();
  
  return (
    <div className="custom-calendar-container">
      <Calendar
        onChange={handleDateChange}
        value={value}
        maxDate={today} // 限制最大可选日期为今天
        tileContent={tileContent}
        tileClassName={({ date }) => {
          const formattedDate = formatDate(date);
          return markedDates[formattedDate] ? 'has-data' : null;
        }}
      />
    </div>
  );
}

export default CustomCalendar; 