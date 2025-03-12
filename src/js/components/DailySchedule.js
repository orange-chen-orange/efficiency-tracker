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
  
  // Initialize state
  const [timeSlots, setTimeSlots] = useState([]);
  const [resetMessage, setResetMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [dailyTask, setDailyTask] = useState('');
  const [copiedTasks, setCopiedTasks] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Clean up future dates in history data
  const cleanupFutureDates = () => {
    try {
      const savedHistory = localStorage.getItem(TASK_HISTORY_KEY);
      if (savedHistory) {
        const historyData = JSON.parse(savedHistory);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let hasChanges = false;
        const cleanedHistory = {};
        
        Object.keys(historyData).forEach(dateStr => {
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime()) && date < today) {
              cleanedHistory[dateStr] = historyData[dateStr];
            } else {
              console.log(`Deleting future date data: ${dateStr}`);
              hasChanges = true;
            }
          } catch (e) {
            console.error(`Processing date ${dateStr} error:`, e);
            // If date format is invalid, don't keep this data
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(cleanedHistory));
          console.log('Future date data cleared');
          
          // Force refresh history component (if exists)
          if (window.dispatchEvent) {
            window.dispatchEvent(new Event('storage'));
          }
        }
        
        return cleanedHistory;
      }
    } catch (error) {
      console.error('Clearing future date data error:', error);
    }
    return {};
  };
  
  // Set CSS variables and initialize data
  useEffect(() => {
    const { segmentsPerHour } = getUserSettings();
    document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
    
    // Clean up future dates in history data
    cleanupFutureDates();
    
    // Load saved data
    loadSavedData();
    
    // Set Service Worker message listener
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Listen for messages from Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('Received Service Worker message:', event.data);
        
        if (event.data && event.data.action === 'SAVE_DAILY_TASKS') {
          console.log('Received Service Worker request to save tasks');
          saveCurrentDayToHistory();
        }
      });
      
      // Notify Service Worker to set up daily save task
      navigator.serviceWorker.controller.postMessage({
        action: 'SETUP_DAILY_SAVE'
      });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          // If it's a valid date, set it as selected date
          setSelectedDate(date);
        }
      } catch (error) {
        console.error('Error parsing date parameter:', error);
      }
    }
  }, []);

  // Load saved data
  const loadSavedData = () => {
    // Load schedule data
    try {
      const savedData = localStorage.getItem('dailySchedule');
      if (savedData) {
        console.log('Found saved schedule data in localStorage');
        const parsedData = JSON.parse(savedData);
        
        // Save current task data
        const currentTaskData = {};
        parsedData.forEach((hourSlots) => {
          hourSlots.forEach((slot) => {
            if (slot.task) {
              // Use time as key to save task
              currentTaskData[slot.time] = slot.task;
            }
          });
        });
        
        // Reinitialize time slots (ensure using latest settings)
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
      } else {
        // If no saved data, use default initialization
        console.log('No saved schedule data found, initializing with default data');
        const freshTimeSlots = initializeTimeSlots();
        setTimeSlots(freshTimeSlots);
      }
    } catch (error) {
      console.error('Error loading saved schedule data:', error);
      // If error, use default initialization
      const freshTimeSlots = initializeTimeSlots();
      setTimeSlots(freshTimeSlots);
    }
    
    // Load daily task data
    try {
      const savedDailyTask = localStorage.getItem('dailyTask');
      if (savedDailyTask) {
        console.log('Found saved daily task in localStorage');
        setDailyTask(savedDailyTask);
      }
    } catch (error) {
      console.error('Error loading saved daily task:', error);
    }
    
    // Load copied task data
    try {
      const savedCopiedTasks = localStorage.getItem('copiedTasks');
      if (savedCopiedTasks) {
        console.log('Found saved copied tasks in localStorage');
        setCopiedTasks(JSON.parse(savedCopiedTasks));
      }
    } catch (error) {
      console.error('Error loading copied tasks:', error);
    }
  };

  // Listen for localStorage changes
  useEffect(() => {
    // Define event handler function
    const handleStorageChange = (event) => {
      if (event.key === 'appSettings') {
        console.log('Settings changed, reinitializing time slots...');
        
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
        
        // Save to localStorage
        try {
          localStorage.setItem('dailySchedule', JSON.stringify(updatedTimeSlots));
          console.log('Updated time slots saved to localStorage');
        } catch (error) {
          console.error('Error saving new time slots:', error);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots]);

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

  // Whenever timeSlots change, save to localStorage
  useEffect(() => {
    // Only save if timeSlots has data
    if (timeSlots && timeSlots.length > 0) {
      try {
        console.log('Saving timeSlots to localStorage');
        localStorage.setItem('dailySchedule', JSON.stringify(timeSlots));
      } catch (error) {
        console.error('Error saving timeSlots to localStorage:', error);
      }
    }
  }, [timeSlots]);

  // Whenever dailyTask changes, save to localStorage
  useEffect(() => {
    try {
      console.log('Saving dailyTask to localStorage');
      localStorage.setItem('dailyTask', dailyTask);
    } catch (error) {
      console.error('Error saving dailyTask to localStorage:', error);
    }
  }, [dailyTask]);

  // Whenever copiedTasks change, save to localStorage
  useEffect(() => {
    try {
      console.log('Saving copiedTasks to localStorage');
      localStorage.setItem('copiedTasks', JSON.stringify(copiedTasks));
    } catch (error) {
      console.error('Error saving copiedTasks to localStorage:', error);
    }
  }, [copiedTasks]);

  // Add save logic before page unload
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
    console.log(`Updating task for slot ${hourIndex}-${segmentIndex}:`, task);
    
    const newTimeSlots = [...timeSlots];
    newTimeSlots[hourIndex][segmentIndex].task = task;
    setTimeSlots(newTimeSlots);
    
    // Save immediately to localStorage
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
    
    // Save immediately to localStorage
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
      
      // Create new time slot data, using current settings
      const freshTimeSlots = initializeTimeSlots();
      
      // Update state
      setTimeSlots(freshTimeSlots);
      setDailyTask('');
      setCopiedTasks([]);
      
      // Clear localStorage data
      try {
        localStorage.removeItem('dailySchedule');
        localStorage.removeItem('dailyTask');
        localStorage.removeItem('copiedTasks');
        
        // Clear all related local storage data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('task_') || key.startsWith('status_')) {
            localStorage.removeItem(key);
          }
        });
        
        // Re-save empty data
        localStorage.setItem('dailySchedule', JSON.stringify(freshTimeSlots));
        localStorage.setItem('dailyTask', '');
        localStorage.setItem('copiedTasks', JSON.stringify([]));
        
        console.log('All tasks and schedule data have been reset');
        
        // Show reset success message
        setResetMessage('Schedule has been reset successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setResetMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error resetting data:', error);
      }
    }
  };

  // Save current day data to history
  const saveCurrentDayToHistory = (specificDate = null) => {
    // Get current date or specified date
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Today's date
    
    // If specific date provided, use it; otherwise use today's date
    const dateToSave = specificDate || today;
    
    // If no specific date provided (i.e., normal save current day data), check if current displayed date is today
    if (!specificDate) {
      const currentDate = selectedDate || now;
      const currentDateStr = currentDate.toISOString().split('T')[0];
      
      // If not today's data, don't save to history
      if (currentDateStr !== today) {
        console.log(`Not saving non-current day data to history: ${currentDateStr}`);
        setSaveMessage('Can only save task records for today!');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }
    }
    
    // Get current task stats
    const stats = getTaskStats();
    
    // Create data object
    const dataToSave = {
      timeSlots: [...timeSlots],
      dailyTasks: dailyTask,
      stats: stats,
      timestamp: now.getTime()
    };
    
    try {
      // Get existing history data
      let historyData = {};
      const savedHistory = localStorage.getItem(TASK_HISTORY_KEY);
      if (savedHistory) {
        historyData = JSON.parse(savedHistory);
      }
      
      // Add or update data
      historyData[dateToSave] = dataToSave;
      
      // Save back to localStorage
      localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(historyData));
      
      // Update last save date
      localStorage.setItem('lastSaveDate', today);
      
      console.log(`Saved ${dateToSave} data to history`);
      
      // Show save success message (only when manually saving)
      if (!specificDate) {
        setSaveMessage('Task record saved to history successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving history data:', error);
      
      // Show save failure message (only when manually saving)
      if (!specificDate) {
        setSaveMessage('Save failed, please try again!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }
  };

  // Check if need to save previous day's data
  useEffect(() => {
    // Only execute if timeSlots has been loaded
    if (timeSlots.length === 0) return;

    // Get current date
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get last save date
    const lastSaveDate = localStorage.getItem('lastSaveDate');
    
    if (!lastSaveDate || lastSaveDate !== today) {
      // Calculate previous day's date
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Check if there's previous day's data to save
      const savedData = localStorage.getItem('dailySchedule');
      const savedDailyTask = localStorage.getItem('dailyTask');
      
      if (savedData && savedDailyTask) {
        console.log(`Detected previous day (${yesterdayStr}) data not saved, saving...`);
        
        // Temporary save current state
        const currentTimeSlots = [...timeSlots];
        const currentDailyTask = dailyTask;
        
        try {
          // Load previous day's data
          const parsedData = JSON.parse(savedData);
          setTimeSlots(parsedData);
          setDailyTask(savedDailyTask);
          
          // Save previous day's data to history
          setTimeout(() => {
            saveCurrentDayToHistory(yesterdayStr);
            
            // Restore current state
            setTimeSlots(currentTimeSlots);
            setDailyTask(currentDailyTask);
            
            // Update last save date to today
            localStorage.setItem('lastSaveDate', today);
            
            console.log(`Successfully saved previous day (${yesterdayStr}) data to history`);
          }, 500);
        } catch (error) {
          console.error('Error saving previous day data:', error);
        }
      } else {
        // If no previous day's data, directly update last save date to today
        localStorage.setItem('lastSaveDate', today);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots.length]); // Only depend on timeSlots.length, avoid circular dependency

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
        
        // Get current date
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Save current day data
        saveCurrentDayToHistory(today);
        
        // Update last save date
        localStorage.setItem('lastSaveDate', today);
        
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
      {saveMessage && <div className="save-message">{saveMessage}</div>}
      
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