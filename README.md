# 🖋️ Doc-Signature

**Doc-Signature** is a secure, scalable **MERN stack** application for managing court-related digital document workflows. It enables role-based access, bulk file handling, dynamic e-signature placement, real-time routing, and automated report generation.

---

## 🚀 Features

- 🔐 Role-based Access (Admin, Reader, Officer)
- 📄 Bulk Excel Upload & Module Splitting
- ✍️ Sign All, Sign Individually, Reject, or Delegate
- 🧾 Dynamic Signature Placement with Report Generation
- 📩 Email Notifications via SMTP (Gmail)
- 📦 Final report includes signature, court ID, QR code
- ⚙️ Cluster-based **Stress Testing** using Multer

---

## 🛠 Tech Stack

- **Frontend**: React + Tailwind + Ant Design + Vite
- **Backend**: Node.js + Express + MongoDB
- **Auth**: JWT
- **File Handling**: Multer
- **Email**: Nodemailer + Gmail SMTP
- **Stress Testing**: Node.js `cluster` module
- **PDF**: Excel parsing, QR generation, e-sign placement

---

## 📁 Folder Structure

```
Doc-Signature/
├── backend/                   # API, DB, Signature Logic
│   ├── controllers/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── frontend/                  # React + Tailwind + AntD
│   ├── src/
│   └── StressTest/            # Cluster thread stress test on multer upload
│
├── files/                     # Static assets
│   ├── sign.png               # Signature Image
│   ├── template_excel.xlsx    # Upload Template
│   └── SRS/                   # Requirement Documentation
│
└── README.md
```

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/iamsumitkumar64/Doc-Signature.git
cd Doc-Signature
```

---

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm i
```

#### Frontend
```bash
cd ../frontend
npm i
```

---

### 3. Environment Variables Setup

#### 📁 `backend/.env`

```env
MONGO_CONNECTION_STRING=mongodb://localhost:27017/Doc-Sign
CURRENT_SERVER_URL=http://localhost:4001
INTERNAL_REQUEST_TOKEN=aaasdfasdf
NODE_ENV=local
FRONTEND_URL=http://localhost:2001

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_AUTH_USER=sumitkumarshaab@gmail.com
EMAIL_AUTH_PASS=your_email_app_password
```

> ⚠️ Use [Google App Passwords](https://support.google.com/accounts/answer/185833) for secure email access.

---

#### 📁 `frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:4001
```

---

## ▶️ Run the App

### Start Backend Server

```bash
cd backend
npm run server
```

### Start Frontend App

```bash
cd frontend
npm run dev
```

---

## 🌐 Local URLs

- **Frontend**: `http://localhost:2001`
- **Backend**: `http://localhost:4001`

---

## 🧪 Stress Testing (Cluster + Multer)

Inside the `/frontend/StressTest` directory, a **custom stress test** is configured to:

- Simulate **50,000 concurrent file upload requests**
- Use **Node.js cluster module** to leverage all CPU cores
- Test **Multer's capacity** for handling simultaneous uploads across threads

> Run it only when backend and Multer middleware are ready to handle high-volume load.

---

## 📂 Upload Assets

In the `/files` directory:

- `sign.png`: Signature image used in final documents
- `template_excel.xlsx`: Format for bulk Reader uploads
- `SRS/`: System Requirement Specifications & documentation

---

## ✅ Future Enhancements

- [ ] Signature drag-and-drop interface
- [ ] Socket.io for real-time role notifications
- [ ] Export PDF with digital signature lock
- [ ] Redis queue for task processing

---

## 🤝 Contributing

Feel free to fork the repo, improve the workflow, or open a PR.  
All meaningful contributions are welcome.

---

## 👨‍💻 Author

**Sumit Birwal**  
GitHub: [@iamsumitkumar64](https://github.com/iamsumitkumar64)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
