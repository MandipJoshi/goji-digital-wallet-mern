import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminLogin } from '../api/api';

const AdminLogin = () => {
  const [form, setForm] = useState({ admin_code: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await adminLogin(form);
      localStorage.setItem('admin_token', res.data.token);
      localStorage.setItem('admin', JSON.stringify(res.data.admin));
      toast.success('Admin login successful!');
      setTimeout(() => navigate('/admin/dashboard'), 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin login failed.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 to-blue-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Admin Login</h2>
        <input
          name="admin_code"
          type="text"
          placeholder="Admin Code"
          required
          className="w-full p-3 border border-gray-300 rounded-md"
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full p-3 border border-gray-300 rounded-md"
          onChange={handleChange}
        />
        <button className="w-full py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition">
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;