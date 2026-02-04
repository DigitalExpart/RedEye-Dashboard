# RedEYE Android Device Monitoring Dashboard

A professional, real-time monitoring and management dashboard for Android device fleets. Built for high performance, visual excellence, and complete backend flexibility.

![RedEYE Login](file:///C:/Users/Shilley%20Pc/.gemini/antigravity/brain/0531b662-739c-474f-be41-054e46e641b4/uploaded_media_1770155494541.png)

## 🚀 Features

- **Real-time Monitoring**: Live status updates (battery, network, signal) via Socket.io.
- **SMS Stream**: Production-grade virtualized message stream handling thousands of messages per device.
- **Advanced Auth**: Multi-step login with 2FA (Telegram OTP & Google Authenticator) and secure signed session management.
- **Admin Panel**: Complete user management, role assignments, and device fleet control.
- **Deterministic Mocking**: Full development lifecycle support without backend dependency using a built-in mock server and data seeder.
- **Responsive Design**: Premium dark-mode UI built with Tailwind CSS and Framer Motion for smooth interactions.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion.
- **State Management**: TanStack Query (React Query) for efficient caching and synchronization.
- **Real-time**: Socket.io-client for bi-directional live updates.
- **Security**: `jose` for signed JWT sessions, `httpOnly` cookies for secure state persistence.
- **UI Components**: Radix UI primitives and Lucide React icons.

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DigitalExpart/RedEye-Dashboard.git
   cd RedEye-Dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy the example environment file and adjust the values (the defaults are optimized for mock mode):
   ```bash
   cp .env.example .env.local
   ```

### Running the Project

#### Development (Mock Mode)
This runs the Next.js dashboard and a mock Socket.io server concurrently. No real backend is required.
```bash
npm run dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Socket Server**: `http://localhost:4001` (Auto-started)

#### Production Build
```bash
npm run build
npm start
```

## 🔐 Mock Credentials

Use these accounts to test the dashboard in Mock Mode:

| Account Type | Username | Password | 2FA Required |
|--------------|----------|----------|--------------|
| **Admin**    | `admin`  | `admin123` | Yes (`123456`) |
| **User**     | `user`   | `user123`  | Yes (`123456`) |
| **Demo**     | `demo`   | `demo123`  | No (Direct)   |

> [!TIP]
> Use the **demo** account for the fastest testing, as it skips the 2FA step.

## 🏗 Swappable Architecture

The project is designed to be backend-agnostic. To transition to a real production backend:
1. Update `NEXT_PUBLIC_USE_MOCKS=false` in `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your production API.
3. The `apiClient` in `src/lib/api/client.ts` will automatically switch from local route handlers to your production endpoint.

## 📁 Project Structure

```bash
src/
├── app/             # Next.js routes and layout
├── components/      # Reusable UI components
├── lib/             # API client, config, and utilities
├── mocks/           # Deterministic data store and seeders
├── providers/       # Context providers (Auth, Query, Toast)
├── types/           # Strict TypeScript contracts
scripts/             # Mock Socket.io server implementation
```

## 📄 License
This project is proprietary. Please refer to delivery terms.
