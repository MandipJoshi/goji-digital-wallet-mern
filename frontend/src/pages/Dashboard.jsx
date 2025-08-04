import { useEffect, useState } from 'react';
import {
  createWallet,
  createDispute,
  getAllTransactions,
  getKYCImage,
  getKYCStatus,
  getUserDisputes,
  submitKYC,
  createTransaction,
  getWallet,
  getDepositHistory,
  updatePassword,
} from '../api/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const Dashboard = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [kyc, setKyc] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycForm, setKycForm] = useState({ document_type: '', document_number: '' });
  const [kycImage, setKycImage] = useState(null);
  const [kycImageUrl, setKycImageUrl] = useState(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeTxId, setDisputeTxId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendForm, setSendForm] = useState({ receiver_wallet_id: '', amount: '' });
  const [theme, setTheme] = useState('dark');
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [updatePasswordForm, setUpdatePasswordForm] = useState({
    oldPassword: '',
    newPassword: ''
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [walletRes, txRes, kycRes, disputeRes] = await Promise.all([
          getWallet().catch(() => null),
          getAllTransactions().catch(() => null),
          getKYCStatus().catch(() => null),
          getUserDisputes().catch(() => null),
        ]);
        setWallet(walletRes?.data?.wallet || null);
        setTransactions(txRes?.data?.transactions || []);
        setKyc(kycRes?.data?.kyc || null);
        setDisputes(disputeRes?.data?.disputes || []);
        if (walletRes?.data?.wallet) {
          const depositRes = await getDepositHistory(walletRes.data.wallet.wallet_id).catch(() => null);
          setDeposits(depositRes?.data?.deposits || []);
        } else {
          setDeposits([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateWallet = async () => {
    try {
      const res = await createWallet();
      setWallet(res.data.wallet);
      toast.success('Wallet created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wallet creation failed');
    }
  };

  const handleKycChange = (e) =>
    setKycForm({ ...kycForm, [e.target.name]: e.target.value });

  const handleKycImageChange = (e) => {
    const file = e.target.files[0];
    if (file && ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setKycImage(file);
    } else {
      setKycImage(null);
      toast.error('Only PNG, JPG, or JPEG files are allowed.');
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('document_type', kycForm.document_type);
      formData.append('document_number', kycForm.document_number);
      if (kycImage) formData.append('document_image', kycImage);

      await submitKYC(formData);
      toast.success('KYC submitted!');
      setShowKycForm(false);
      setKycImage(null);
      setKycForm({ document_type: '', document_number: '' });

      const kycRes = await getKYCStatus();
      setKyc(kycRes.data.kyc);
    } catch (err) {
      console.error('KYC Submission Error:', err);
      toast.error('KYC submission failed');
    }
  };

  const handleViewKycImage = async () => {
    try {
      const res = await getKYCImage();
      const url = URL.createObjectURL(res.data);
      setKycImageUrl(url);
    } catch (err) {
      console.error('KYC Image Error:', err);
      toast.error('Unable to fetch KYC document image.');
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    try {
      await createDispute({ transaction_id: disputeTxId, reason: disputeReason });
      toast.success('Dispute created!');
      setShowDisputeForm(false);
      setDisputeTxId('');
      setDisputeReason('');

      const disputeRes = await getUserDisputes();
      setDisputes(disputeRes.data.disputes || []);
    } catch (err) {
      console.error('Dispute Error:', err);
      toast.error(err.response?.data?.message || 'Dispute creation failed');
    }
  };

  const handleSendChange = (e) => {
    setSendForm({ ...sendForm, [e.target.name]: e.target.value });
  };

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTransaction(sendForm);
      toast.success('Money sent!');
      setShowSendForm(false);
      setSendForm({ receiver_wallet_id: '', amount: '' });

      const txRes = await getAllTransactions();
      setTransactions(txRes.data.transactions || []);

      const walletRes = await getWallet();
      setWallet(walletRes.data.wallet);
    } catch (err) {
      console.error('Transaction Error:', err);
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    toast.success('Signed out!');
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleUpdatePasswordChange = (e) => {
    setUpdatePasswordForm({ ...updatePasswordForm, [e.target.name]: e.target.value });
  };

  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await updatePassword(updatePasswordForm);
      toast.success('Password updated successfully!');
      setShowUpdatePassword(false);
      setUpdatePasswordForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Password update failed'
      );
    }
  };

  // PDF download for a single transaction
  const handleDownloadTxPDF = (tx) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Transaction Details', 14, 20);

    doc.setFontSize(12);
    doc.text(`Transaction ID: ${tx.transaction_id}`, 14, 35);
    doc.text(`Amount: NRs.${tx.amount}`, 14, 45);
    doc.text(`Status: ${tx.status}`, 14, 55);
    doc.text(`Time: ${tx.transaction_time}`, 14, 65);
    doc.text(`Sender Wallet: ${tx.sender_wallet_id || 'N/A'}`, 14, 75);
    doc.text(`Receiver Wallet: ${tx.receiver_wallet_id || 'N/A'}`, 14, 85);

    doc.save(`transaction_${tx.transaction_id}.pdf`);
  };

  const inputClass = theme === 'dark'
    ? "p-2 rounded border bg-gray-900 text-gray-100"
    : "p-2 rounded border";
  const sectionClass = theme === 'dark'
    ? "bg-gray-800 p-4 rounded-md flex flex-col gap-2"
    : "bg-gray-100 p-4 rounded-md flex flex-col gap-2";
  const tableClass = theme === 'dark'
    ? "min-w-full bg-gray-900 border rounded text-gray-100"
    : "min-w-full bg-white border rounded";
  const tableHeaderClass = theme === 'dark'
    ? "bg-gray-800 text-gray-100"
    : "bg-gray-200";

  return (
    <div className={theme === 'dark'
      ? "min-h-screen bg-gray-900 text-gray-100"
      : "min-h-screen bg-gray-100 text-gray-900"}
    >
      <div className={theme === 'dark'
        ? "max-w-3xl mx-auto bg-gray-800 rounded-xl shadow-lg p-8"
        : "max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8"}
      >
        <div
          className={
            theme === 'dark'
              ? "flex justify-between items-center mb-6 bg-gray-900 rounded-lg p-4"
              : "flex justify-between items-center mb-6 bg-white rounded-lg p-4"
          }
        >
          <div>
            <h1
              className={
                theme === 'dark'
                  ? "text-3xl font-bold text-gray-100 text-center"
                  : "text-3xl font-bold text-gray-800 text-center"
              }
            >
              User Dashboard
            </h1>
            {user && (
              <div className="mt-2 text-sm text-gray-400">
                <div>Full Name: <span className="font-semibold">{user.full_name}</span></div>
                <div>Phone: <span className="font-semibold">{user.phone}</span></div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className={theme === 'dark'
                ? "px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
                : "px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <>
            {/* Wallet Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Wallet</h2>
              {wallet ? (
                <div className={theme === 'dark' ? "bg-gray-800 p-4 rounded-md flex flex-col gap-2" : "bg-gray-100 p-4 rounded-md flex flex-col gap-2"}>
                  <div><span className="font-semibold">Wallet ID:</span> {wallet.wallet_id}</div>
                  <div><span className="font-semibold">Balance:</span> रु{wallet.balance}</div>
                  <div><span className="font-semibold">Hold Balance:</span> रु{wallet.hold_balance}</div>
                  <div>
                    <span className="font-semibold">Status:</span>{' '}
                    {wallet.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Frozen</span>
                    )}
                  </div>
                  <button
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={() => setShowSendForm(!showSendForm)}
                  >
                    Send Money
                  </button>
                  {/* Send Money Form appears here */}
                  {showSendForm && (
                    <form
                      onSubmit={handleSendSubmit}
                      className={theme === 'dark'
                        ? "bg-gray-800 p-4 rounded-md flex flex-col gap-2 mt-4 text-gray-100"
                        : "bg-gray-100 p-4 rounded-md flex flex-col gap-2 mt-4"}
                    >
                      <h3 className="font-semibold mb-2">Send Money</h3>
                      <input
                        type="text"
                        name="receiver_wallet_id"
                        placeholder="Receiver Wallet ID"
                        value={sendForm.receiver_wallet_id}
                        onChange={handleSendChange}
                        className={inputClass}
                        required
                      />
                      <input
                        type="number"
                        name="amount"
                        placeholder="Amount"
                        value={sendForm.amount}
                        onChange={handleSendChange}
                        className={inputClass}
                        required
                        min="1"
                        step="any"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Send
                        </button>
                        <button
                          type="button"
                          className={theme === 'dark' ? "px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700" : "px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"}
                          onClick={() => setShowSendForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <button
                  className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                  onClick={handleCreateWallet}
                >
                  Create Wallet
                </button>
              )}
            </div>

            {/* KYC Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">KYC Status</h2>
              {kyc ? (
                <div className={theme === 'dark' ? "bg-gray-800 p-4 rounded-md flex flex-col gap-2" : "bg-gray-100 p-4 rounded-md flex flex-col gap-2"}>
                  <div><span className="font-semibold">Type:</span> {kyc.document_type}</div>
                  <div><span className="font-semibold">Number:</span> {kyc.document_number}</div>
                  <div>
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={
                      kyc.status === 'verified'
                        ? 'text-green-600'
                        : kyc.status === 'pending'
                          ? 'text-yellow-600'
                          : kyc.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-gray-600'
                    }>
                      {kyc.status}
                    </span>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 mt-2"
                    onClick={handleViewKycImage}
                  >
                    View Document
                  </button>
                  {kycImageUrl && (
                    <img
                      src={kycImageUrl}
                      alt="KYC Document"
                      className="mt-4 rounded shadow max-h-64"
                    />
                  )}
                  {kyc.status === 'rejected' && (
                    <div className="text-red-500 font-semibold mt-2">
                      Your KYC was rejected. Please contact the Admin for further assistance.
                    </div>
                  )}
                </div>
              ) : showKycForm ? (
                <form
                  onSubmit={handleKycSubmit}
                  className={theme === 'dark'
                    ? "bg-gray-800 p-4 rounded-md flex flex-col gap-2 text-gray-100"
                    : "bg-gray-100 p-4 rounded-md flex flex-col gap-2"}
                >
                  <select
                    name="document_type"
                    value={kycForm.document_type}
                    onChange={handleKycChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select Document Type</option>
                    <option value="passport">Passport</option>
                    <option value="national id">National ID</option>
                    <option value="citizenship">Citizenship</option>
                  </select>
                  <input
                    type="text"
                    name="document_number"
                    placeholder="Document Number"
                    value={kycForm.document_number}
                    onChange={handleKycChange}
                    className={inputClass}
                    required
                  />
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleKycImageChange}
                    className={inputClass}
                    required
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800">
                    Submit KYC
                  </button>
                  <button
                    type="button"
                    className={theme === 'dark'
                      ? "px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mt-2"
                      : "px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 mt-2"}
                    onClick={() => {
                      setShowKycForm(false);
                      setKycImage(null);
                      setKycForm({ document_type: '', document_number: '' });
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div>
                  <div className="text-gray-600 mb-2">No KYC submitted.</div>
                  <button
                    className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                    onClick={() => setShowKycForm(true)}
                  >
                    Create New KYC
                  </button>
                </div>
              )}
            </div>

            {/* Transactions Section */}
            <div className="mb-8">
              <h2 className={theme === 'dark' ? "text-xl font-semibold text-gray-100 mb-2" : "text-xl font-semibold text-gray-700 mb-2"}>Transactions</h2>
              {transactions.length ? (
                <div className="overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr className={tableHeaderClass}>
                        <th className="py-2 px-4 border-b">ID</th>
                        <th className="py-2 px-4 border-b">Amount</th>
                        <th className="py-2 px-4 border-b">Status</th>
                        <th className="py-2 px-4 border-b">Time</th>
                        <th className="py-2 px-4 border-b">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.transaction_id}>
                          <td className="py-2 px-4 border-b">{tx.transaction_id}</td>
                          <td className={`py-2 px-4 border-b ${wallet && tx.sender_wallet_id === wallet.wallet_id ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}`}>
                            {wallet && tx.sender_wallet_id === wallet.wallet_id
                              ? <>- रु{tx.amount}</>
                              : <>+ रु{tx.amount}</>
                            }
                          </td>
                          <td className="py-2 px-4 border-b">{tx.status}</td>
                          <td className="py-2 px-4 border-b">
                            {new Date(tx.transaction_time).toLocaleString()}
                          </td>
                          <td className="py-2 px-4 border-b flex gap-2">
                            {wallet && tx.sender_wallet_id === wallet.wallet_id && (
                              <button
                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                onClick={() => {
                                  setDisputeTxId(tx.transaction_id);
                                  setShowDisputeForm(true);
                                }}
                              >
                                Create Dispute
                              </button>
                            )}
                            <button
                              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                              onClick={() => handleDownloadTxPDF(tx)}
                            >
                              Download PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={theme === 'dark' ? "text-gray-400" : "text-gray-600"}>No transactions found.</div>
              )}
            </div>

            {/* Disputes Section */}
            <div className="mb-8">
              <h2 className={theme === 'dark' ? "text-xl font-semibold text-gray-100 mb-2" : "text-xl font-semibold text-gray-700 mb-2"}>Disputes</h2>
              {disputes.length ? (
                <div className="overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr className={tableHeaderClass}>
                        <th className="py-2 px-4 border-b">Dispute ID</th>
                        <th className="py-2 px-4 border-b">Transaction ID</th>
                        <th className="py-2 px-4 border-b">Reason</th>
                        <th className="py-2 px-4 border-b">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputes.map(d => (
                        <tr key={d.dispute_id}>
                          <td className="py-2 px-4 border-b">{d.dispute_id}</td>
                          <td className="py-2 px-4 border-b">{d.transaction_id}</td>
                          <td className="py-2 px-4 border-b">{d.reason}</td>
                          <td className="py-2 px-4 border-b">{d.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={theme === 'dark' ? "text-gray-400" : "text-gray-600"}>No disputes found.</div>
              )}
            </div>

            {/* Dispute Form Modal */}
            {showDisputeForm && (
              <form
                onSubmit={handleCreateDispute}
                className={theme === 'dark' ? "bg-gray-800 p-4 rounded-md flex flex-col gap-2 mt-4 text-gray-100" : "bg-gray-100 p-4 rounded-md flex flex-col gap-2 mt-4"}
              >
                <h3 className="font-semibold mb-2">
                  Create Dispute{disputeTxId ? ` for Transaction ${disputeTxId}` : ''}
                </h3>
                {!disputeTxId && (
                  <input
                    type="text"
                    placeholder="Transaction ID"
                    value={disputeTxId}
                    onChange={e => setDisputeTxId(e.target.value)}
                    className={inputClass}
                    required
                  />
                )}
                <input
                  type="text"
                  placeholder="Reason for dispute"
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  className={inputClass}
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    className={theme === 'dark' ? "px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700" : "px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"}
                    onClick={() => {
                      setShowDisputeForm(false);
                      setDisputeTxId('');
                      setDisputeReason('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Deposit History Section */}
            <div className="mb-8">
              <h2 className={theme === 'dark' ? "text-xl font-semibold text-gray-100 mb-2" : "text-xl font-semibold text-gray-700 mb-2"}>Deposit History</h2>
              {deposits.length ? (
                <div className="overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr className={tableHeaderClass}>
                        <th className="py-2 px-4 border-b">Deposit ID</th>
                        <th className="py-2 px-4 border-b">Amount</th>
                        <th className="py-2 px-4 border-b">Bank Reference</th>
                        <th className="py-2 px-4 border-b">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map(dep => (
                        <tr key={dep.deposit_id}>
                          <td className="py-2 px-4 border-b">{dep.deposit_id}</td>
                          <td className="py-2 px-4 border-b">रु{dep.amount}</td>
                          <td className="py-2 px-4 border-b">{dep.bank_reference}</td>
                          <td className="py-2 px-4 border-b">{new Date(dep.deposited_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={theme === 'dark' ? "text-gray-400" : "text-gray-600"}>No deposits found.</div>
              )}
            </div>

            {/* Update Password Section */}
            <div className="mb-8">
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                onClick={() => setShowUpdatePassword(!showUpdatePassword)}
              >
                Update Password
              </button>
              {showUpdatePassword && (
                <form
                  onSubmit={handleUpdatePasswordSubmit}
                  className={theme === 'dark'
                    ? "bg-gray-800 p-4 rounded-md flex flex-col gap-2 mt-4 text-gray-100"
                    : "bg-gray-100 p-4 rounded-md flex flex-col gap-2 mt-4"}
                >
                  <input
                    type="password"
                    name="oldPassword"
                    placeholder="Old Password"
                    value={updatePasswordForm.oldPassword}
                    onChange={handleUpdatePasswordChange}
                    className={inputClass}
                    required
                  />
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New Password"
                    value={updatePasswordForm.newPassword}
                    onChange={handleUpdatePasswordChange}
                    className={inputClass}
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className={theme === 'dark' ? "px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700" : "px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"}
                      onClick={() => setShowUpdatePassword(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}


      </div>
    </div>
  );
};

export default Dashboard;