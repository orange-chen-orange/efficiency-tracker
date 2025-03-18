import React, { useState, useEffect } from 'react';
import '../../../css/Settings.css';

function Settings() {
  // Default settings
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(22);
  
  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  // Save settings
  const saveSettings = () => {
    // Validate settings
    if (endHour <= startHour) {
      alert('End time must be after start time');
      return;
    }
    
    // Create settings object
    const settings = {
      startHour,
      endHour,
      segmentsPerHour: 3 // 固定为3
    };
    
    // Save to localStorage
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // 触发storage事件以便于其他组件检测设置变更
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'appSettings',
        newValue: JSON.stringify(settings),
        url: window.location.href
      }));
      
      // 添加一个特殊的标志，表示设置刚刚被更新
      localStorage.setItem('settingsLastUpdated', Date.now().toString());
      
      // 额外触发一个自定义事件，以确保在同一页面内的组件也能响应
      const settingsChangedEvent = new CustomEvent('settingsChanged', {
        detail: settings
      });
      window.dispatchEvent(settingsChangedEvent);
      
      alert('Settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings, please try again');
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-form">
        <div className="form-group">
          <label>Time Range</label>
          <p className="description">Set the start and end times for your schedule</p>
          
          <div className="time-range">
            <div className="time-input">
              <select 
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
              >
                {hourOptions.map(hour => (
                  <option key={`start-${hour}`} value={hour}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </div>
            
            <span className="time-separator">to</span>
            
            <div className="time-input">
              <select 
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
              >
                {hourOptions.map(hour => (
                  <option key={`end-${hour}`} value={hour}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <button className="save-button" onClick={saveSettings}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default Settings; 