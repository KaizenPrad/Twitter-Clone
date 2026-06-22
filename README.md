# 🐦 Twitter Clone

A full-stack Twitter/X clone built with the MERN stack featuring real-time posts, notifications, user profiles, and social interactions.

![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5.x-5A0EF8?style=flat-square&logo=daisyui&logoColor=white)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Secure signup/login with JWT tokens
- 📝 **Create Posts** - Tweet with text and images
- ❤️ **Like & Retweet** - Engage with content
- 👥 **Follow System** - Follow/unfollow users
- 📰 **Home Feed** - See posts from followed users
- 🔔 **Notifications** - Real-time notification system
- 👤 **User Profiles** - Customizable profile with bio and avatar

### Advanced Features
- 🖼️ **Image Upload** - Share images with your tweets
- 🔍 **Explore** - Discover new content and trending topics
- 📱 **Responsive Design** - Perfect on desktop and mobile
- 🎨 **Modern UI** - Twitter-like interface with DaisyUI
- ⚡ **React Query** - Optimistic updates and caching
- 🔄 **Real-time Updates** - Instant feed refresh

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Cloudinary** | Image storage & optimization |
| **Cookie Parser** | Cookie handling |
| **CORS** | Cross-origin resource sharing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **DaisyUI** | Tailwind component library |
| **React Query** | Server state management |
| **React Router** | Client-side routing |
| **Axios** | HTTP client |
| **React Icons** | Icon library |
| **React Hot Toast** | Notifications |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React)                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Pages   │  │Components│  │  Hooks   │  │   Utils    │  │
│  │          │  │          │  │(React    │  │            │  │
│  │          │  │          │  │ Query)   │  │            │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └──────────────┴─────────────┴───────────────┘        │
│                           │                                  │
│                       Axios + React Query                   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Express)                          │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Routes   │  │Controllers│  │Middleware│  │   Lib     │  │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       └──────────────┴─────────────┴───────────────┘        │
│                           │                                  │
│              ┌────────────┴────────────┐                    │
│              ▼                         ▼                    │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │     MongoDB      │      │    Cloudinary     │            │
│  │    (Database)    │      │  (Image Storage)  │            │
│  └──────────────────┘      └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (local instance or MongoDB Atlas account)
- **Cloudinary** account (for image storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KaizenPrad/Twitter-Clone.git
   cd Twitter-Clone
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Set up environment variables** (see below)

6. **Start the development servers**

   In one terminal (backend):
   ```bash
   cd backend
   npm run dev
   ```

   In another terminal (frontend):
   ```bash
   cd frontend
   npm run dev
   ```

7. **Open your browser**
   ```
   Frontend: http://localhost:5173
   Backend:  http://localhost:5000
   ```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/twitter-clone

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

---

## 📁 Project Structure

```
Twitter-Clone/
├── backend/
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.js
│   │   ├── notification.controller.js
│   │   ├── post.controller.js
│   │   └── user.controller.js
│   ├── db/                  # Database connection
│   ├── lib/utils/           # Utility functions
│   ├── middleware/           # Custom middleware (auth)
│   ├── models/              # Mongoose data models
│   │   ├── notification.model.js
│   │   ├── post.model.js
│   │   └── user.model.js
│   ├── routes/              # API route definitions
│   └── server.js            # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Route-level components
│   │   ├── utils/           # Helper utilities
│   │   ├── App.jsx          # Main app with routing
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   ├── index.html           # HTML template
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind configuration
│   └── package.json
│
├── .gitignore
├── package.json             # Root package.json
└── README.md
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/signup` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/logout` | Logout user | Authenticated |
| GET | `/api/auth/me` | Get current user | Authenticated |

### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users/profile/:username` | Get user profile | Public |
| PUT | `/api/users/update` | Update profile | Authenticated |
| POST | `/api/users/follow/:userId` | Follow user | Authenticated |
| POST | `/api/users/unfollow/:userId` | Unfollow user | Authenticated |
| GET | `/api/users/suggested` | Get suggested users | Authenticated |

### Posts
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/posts/feed` | Get home feed | Authenticated |
| GET | `/api/posts/user/:username` | Get user posts | Public |
| GET | `/api/posts/:postId` | Get single post | Public |
| POST | `/api/posts/create` | Create new post | Authenticated |
| DELETE | `/api/posts/:postId` | Delete post | Owner |
| POST | `/api/posts/like/:postId` | Like post | Authenticated |
| POST | `/api/posts/unlike/:postId` | Unlike post | Authenticated |
| POST | `/api/posts/retweet/:postId` | Retweet post | Authenticated |

### Notifications
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/notifications` | Get notifications | Authenticated |
| DELETE | `/api/notifications` | Clear notifications | Authenticated |

---

## 🎨 Screenshots

> Add screenshots of your application here

```
[Home Feed]  [Create Post]  [User Profile]  [Notifications]
```

---

## 🔧 Available Scripts

### Root
| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |

### Backend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start production server |

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Pradyumn Dwivedi**
- GitHub: [@KaizenPrad](https://github.com/KaizenPrad)
- LinkedIn: [Pradyumn Dwivedi](https://linkedin.com/in/pradyumn)

---

## 🙏 Acknowledgments

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [DaisyUI Documentation](https://daisyui.com/)

---

<div align="center">

**⭐ Star this repository if you found it helpful! ⭐**

</div>
