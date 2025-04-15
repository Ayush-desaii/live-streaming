import React, { useState, useEffect } from "react";
import StreamHost from "./components/StreamHost";
import VideoCall from "./components/VideoCall";
import ChatComponent from "./components/Chat"; // Import the chat component

function App() {
    const [activeTab, setActiveTab] = useState("stream"); // "stream" or "videocall"
    const [showChat, setShowChat] = useState(true);
    const [sessionId, setSessionId] = useState(null);
    
    // Generate a unique session ID when the app loads
    useEffect(() => {
        setSessionId(`session-${Date.now()}`);
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-5 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-2xl font-bold text-blue-600 mb-2">
                    Live Streaming & Video Call
                </h1>
                <p className="text-gray-600">Stream your content or connect with others through video calls</p>
            </header>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-5">
                <button 
                    onClick={() => setActiveTab("stream")}
                    className={`py-3 px-6 text-base ${
                        activeTab === "stream" 
                        ? "font-semibold text-blue-600 border-b-2 border-blue-600" 
                        : "font-normal text-gray-600"
                    }`}
                >
                    Live Streaming
                </button>
                <button 
                    onClick={() => setActiveTab("videocall")}
                    className={`py-3 px-6 text-base ${
                        activeTab === "videocall" 
                        ? "font-semibold text-blue-600 border-b-2 border-blue-600" 
                        : "font-normal text-gray-600"
                    }`}
                >
                    Video Call
                </button>
            </div>

            {/* Main content area with flexible layout */}
            <div className="flex flex-row gap-5 h-full">
                {/* Left side: StreamHost or VideoCall */}
                <div className={`${showChat ? 'w-3/4' : 'w-full'} transition-all duration-300`}>
                    {activeTab === "stream" ? <StreamHost /> : <VideoCall />}
                </div>
                
                {/* Right side: Chat (conditionally shown) */}
                {showChat && (
                    <div className="w-1/4 min-w-[300px] max-w-md">
                        <ChatComponent 
                            roomId={sessionId} 
                            username="" // Let user set their name
                            serverUrl="https://1e7c-49-36-83-170.ngrok-free.app"
                        />
                    </div>
                )}
            </div>
            
            {/* Toggle chat button */}
            <button 
                onClick={() => setShowChat(!showChat)}
                className="fixed bottom-5 right-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center cursor-pointer shadow-lg z-50"
            >
                {showChat ? (
                    // Close icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    // Chat icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                )}
            </button>
        </div>
    );
}

export default App;