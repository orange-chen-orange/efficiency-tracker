import React, { useState, useEffect } from 'react';
import TimeSlot from './TimeSlot';
import TimeLine from './TimeLine';
import DailyTaskSlot from './DailyTaskSlot';
import '../../css/DailySchedule.css';

function DailySchedule() {
  // 获取用户设置
  const getUserSettings = () => {
    let startHour = 7;
    let endHour = 22;
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
  
  // 设置 CSS 变量
  useEffect(() => {
    const { segmentsPerHour } = getUserSettings();
    document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
    
    // 重新初始化时间槽，确保它们与用户设置一致
    const freshTimeSlots = initializeTimeSlots();
    setTimeSlots(freshTimeSlots);
  }, []);

  // 监听 localStorage 变化
  useEffect(() => {
    // 定义事件处理函数
    const handleStorageChange = (event) => {
      if (event.key === 'appSettings') {
        console.log('Settings changed, reinitializing time slots...');
        
        // 更新 CSS 变量
        const { segmentsPerHour } = getUserSettings();
        document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
        
        // 重新初始化时间槽
        const freshTimeSlots = initializeTimeSlots();
        setTimeSlots(freshTimeSlots);
        
        // 保存到 localStorage
        try {
          localStorage.setItem('dailySchedule', JSON.stringify(freshTimeSlots));
        } catch (error) {
          console.error('Error saving new time slots:', error);
        }
      }
    };
    
    // 添加事件监听器
    window.addEventListener('storage', handleStorageChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Initialize time slot data
  const initializeTimeSlots = () => {
    // 尝试从localStorage读取用户设置
    const { startHour, endHour, segmentsPerHour } = getUserSettings();
    
    const slots = [];
    // 使用用户设置的时间范围和分段
    for (let hour = startHour; hour < endHour; hour++) {
      const hourSlots = [];
      // 计算每个分段的分钟数
      const minutesPerSegment = 60 / segmentsPerHour;
      
      for (let segment = 0; segment < segmentsPerHour; segment++) {
        const startMinute = segment * minutesPerSegment;
        const endMinute = startMinute + minutesPerSegment;
        
        // 格式化分钟显示
        const formattedStartMinute = startMinute === 0 ? '00' : startMinute;
        
        // 处理结束时间，如果是60分钟，则显示为下一个小时的0分钟
        let formattedEndHour = hour;
        let formattedEndMinute = endMinute;
        
        if (endMinute === 60) {
          formattedEndHour = hour + 1;
          formattedEndMinute = 0;
        }
        
        const formattedEndMinuteStr = formattedEndMinute === 0 ? '00' : formattedEndMinute;
        
        hourSlots.push({
          id: `${hour}-${segment}`,
          time: `${hour}:${formattedStartMinute} - ${formattedEndHour}:${formattedEndMinuteStr}`,
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

  // 添加一个状态来全局跟踪已复制的任务
  const [copiedTasks, setCopiedTasks] = useState(() => {
    try {
      const savedCopiedTasks = localStorage.getItem('copiedTasks');
      if (savedCopiedTasks) {
        return JSON.parse(savedCopiedTasks);
      }
    } catch (error) {
      console.error('Error loading copied tasks:', error);
    }
    return [];
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
    // 使用Map来存储每个唯一任务的状态
    const taskStatusMap = new Map();

    // 统计时间段任务
    timeSlots.forEach(hourSlots => {
      hourSlots.forEach(slot => {
        if (slot.task) {
          // 解析任务字符串，提取任务和状态
          const taskItems = slot.task.split('\n').filter(item => item.trim() !== '');
          
          taskItems.forEach(taskItem => {
            // 提取任务内容（不包含状态信息）
            const taskContent = taskItem.split(' [STATUS:')[0];
            
            // 提取状态信息
            let status = 'initial';
            if (taskItem.includes('[STATUS:completed]')) {
              status = 'completed';
            } else if (taskItem.includes('[STATUS:failed]')) {
              status = 'failed';
            }
            
            // 更新任务状态Map
            if (!taskStatusMap.has(taskContent)) {
              // 如果是新任务，直接添加状态
              taskStatusMap.set(taskContent, status);
            } else {
              // 如果任务已存在，根据规则更新状态
              const currentStatus = taskStatusMap.get(taskContent);
              
              // 规则1：如果有任何一个实例是completed，则整个任务计为completed
              if (status === 'completed' || currentStatus === 'completed') {
                taskStatusMap.set(taskContent, 'completed');
              }
              // 规则2：如果有任何一个实例是pending，且没有completed，则整个任务计为pending
              else if (status === 'initial' || currentStatus === 'initial') {
                taskStatusMap.set(taskContent, 'initial');
              }
              // 规则3：其他情况（都是failed）保持为failed
            }
          });
        }
      });
    });

    // 统计各状态的任务数量
    let completedTasks = 0;
    let failedTasks = 0;
    let initialTasks = 0;
    
    taskStatusMap.forEach(status => {
      if (status === 'completed') {
        completedTasks++;
      } else if (status === 'failed') {
        failedTasks++;
      } else {
        initialTasks++;
      }
    });

    return {
      total: taskStatusMap.size, // 使用Map的大小作为总任务数
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

  // 找到当前时间对应的时间段
  const findCurrentTimeSlot = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 获取用户设置的时间范围
    const { startHour, endHour, segmentsPerHour } = getUserSettings();
    
    // 检查当前时间是否在用户设置的时间范围内
    if (currentHour < startHour || currentHour >= endHour) {
      return null;
    }
    
    // 计算小时索引（相对于起始时间）
    const hourIndex = currentHour - startHour;
    
    // 计算每个分段的分钟数
    const minutesPerSegment = 60 / segmentsPerHour;
    
    // 确定当前分钟对应的时间段
    const segmentIndex = Math.floor(currentMinute / minutesPerSegment);
    
    return { hourIndex, segmentIndex };
  };

  // 检查当前时间段是否已经包含特定任务
  const isTaskInCurrentTimeSlot = (taskContent) => {
    const currentSlot = findCurrentTimeSlot();
    if (!currentSlot) {
      return false;
    }
    
    const { hourIndex, segmentIndex } = currentSlot;
    const currentSlotTasks = timeSlots[hourIndex][segmentIndex].task;
    
    if (!currentSlotTasks) {
      return false;
    }
    
    // 解析当前时间段的任务
    const currentTaskItems = currentSlotTasks.split('\n').filter(item => item.trim() !== '');
    
    // 检查是否有任务内容匹配
    for (const item of currentTaskItems) {
      // 提取任务内容（不包含状态信息）
      const content = item.split(' [STATUS:')[0];
      if (content === taskContent) {
        return true;
      }
    }
    
    return false;
  };

  // 复制任务到当前时间段
  const copyTaskToCurrent = (taskContent) => {
    const currentSlot = findCurrentTimeSlot();
    if (!currentSlot) {
      console.log('Current time is outside of the schedule range (7:00-22:00)');
      return;
    }
    
    // 检查任务是否已经存在于当前时间段
    if (isTaskInCurrentTimeSlot(taskContent)) {
      console.log(`Task "${taskContent}" is already in the current time slot`);
      return;
    }
    
    const { hourIndex, segmentIndex } = currentSlot;
    
    // 获取当前时间段的任务
    const currentSlotTasks = timeSlots[hourIndex][segmentIndex].task;
    
    // 如果当前时间段已经有任务，则将新任务添加到现有任务后面
    const updatedTask = currentSlotTasks 
      ? `${currentSlotTasks}\n${taskContent}`
      : taskContent;
    
    // 更新当前时间段的任务
    updateTask(hourIndex, segmentIndex, updatedTask);
    
    // 将任务添加到已复制列表 - 保留这部分代码以便跟踪历史记录，但不再用于限制复制
    const newCopiedTasks = [...copiedTasks, taskContent];
    setCopiedTasks(newCopiedTasks);
    
    // 保存到 localStorage
    try {
      localStorage.setItem('copiedTasks', JSON.stringify(newCopiedTasks));
    } catch (error) {
      console.error('Error saving copied tasks:', error);
    }
    
    console.log(`Task copied to current time slot (${hourIndex}, ${segmentIndex}): ${taskContent}`);
  };

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
    
    // 获取用户设置的时间范围
    const { startHour, endHour, segmentsPerHour } = getUserSettings();
    
    // Add header row
    mainContent.push(
      <div className="schedule-row header-row" key="header">
        <div className="daily-task-header">Daily Task</div>
        <div className="time-header">Time</div>
        {Array.from({ length: segmentsPerHour }, (_, i) => {
          const minutesPerSegment = 60 / segmentsPerHour;
          const startMinute = Math.floor(i * minutesPerSegment);
          const endMinute = Math.floor((i + 1) * minutesPerSegment);
          return (
            <div className="segment-header" key={`segment-${i}`}>
              {startMinute}-{endMinute} minutes
            </div>
          );
        })}
      </div>
    );
    
    // Create time slots rows
    const timeSlotRows = [];
    
    // Add rows for each hour
    timeSlots.forEach((hourSlots, hourIndex) => {
      const actualHour = startHour + hourIndex;
      
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
              copyTaskToCurrent={copyTaskToCurrent}
              copiedTasks={copiedTasks}
              isTaskInCurrentTimeSlot={isTaskInCurrentTimeSlot}
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
      
      <button className="reset-button" onClick={resetSchedule}>
        Reset Schedule
      </button>
      
      {resetMessage && <div className="reset-message">{resetMessage}</div>}
      
      <div className="schedule-container">
        <div className="info-container">
          <p className="schedule-description">{formatCurrentTime()}</p>
          <p className="schedule-info">
            Tasks: {getTaskStats().total} | 
            Completed: {getTaskStats().completed} | 
            Failed: {getTaskStats().failed} | 
            Pending: {getTaskStats().initial}
          </p>
        </div>
        {renderTimeSlots()}
      </div>
    </div>
  );
}

export default DailySchedule; 