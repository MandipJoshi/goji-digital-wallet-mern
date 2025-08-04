## Setup Process

### Prerequisites

- Node.js (v18+ recommended)
- MySQL server
- npm (comes with Node.js)

---

### 1. Clone the Repository

```sh
git clone https://github.com/MandipJoshi/goji-digital-wallet-mern/upload
cd backend
```

---

### 2. Install Dependencies

```sh
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the `backend` folder with the following content (adjust values as needed):

```env
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
JWT_TOKEN=your_jwt_secret
BANK_API_KEYS=your_bank_api_key
PORT=3001
```

---

### 4. Set Up the Database

- Create a MySQL database matching `DB_NAME`.
- Run the SQL schema in `db.sql` (if provided) to create tables, or let Sequelize auto-create them on first run.

---

### 5. Start the Backend Server

```sh
npm start
```

The server will run at [http://localhost:3001](http://localhost:3001) by default.

---

### 6. Run Automated Tests (Optional)

```sh
npm test
```

---

### 7. Uploads Directory

Ensure an `uploads` directory exists in the backend folder for KYC document storage.  
If not present, create it:

```sh
mkdir uploads
```

---

### 8. Connect Frontend

- The backend is configured to accept requests from `http://localhost:5173` (the default Vite frontend port).
- Start your frontend separately and connect via API endpoints.

---

**Your backend is now ready for use!**
