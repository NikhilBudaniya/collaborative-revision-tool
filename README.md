# Industrial Collaborative Revision Tool

This is a polished, real-time collaborative workspace built with **Next.js 15**, **React 19**, and **Pusher**. It is designed for professional teams to synchronize document revision states with strict organization-level isolation and an industrial, high-density aesthetic.

## 🚀 Key Features

- **Real-Time Synchronization**: Instant state and history updates across all connected devices using Pusher WebSockets.
- **Organization Isolation**: Uses `private-org-{id}` channels and server-side cookie validation to ensure users only see data belonging to their `orgId`.
- **Zero-Latency UI**: Leverages React 19 `useOptimistic` and `useTransition` for instantaneous feedback during status updates.
- **Race Condition Protection**: Implements server-side atomic queues and client-side versioning to handle concurrent updates without data loss or UI flickering.
- **Offline Resilience**: Built-in **Outbox System** that queues updates locally if the connection is lost and auto-syncs upon reconnection.
- **Industrial Aesthetic**: A custom "Command Center" theme built with Tailwind CSS (Zinc palette) and Geist Mono typography.
- **Auditory Feedback**: Tactile sound effects for system events (requires assets in `/public/sounds/`).
- **Session Manager**: A built-in developer tool (bottom-right) to quickly toggle `orgId` and `userId` for testing.

## 🔊 Auditory Feedback System

To enhance the "Command Center" feel, the app includes a minimalist sound engine:
- **Success Ping (`success.mp3`)**: Rings immediately after you successfully commit a state update.
- **System Tick (`tick.mp3`)**: Rings when a new update is received from *another* user or tab.

*Note: Please place your `.mp3` files in `colab_frontend/public/sounds/` to activate this feature.*

## 📐 Technical Decisions: Why This Architecture?

During the design phase, several alternative approaches were evaluated and ruled out to ensure the most robust solution for a real-world collaborative environment:

### 1. Ruled Out: Native Browser Sync (`BroadcastChannel`)
- **Initial Idea**: Use the browser's native `BroadcastChannel` API to sync tabs locally without a backend.
- **Why Ruled Out**: While "zero-config," it only works for tabs on the same machine. A true collaborative tool must sync across different users, machines, and networks. We moved to **Pusher** to provide a global WebSocket layer.

### 2. Ruled Out: Client-Side Only State (`localStorage`)
- **Initial Idea**: Store the revision history in the browser's local storage.
- **Why Ruled Out**: This would fail the "Shared State" requirement. Users in the same organization would have independent histories until they manually shared them. We implemented a **Server-Side Global Singleton** to act as the temporary "Source of Truth."

### 3. Ruled Out: Standard WebSockets (`Socket.IO`)
- **Initial Idea**: Use a traditional Socket.IO server.
- **Why Ruled Out**: Standard Next.js serverless functions are ephemeral and cannot maintain the persistent connection required for raw WebSockets. **Pusher** manages the infrastructure externally, which is the industry standard for Next.js.

### 4. Ruled Out: Periodic Polling
- **Initial Idea**: Have the client "ask" the server for updates every few seconds.
- **Why Ruled Out**: Polling feels "laggy" and creates unnecessary server load. It doesn't meet the high-performance "Real-Time" objective as elegantly as a Push-based architecture.

## 🏗 Advanced Implementation Details

### 1. Persistence & HMR-Safe State
Since this prototype operates without a traditional database, we implemented a **Global Singleton Pattern** on the server. This in-memory cache stores the `RevisionState` and `RevisionLog` per `orgId`, ensuring history persists across page refreshes and survives Hot Module Replacement (HMR) during development.

### 2. Distributed Race Condition Shield
To handle high-concurrency environments across different machines:
- **Server-Side Atomic Queue**: All updates for a specific organization are enqueued and processed sequentially to ensure `version` increments remain consistent.
- **Monotonic Versioning**: Every state broadcast includes a version number. The client-side hook explicitly rejects any incoming packets with a version equal to or lower than the current local state, preventing "state-flips" from out-of-order network traffic.

### 3. Connection State & Offline Outbox
The application actively monitors the WebSocket link. If the link is severed:
- The UI displays a `NETWORK_DISCONNECTED` system alert.
- Updates are stored in a local **Outbox** (persisted in `localStorage`).
- Upon restoration of the `SYS_LINK`, the outbox is automatically flushed to the server in chronological order.

### 4. Chronological Reconciliation
The system uses **Event-Time Reconciliation** to handle late-arriving offline updates:
- **Client-Side Timestamping**: Timestamps are generated the moment "Commit" is clicked, preserving user intent regardless of network lag.
- **Deterministic History**: When the server receives an update, it sorts the entire historical log by timestamp.
- **LWW (Last-Write-Wins) Status**: The current "Winner" status is only updated if the incoming event is strictly newer than the current `lastUpdate.timestamp`. Older updates are added to history but do not revert the system status.

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

## 🧪 Testing Sync & Isolation

- **Step 1**: Open the application in two separate browser windows (or different browsers).
- **Step 2**: In both windows, look for the **Session Manager** in the bottom-right corner.
- **Step 3**: Set both windows to the same `ORG_ID` (e.g., `ORG_ALPHA`).
- **Step 4**: Update the status in Window A. You should see it reflect **instantly** in Window B, accompanied by a sound effect.
- **Step 5**: Change the `ORG_ID` in Window B to something else (e.g., `ORG_BETA`).
- **Step 6**: Update the status in Window A again. Window B should **not** receive the update, confirming strict organizational isolation.

---
*Developed for Interface AI.*
