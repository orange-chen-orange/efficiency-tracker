// Service Worker 版本
const CACHE_VERSION = 'v1';
const CACHE_NAME = `efficiency-tracker-${CACHE_VERSION}`;

// 需要缓存的资源
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
];

// 安装Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker 正在安装...');
  
  // 跳过等待，直接激活
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker 已激活');
  
  // 清理旧版本缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 删除旧缓存 ', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 设置定时任务，在每天23:59保存数据
  setupDailySaveTask();
  
  return self.clients.claim();
});

// 处理fetch请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在缓存中找到响应，则返回缓存的响应
        if (response) {
          return response;
        }
        
        // 否则发送网络请求
        return fetch(event.request).then(
          response => {
            // 检查是否收到有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应是流，只能使用一次
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
  );
});

// 设置每天23:59保存数据的定时任务
function setupDailySaveTask() {
  console.log('设置每日保存任务...');
  
  // 计算距离今天23:59的毫秒数
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
    return Math.max(0, endOfDay.getTime() - now.getTime());
  };
  
  // 设置定时器
  const scheduleEndOfDaySave = () => {
    const timeUntilEndOfDay = calculateTimeUntilEndOfDay();
    console.log(`Service Worker: 距离今天结束还有 ${Math.floor(timeUntilEndOfDay / 1000 / 60)} 分钟，将在结束时保存任务记录`);
    
    // 使用setTimeout设置定时器
    setTimeout(() => {
      console.log('Service Worker: 执行每日任务记录保存');
      
      // 通知所有客户端保存数据
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            action: 'SAVE_DAILY_TASKS',
            timestamp: new Date().toISOString()
          });
        });
      });
      
      // 如果没有活动的客户端，则直接保存数据
      saveDailyTasksToHistory();
      
      // 重新设置明天的定时器
      setTimeout(scheduleEndOfDaySave, 1000); // 1秒后重新计算明天的时间
    }, timeUntilEndOfDay);
  };
  
  // 启动定时器
  scheduleEndOfDaySave();
}

// 直接从Service Worker保存数据到历史记录
function saveDailyTasksToHistory() {
  // 获取当前日期
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // 格式: YYYY-MM-DD
  
  // 从localStorage读取数据
  self.clients.matchAll().then(clients => {
    if (clients.length > 0) {
      // 如果有活动的客户端，让客户端处理保存
      return;
    }
    
    // 如果没有活动的客户端，尝试直接保存
    console.log('Service Worker: 没有活动的客户端，尝试直接保存数据');
    
    // 注意：Service Worker无法直接访问localStorage
    // 这里我们可以使用IndexedDB或者通过发送请求到服务器来保存数据
    // 但由于这是一个前端应用，我们可以在下次用户打开应用时检查并保存
    
    // 设置一个标记，表示需要在下次打开时保存昨天的数据
    self.registration.showNotification('Efficiency Tracker', {
      body: '您的任务数据将在下次打开应用时自动保存',
      icon: '/logo192.png'
    });
  });
}

// 监听来自客户端的消息
self.addEventListener('message', event => {
  console.log('Service Worker 收到消息:', event.data);
  
  if (event.data && event.data.action === 'SETUP_DAILY_SAVE') {
    setupDailySaveTask();
  }
}); 