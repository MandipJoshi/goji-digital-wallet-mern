const express = require('express');
const cors = require('cors');
require("dotenv").config();
const {sequelize, connectDB} = require("./db/database");

const app = express();

const PORT = process.env.PORT || 3001;
app.use(express.json());

app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173'
}));

app.use('/api/user', require('./route/userRoute'));
app.use('/api/transaction', require('./route/transactionRoute'));
app.use('/api/wallet', require('./route/walletRoute'));
app.use('/api/admin', require('./route/adminRoute'));
app.use('/api/kyc', require('./route/kycRoute'));
app.use('/api/dispute', require('./route/disputeRoutes'));
app.use('/api/deposit', require('./route/depositRoute'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    const startServer = async () => {
        await connectDB();
        await sequelize.sync();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    };
    startServer();
}

module.exports = app;