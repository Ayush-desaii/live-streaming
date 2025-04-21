import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';

const StreamHost = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamStatus, setStreamStatus] = useState('Not Streaming');
    const [showModal, setShowModal] = useState(false);
    const [youtubeKey, setYoutubeKey] = useState(null);
    const socketRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const userIdRef = useRef(null);
    
    // Load stream details from localStorage
    useEffect(() => {
        try {
            const streamDetails = JSON.parse(localStorage.getItem('streamDetails') || '{}');
            if (streamDetails) {
                console.log('Stream details loaded from localStorage:', streamDetails);
            }
        } catch (error) {
            console.error('Error loading stream details from localStorage:', error);
        }
    }, []);

    const generateUserId = () => {
        // Get stream details from localStorage
        const streamDetails = JSON.parse(localStorage.getItem('streamDetails') || '{}');
        const { name = 'unknown', title = 'untitled' } = streamDetails;
        
        // Create userId from name and title
        const baseId = `${name}-${title}`.replace(/\s+/g, '-').toLowerCase();
        const timestamp = Date.now().toString(36);
        return `${baseId}-${timestamp}`;
    };

    const startStreaming = async () => {
        if (!youtubeKey) {
            alert('Please enter your YouTube Stream Key');
            return;
        }

        try {
            // Generate userId for this stream
            const userId = generateUserId();
            userIdRef.current = userId;
            
            // Initialize stream with server first
            const response = await fetch('http://localhost:5000/start-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    youtubeStreamKey: youtubeKey
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to initialize stream');
            }
            
            setStreamStatus('Stream initialized with server');
            
            // Capture display media with specific constraints to prefer current tab
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser', // Prefer browser tab
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                preferCurrentTab: true // Experimental hint
            });
            streamRef.current = stream;

            // Connect socket
            const socket = io('http://localhost:5000', {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            socketRef.current = socket;

            // Socket connection handlers
            socket.on('connect', () => {
                console.log('Socket connected for streaming');
                setStreamStatus('Socket Connected');
                
                // Identify this socket with the userId
                socket.emit('identify', { userId });
                
                socket.on('stream-ready', () => {
                    console.log('Stream is ready, starting MediaRecorder');
                    
                    // Initialize MediaRecorder
                    const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'video/webm;codecs=vp9',
                        videoBitsPerSecond: 2500000,
                        audioBitsPerSecond: 128000
                    });

                    mediaRecorderRef.current = mediaRecorder;

                    // Send video chunks to server
                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            socket.emit('stream', event.data);
                        }
                    };

                    // Start recording
                    mediaRecorder.start(1000); // Send data every second
                    setIsStreaming(true);
                    setStreamStatus('Streaming to YouTube');
                });
                
                // Handle stream errors
                socket.on('stream-error', (errorMsg) => {
                    console.error('Stream error:', errorMsg);
                    setStreamStatus(`Error: ${errorMsg}`);
                    
                    // Optionally stop streaming on error
                    if (isStreaming) {
                        stopStreaming();
                    }
                });

                // Handle stream end
                stream.getVideoTracks()[0].onended = stopStreaming;
            });

            // Error handling
            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setStreamStatus('Connection Failed');
            });

        } catch (error) {
            console.error('Streaming setup error:', error);
            setStreamStatus(`Setup Failed: ${error.message}`);
            
            // Provide more detailed error information
            if (error.name === 'NotAllowedError') {
                alert('Screen sharing was cancelled or not permitted. Please select your desired tab/window.');
            }
        }
    };

    const stopStreaming = async () => {
        // Stop media recorder
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }

        // Stop stream tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        
        // Tell server to stop the stream
        if (userIdRef.current) {
            try {
                await fetch('http://localhost:5000/stop-stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: userIdRef.current
                    })
                });
                console.log('Stream stopped on server');
            } catch (error) {
                console.error('Error stopping stream on server:', error);
            }
        }
   

        // Reset states
        setIsStreaming(false);
        setStreamStatus('Streaming Stopped');
    };

    const handleClick = () => {
        if (youtubeKey) {
          isStreaming ? stopStreaming() : startStreaming();
        } else {
          setShowModal(true);
        }
      };

    const handleChange = (e) => setYoutubeKey(e.target.value);
    const handleSubmit = () => {
      // Save the stream key to parent (optional, e.g., via prop function)
      // Set to youtubeKey state if you manage that outside
      startStreaming(youtubeKey); 
      setShowModal(false);
    };

    return (
        <>
        <div>
          <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
                ${isStreaming
                  ? 'bg-green-100 hover:bg-green-200 text-green-700'
                  : 'bg-red-100 hover:bg-red-200 text-red-700'}
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5L20 7" />
            </svg>
            {isStreaming ? "Live" : "Go Live"}
          </button>
        </div>
  
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Enter YouTube stream key</h2>
  
              <input
                type="text"
                placeholder="Enter your YouTube stream key"
                value={youtubeKey}
                onChange={handleChange}
                className="w-full mb-4 px-4 py-2 border rounded"
              />
  
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
};

export default StreamHost;