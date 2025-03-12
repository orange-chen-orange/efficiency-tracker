import React, { useState, useEffect } from 'react';
import '../../css/TimeLine.css';

function TimeLine({ hour }) {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  
  // 更新当前时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const minute = now.getMinutes();
      
      // 格式化当前时间为 HH:MM 格式
      const formattedHour = currentHour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      setCurrentTime(`${formattedHour}:${formattedMinute}`);
      
      // 检查当前时间与目标小时的关系
      if (currentHour === hour) {
        // 如果是当前小时，设置实际分钟数
        setCurrentMinute(minute);
      } else if (currentHour > hour) {
        // 如果当前时间已经过了这个小时，设置为满进度
        setCurrentMinute(60);
      } else {
        // 如果当前时间还没到这个小时，设置为零进度
        setCurrentMinute(0);
      }
    };
    
    // 立即更新一次
    updateTime();
    
    // 每分钟更新一次
    const intervalId = setInterval(updateTime, 60000);
    
    return () => clearInterval(intervalId);
  }, [hour]);
  
  // 计算进度条的宽度（百分比）
  const calculateProgress = () => {
    // 将分钟转换为百分比位置 (0-60分钟 => 0-100%)
    return (currentMinute / 60) * 100;
  };
  
  return (
    <div className="time-line-container">
      <div className="time-line">
        {/* 时间进度条 */}
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{ width: `${calculateProgress()}%` }}
          ></div>
          
          {/* 时间标签 */}
          {currentMinute > 0 && currentMinute < 60 && (
            <div 
              className="current-time-label"
              style={{ left: `${calculateProgress()}%` }}
            >
              {currentTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeLine; 