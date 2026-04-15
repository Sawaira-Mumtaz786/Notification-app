import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Notification {
  _id: string;
  header: string;
  body: string;
  category: 'INFO' | 'WARNING' | 'ERROR';
  isClosed: boolean;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [undismissed, setUndismissed] = useState<Notification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<'INFO' | 'WARNING' | 'ERROR'>('INFO');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHeader, setEditHeader] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategory, setEditCategory] = useState<'INFO' | 'WARNING' | 'ERROR'>('INFO');

  const user = JSON.parse(localStorage.getItem('user') || '{"fullName":"User"}');
  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const [all, und] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/undismissed')
      ]);
      setNotifications(all.data);
      setUndismissed(und.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchData();
  }, []);

  const getColor = (cat: string) => {
    if (cat === 'ERROR') return '#ffcccc';
    if (cat === 'WARNING') return '#fff3cd';
    return '#cce5ff';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/notifications', { header, body, category });
      setNotifications([res.data, ...notifications]);
      if (!res.data.isClosed) setUndismissed([res.data, ...undismissed].slice(0, 5));
      setHeader(''); setBody(''); setShowForm(false);
    } catch (err) { alert('Create failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      setUndismissed(undismissed.filter(n => n._id !== id));
    } catch (err) { alert('Delete failed'); }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/dismiss`);
      setUndismissed(undismissed.filter(n => n._id !== id));
      setNotifications(notifications.map(n => n._id === id ? { ...n, isClosed: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleEdit = (n: Notification) => {
    setEditingId(n._id);
    setEditHeader(n.header);
    setEditBody(n.body);
    setEditCategory(n.category);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/${id}`, { header: editHeader, body: editBody, category: editCategory });
      setNotifications(notifications.map(n => n._id === id ? res.data : n));
      setEditingId(null);
    } catch (err) { alert('Update failed'); }
  };

  const Banner: React.FC<{ n: Notification }> = ({ n }) => {
    useEffect(() => {
      if (n.category === 'INFO') {
        const t = setTimeout(() => handleDismiss(n._id), 90000);
        return () => clearTimeout(t);
      }
    }, []);
    return (
      <div style={{ backgroundColor: getColor(n.category), padding: '12px', marginBottom: '8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
        <div><strong>{n.header}</strong><p>{n.body}</p><small>{n.category}</small></div>
        <button onClick={() => handleDismiss(n._id)} style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Dashboard</h1>
        <div>
          Welcome, {user.fullName}! 
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }} 
            style={{ 
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {undismissed.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {undismissed.length > 5 ? <p>You have {undismissed.length} undismissed notifications.</p> : undismissed.map(n => <Banner key={n._id} n={n} />)}
        </div>
      )}

      <button onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
        {showForm ? 'Cancel' : '+ Create Notification'}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <input type="text" placeholder="Header" value={header} onChange={e => setHeader(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
          <textarea placeholder="Body" value={body} onChange={e => setBody(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
          <select value={category} onChange={e => setCategory(e.target.value as any)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
            <option value="INFO">INFO</option><option value="WARNING">WARNING</option><option value="ERROR">ERROR</option>
          </select>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Create</button>
        </form>
      )}

      <h2>All Notifications ({notifications.length})</h2>
      {notifications.map(n => (
        <div key={n._id} style={{ backgroundColor: getColor(n.category), padding: '16px', marginBottom: '12px', borderRadius: '8px' }}>
          {editingId === n._id ? (
            <div>
              <input value={editHeader} onChange={e => setEditHeader(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px' }} />
              <textarea value={editBody} onChange={e => setEditBody(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px' }} />
              <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)} style={{ width: '100%', padding: '8px', marginBottom: '8px' }}>
                <option value="INFO">INFO</option><option value="WARNING">WARNING</option><option value="ERROR">ERROR</option>
              </select>
              <button onClick={() => saveEdit(n._id)} style={{ marginRight: '8px' }}>Save</button>
              <button onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><h3>{n.header}</h3><p>{n.body}</p><small>{n.category} | {new Date(n.createdAt).toLocaleString()}{n.isClosed && ' (Closed)'}</small></div>
              <div>
                <button onClick={() => handleEdit(n)} style={{ marginRight: '8px' }}>Edit</button>
                <button onClick={() => handleDelete(n._id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px' }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
