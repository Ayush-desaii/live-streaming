import React, { useState, useEffect } from "react";
import VideoCall from "./components/VideoCall";
import StreamDetailsPopup from "./components/DetailsPopup";
import { FaUserEdit } from "react-icons/fa";

function App() {
    const [activeTab, setActiveTab] = useState("stream"); // "stream" or "videocall"
    const [sessionId, setSessionId] = useState(null);
    const [formData, setFormData] = useState({ name: "", title: "", key: "" });
    const [showForm, setShowForm] = useState(false);
    
    // Generate a unique session ID when the app loads
    useEffect(() => {
        setSessionId(`session-${Date.now()}`);
        const saved = localStorage.getItem("streamDetails");
        if (saved) {
            setFormData(JSON.parse(saved));
        }
    }, []);

    const handleChange = (e) => {
        const updated = { ...formData, [e.target.name]: e.target.value };
        setFormData(updated);
        localStorage.setItem("streamDetails", JSON.stringify(updated));
      };

    return (
        <div className="max-w-6xl mx-auto p-5 font-sans">
            <StreamDetailsPopup setFormData={setFormData} />
            <header className="flex justify-between items-center px-4 py-4 relative">
                {/* Right: Title & Subtitle */}
                <div className="text-left">
                    <h1 className="text-2xl font-bold text-blue-600 mb-1">
                    Podcast & Live Streaming
                    </h1>
                    <p className="text-gray-600 text-sm">
                    Stream your podcast
                    </p>
                </div>

                {/* Left: Editable Icon & Form */}
                <div className="relative">
                    <button
                    onClick={() => setShowForm((prev) => !prev)}
                    className="text-blue-600 text-xl"
                    >
                    <FaUserEdit />
                    </button>

                    {showForm && (
                    <div className="absolute top-full right-0 mt-2 bg-white shadow-lg border p-4 rounded-lg z-50 w-72 max-w-[90vw]">
                        <label className="block text-sm text-gray-700 mb-1">Name:</label>
                        <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border px-2 py-1 rounded mb-3 text-sm"
                        placeholder="Enter name"
                        />
                        <label className="block text-sm text-gray-700 mb-1">Title:</label>
                        <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full border px-2 py-1 rounded text-sm"
                        placeholder="Enter title"
                        />
                    </div>
                    )}
                </div>
            </header>

            {/* Main content area with flexible layout */}
            <div className="flex flex-row gap-5 h-full">
                <div className={'w-full transition-all duration-300'}>
                    <VideoCall />
                </div>                
            </div>
            
        </div>
    );
}

export default App;