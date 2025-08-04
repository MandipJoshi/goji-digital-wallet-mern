import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-900 to-gray-900 flex flex-col items-center justify-center text-white">
            <div className="max-w-2xl w-full px-6 py-12 bg-opacity-80 bg-gray-800 rounded-xl shadow-lg text-center">
                <h1 className="text-4xl font-bold mb-4">Goji Digital Wallet</h1>
                <p className="text-lg mb-8">
                    Securely manage your money, send payments, and track transactions with ease.
                </p>
                <button
                    className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition"
                    onClick={() => navigate('/login')}
                >
                    Get Started
                </button>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-gray-900 bg-opacity-70 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-2">Instant Transfers</h2>
                        <p>Send and receive money instantly to anyone with a wallet ID.</p>
                    </div>
                    <div className="bg-gray-900 bg-opacity-70 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-2">KYC Verification</h2>
                        <p>Keep your account secure with easy document upload and verification.</p>
                    </div>
                    <div className="bg-gray-900 bg-opacity-70 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-2">Track Transactions</h2>
                        <p>View your transaction history and download statements anytime.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;