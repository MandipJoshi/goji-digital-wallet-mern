import axios from 'axios';

const API_BASE_URL = 'http://localhost:6969/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('admin_token');
  const token = localStorage.getItem('token');
  // Use admin token for admin routes, else use user token
  if (adminToken && config.url.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User endpoints
export const registerUser = (data) => api.post('/user/register', data);
export const loginUser = (data) => api.post('/user/login', data);
export const updatePassword = (data) => api.patch('/user/update-password', data);

// Wallet endpoints
export const createWallet = () => api.post('/wallet');
export const getWallet = () => api.get('/wallet');

// Transaction endpoints
export const createTransaction = (data) => api.post('/transaction', data);
export const getAllTransactions = () => api.get('/transaction');
export const getTransactionById = (id) => api.get(`/transaction/${id}`);

// KYC endpoints
export const submitKYC = (formData) =>
  api.post('/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getKYCStatus = () => api.get('/kyc');
export const getKYCImage = () => api.get('/kyc/docimage', { responseType: 'blob' });

// Dispute endpoints
export const createDispute = (data) => api.post('/dispute', data);
export const getUserDisputes = () => api.get('/dispute');
export const getDisputeById = (id) => api.get(`/dispute/${id}`);

// Admin endpoints
export const suspendUser = (user_id) => api.patch(`/admin/user/${user_id}/suspend`);
export const freezeWallet = (wallet_id) => api.patch(`/admin/wallet/${wallet_id}/freeze`);
export const unfreezeWallet = (wallet_id) => api.patch(`/admin/wallet/${wallet_id}/unfreeze`);
export const reviewKYC = (kyc_id, status) => api.patch(`/admin/kyc/${kyc_id}/review`, { status });
export const solveDispute = (dispute_id, resolution) =>
  api.post(`/admin/dispute/${dispute_id}/solve`, { resolution });
export const activateUser = (user_id) => api.patch(`/admin/user/${user_id}/activate`);

// Admin "get all" endpoints
export const getAllUsers = () => api.get('/admin/user/all');
export const getAllWallets = () => api.get('/admin/wallet/all');
export const getAllKycs = () => api.get('/admin/kyc/all');
export const getAllDisputes = () => api.get('/admin/dispute/all');

// Health check
export const getHealth = () => api.get('/health');

// Deposit history (user)
export const getDepositHistory = (wallet_id) => api.get(`/deposit/history/${wallet_id}`);

// Admin login endpoint
export const adminLogin = (data) => api.post('/admin/login', data);