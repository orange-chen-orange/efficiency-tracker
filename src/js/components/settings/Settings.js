import React, { useState, useEffect, useCallback } from 'react';
import '../../../css/Settings.css';

function Settings() {
  // Default settings
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(22);
  const [segmentsPerHour, setSegmentsPerHour] = useState(3);
  const [timeSlots, setTimeSlots] = useState([]);

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate segments per hour options (1-6)
  const segmentOptions = [1, 2, 3, 4, 6];

  // Generate time slots preview
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    
    // Ensure end time is after start time
    if (endHour <= startHour) {
      return;
    }
    
    // Calculate minutes per segment
    const minutesPerSegment = 60 / segmentsPerHour;
    
    // Generate all time slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let segment = 0; segment < segmentsPerHour; segment++) {
        const startMinute = segment * minutesPerSegment;
        const endMinute = startMinute + minutesPerSegment;
        
        const startTimeStr = `${hour}:${startMinute === 0 ? '00' : startMinute}`;
        const endTimeStr = `${hour}:${endMinute === 0 ? '00' : endMinute}`;
        
        slots.push(`${startTimeStr} - ${endTimeStr}`);
      }
    }
    
    // Only show first 10 time slots as preview
    setTimeSlots(slots.slice(0, 10));
  }, [startHour, endHour, segmentsPerHour]);

  // Update time slots preview when settings change
  useEffect(() => {
    generateTimeSlots();
  }, [generateTimeSlots]);

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
      segmentsPerHour
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
        
        <div className="form-group">
          <label>Time Segments</label>
          <p className="description">Set how many segments each hour is divided into</p>
          
          <div className="segments-input">
            <select 
              value={segmentsPerHour}
              onChange={(e) => setSegmentsPerHour(parseInt(e.target.value))}
            >
              {segmentOptions.map(option => (
                <option key={option} value={option}>
                  {option} segments ({60/option} minutes each)
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button className="save-button" onClick={saveSettings}>
          Save Settings
        </button>
      </div>
      
      {timeSlots.length > 0 && (
        <div className="settings-preview">
          <div className="preview-header">Time Slots Preview (showing first 10):</div>
          <div className="preview-content">
            {timeSlots.map((slot, index) => (
              <div key={index} className="time-slot-preview">
                {slot}
              </div>
            ))}
            {timeSlots.length > 10 && <div>...</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings; 