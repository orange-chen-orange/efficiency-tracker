import React, { useState, useEffect } from 'react';
import TimeSlot from './TimeSlot';
import TimeLine from './TimeLine';
import DailyTaskSlot from './DailyTaskSlot';
import '../../css/DailySchedule.css';

function DailySchedule() {
  // Initialize time slot data
  const initializeTimeSlots = () => {
    const slots = [];
    // From 7 AM to 9 PM, divide each hour into 3 parts
    for (let hour = 7; hour <= 21; hour++) {
      const hourSlots = [];
      for (let segment = 0; segment < 3; segment++) {
        const startMinute = segment * 20;
        const endMinute = startMinute + 20;
        
        hourSlots.push({
          id: `${hour}-${segment}`,
          time: `${hour}:${startMinute === 0 ? '00' : startMinute} - ${hour}:${endMinute === 0 ? '00' : endMinute}`,
          task: '',
        });
      }
      slots.push(hourSlots);
    }
    return slots;
  };

  // 初始化状态，尝试从 localStorage 加载数据
  const [timeSlots, setTimeSlots] = useState(() => {
    try {
      const savedData = localStorage.getItem('dailySchedule');
      if (savedData) {
        console.log('Found saved data in localStorage');
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
    console.log('No saved data found, initializing with default data');
    return initializeTimeSlots();
  });

  const [resetMessage, setResetMessage] = useState('');

  // 初始化每日任务，尝试从 localStorage 加载数据
  const [dailyTask, setDailyTask] = useState(() => {
    try {
      const savedDailyTask = localStorage.getItem('dailyTask');
      if (savedDailyTask) {
        console.log('Found saved daily task in localStorage');
        return savedDailyTask;
      }
    } catch (error) {
      console.error('Error loading saved daily task:', error);
    }
    console.log('No saved daily task found, initializing with empty string');
    return '';
  });

  // 添加当前时间状态
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新当前时间的函数
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // 格式化当前时间的函数
  const formatCurrentTime = () => {
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentTime.getDay()];
    
    return `${year}-${month}-${day}, ${weekday}`;
  };

  // 统计任务数量的函数
  const getTaskStats = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    let failedTasks = 0;
    let initialTasks = 0;

    // 统计时间段任务
    timeSlots.forEach(hourSlots => {
      hourSlots.forEach(slot => {
        if (slot.task) {
          // 解析任务字符串，提取任务和状态
          const taskItems = slot.task.split('\n').filter(item => item.trim() !== '');
          
          taskItems.forEach(taskItem => {
            totalTasks++;
            
            // 提取状态信息
            if (taskItem.includes('[STATUS:completed]')) {
              completedTasks++;
            } else if (taskItem.includes('[STATUS:failed]')) {
              failedTasks++;
            } else {
              initialTasks++;
            }
          });
        }
      });
    });

    return {
      total: totalTasks,
      completed: completedTasks,
      failed: failedTasks,
      initial: initialTasks
    };
  };

  // 每当 timeSlots 变化时，保存到 localStorage
  useEffect(() => {
    try {
      console.log('Saving timeSlots to localStorage');
      localStorage.setItem('dailySchedule', JSON.stringify(timeSlots));
    } catch (error) {
      console.error('Error saving timeSlots to localStorage:', error);
    }
  }, [timeSlots]);

  // 每当 dailyTask 变化时，保存到 localStorage
  useEffect(() => {
    try {
      console.log('Saving dailyTask to localStorage');
      localStorage.setItem('dailyTask', dailyTask);
    } catch (error) {
      console.error('Error saving dailyTask to localStorage:', error);
    }
  }, [dailyTask]);

  // 添加页面卸载前的保存逻辑
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem('dailySchedule', JSON.stringify(timeSlots));
        localStorage.setItem('dailyTask', dailyTask);
        console.log('Data saved before page unload');
      } catch (error) {
        console.error('Error saving data before unload:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timeSlots, dailyTask]);

  // Update task for a specific time slot
  const updateTask = (hourIndex, segmentIndex, task) => {
    console.log(`Updating task for slot ${hourIndex}-${segmentIndex}:`, task);
    
    const newTimeSlots = [...timeSlots];
    newTimeSlots[hourIndex][segmentIndex].task = task;
    setTimeSlots(newTimeSlots);
    
    // 立即保存到 localStorage
    try {
      localStorage.setItem('dailySchedule', JSON.stringify(newTimeSlots));
      console.log('Task saved to localStorage');
    } catch (error) {
      console.error('Error saving task to localStorage:', error);
    }
  };

  // Update daily task
  const updateDailyTask = (task) => {
    console.log('Updating daily task:', task);
    setDailyTask(task);
    
    // 立即保存到 localStorage
    try {
      localStorage.setItem('dailyTask', task);
      console.log('Daily task saved to localStorage');
    } catch (error) {
      console.error('Error saving daily task to localStorage:', error);
    }
  };

  // Reset the entire schedule
  const resetSchedule = () => {
    const confirmReset = window.confirm('Are you sure you want to reset all time slots? This will clear all tasks and statuses.');
    
    if (confirmReset) {
      console.log('Resetting all time slots and daily task...');
      
      // 创建全新的时间段数据
      const freshTimeSlots = initializeTimeSlots();
      
      // 更新状态
      setTimeSlots(freshTimeSlots);
      setDailyTask('');
      
      // 清除 localStorage 中的数据
      try {
        localStorage.removeItem('dailySchedule');
        localStorage.removeItem('dailyTask');
        
        // 清除所有相关的本地存储数据
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('task_') || key.startsWith('status_')) {
            localStorage.removeItem(key);
          }
        });
        
        // 重新保存空数据
        localStorage.setItem('dailySchedule', JSON.stringify(freshTimeSlots));
        localStorage.setItem('dailyTask', '');
        
        console.log('All tasks and schedule data have been reset');
        
        // 显示重置成功消息
        setResetMessage('Schedule has been reset successfully!');
        
        // 3秒后清除消息
        setTimeout(() => {
          setResetMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error resetting data:', error);
      }
    }
  };

  // Render time slots
  const renderTimeSlots = () => {
    const mainContent = [];
    
    // Add header row
    mainContent.push(
      <div className="schedule-row header-row" key="header">
        <div className="daily-task-header">Daily Task</div>
        <div className="time-header">Time</div>
        <div className="segment-header">0-20 minutes</div>
        <div className="segment-header">20-40 minutes</div>
        <div className="segment-header">40-60 minutes</div>
      </div>
    );
    
    // Create time slots rows
    const timeSlotRows = [];
    
    // Add rows for each hour
    timeSlots.forEach((hourSlots, hourIndex) => {
      const actualHour = 7 + hourIndex;
      
      // 在每个小时行前方添加时间线
      timeSlotRows.push(
        <div className="time-line-row" key={`timeline-${hourIndex}`}>
          <div className="hour-label"></div>
          <TimeLine hour={actualHour} />
        </div>
      );
      
      // 添加时间段行
      timeSlotRows.push(
        <div className="schedule-row" key={hourIndex}>
          <div className="hour-label">{actualHour}:00</div>
          {hourSlots.map((slot, segmentIndex) => (
            <TimeSlot
              key={slot.id}
              time={slot.time}
              task={slot.task}
              onTaskChange={(task) => updateTask(hourIndex, segmentIndex, task)}
            />
          ))}
        </div>
      );
    });
    
    // Create the main grid with daily task column
    mainContent.push(
      <div className="schedule-grid" key="schedule-grid">
        <div className="daily-task-column">
          <DailyTaskSlot
            key="daily-task-slot"
            time="Daily Tasks"
            task={dailyTask}
            onTaskChange={updateDailyTask}
          />
        </div>
        <div className="time-slots-column">
          {timeSlotRows}
        </div>
      </div>
    );
    
    return mainContent;
  };

  return (
    <div className="daily-schedule">
      <h1>Efficiency Tracker</h1>
      <div className="info-container">
        <p className="schedule-description">{formatCurrentTime()}</p>
        <p className="schedule-info">
          Tasks: {getTaskStats().total} | 
          Completed: {getTaskStats().completed} | 
          Failed: {getTaskStats().failed} | 
          Pending: {getTaskStats().initial}
        </p>
      </div>
      
      <button className="reset-button" onClick={resetSchedule}>
        Reset Schedule
      </button>
      
      {resetMessage && <div className="reset-message">{resetMessage}</div>}
      
      <div className="schedule-container">
        {renderTimeSlots()}
      </div>
    </div>
  );
}

export default DailySchedule; 