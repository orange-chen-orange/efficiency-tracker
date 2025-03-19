import React from 'react';
import Settings from './Settings';
import '../../../css/Settings.css';

function SettingsPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div className="settings-header">
        <h1>Efficiency Tracker Settings</h1>
        <p>Customize your schedule</p>
      </div>
      <Settings />
    </div>
  );
}

export default SettingsPage; 