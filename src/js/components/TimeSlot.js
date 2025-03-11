import React, { useState, useEffect, useCallback } from 'react';
import '../../css/TimeSlot.css';

function TimeSlot({ time, task, onTaskChange, copyTaskToCurrent, copiedTasks = [], isTaskInCurrentTimeSlot }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [showAddButton, setShowAddButton] = useState(true);
  const [containerStatus, setContainerStatus] = useState('initial');

  // Status constants
  const STATUS_INITIAL = 'initial';
  const STATUS_COMPLETED = 'completed';
  const STATUS_FAILED = 'failed';
  const STATUS_MIXED = 'mixed';

  // Extract tasks and statuses from task string
  useEffect(() => {
    console.log(`TimeSlot for ${time} received task:`, task);
    
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
      // If task is empty, clear task list and status
      console.log('Task is empty, clearing tasks and statuses');
      setTasks([]);
      setTaskStatuses([]);
      setContainerStatus(STATUS_INITIAL);
    }
  }, [task, STATUS_INITIAL, time]);

  // Update container status
  useEffect(() => {
    updateContainerStatus(taskStatuses);
  }, [taskStatuses]);

  // Check all task statuses and update container background color
  const updateContainerStatus = (statuses) => {
    if (statuses.length === 0) {
      // If there are no tasks, set to initial status
      setContainerStatus(STATUS_INITIAL);
      return;
    }
    
    const hasCompleted = statuses.includes(STATUS_COMPLETED);
    const hasFailed = statuses.includes(STATUS_FAILED);
    const hasInitial = statuses.includes(STATUS_INITIAL);
    
    // Check if all tasks have the same status
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
      // Mixed status
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
        // Edit existing task
        console.log('Editing first task');
        newTasks[0] = currentTask;
      } else if (typeof isEditing === 'number') {
        // Edit task at specific index
        console.log(`Editing task at index ${isEditing}`);
        newTasks[isEditing] = currentTask;
      } else {
        // Add new task
        console.log('Adding new task');
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
      
      // Update container status
      updateContainerStatus(newStatuses);
    } else {
      console.log('Task is empty, not saving');
    }
    setIsEditing(false);
    setCurrentTask('');
    setShowAddButton(true);
  };

  // Handle task status change
  const handleTaskStatusChange = (index, newStatus) => {
    const currentStatus = taskStatuses[index];
    const taskContent = tasks[index];
    
    // If clicked on current status, toggle back to initial
    if (currentStatus === newStatus) {
      newStatus = STATUS_INITIAL;
    } else if (newStatus === STATUS_FAILED && copyTaskToCurrent && time !== "Daily Tasks") {
      // 如果任务状态变为失败，并且有复制功能，则询问用户是否要复制任务
      // 先检查当前时间段是否已经包含该任务
      if (isTaskInCurrentTimeSlot && isTaskInCurrentTimeSlot(taskContent)) {
        console.log(`Task "${taskContent}" already exists in current time slot, skipping confirmation dialog`);
      } else {
        // 显示确认弹窗
        const shouldCopy = window.confirm(`Do you want to copy the task "${taskContent}" to the current time slot?`);
        
        // 如果用户确认，则复制任务
        if (shouldCopy) {
          // 复制任务到当前时间段
          copyTaskToCurrent(`${taskContent} [STATUS:${STATUS_INITIAL}]`);
        }
      }
    }
    
    // Update status
    const newStatuses = [...taskStatuses];
    newStatuses[index] = newStatus;
    setTaskStatuses(newStatuses);
    
    // Update container status
    updateContainerStatus(newStatuses);
    
    // Combine tasks and status information into a string
    const combinedTaskString = combineTasksAndStatuses(tasks, newStatuses);
    onTaskChange(combinedTaskString);
  };

  // Add new task
  const addNewTask = () => {
    setIsEditing('new');
    setCurrentTask('');
    setShowAddButton(false);
  };

  // Edit task
  const editTask = (index) => {
    setIsEditing(index);
    setCurrentTask(tasks[index]);
    setShowAddButton(false);
  };

  // Delete task
  const deleteTask = (index) => {
    const newTasks = [...tasks];
    const newStatuses = [...taskStatuses];
    
    // Get task content before deletion
    const taskContent = newTasks[index];
    
    newTasks.splice(index, 1);
    newStatuses.splice(index, 1);
    setTasks(newTasks);
    setTaskStatuses(newStatuses);
    
    // No need to update copied tasks list, as this list is now managed in the parent component
    
    // Combine tasks and status information into a string
    const combinedTaskString = combineTasksAndStatuses(newTasks, newStatuses);
    onTaskChange(combinedTaskString);
    
    // Update container status
    updateContainerStatus(newStatuses);
  };

  // Render task list
  const renderTasks = () => {
    if (tasks.length === 0) {
      return null;
    }

    return (
      <div className="tasks-list">
        {tasks.map((taskItem, index) => (
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
            <div className="task-content" onClick={() => editTask(index)}>
              {taskItem}
            </div>
            <button className="delete-task-btn" onClick={() => deleteTask(index)}>
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`time-slot status-${containerStatus}`}>
      {time !== "Daily Tasks" && <div className="time-display">{time}</div>}
      <div className="task-container">
        {isEditing !== false ? (
          <div className="task-edit">
            <input
              type="text"
              value={currentTask}
              onChange={handleTaskChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter task..."
              autoFocus
            />
            <button onClick={saveTask}>Save</button>
          </div>
        ) : (
          <>
            {renderTasks()}
            {showAddButton && (
              <button 
                className="add-task-btn" 
                onClick={addNewTask}
              >
                +
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TimeSlot; 