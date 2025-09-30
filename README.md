# KPI System

This project is a **KPI management system** built with **React** and **Vite**, using **MongoDB Atlas** as the database. It allows you to manage KPIs, users, and reports.

---

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)

---

## Setup Instructions

1. **Clone the repository**:

git clone https://github.com/babammbuay/kpi-system.git
cd kpi-system

2. **Install dependencies**:

npm install

3. **Create a .env file in the sever directory and add your MongoDB Atlas connection string**:

MONGO_URI="your_mongodb_atlas_connection_string"
PORT=5000
JWT_SECRET= your_JWT_SECRET

Replace your_mongodb_atlas_connection_string with the URI from MongoDB Atlas (see below).

## MongoDB Atlas Setup
Go to MongoDB Atlas https://www.mongodb.com/products/platform/atlas-database and create a free account.

Create a new cluster (Free Tier is enough for testing).

Create a database user with a username and password.

Get your connection string from the Connect button in Atlas.

Replace <username>, <password>, and <dbname> in the URI:

mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
Add this URI to your .env file as MONGO_URI.

## Running the Project
1. **Start the backend (if backend is in server/ folder)**:

cd server
npm install
npm start

2. **Start the frontend**:

cd ..
npm run dev

3. **Open your browser at**:

http://localhost:5173

## API Documentation
Base URL: http://localhost:5000 (or your deployed server)
