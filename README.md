# Smart Attendance System

Smart Attendance System is a full-stack web application that automates attendance using face recognition. It enables users to register faces, mark attendance through real-time recognition, and provides administrators with tools to manage users and attendance records.

## Live Demo

https://attendance-system-phi-gules.vercel.app

## Features

* Face registration and recognition using face-api.js
* Automated check-in and check-out
* Student and administrator dashboards
* Attendance history and records
* Secure JWT-based authentication
* Role-based access control
* Responsive user interface
* RESTful API architecture

## Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios
* React Router

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

### Face Recognition

* face-api.js
* TensorFlow.js

## Project Structure

```text
client/
server/
```

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/attendance-system.git
```

Install dependencies:

```bash
cd client
npm install

cd ../server
npm install
```

Create a `.env` file in the server directory and configure the required environment variables.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

## Running the Application

Start the backend:

```bash
npm run dev
```

Start the frontend:

```bash
npm start
```

## Future Improvements

* Multi-device support
* Attendance analytics and reports
* Notification system
* Enhanced face recognition performance

## Author

**Ujjwal Asati**

B.Tech Computer Science and Engineering, VIT Vellore

## License

This project is licensed under the MIT License.
