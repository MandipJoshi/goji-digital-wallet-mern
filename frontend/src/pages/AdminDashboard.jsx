import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  suspendUser,
  freezeWallet,
  reviewKYC,
  solveDispute,
  getAllUsers,
  getAllWallets,
  getAllKycs,
  getAllDisputes,
  activateUser,
  unfreezeWallet,
} from '../api/api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [kycs, setKycs] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch all admin data using api.js functions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, walletRes, kycRes, disputeRes] = await Promise.all([
          getAllUsers(),
          getAllWallets(),
          getAllKycs(),
          getAllDisputes(),
        ]);
        setUsers(userRes.data.users || []);
        setWallets(walletRes.data.wallets || []);
        setKycs(kycRes.data.kycs || []);
        setDisputes(disputeRes.data.disputes || []);
      } catch (err) {
        toast.error('Failed to fetch admin data');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Admin actions
  const handleSuspendUser = async (user_id) => {
    try {
      await suspendUser(user_id);
      toast.success('User suspended');
      setUsers(users.map(u => u.user_id === user_id ? { ...u, status: 'suspended' } : u));
    } catch {
      toast.error('Failed to suspend user');
    }
  };

  const handleActivateUser = async (user_id) => {
    try {
      await activateUser(user_id);
      toast.success('User activated');
      setUsers(users.map(u => u.user_id === user_id ? { ...u, status: 'active' } : u));
    } catch {
      toast.error('Failed to activate user');
    }
  };

  const handleFreezeWallet = async (wallet_id) => {
    try {
      await freezeWallet(wallet_id);
      toast.success('Wallet frozen');
      setWallets(wallets.map(w => w.wallet_id === wallet_id ? { ...w, is_active: false } : w));
    } catch {
      toast.error('Failed to freeze wallet');
    }
  };

  const handleUnfreezeWallet = async (wallet_id) => {
    try {
      await unfreezeWallet(wallet_id);
      toast.success('Wallet unfrozen');
      setWallets(wallets.map(w => w.wallet_id === wallet_id ? { ...w, is_active: true } : w));
    } catch {
      toast.error('Failed to unfreeze wallet');
    }
  };

  const handleReviewKYC = async (kyc_id, status) => {
    try {
      await reviewKYC(kyc_id, status);
      toast.success(`KYC ${status}`);
      setKycs(kycs.map(k => k.kyc_id === kyc_id ? { ...k, status } : k));
    } catch {
      toast.error('Failed to review KYC');
    }
  };

  const handleSolveDispute = async (dispute_id, resolution) => {
    try {
      await solveDispute(dispute_id, resolution);
      toast.success(`Dispute ${resolution}`);
      setDisputes(disputes.map(d => d.dispute_id === dispute_id ? { ...d, status: resolution === 'accepted' ? 'resolved' : 'rejected' } : d));
    } catch {
      toast.error('Failed to solve dispute');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className={theme === 'dark'
      ? "min-h-screen bg-gray-900 text-gray-100"
      : "min-h-screen bg-gray-100 text-gray-900"}
    >
      <div className={theme === 'dark'
        ? "max-w-6xl mx-auto bg-gray-800 rounded-xl shadow-lg p-8"
        : "max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8"}
      >
        <div
          className={
            theme === 'dark'
              ? "flex justify-between items-center mb-6 bg-gray-900 rounded-lg p-4"
              : "flex justify-between items-center mb-6 bg-white rounded-lg p-4"
          }
        >
          <h1
            className={
              theme === 'dark'
                ? "text-3xl font-bold text-gray-100 text-center"
                : "text-3xl font-bold text-gray-800 text-center"
            }
          >
            Admin Dashboard
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={theme === 'dark'
                ? "px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
                : "px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin');
                toast.success('Signed out!');
                navigate('/admin/login');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Users Table */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className={theme === 'dark' ? "bg-gray-800 text-gray-100" : "bg-gray-200"}>
                  <th className="px-2 py-1 border">ID</th>
                  <th className="px-2 py-1 border">Name</th>
                  <th className="px-2 py-1 border">Email</th>
                  <th className="px-2 py-1 border">Phone</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} className="text-center">
                    <td className="border px-2 py-1">{u.user_id}</td>
                    <td className="border px-2 py-1">{u.full_name}</td>
                    <td className="border px-2 py-1">{u.email}</td>
                    <td className="border px-2 py-1">{u.phone}</td>
                    <td className="border px-2 py-1">{u.status}</td>
                    <td className="border px-2 py-1">
                      {u.status !== 'suspended' ? (
                        <button
                          className="px-2 py-1 bg-red-600 text-white rounded"
                          onClick={() => handleSuspendUser(u.user_id)}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="px-2 py-1 bg-green-600 text-white rounded"
                          onClick={() => handleActivateUser(u.user_id)}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Wallets Table */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Wallets</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className={theme === 'dark' ? "bg-gray-800 text-gray-100" : "bg-gray-200"}>
                  <th className="px-2 py-1 border">ID</th>
                  <th className="px-2 py-1 border">User ID</th>
                  <th className="px-2 py-1 border">Balance</th>
                  <th className="px-2 py-1 border">Hold Balance</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map(w => (
                  <tr key={w.wallet_id} className="text-center">
                    <td className="border px-2 py-1">{w.wallet_id}</td>
                    <td className="border px-2 py-1">{w.user_id}</td>
                    <td className="border px-2 py-1">{w.balance}</td>
                    <td className="border px-2 py-1">{w.hold_balance}</td>
                    <td className="border px-2 py-1">{w.is_active ? 'Active' : 'Frozen'}</td>
                    <td className="border px-2 py-1">
                      {w.is_active ? (
                        <button
                          className="px-2 py-1 bg-yellow-600 text-white rounded"
                          onClick={() => handleFreezeWallet(w.wallet_id)}
                        >
                          Freeze
                        </button>
                      ) : (
                        <button
                          className="px-2 py-1 bg-green-600 text-white rounded"
                          onClick={() => handleUnfreezeWallet(w.wallet_id)}
                        >
                          Unfreeze
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* KYC Table */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">KYC Requests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className={theme === 'dark' ? "bg-gray-800 text-gray-100" : "bg-gray-200"}>
                  <th className="px-2 py-1 border">ID</th>
                  <th className="px-2 py-1 border">User ID</th>
                  <th className="px-2 py-1 border">Type</th>
                  <th className="px-2 py-1 border">Number</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {kycs.map(k => (
                  <tr key={k.kyc_id} className="text-center">
                    <td className="border px-2 py-1">{k.kyc_id}</td>
                    <td className="border px-2 py-1">{k.user_id}</td>
                    <td className="border px-2 py-1">{k.document_type}</td>
                    <td className="border px-2 py-1">{k.document_number}</td>
                    <td className="border px-2 py-1">{k.status}</td>
                    <td className="border px-2 py-1">
                      {k.status === 'pending' && (
                        <>
                          <button
                            className="px-2 py-1 bg-green-600 text-white rounded mr-2"
                            onClick={() => handleReviewKYC(k.kyc_id, 'verified')}
                          >
                            Verify
                          </button>
                          <button
                            className="px-2 py-1 bg-red-600 text-white rounded"
                            onClick={() => handleReviewKYC(k.kyc_id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Disputes Table */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Disputes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className={theme === 'dark' ? "bg-gray-800 text-gray-100" : "bg-gray-200"}>
                  <th className="px-2 py-1 border">ID</th>
                  <th className="px-2 py-1 border">User ID</th>
                  <th className="px-2 py-1 border">Transaction ID</th>
                  <th className="px-2 py-1 border">Reason</th>
                  <th className="px-2 py-1 border">Status</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={d.dispute_id} className="text-center">
                    <td className="border px-2 py-1">{d.dispute_id}</td>
                    <td className="border px-2 py-1">{d.user_id}</td>
                    <td className="border px-2 py-1">{d.transaction_id}</td>
                    <td className="border px-2 py-1">{d.reason}</td>
                    <td className="border px-2 py-1">{d.status}</td>
                    <td className="border px-2 py-1">
                      {(d.status === 'open' || d.status === 'under_review') && (
                        <>
                          <button
                            className="px-2 py-1 bg-green-600 text-white rounded mr-2"
                            onClick={() => handleSolveDispute(d.dispute_id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="px-2 py-1 bg-red-600 text-white rounded"
                            onClick={() => handleSolveDispute(d.dispute_id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;