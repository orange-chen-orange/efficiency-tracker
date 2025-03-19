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
      segmentsPerHour: 3 // 设置默认值为3
    };
    
    // Save to localStorage
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Trigger storage event so other components can detect settings changes
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'appSettings',
        newValue: JSON.stringify(settings),
        url: window.location.href
      }));
      
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