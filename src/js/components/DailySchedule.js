import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TimeSlot from './TimeSlot';
import TimeLine from './TimeLine';
import DailyTaskSlot from './DailyTaskSlot';
import '../../css/DailySchedule.css';

function DailySchedule() {
  // 常量定义
  const TIME_SLOTS_KEY = 'timeSlots';
  const DAILY_TASKS_KEY = 'dailyTasks';
  const TASK_HISTORY_KEY = 'taskHistory';
  
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
  
  // 初始化状态
  const [timeSlots, setTimeSlots] = useState([]);
  const [resetMessage, setResetMessage] = useState('');
  const [dailyTask, setDailyTask] = useState('');
  const [copiedTasks, setCopiedTasks] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // 设置 CSS 变量和初始化数据
  useEffect(() => {
    const { segmentsPerHour } = getUserSettings();
    document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
    
    // 加载保存的数据
    loadSavedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 在组件的初始化部分，添加获取URL参数的逻辑
  useEffect(() => {
    // 检查URL是否包含日期参数
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam) {
      try {
        // 尝试解析日期参数
        const date = new Date(dateParam);
        if (!isNaN(date.getTime())) {
          // 如果是有效日期，设置为选中日期
          setSelectedDate(date);
        }
      } catch (error) {
        console.error('解析日期参数时出错:', error);
      }
    }
  }, []);

  // 加载保存的数据
  const loadSavedData = () => {
    // 加载日程表数据
    try {
      const savedData = localStorage.getItem('dailySchedule');
      if (savedData) {
        console.log('Found saved schedule data in localStorage');
        const parsedData = JSON.parse(savedData);
        
        // 保存当前任务数据
        const currentTaskData = {};
        parsedData.forEach((hourSlots) => {
          hourSlots.forEach((slot) => {
            if (slot.task) {
              // 使用时间作为键来保存任务
              currentTaskData[slot.time] = slot.task;
            }
          });
        });
        
        // 重新初始化时间槽（确保使用最新设置）
        const freshTimeSlots = initializeTimeSlots();
        
        // 将保存的任务数据映射回新的时间槽
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
      } else {
        // 如果没有保存的数据，则使用默认初始化
        console.log('No saved schedule data found, initializing with default data');
        const freshTimeSlots = initializeTimeSlots();
        setTimeSlots(freshTimeSlots);
      }
    } catch (error) {
      console.error('Error loading saved schedule data:', error);
      // 如果出错，则使用默认初始化
      const freshTimeSlots = initializeTimeSlots();
      setTimeSlots(freshTimeSlots);
    }
    
    // 加载每日任务数据
    try {
      const savedDailyTask = localStorage.getItem('dailyTask');
      if (savedDailyTask) {
        console.log('Found saved daily task in localStorage');
        setDailyTask(savedDailyTask);
      }
    } catch (error) {
      console.error('Error loading saved daily task:', error);
    }
    
    // 加载已复制任务数据
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

  // 监听 localStorage 变化
  useEffect(() => {
    // 定义事件处理函数
    const handleStorageChange = (event) => {
      if (event.key === 'appSettings') {
        console.log('Settings changed, reinitializing time slots...');
        
        // 更新 CSS 变量
        const { segmentsPerHour } = getUserSettings();
        document.documentElement.style.setProperty('--segments-per-hour', segmentsPerHour);
        
        // 保存当前任务数据
        const currentTaskData = {};
        
        // 只有当 timeSlots 有数据时才处理
        if (timeSlots && timeSlots.length > 0) {
          timeSlots.forEach((hourSlots) => {
            hourSlots.forEach((slot) => {
              if (slot.task) {
                // 使用时间作为键来保存任务
                currentTaskData[slot.time] = slot.task;
              }
            });
          });
        }
        
        // 重新初始化时间槽
        const freshTimeSlots = initializeTimeSlots();
        
        // 将保存的任务数据映射回新的时间槽
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
        
        // 保存到 localStorage
        try {
          localStorage.setItem('dailySchedule', JSON.stringify(updatedTimeSlots));
          console.log('Updated time slots saved to localStorage');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots]);

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
          
          taskItems.forEach(item => {
            // 提取任务内容和状态
            const statusMatch = item.match(/\[STATUS:(.*?)\]/);
            if (statusMatch) {
              const status = statusMatch[1];
              // 提取任务内容（不包含状态信息）
              const taskContent = item.replace(/\[STATUS:.*?\]/, '').trim();
              
              // 如果任务已经存在于Map中，只有当新状态优先级更高时才更新
              if (taskStatusMap.has(taskContent)) {
                const currentStatus = taskStatusMap.get(taskContent);
                // 状态优先级: completed > failed > initial
                if (
                  (status === 'completed') || 
                  (status === 'failed' && currentStatus === 'initial')
                ) {
                  taskStatusMap.set(taskContent, status);
                }
              } else {
                // 如果任务不存在于Map中，添加它
                taskStatusMap.set(taskContent, status);
              }
            } else {
              // 如果没有状态信息，将其视为初始状态
              const taskContent = item.trim();
              if (!taskStatusMap.has(taskContent)) {
                taskStatusMap.set(taskContent, 'initial');
              }
            }
          });
        }
      });
    });

    // 计算各种状态的任务数量
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
    // 只有当 timeSlots 有数据时才保存
    if (timeSlots && timeSlots.length > 0) {
      try {
        console.log('Saving timeSlots to localStorage');
        localStorage.setItem('dailySchedule', JSON.stringify(timeSlots));
      } catch (error) {
        console.error('Error saving timeSlots to localStorage:', error);
      }
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

  // 每当 copiedTasks 变化时，保存到 localStorage
  useEffect(() => {
    try {
      console.log('Saving copiedTasks to localStorage');
      localStorage.setItem('copiedTasks', JSON.stringify(copiedTasks));
    } catch (error) {
      console.error('Error saving copiedTasks to localStorage:', error);
    }
  }, [copiedTasks]);

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
      
      // 创建全新的时间段数据，使用当前设置
      const freshTimeSlots = initializeTimeSlots();
      
      // 更新状态
      setTimeSlots(freshTimeSlots);
      setDailyTask('');
      setCopiedTasks([]);
      
      // 清除 localStorage 中的数据
      try {
        localStorage.removeItem('dailySchedule');
        localStorage.removeItem('dailyTask');
        localStorage.removeItem('copiedTasks');
        
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
        localStorage.setItem('copiedTasks', JSON.stringify([]));
        
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

  // 保存当天数据到历史记录
  const saveCurrentDayToHistory = () => {
    // 获取当前日期
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // 格式: YYYY-MM-DD
    
    // 检查当前显示的日期是否是今天
    const currentDate = selectedDate || now;
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    // 如果不是今天的数据，不保存到历史记录
    if (currentDateStr !== today) {
      console.log(`不保存非当天数据到历史记录: ${currentDateStr}`);
      return;
    }
    
    // 获取当前任务统计
    const stats = getTaskStats();
    
    // 创建今天的数据对象
    const todayData = {
      timeSlots: [...timeSlots],
      dailyTasks: dailyTask,
      stats: stats,
      timestamp: now.getTime()
    };
    
    try {
      // 获取现有历史数据
      let historyData = {};
      const savedHistory = localStorage.getItem(TASK_HISTORY_KEY);
      if (savedHistory) {
        historyData = JSON.parse(savedHistory);
      }
      
      // 添加或更新今天的数据
      historyData[today] = todayData;
      
      // 保存回 localStorage
      localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(historyData));
      
      console.log(`已保存 ${today} 的数据到历史记录`);
    } catch (error) {
      console.error('保存历史数据时出错:', error);
    }
  };

  // 每当 timeSlots 或 dailyTask 变化时，保存到历史记录
  useEffect(() => {
    // 只有当数据加载完成后才保存
    if (timeSlots.length > 0) {
      saveCurrentDayToHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots, dailyTask]);

  // Render time slots
  const renderTimeSlots = () => {
    const mainContent = [];
    
    // 获取用户设置的时间范围
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