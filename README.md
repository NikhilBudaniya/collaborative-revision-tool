# Industrial Collaborative Revision Tool

This is a polished, real-time collaborative workspace built with **Next.js 15**, **React 19**, and **Pusher**. It is designed for professional teams to synchronize document revision states with strict organization-level isolation and an industrial, high-density aesthetic.

## 🚀 Key Features

- **Real-Time Synchronization**: Instant state and history updates across all connected devices using Pusher WebSockets.
- **Organization Isolation**: Uses `private-org-{id}` channels and server-side cookie validation to ensure users only see data belonging to their `orgId`.
- **Zero-Latency UI**: Leverages React 19 `useOptimistic` and `useTransition` for instantaneous feedback during status updates.
- **Race Condition Protection**: Implements server-side atomic queues and client-side versioning to handle concurrent updates without data loss or UI flickering.
- **Industrial Aesthetic**: A custom "Command Center" theme built with Tailwind CSS (Zinc palette) and Geist Mono typography.
- **Auditory Feedback**: Tactile sound effects for system events (requires assets in `/public/sounds/`).
- **Session Manager**: A built-in developer tool (bottom-right) to quickly toggle `orgId` and `userId` for testing.

## 🔊 Auditory Feedback System

To enhance the "Command Center" feel, the app includes a minimalist sound engine:
- **Success Ping (`success.mp3`)**: Rings immediately after you successfully commit a state update. Provides confirmation that your change was persisted.
- **System Tick (`tick.mp3`)**: Rings when a new update is received from *another* user or tab. Provides awareness of collaborative activity without needing to look at the log.

*Note: Please place your `.mp3` files in `colab_frontend/public/sounds/` to activate this feature.*

## 📐 Technical Decisions: Why This Architecture?

During the design phase, several alternative approaches were evaluated and ruled out to ensure the most robust solution for a real-world collaborative environment:

### 1. Ruled Out: Native Browser Sync (`BroadcastChannel`)
*   **Initial Idea**: Use the browser's native `BroadcastChannel` API to sync tabs locally without a backend.
*   **Why Ruled Out**: While "zero-config," it only works for tabs on the same machine. A true collaborative tool must sync across different users, machines, and networks. We moved to **Pusher** to provide a global WebSocket layer.

### 2. Ruled Out: Client-Side Only State (`localStorage`)
*   **Initial Idea**: Store the revision history in the browser's local storage.
*   **Why Ruled Out**: This would fail the "Shared State" requirement. Users in the same organization would have independent histories until they manually shared them. We implemented a **Server-Side Global Singleton** to act as the temporary "Source of Truth" for all users in an organization.

### 3. Ruled Out: Standard WebSockets (`Socket.IO`)
*   **Initial Idea**: Use a traditional Socket.IO server.
*   **Why Ruled Out**: Standard Next.js serverless functions (like API Routes or Server Actions) are ephemeral and cannot maintain the persistent connection required for raw WebSockets. We chose **Pusher** because it manages the persistent connection infrastructure externally, which is the industry standard for Next.js/Serverless real-time apps.

### 4. Ruled Out: Periodic Polling
*   **Initial Idea**: Have the client "ask" the server for updates every few seconds.
*   **Why Ruled Out**: Polling feels "laggy" and creates unnecessary server load. It doesn't meet the high-performance "Real-Time" objective as elegantly as a Push-based architecture.

## 🏁 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` file in the `colab_frontend` directory and add your Pusher credentials:
   ```env
   NEXT_PUBLIC_PUSHER_KEY=your_key
   NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
   PUSHER_APP_ID=your_id
   PUSHER_SECRET=your_secret
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Testing Sync & Isolation**:
   - Open the app in two windows.
   - Use the **Session Manager** (bottom-right) to set both to the same `orgId`.
   - Update a status in one window and watch it sync.
   - Change the `orgId` in one window to verify that updates are no longer shared (Isolation Protocol).

---
*Developed for the Interface Frontend Engineering Task.*
