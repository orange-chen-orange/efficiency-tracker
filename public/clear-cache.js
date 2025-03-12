// 清除浏览器缓存的脚本
(function() {
  // 清除Service Worker缓存
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('删除缓存:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      console.log('所有缓存已清除');
    });
  }
  
  // 清除Service Worker注册
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister();
        console.log('Service Worker已注销');
      }
    });
  }
  
  // 清除localStorage
  localStorage.clear();
  console.log('localStorage已清除');
  
  // 清除sessionStorage
  sessionStorage.clear();
  console.log('sessionStorage已清除');
  
  // 刷新页面
  setTimeout(function() {
    window.location.reload(true);
  }, 1000);
})(); 