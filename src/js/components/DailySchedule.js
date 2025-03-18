import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// 修复timeSlots键的一致性问题，确保所有键都是字符串类型

import TimeSlot from './TimeSlot';
import TimeLine from './TimeLine';
import DailyTaskSlot from './DailyTaskSlot';
import '../../css/DailySchedule.css';

// 添加一个获取本地日期字符串的辅助函数
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function DailySchedule() {
  // Constants
  const HISTORY_KEY = 'taskHistory';
  
  // Get user settings
  const getUserSettings = () => {
    let startHour = 7;
    let endHour = 22;
    const segmentsPerHour = 3; // 固定为3，不再从设置中读取
    
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        startHour = settings.startHour;
        endHour = settings.endHour;
        // 不再读取segmentsPerHour，使用固定值3
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
  
  // Initialize state
  const [timeSlots, setTimeSlots] = useState([]);
  const [resetMessage, setResetMessage] = useState('');
  const [dailyTask, setDailyTask] = useState('');
  const [copiedTasks, setCopiedTasks] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Clean up future dates in history data
  const cleanupFutureDates = () => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        // 直接返回解析后的历史数据，不再删除任何日期的数据
        return JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Error parsing history data:', error);
    }
    return {};
  };
  
  // 清理旧的存储数据
  const cleanupOldStorageData = () => {
    try {
      // 删除旧的 dailySchedule 数据，因为现在我们只使用 taskHistory
      if (localStorage.getItem('dailySchedule')) {
        localStorage.removeItem('dailySchedule');
        console.log('Removed old dailySchedule data');
      }
      
      // 删除其他可能不再需要的旧数据
      const oldKeys = ['dailyTask']; // 可以添加其他旧的键
      
      oldKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`Removed old ${key} data`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old storage data:', error);
    }
  };
  
  // Set CSS variables and initialize data
  useEffect(() => {
    const { segmentsPerHour } = getUserSettings();
    document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
    
    // Clean up future dates in history data
    cleanupFutureDates();
    
    // 清理旧的存储数据
    cleanupOldStorageData();
    
    // Load saved data
    loadSavedData();
    
    // Set Service Worker message listener
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Listen for messages from Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('Received Service Worker message:', event.data);
        
        if (event.data && event.data.action === 'SAVE_DAILY_TASKS') {
          console.log('Received Service Worker request to save tasks');
          // 不再需要调用 saveCurrentDayToHistory，因为数据已经实时保存在历史记录中
          // 只需要更新 lastSaveDate
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem('lastSaveDate', today);
        }
      });
      
      // Notify Service Worker to set up daily save task
      navigator.serviceWorker.controller.postMessage({
        action: 'SETUP_DAILY_SAVE'
      });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 添加一个专门用于监听组件可见性变化的useEffect
  // 当用户从设置页面切换回来时，重新检查时间范围并更新时间槽
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        console.log('DailySchedule component is now visible, checking for settings changes...');
        // 获取当前存储的设置
        const { startHour, endHour } = getUserSettings();
        
        // 检查时间槽数量是否与设置匹配
        let shouldReinitialize = false;
        
        // 如果时间槽为空或时间范围与当前不匹配，则重新初始化
        if (!timeSlots || timeSlots.length === 0) {
          shouldReinitialize = true;
        } else {
          // 计算基于当前设置应该有的时间槽数量
          const expectedHours = endHour - startHour;
          if (timeSlots.length !== expectedHours) {
            shouldReinitialize = true;
          }
        }
        
        if (shouldReinitialize) {
          console.log('Settings have changed, reinitializing time slots...');
          // 保存当前任务数据到临时映射
          const currentTaskData = {};
          
          // 只在时间槽有数据时处理
          if (timeSlots && timeSlots.length > 0) {
            timeSlots.forEach((hourSlots) => {
              hourSlots.forEach((slot) => {
                if (slot.task) {
                  // 使用时间作为键保存任务
                  currentTaskData[slot.time] = slot.task;
                }
              });
            });
          }
          
          // 重新初始化时间槽
          const freshTimeSlots = initializeTimeSlots();
          
          // 将保存的任务数据映射到新时间槽
          const updatedTimeSlots = freshTimeSlots.map((hourSlots) => {
            return hourSlots.map((slot) => {
              // 检查是否有匹配的时间槽任务
              if (currentTaskData[slot.time]) {
                return { ...slot, task: currentTaskData[slot.time] };
              }
              return slot;
            });
          });
          
          // 更新状态
          setTimeSlots(updatedTimeSlots);
          
          // 更新今天的历史数据
          try {
            const today = getLocalDateString();
            let historyData = {};
            
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            if (savedHistory) {
              historyData = JSON.parse(savedHistory);
            }
            
            // 更新今天的数据
            if (historyData[today]) {
              historyData[today].timeSlots = updatedTimeSlots;
              historyData[today].timestamp = Date.now();
              historyData[today].stats = calculateStats(updatedTimeSlots);
            } else {
              // 如果今天的数据不存在，创建新数据
              historyData[today] = {
                timeSlots: updatedTimeSlots,
                dailyTasks: dailyTask,
                stats: calculateStats(updatedTimeSlots),
                timestamp: Date.now()
              };
            }
            
            // 保存到历史记录
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
            console.log('Updated time slots saved to history');
          } catch (error) {
            console.error('Error saving new time slots to history:', error);
          }
        }
      }
    }
    
    // 首次运行检查
    handleVisibilityChange();
    
    // 添加可见性变更事件监听器
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // 清理函数
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timeSlots, dailyTask]);

  // Add URL parameter handling logic in component initialization
  useEffect(() => {
    // Check if URL contains date parameter
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam) {
      try {
        // Try to parse date parameter
        const date = new Date(dateParam);
        if (!isNaN(date.getTime())) {
          // 不再设置 selectedDate，而是直接加载指定日期的数据
          console.log(`Date parameter detected: ${dateParam}`);
          // 这里可以添加加载特定日期数据的逻辑，如果需要的话
        }
      } catch (error) {
        console.error('Error parsing date parameter:', error);
      }
    }
  }, []);

  // Load saved data
  const loadSavedData = () => {
    const today = getLocalDateString();
    
    try {
      // 从历史记录中加载今天的数据
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const historyData = JSON.parse(savedHistory);
        
        // 检查今天的数据是否存在
        if (historyData[today]) {
          // 加载时间槽数据
          if (historyData[today].timeSlots && historyData[today].timeSlots.length > 0) {
            setTimeSlots([...historyData[today].timeSlots]);
          } else {
            // 如果没有时间槽数据，初始化
            const initialSlots = initializeTimeSlots();
            setTimeSlots(initialSlots);
            
            // 更新历史记录中的时间槽数据
            historyData[today].timeSlots = initialSlots;
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
          }
          
          // 加载每日任务
          if (historyData[today].dailyTasks) {
            setDailyTask(historyData[today].dailyTasks);
          }
        } else {
          // 如果今天的数据不存在，创建新数据
          const initialSlots = initializeTimeSlots();
          setTimeSlots(initialSlots);
          
          // 创建今天的数据
          historyData[today] = {
            timeSlots: initialSlots,
            dailyTasks: '',
            stats: calculateStats(initialSlots),
            timestamp: Date.now()
          };
          
          localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
        }
      } else {
        // 如果没有历史记录，创建新的历史记录
        const initialSlots = initializeTimeSlots();
        setTimeSlots(initialSlots);
        
        // 创建新的历史记录
        const newHistory = {
          [today]: {
            timeSlots: initialSlots,
            dailyTasks: '',
            stats: calculateStats(initialSlots),
            timestamp: Date.now()
          }
        };
        
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      }
      
      // 加载已复制的任务
      try {
        const savedCopiedTasks = localStorage.getItem('copiedTasks');
        if (savedCopiedTasks) {
          setCopiedTasks(JSON.parse(savedCopiedTasks));
        }
      } catch (error) {
        console.error('Error loading copied tasks:', error);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      
      // 如果出错，使用默认初始化
      const initialSlots = initializeTimeSlots();
      setTimeSlots(initialSlots);
    }
  };

  // Listen for localStorage changes
  useEffect(() => {
    // Define event handler function
    const handleStorageChange = (event) => {
      if (event.key === 'appSettings') {
        console.log('Settings changed via storage event, reinitializing time slots...');
        
        // Update CSS variables
        const { segmentsPerHour } = getUserSettings();
        document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
        
        // Save current task data
        const currentTaskData = {};
        
        // Only process if timeSlots has data
        if (timeSlots && timeSlots.length > 0) {
          timeSlots.forEach((hourSlots) => {
            hourSlots.forEach((slot) => {
              if (slot.task) {
                // Use time as key to save task
                currentTaskData[slot.time] = slot.task;
              }
            });
          });
        }
        
        // Reinitialize time slots
        const freshTimeSlots = initializeTimeSlots();
        
        // Map saved task data to new time slots
        const updatedTimeSlots = freshTimeSlots.map((hourSlots) => {
          return hourSlots.map((slot) => {
            // Check if there's a matching time slot task
            if (currentTaskData[slot.time]) {
              return { ...slot, task: currentTaskData[slot.time] };
            }
            return slot;
          });
        });
        
        // Update state
        setTimeSlots(updatedTimeSlots);
        
        // 更新今天的历史数据，而不是保存到 dailySchedule
        try {
          const today = getLocalDateString();
          let historyData = {};
          
          const savedHistory = localStorage.getItem(HISTORY_KEY);
          if (savedHistory) {
            historyData = JSON.parse(savedHistory);
          }
          
          // 更新今天的数据
          if (historyData[today]) {
            historyData[today].timeSlots = updatedTimeSlots;
            historyData[today].timestamp = Date.now();
            historyData[today].stats = calculateStats(updatedTimeSlots);
          } else {
            // 如果今天的数据不存在，创建新数据
            historyData[today] = {
              timeSlots: updatedTimeSlots,
              dailyTasks: dailyTask,
              stats: calculateStats(updatedTimeSlots),
              timestamp: Date.now()
            };
          }
          
          // 保存到历史记录
          localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
          console.log('Updated time slots saved to history');
        } catch (error) {
          console.error('Error saving new time slots to history:', error);
        }
      }
    };
    
    // 添加处理自定义事件的函数
    const handleSettingsChanged = (event) => {
      console.log('Settings changed via custom event, reinitializing time slots...', event.detail);
      
      // 更新CSS变量
      const { segmentsPerHour } = getUserSettings();
      document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
      
      // 保存当前任务数据
      const currentTaskData = {};
      
      // 只在时间槽有数据时处理
      if (timeSlots && timeSlots.length > 0) {
        timeSlots.forEach((hourSlots) => {
          hourSlots.forEach((slot) => {
            if (slot.task) {
              // 使用时间作为键保存任务
              currentTaskData[slot.time] = slot.task;
            }
          });
        });
      }
      
      // 重新初始化时间槽
      const freshTimeSlots = initializeTimeSlots();
      
      // 将保存的任务数据映射到新时间槽
      const updatedTimeSlots = freshTimeSlots.map((hourSlots) => {
        return hourSlots.map((slot) => {
          // 检查是否有匹配的时间槽任务
          if (currentTaskData[slot.time]) {
            return { ...slot, task: currentTaskData[slot.time] };
          }
          return slot;
        });
      });
      
      // 更新状态
      setTimeSlots(updatedTimeSlots);
      
      // 更新今天的历史数据
      try {
        const today = getLocalDateString();
        let historyData = {};
        
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) {
          historyData = JSON.parse(savedHistory);
        }
        
        // 更新今天的数据
        if (historyData[today]) {
          historyData[today].timeSlots = updatedTimeSlots;
          historyData[today].timestamp = Date.now();
          historyData[today].stats = calculateStats(updatedTimeSlots);
        } else {
          // 如果今天的数据不存在，创建新数据
          historyData[today] = {
            timeSlots: updatedTimeSlots,
            dailyTasks: dailyTask,
            stats: calculateStats(updatedTimeSlots),
            timestamp: Date.now()
          };
        }
        
        // 保存到历史记录
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
        console.log('Updated time slots saved to history');
      } catch (error) {
        console.error('Error saving new time slots to history:', error);
      }
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsChanged', handleSettingsChanged);
    
    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsChanged', handleSettingsChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots, dailyTask]);

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

  // Task stats function
  const getTaskStats = () => {
    // Use Map to store status of each unique task
    const taskStatusMap = new Map();

    // Count time slot tasks
    timeSlots.forEach(hourSlots => {
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

  // 计算任务统计信息的函数，用于历史数据
  const calculateStats = (slots) => {
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

  // Update task for a specific time slot
  const updateTask = (hourIndex, segmentIndex, task) => {
    const today = getLocalDateString();
    let historyData = {};
    
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        historyData = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Error loading history data:', error);
    }
    
    // 更新今天的数据
    if (historyData[today]) {
      // 确保 timeSlots 数组存在且有足够的元素
      if (!historyData[today].timeSlots) {
        historyData[today].timeSlots = timeSlots.length > 0 ? [...timeSlots] : initializeTimeSlots();
      }
      
      // 确保 hourIndex 和 segmentIndex 有效
      if (historyData[today].timeSlots[hourIndex] && 
          historyData[today].timeSlots[hourIndex][segmentIndex]) {
        historyData[today].timeSlots[hourIndex][segmentIndex].task = task;
        historyData[today].timestamp = Date.now();
        
        // 更新统计信息
        historyData[today].stats = calculateStats(historyData[today].timeSlots);
        
        // 保存到 localStorage
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
        
        // 更新状态
        setTimeSlots([...historyData[today].timeSlots]);
      }
    } else {
      // 如果今天的数据不存在，先创建
      const newTimeSlots = timeSlots.length > 0 ? [...timeSlots] : initializeTimeSlots();
      
      // 更新特定时间槽的任务
      if (newTimeSlots[hourIndex] && newTimeSlots[hourIndex][segmentIndex]) {
        newTimeSlots[hourIndex][segmentIndex].task = task;
      }
      
      const newData = {
        timeSlots: newTimeSlots,
        dailyTasks: dailyTask,
        stats: calculateStats(newTimeSlots),
        timestamp: Date.now()
      };
      
      historyData[today] = newData;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
      
      // 更新状态
      setTimeSlots([...newTimeSlots]);
    }
  };

  // Update daily task
  const updateDailyTask = (task) => {
    // 添加日期调试信息
    const now = new Date();
    const localDateStr = getLocalDateString(now); // 使用辅助函数获取本地日期
    console.log('当前日期信息:', {
      '本地时间': now.toString(),
      '本地日期': localDateStr,
      '时区偏移(分钟)': now.getTimezoneOffset()
    });
    
    const today = localDateStr;
    let historyData = {};
    
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        historyData = JSON.parse(savedHistory);
        console.log('历史数据中的日期:', Object.keys(historyData));
      }
    } catch (error) {
      console.error('Error loading history data:', error);
    }
    
    // 更新今天的数据
    if (historyData[today]) {
      historyData[today].dailyTasks = task;
      historyData[today].timestamp = Date.now();
      
      // 保存到 localStorage
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
      console.log(`更新了${today}的数据`);
      
      // 更新状态
      setDailyTask(task);
    } else {
      // 如果今天的数据不存在，先创建
      const newData = {
        timeSlots: timeSlots.length > 0 ? timeSlots : initializeTimeSlots(),
        dailyTasks: task,
        stats: calculateStats(timeSlots.length > 0 ? timeSlots : initializeTimeSlots()),
        timestamp: Date.now()
      };
      
      historyData[today] = newData;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
      console.log(`创建了${today}的新数据`);
      
      // 更新状态
      setDailyTask(task);
    }
  };

  // Reset the entire schedule
  const resetSchedule = () => {
    const confirmReset = window.confirm('Are you sure you want to reset all time slots? This will clear all tasks and statuses.');
    
    if (confirmReset) {
      // 添加日期调试信息
      const now = new Date();
      const localDateStr = getLocalDateString(now); // 使用辅助函数获取本地日期
      console.log('重置时的日期信息:', {
        '本地时间': now.toString(),
        '本地日期': localDateStr,
        '时区偏移(分钟)': now.getTimezoneOffset()
      });
      
      const today = localDateStr;
      
      // 创建新的时间槽数据
      const initialSlots = initializeTimeSlots();
      
      try {
        // 从历史记录中加载数据
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        let historyData = {};
        
        if (savedHistory) {
          historyData = JSON.parse(savedHistory);
          console.log('重置前历史数据中的日期:', Object.keys(historyData));
        }
        
        // 更新今天的数据
        historyData[today] = {
          timeSlots: initialSlots,
          dailyTasks: '',
          stats: calculateStats(initialSlots),
          timestamp: Date.now()
        };
        
        // 保存到历史记录
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
        console.log(`重置并更新了${today}的数据`);
        
        // 清除已复制的任务
        localStorage.removeItem('copiedTasks');
        
        // 更新状态
        setTimeSlots(initialSlots);
        setDailyTask('');
        setCopiedTasks([]);
        
        // 显示重置成功消息
        setResetMessage('Schedule has been reset successfully!');
        setTimeout(() => {
          setResetMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error resetting schedule:', error);
        
        // 如果出错，仍然更新状态
        setTimeSlots(initialSlots);
        setDailyTask('');
        setCopiedTasks([]);
      }
    }
  };

  // 修改检查前一天数据的 useEffect
  useEffect(() => {
    // 只在组件挂载时执行一次
    const checkPreviousDayData = () => {
      // 获取当前日期
      const today = getLocalDateString();
      
      // 获取上次保存日期
      const lastSaveDate = localStorage.getItem('lastSaveDate');
      
      // 如果上次保存日期不是今天，更新为今天
      if (!lastSaveDate || lastSaveDate !== today) {
        localStorage.setItem('lastSaveDate', today);
      }
    };
    
    // 执行检查
    checkPreviousDayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 修改定时保存的 useEffect
  useEffect(() => {
    // 计算到今天结束的毫秒数
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

    // 设置定时器
    const scheduleEndOfDaySave = () => {
      const timeUntilEndOfDay = calculateTimeUntilEndOfDay();
      
      // 设置定时器，在一天结束时更新 lastSaveDate
      const timer = setTimeout(() => {
        // 获取当前日期
        const today = getLocalDateString();
        
        // 更新上次保存日期
        localStorage.setItem('lastSaveDate', today);
        
        // 重新设置明天的定时器
        setTimeout(scheduleEndOfDaySave, 1000); // 1 秒后重新计算明天的时间
      }, timeUntilEndOfDay);
      
      return timer;
    };
    
    // 初始化定时器
    const timer = scheduleEndOfDaySave();
    
    // 清理函数
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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