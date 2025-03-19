/**
 * 清除本地存储中的未来日期数据
 * 修改后：保留当天和未来日期的数据
 */
export const cleanupFutureDates = () => {
  try {
    const savedHistory = localStorage.getItem('taskHistory');
    if (savedHistory) {
      const historyData = JSON.parse(savedHistory);
      // 已不再移除当前和未来日期的数据，直接返回所有数据
      return historyData;
    }
  } catch (error) {
    console.error('[清理] 处理历史数据时出错:', error);
  }
  return {};
};

/**
 * 完全清除本地存储中的所有数据
 * 谨慎使用，这将删除所有应用数据
 */
export const clearAllStorage = () => {
  try {
    localStorage.clear();
    console.log('[清理] 已清除所有本地存储数据');
    return true;
  } catch (error) {
    console.error('[清理] 清除所有本地存储数据时出错:', error);
    return false;
  }
};

/**
 * 创建测试数据
 * 用于测试历史记录功能
 */
export const createTestData = () => {
  try {
    // 清除现有数据
    const taskHistory = {};
    
    // 获取当前日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 创建过去7天的测试数据
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 创建随机任务数据
      const totalTasks = Math.floor(Math.random() * 10) + 1;
      const completedTasks = Math.floor(Math.random() * (totalTasks + 1));
      const failedTasks = Math.floor(Math.random() * (totalTasks - completedTasks + 1));
      const initialTasks = totalTasks - completedTasks - failedTasks;
      
      taskHistory[dateStr] = {
        timeSlots: [],
        dailyTasks: '测试任务',
        stats: {
          total: totalTasks,
          completed: completedTasks,
          failed: failedTasks,
          initial: initialTasks
        },
        timestamp: date.getTime()
      };
    }
    
    // 保存到本地存储
    localStorage.setItem('taskHistory', JSON.stringify(taskHistory));
    console.log('[测试] 已创建测试数据');
    
    return taskHistory;
  } catch (error) {
    console.error('[测试] 创建测试数据时出错:', error);
    return {};
  }
}; 