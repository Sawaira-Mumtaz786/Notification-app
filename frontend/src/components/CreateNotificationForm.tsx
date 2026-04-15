import React, { useState } from 'react';

interface Props {
  onSubmit: (data: { header: string; body: string; category: 'INFO' | 'WARNING' | 'ERROR' }) => void;
}

const CreateNotificationForm: React.FC<Props> = ({ onSubmit }) => {
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<'INFO' | 'WARNING' | 'ERROR'>('INFO');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!header.trim() || !body.trim()) {
      setError('All fields are required');
      return;
    }
    onSubmit({ header, body, category });
    setHeader('');
    setBody('');
    setCategory('INFO');
    setError('');
  };

  return (
    <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Create New Notification</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Header *</label>
          <input
            type="text"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Body *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px', minHeight: '80px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          >
            <option value="INFO">INFO (Blue)</option>
            <option value="WARNING">WARNING (Yellow)</option>
            <option value="ERROR">ERROR (Red)</option>
          </select>
        </div>
        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Create Notification
        </button>
      </form>
    </div>
  );
};

export default CreateNotificationForm;