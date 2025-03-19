import React, { useState, useEffect } from 'react';
import TimeSlot from './TimeSlot';
import TimeLine from './TimeLine';
import DailyTaskSlot from './DailyTaskSlot';
import '../../css/DailySchedule.css';

function DailySchedule() {
  // Constants
  const TASK_HISTORY_KEY = 'taskHistory';
  
  // Get user settings
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

  // Initialize time slot data
  const initializeTimeSlots = () => {
    // Try to read user settings from localStorage
    const { startHour, endHour, segmentsPerHour } = getUserSettings();
    
    const slots = [];
    // Use time range and segments from user settings
    for (let hour = startHour; hour < endHour; hour++) {
      const hourSlots = [];
      // Calculate minutes per segment
      const minutesPerSegment = 60 / segmentsPerHour;
      
      for (let segment = 0; segment < segmentsPerHour; segment++) {
        const startMinute = segment * minutesPerSegment;
        const endMinute = startMinute + minutesPerSegment;
        
        // Format minute display
        const formattedStartMinute = startMinute === 0 ? '00' : startMinute;
        
        // Handle end time, if it's 60 minutes, display as 0 minutes of the next hour
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
  
  // 获取当前日期的格式化字符串 (YYYY-MM-DD)
  const getCurrentDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Initialize state
  const [timeSlots, setTimeSlots] = useState([]);
  const [resetMessage, setResetMessage] = useState('');
  const [dailyTask, setDailyTask] = useState('');
  const [copiedTasks, setCopiedTasks] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDateString] = useState(getCurrentDateString());
  
  // 从 taskHistory 加载今天的数据
  const loadTodayDataFromHistory = () => {
    try {
      const savedHistory = localStorage.getItem(TASK_HISTORY_KEY);
      if (savedHistory) {
        const historyData = JSON.parse(savedHistory);
        const todayData = historyData[currentDateString];
        
        if (todayData) {
          console.log('Found today\'s data in taskHistory');
          
          // 检查当前设置和存储数据的结构是否一致
          const { startHour, endHour, segmentsPerHour } = getUserSettings();
          const storedTimeSlotsStructure = todayData.timeSlots;
          
          // 如果存储的时间槽结构与当前设置不匹配，需要适配数据
          if (storedTimeSlotsStructure.length !== (endHour - startHour)) {
            console.log('Stored data structure doesn\'t match current settings, adapting data...');
            const adaptedTimeSlots = adaptTimeSlotsToCurrentSettings(storedTimeSlotsStructure, todayData.dailyTasks);
            setTimeSlots(adaptedTimeSlots);
            setDailyTask(todayData.dailyTasks);
            
            // 立即将适配后的数据保存回 taskHistory
            saveTodayDataToHistory(adaptedTimeSlots, todayData.dailyTasks);
            return true;
          }
          
          // 结构匹配，直接使用存储的数据
          setTimeSlots(todayData.timeSlots);
          setDailyTask(todayData.dailyTasks);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading today\'s data from history:', error);
      return false;
    }
  };
  
  // 适配时间槽结构到当前设置
  const adaptTimeSlotsToCurrentSettings = (storedTimeSlots, dailyTaskContent) => {
    // 获取当前设置
    const { startHour, endHour, segmentsPerHour } = getUserSettings();
    
    // 初始化新的时间槽结构
    const freshTimeSlots = initializeTimeSlots();
    
    // 创建映射，将存储的任务数据按时间段映射到时间槽
    const taskMap = new Map();
    
    // 遍历存储的时间槽数据，提取任务信息
    storedTimeSlots.forEach((hourSlots, hourIndex) => {
      hourSlots.forEach((slot, segmentIndex) => {
        if (slot.task && slot.task.trim() !== '') {
          // 使用时间作为键来保存任务内容
          taskMap.set(slot.time, slot.task);
        }
      });
    });
    
    // 将任务数据适配到新的时间槽结构
    const adaptedTimeSlots = freshTimeSlots.map(hourSlots => {
      return hourSlots.map(slot => {
        // 检查是否有匹配的时间槽任务
        if (taskMap.has(slot.time)) {
          return { ...slot, task: taskMap.get(slot.time) };
        }
        return slot;
      });
    });
    
    console.log('Time slots adapted to current settings');
    return adaptedTimeSlots;
  };
  
  // 将今天的数据保存到 taskHistory
  const saveTodayDataToHistory = (slots, task) => {
    try {
      // 获取现有的历史数据
      let historyData = {};
      const savedHistory = localStorage.getItem(TASK_HISTORY_KEY);
      if (savedHistory) {
        historyData = JSON.parse(savedHistory);
      }
      
      // 获取当前任务统计
      const stats = getTaskStats(slots);
      
      // 创建要保存的数据对象
      const dataToSave = {
        timeSlots: slots || timeSlots,
        dailyTasks: task || dailyTask,
        stats: stats,
        timestamp: new Date().getTime()
      };
      
      // 添加或更新数据
      historyData[currentDateString] = dataToSave;
      
      // 保存回 localStorage
      localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(historyData));
      
      console.log(`Saved today's data to taskHistory: ${currentDateString}`);
      return true;
    } catch (error) {
      console.error('Error saving today\'s data to history:', error);
      return false;
    }
  };
  
  // Set CSS variables and initialize data
  useEffect(() => {
    const { segmentsPerHour } = getUserSettings();
    document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
    
    // 尝试从 taskHistory 加载今天的数据
    const todayDataLoaded = loadTodayDataFromHistory();
    
    // 如果没有今天的数据，初始化新的数据
    if (!todayDataLoaded) {
      console.log('No data for today in taskHistory, initializing new data');
      const freshTimeSlots = initializeTimeSlots();
      setTimeSlots(freshTimeSlots);
      
      // 直接将初始化的空数据保存到 taskHistory
      saveTodayDataToHistory(freshTimeSlots, '');
    }
    
    // 加载复制的任务数据
    try {
      const savedCopiedTasks = localStorage.getItem('copiedTasks');
      if (savedCopiedTasks) {
        console.log('Found saved copied tasks in localStorage');
        setCopiedTasks(JSON.parse(savedCopiedTasks));
      }
    } catch (error) {
      console.error('Error loading copied tasks:', error);
    }
    
    // Set Service Worker message listener
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Listen for messages from Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('Received Service Worker message:', event.data);
        
        if (event.data && event.data.action === 'SAVE_DAILY_TASKS') {
          console.log('Received Service Worker request to save tasks');
          saveTodayDataToHistory();
        }
      });
      
      // Notify Service Worker to set up daily save task
      navigator.serviceWorker.controller.postMessage({
        action: 'SETUP_DAILY_SAVE'
      });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Task stats function - 传入时间槽参数使其可以用于不同的时间槽数据
  const getTaskStats = (slots = timeSlots) => {
    // Use Map to store status of each unique task
    const taskStatusMap = new Map();

    // Count time slot tasks
    slots.forEach(hourSlots => {
      hourSlots.forEach(slot => {
        if (slot.task) {
          // Parse task string, extract task and status
          const taskItems = slot.task.split('\n').filter(item => item.trim() !== '');
          
          taskItems.forEach(item => {
            // Extract task content and status
            const statusMatch = item.match(/\[STATUS:(.*?)\]/);
            if (statusMatch) {
              const status = statusMatch[1];
              // Extract task content (without status information)
              const taskContent = item.replace(/\[STATUS:.*?\]/, '').trim();
              
              // If task already exists in Map, only update if new status has higher priority
              if (taskStatusMap.has(taskContent)) {
                const currentStatus = taskStatusMap.get(taskContent);
                // Status priority: completed > failed > initial
                if (
                  (status === 'completed') || 
                  (status === 'failed' && currentStatus === 'initial')
                ) {
                  taskStatusMap.set(taskContent, status);
                }
              } else {
                // If task doesn't exist in Map, add it
                taskStatusMap.set(taskContent, status);
              }
            } else {
              // If no status information, treat as initial status
              const taskContent = item.trim();
              if (!taskStatusMap.has(taskContent)) {
                taskStatusMap.set(taskContent, 'initial');
              }
            }
          });
        }
      });
    });

    // Calculate task counts for each status
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
      total: taskStatusMap.size, // Use Map size as total task count
      completed: completedTasks,
      failed: failedTasks,
      initial: initialTasks
    };
  };

  // Update task for a specific time slot
  const updateTask = (hourIndex, segmentIndex, task) => {
    console.log(`Updating task for slot ${hourIndex}-${segmentIndex}:`, task);
    
    const newTimeSlots = [...timeSlots];
    newTimeSlots[hourIndex][segmentIndex].task = task;
    setTimeSlots(newTimeSlots);
    
    // 直接保存到 taskHistory
    saveTodayDataToHistory(newTimeSlots, dailyTask);
  };

  // Update daily task
  const updateDailyTask = (task) => {
    console.log('Updating daily task:', task);
    setDailyTask(task);
    
    // 直接保存到 taskHistory
    saveTodayDataToHistory(timeSlots, task);
  };

  // Find current time slot
  const findCurrentTimeSlot = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Get user settings time range
    const { startHour, endHour, segmentsPerHour } = getUserSettings();
    
    // Check if current time is within user settings time range
    if (currentHour < startHour || currentHour >= endHour) {
      return null;
    }
    
    // Calculate hour index (relative to start time)
    const hourIndex = currentHour - startHour;
    
    // Calculate minutes per segment
    const minutesPerSegment = 60 / segmentsPerHour;
    
    // Determine current minute's time slot
    const segmentIndex = Math.floor(currentMinute / minutesPerSegment);
    
    return { hourIndex, segmentIndex };
  };

  // Check if current time slot already contains specific task
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
    
    // Parse current time slot tasks
    const currentTaskItems = currentSlotTasks.split('\n').filter(item => item.trim() !== '');
    
    // Check if task content matches
    for (const item of currentTaskItems) {
      // Extract task content (without status information)
      const content = item.split(' [STATUS:')[0];
      if (content === taskContent) {
        return true;
      }
    }
    
    return false;
  };

  // Copy task to current time slot
  const copyTaskToCurrent = (taskContent) => {
    const currentSlot = findCurrentTimeSlot();
    if (!currentSlot) {
      console.log('Current time is outside of the schedule range (7:00-22:00)');
      return;
    }
    
    // Check if task already exists in current time slot
    if (isTaskInCurrentTimeSlot(taskContent)) {
      console.log(`Task "${taskContent}" is already in the current time slot`);
      return;
    }
    
    const { hourIndex, segmentIndex } = currentSlot;
    
    // Get current time slot tasks
    const currentSlotTasks = timeSlots[hourIndex][segmentIndex].task;
    
    // If current time slot already has tasks, add new task to existing tasks
    const updatedTask = currentSlotTasks 
      ? `${currentSlotTasks}\n${taskContent}`
      : taskContent;
    
    // Update current time slot tasks
    updateTask(hourIndex, segmentIndex, updatedTask);
    
    // Add task to copied list - keep this code for tracking history, but no longer used for limiting copying
    const newCopiedTasks = [...copiedTasks, taskContent];
    setCopiedTasks(newCopiedTasks);
    
    // Save to localStorage
    try {
      localStorage.setItem('copiedTasks', JSON.stringify(newCopiedTasks));
    } catch (error) {
      console.error('Error saving copied tasks:', error);
    }
    
    console.log(`Task copied to current time slot (${hourIndex}, ${segmentIndex}): ${taskContent}`);
  };

  // Reset the entire schedule
  const resetSchedule = () => {
    const confirmReset = window.confirm('Are you sure you want to reset all time slots? This will clear all tasks and statuses.');
    
    if (confirmReset) {
      console.log('Resetting all time slots and daily task...');
      
      // Create new time slot data, using current settings
      const freshTimeSlots = initializeTimeSlots();
      
      // Update state
      setTimeSlots(freshTimeSlots);
      setDailyTask('');
      setCopiedTasks([]);
      
      // 直接保存到 taskHistory
      saveTodayDataToHistory(freshTimeSlots, '');
      
      // 保存复制的任务
      try {
        localStorage.setItem('copiedTasks', JSON.stringify([]));
      } catch (error) {
        console.error('Error saving copied tasks:', error);
      }
      
      // 显示重置成功消息
      setResetMessage('Schedule has been reset successfully!');
      
      // 3秒后清除消息
      setTimeout(() => {
        setResetMessage('');
      }, 3000);
    }
  };

  // Update current time function
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format current time function
  const formatCurrentTime = () => {
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentTime.getDay()];
    
    return `${year}-${month}-${day}, ${weekday}`;
  };

  // Add save logic before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        // 直接保存到 taskHistory
        saveTodayDataToHistory();
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

  // Add a timer, save daily task records at 23:59 every day
  useEffect(() => {
    // Calculate milliseconds until today 23:59:00
    const calculateTimeUntilEndOfDay = () => {
      const now = new Date();
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        0
      );
      return endOfDay.getTime() - now.getTime();
    };

    // Set timer
    const scheduleEndOfDaySave = () => {
      const timeUntilEndOfDay = calculateTimeUntilEndOfDay();
      console.log(`${Math.floor(timeUntilEndOfDay / 1000 / 60)} minutes until today ends, will save task records at end of day`);
      
      // Set timer to save data at end of day
      const timer = setTimeout(() => {
        console.log('Executing daily task record save');
        
        // 直接保存到 taskHistory
        saveTodayDataToHistory();
        
        // Re-set tomorrow's timer
        setTimeout(scheduleEndOfDaySave, 1000); // 1 second later recalculate tomorrow's time
      }, timeUntilEndOfDay);
      
      return timer;
    };
    
    // Initialize timer
    const timer = scheduleEndOfDaySave();
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array, runs only once when component mounts

  // 添加设置变更监听
  useEffect(() => {
    // 监听localStorage变化事件处理函数
    const handleStorageChange = (event) => {
      if (event.key === 'appSettings') {
        console.log('Settings changed, adapting time slots structure...');
        
        // 重新加载用户设置
        const { segmentsPerHour } = getUserSettings();
        document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
        
        // 重新加载今天的数据（会触发结构适配）
        const todayDataLoaded = loadTodayDataFromHistory();
        
        // 如果没有数据，则创建新结构
        if (!todayDataLoaded) {
          const freshTimeSlots = initializeTimeSlots();
          setTimeSlots(freshTimeSlots);
          
          // 保存新结构到 taskHistory
          saveTodayDataToHistory(freshTimeSlots, dailyTask);
        }
      }
    };
    
    // 添加事件监听器
    window.addEventListener('storage', handleStorageChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyTask]); // 依赖 dailyTask，当它变化时重新设置监听器

  // Render time slots
  const renderTimeSlots = () => {
    const mainContent = [];
    
    // Get user settings time range
    const { startHour, segmentsPerHour } = getUserSettings();
    
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
      
      // Add time line row above each hour
      timeSlotRows.push(
        <div className="time-line-row" key={`timeline-${hourIndex}`}>
          <div className="hour-label"></div>
          <TimeLine hour={actualHour} />
        </div>
      );
      
      // Add time slot row
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
      
      <div className="action-buttons">
        <button className="reset-button" onClick={resetSchedule}>
          Reset Schedule
        </button>
      </div>
      
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