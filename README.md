# CoreWealth Banking Application 🏦

A modern, full-stack banking simulation designed to demonstrate object-oriented programming principles, data structures, and secure web application development. 

## 🚀 Overview

The CoreWealth Banking Application provides a comprehensive interface for managing bank accounts, processing transactions, and handling loans. It features a robust Java Spring Boot backend coupled with a responsive React frontend, utilizing Firebase for secure authentication and PostgreSQL for reliable data storage.

## ✨ Features

- **Secure Authentication**: Integration with Firebase Google Authentication for seamless and secure user login.
- **Account Management**: Support for different account types (Savings and Credit) with specific rules and limits.
- **Secure Transactions**: PIN-secured transactions with server-side hashing to protect user data.
- **Transaction History**: Track deposits, withdrawals, and transfers with detailed transaction histories.
- **Loan Processing**: Request and manage loans seamlessly within the application.
- **Modern UI**: A responsive, fast, and interactive user interface built with React and Vite.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Authentication**: Firebase Auth

### Backend
- **Framework**: Java Spring Boot
- **Database**: PostgreSQL
- **Architecture**: RESTful API, DAO Pattern

## ⚙️ Setup & Installation

### Prerequisites
- Java 25+
- Node.js & npm
- PostgreSQL
- Firebase Project (for Authentication)

### Backend Setup (Spring Boot)
1. **Configure PostgreSQL**:
   Create a local database named `bank_db`.
2. **Environment Variables**:
   Set up the following environment variables (or rely on the default `postgres` user):
   ```bash
   export DB_USER="your_postgres_user"
   export DB_PASSWORD="your_postgres_password"
   ```
3. **Run the Application**:
   Navigate to the root directory and start the Spring Boot server:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend will run on `http://localhost:8080`.

### Frontend Setup (React/Vite)
1. **Navigate to the Frontend directory**:
   ```bash
   cd Frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Firebase**:
   Create a `.env` file in the `Frontend` directory with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## 🔒 Security Practices Highlight
- **No Hardcoded Secrets**: All API keys and database credentials are managed via environment variables.
- **Password Hashing**: User PINs are hashed before being stored or verified against the PostgreSQL database.
- **Token-based Auth**: Utilizing Firebase's robust authentication mechanisms for user sessions.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
