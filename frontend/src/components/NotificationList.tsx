import React, { useState } from 'react';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';

interface Props {
  notifications: Notification[];
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

const NotificationList: React.FC<Props> = ({ notifications, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHeader, setEditHeader] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategory, setEditCategory] = useState<'INFO' | 'WARNING' | 'ERROR'>('INFO');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ERROR': return '#ffcccc';
      case 'WARNING': return '#fff3cd';
      case 'INFO': return '#cce5ff';
      default: return '#f9f9f9';
    }
  };

  const startEdit = (notif: Notification) => {
    setEditingId(notif._id);
    setEditHeader(notif.header);
    setEditBody(notif.body);
    setEditCategory(notif.category);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditHeader('');
    setEditBody('');
    setEditCategory('INFO');
  };

  const saveEdit = async (id: string) => {
    if (!editHeader.trim() || !editBody.trim()) {
      alert('All fields are required');
      return;
    }
    await notificationService.update(id, {
      header: editHeader,
      body: editBody,
      category: editCategory,
    });
    cancelEdit();
    onUpdate();
  };

  if (notifications.length === 0) {
    return <p>No notifications yet. Create one above!</p>;
  }

  return (
    <div>
      {notifications.map((notif) => (
        <div
          key={notif._id}
          style={{
            backgroundColor: getCategoryColor(notif.category),
            padding: '16px',
            marginBottom: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          {editingId === notif._id ? (
            <div>
              <input
                type="text"
                value={editHeader}
                onChange={(e) => setEditHeader(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
              />
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '8px', minHeight: '60px' }}
              />
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as any)}
                style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
              >
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
              </select>
              <button onClick={() => saveEdit(notif._id)} style={{ marginRight: '8px', padding: '6px 12px' }}>
                Save
              </button>
              <button onClick={cancelEdit} style={{ padding: '6px 12px' }}>Cancel</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px' }}>{notif.header}</h3>
                  <p style={{ margin: '0 0 8px' }}>{notif.body}</p>
                  <small>
                    <strong>{notif.category}</strong> | {new Date(notif.createdAt).toLocaleString()}
                    {notif.isClosed && <span> (Closed)</span>}
                  </small>
                </div>
                <div>
                  <button
                    onClick={() => startEdit(notif)}
                    style={{ marginRight: '8px', padding: '6px 12px' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(notif._id)}
                    style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px' 
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationList;