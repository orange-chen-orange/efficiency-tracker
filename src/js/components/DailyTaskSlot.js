import React, { useState, useEffect, useCallback } from 'react';
import '../../css/DailyTaskSlot.css';

function DailyTaskSlot({ time, task, onTaskChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [containerStatus, setContainerStatus] = useState('initial');

  // Status constants
  const STATUS_INITIAL = 'initial';
  const STATUS_COMPLETED = 'completed';
  const STATUS_FAILED = 'failed';
  const STATUS_MIXED = 'mixed';

  // Extract tasks and statuses from task string
  useEffect(() => {
    console.log(`DailyTaskSlot for ${time} received task:`, task);
    
    if (task) {
      // If the task string contains newlines, split it into multiple tasks
      const taskItems = task.split('\n').filter(item => item.trim() !== '');
      console.log('Task items after split:', taskItems);
      
      // Extract status information if available
      const extractedTasks = [];
      const extractedStatuses = [];
      
      taskItems.forEach(item => {
        const statusMatch = item.match(/\[STATUS:(.*?)\]/);
        if (statusMatch) {
          const status = statusMatch[1];
          const taskText = item.replace(/\[STATUS:.*?\]/, '').trim();
          extractedTasks.push(taskText);
          extractedStatuses.push(status);
        } else {
          extractedTasks.push(item);
          extractedStatuses.push(STATUS_INITIAL);
        }
      });
      
      console.log('Extracted tasks:', extractedTasks);
      console.log('Extracted statuses:', extractedStatuses);
      
      setTasks(extractedTasks);
      setTaskStatuses(extractedStatuses);
    } else {
      // 如果 task 为空，清空任务列表和状态
      console.log('Task is empty, clearing tasks and statuses');
      setTasks([]);
      setTaskStatuses([]);
      setContainerStatus(STATUS_INITIAL);
    }
  }, [task, STATUS_INITIAL, time]);

  // 更新容器状态
  useEffect(() => {
    updateContainerStatus(taskStatuses);
  }, [taskStatuses]);

  // 检查所有任务状态并更新容器背景色
  const updateContainerStatus = (statuses) => {
    if (statuses.length === 0) {
      // 如果没有任务，设置为初始状态
      setContainerStatus(STATUS_INITIAL);
      return;
    }
    
    // 检查是否所有任务都是同一状态
    const allCompleted = statuses.every(status => status === STATUS_COMPLETED);
    const allFailed = statuses.every(status => status === STATUS_FAILED);
    const allInitial = statuses.every(status => status === STATUS_INITIAL);
    
    if (allCompleted) {
      setContainerStatus(STATUS_COMPLETED);
    } else if (allFailed) {
      setContainerStatus(STATUS_FAILED);
    } else if (allInitial) {
      setContainerStatus(STATUS_INITIAL);
    } else {
      // 混合状态
      setContainerStatus(STATUS_MIXED);
    }
  };

  // Combine tasks and statuses into a string
  const combineTasksAndStatuses = useCallback((tasks, statuses) => {
    console.log('Combining tasks and statuses:');
    console.log('Tasks:', tasks);
    console.log('Statuses:', statuses);
    
    const result = tasks.map((task, index) => {
      const status = statuses[index] || STATUS_INITIAL;
      return `${task} [STATUS:${status}]`;
    }).join('\n');
    
    console.log('Combined result:', result);
    return result;
  }, [STATUS_INITIAL]);

  // Handle task input change
  const handleTaskChange = (e) => {
    setCurrentTask(e.target.value);
  };

  // Handle pressing Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveTask();
    }
  };

  // Save task
  const saveTask = () => {
    console.log('Saving task:', currentTask);
    console.log('Current editing state:', isEditing);
    
    if (currentTask.trim()) {
      const newTasks = [...tasks];
      const newStatuses = [...taskStatuses];
      
      if (isEditing === true) {
        // Add new task (when isEditing is true but not a number)
        console.log('Adding new task');
        newTasks.push(currentTask);
        newStatuses.push(STATUS_INITIAL);
      } else if (typeof isEditing === 'number') {
        // Edit task at specific index
        console.log(`Editing task at index ${isEditing}`);
        newTasks[isEditing] = currentTask;
      } else {
        // Add new task (fallback)
        console.log('Adding new task (fallback)');
        newTasks.push(currentTask);
        newStatuses.push(STATUS_INITIAL);
      }
      
      console.log('New tasks after edit:', newTasks);
      console.log('New statuses after edit:', newStatuses);
      
      setTasks(newTasks);
      setTaskStatuses(newStatuses);
      
      // Combine tasks and status information into a string
      const combinedTaskString = combineTasksAndStatuses(newTasks, newStatuses);
      console.log('Calling onTaskChange with:', combinedTaskString);
      onTaskChange(combinedTaskString);
      
      // 更新容器状态
      updateContainerStatus(newStatuses);
    } else {
      console.log('Task is empty, not saving');
    }
    setIsEditing(false);
    setCurrentTask('');
  };

  // Handle task status change
  const handleTaskStatusChange = (index, newStatus) => {
    const newStatuses = [...taskStatuses];
    
    // 如果点击的是当前状态，切换回初始状态
    if (newStatuses[index] === newStatus) {
      newStatuses[index] = STATUS_INITIAL;
    } else {
      newStatuses[index] = newStatus;
    }
    
    setTaskStatuses(newStatuses);
    
    // Combine tasks and status information into a string
    const combinedTaskString = combineTasksAndStatuses(tasks, newStatuses);
    onTaskChange(combinedTaskString);
    
    // 更新容器状态
    updateContainerStatus(newStatuses);
  };

  // Add new task
  const addNewTask = () => {
    setCurrentTask(''); // 确保输入框为空
    setIsEditing(true); // 进入编辑模式
  };

  // Edit task
  const editTask = (index) => {
    setCurrentTask(tasks[index]);
    setIsEditing(index);
  };

  // Delete task
  const deleteTask = (index) => {
    const newTasks = [...tasks];
    const newStatuses = [...taskStatuses];
    
    newTasks.splice(index, 1);
    newStatuses.splice(index, 1);
    
    setTasks(newTasks);
    setTaskStatuses(newStatuses);
    
    // Combine tasks and status information into a string
    const combinedTaskString = combineTasksAndStatuses(newTasks, newStatuses);
    onTaskChange(combinedTaskString);
    
    // 更新容器状态
    updateContainerStatus(newStatuses);
  };

  // Render tasks
  const renderTasks = () => {
    return tasks.map((task, index) => (
      <div 
        key={index} 
        className={`task-item status-${taskStatuses[index]}`}
      >
        <div className="task-status-controls">
          <button 
            className={`status-btn ${taskStatuses[index] === STATUS_COMPLETED ? 'active' : ''}`}
            onClick={() => handleTaskStatusChange(index, STATUS_COMPLETED)}
            title="Completed"
          >
            ✅
          </button>
          <button 
            className={`status-btn ${taskStatuses[index] === STATUS_FAILED ? 'active' : ''}`}
            onClick={() => handleTaskStatusChange(index, STATUS_FAILED)}
            title="Failed"
          >
            ❌
          </button>
        </div>
        <div 
          className="task-content"
          onClick={() => editTask(index)}
        >
          {task}
        </div>
        <button 
          className="delete-task-btn"
          onClick={() => deleteTask(index)}
        >
          ×
        </button>
      </div>
    ));
  };

  return (
    <div className={`daily-task-slot status-${containerStatus}`}>
      <div className="task-container">
        {/* 任务列表部分 */}
        {tasks.length > 0 && (
          <div className="tasks-list">
            {renderTasks()}
          </div>
        )}
        
        {/* 编辑框部分 */}
        {isEditing !== false ? (
          <div className="task-edit">
            <input
              type="text"
              value={currentTask}
              onChange={handleTaskChange}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button onClick={saveTask}>Save</button>
          </div>
        ) : (
          /* 添加按钮部分 */
          <button 
            className="add-task-btn"
            onClick={addNewTask}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

export default DailyTaskSlot; 