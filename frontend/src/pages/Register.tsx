import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError('Password must be at least 6 characters');
    try {
      await axios.post('http://localhost:3000/users/register', { fullName, username, password });
      const res = await axios.post('http://localhost:3000/auth/login', { username, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        <input type="password" placeholder="Password (min 6)" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Register</button>
      </form>
      <p><Link to="/login">Login</Link></p>
    </div>
  );
};

export default Register;