import React, { useEffect, useState } from 'react';
import { Notification } from '../types';

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationBanner: React.FC<Props> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  if (notifications.length > 5) {
    return (
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px',
        border: '1px solid #ccc'
      }}>
        You have {notifications.length} undismissed notifications.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      {notifications.map(notif => (
        <BannerItem key={notif._id} notification={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const BannerItem: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({
  notification,
  onDismiss,
}) => {
  const getBgColor = (cat: string) => {
    switch (cat) {
      case 'ERROR': return '#ffcccc';
      case 'WARNING': return '#fff3cd';
      case 'INFO': return '#cce5ff';
      default: return '#f0f0f0';
    }
  };

  useEffect(() => {
    if (notification.category === 'INFO') {
      const timer = setTimeout(() => {
        onDismiss(notification._id);
      }, 90000);
      return () => clearTimeout(timer);
    }
  }, [notification._id, notification.category, onDismiss]);

  return (
    <div style={{
      backgroundColor: getBgColor(notification.category),
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '1px solid #ddd'
    }}>
      <div>
        <strong>{notification.header}</strong>
        <p style={{ margin: '4px 0 0' }}>{notification.body}</p>
        <small>{notification.category}</small>
      </div>
      <button
        onClick={() => onDismiss(notification._id)}
        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationBanner;