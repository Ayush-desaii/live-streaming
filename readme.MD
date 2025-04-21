```markdown
# 🎙️ Podcast Live Streaming Web App

This project allows users to host and stream their podcasts **live to YouTube** with webcam support and peer-to-peer video calls using WebRTC and Socket.IO. Built for creators who want to go live with a guest seamlessly.

---

## 🚀 Features

- ✅ Enter host name & podcast title  
- ✅ Start your webcam  
- ✅ Create a video call room  
- ✅ Invite a guest by sharing Call ID  
- ✅ Enter your YouTube RTMP stream key  
- ✅ Go LIVE and broadcast your podcast to YouTube  
- ✅ **Collaborative Whiteboard** for real-time sketching, notes, and ideas sharing during podcast

---

## 🧠 Tech Stack

- **Frontend**: React, Tailwind CSS  
- **Backend**: Node.js, Express.js, Socket.IO  
- **Streaming**: FFmpeg, YouTube RTMP  
- **P2P Calls**: WebRTC (PeerJS or custom signaling)  
- **Live Video**: MediaStream, WebSocket piping

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ayush-desaii/live-streaming
```

### 2. Install Dependencies

```bash
# For backend
cd server
npm install

# For frontend
cd ../frontend
npm install
```

### 3. Start the Servers

```bash
# In server directory
node server.js

# In client directory
npm run start
```

---

## 🧭 Usage Guide

### Step-by-step Workflow

1. **Enter Your Name and Podcast Title**  
   Start by entering your display name and title for the podcast episode.

2. **Start Webcam**  
   Click on "Start Camera" to preview your camera feed.

3. **Create a Call Room**  
   Generate a call room by clicking “Create Call”. You’ll get a unique Call ID.

4. **Share Call ID**  
   Share the Call ID with your guest so they can join your podcast room.

5. **Enter YouTube RTMP Key**  
   Paste the YouTube stream key in the input field provided.

6. **Go Live!**  
   Press the "Go Live" button to start streaming your podcast directly to YouTube.

---

## 📺 How to Get YouTube RTMP Key

1. Go to **YouTube Studio**
2. Click on **"Go Live"**
3. Under **Stream Settings**, copy the **Stream Key**
4. Paste it into the app when prompted

---

## 🛑 Stop Streaming

Click on the **"Live"** button (which toggles to stop) to end your live stream whenever needed.

---

## 📌 Notes

- Ensure your YouTube account is verified and enabled for live streaming.
- Guest and host must allow camera and microphone access.
- Works best on modern browsers like **Chrome** or **Firefox**.

---

## 🙌 Contributing

Contributions are welcome!  
Feel free to fork this project, open issues, and submit pull requests.

---

## 📄 License

This project is licensed under the **MIT License**.  
You are free to use and modify this project for your own needs.
```
