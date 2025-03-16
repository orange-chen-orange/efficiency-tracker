/**
 * 获取本地日期字符串的辅助函数
 */
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 清除本地存储中的未来日期数据
 * 这个函数会检查taskHistory中的所有日期，删除今天和未来的日期数据
 */
export const cleanupFutureDates = () => {
  try {
    const savedHistory = localStorage.getItem('taskHistory');
    if (savedHistory) {
      // 直接返回解析后的历史数据，不再删除任何日期的数据
      return JSON.parse(savedHistory);
    }
  } catch (error) {
    console.error('[历史] 解析历史数据时出错:', error);
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
      const dateStr = getLocalDateString(date); // 使用本地日期格式
      
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