import React, { useState, useRef } from 'react';
import io from 'socket.io-client';

const StreamHost = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamStatus, setStreamStatus] = useState('Not Streaming');
    const socketRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);

    const startStreaming = async () => {
        try {
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
                setStreamStatus('Streaming Started');

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
            setStreamStatus('Setup Failed');
            
            // Provide more detailed error information
            if (error.name === 'NotAllowedError') {
                alert('Screen sharing was cancelled or not permitted. Please select your desired tab/window.');
            }
        }
    };

    const stopStreaming = () => {
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

        // Reset states
        setIsStreaming(false);
        setStreamStatus('Streaming Stopped');
    };

    return (
        <div>
            {!isStreaming ? (
                <button 
                    onClick={startStreaming}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Start Streaming
                </button>
            ) : (
                <button 
                    onClick={stopStreaming}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Stop Streaming
                </button>
            )}
            <p className="mt-2 text-gray-600">Status: {streamStatus}</p>
        </div>
    );
};

export default StreamHost;