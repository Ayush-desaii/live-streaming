const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // For parsing JSON request bodies

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Object to store active streaming processes
const activeStreams = {};

// Route to initialize streaming with user's YouTube key
app.post('/start-stream', (req, res) => {
    const { userId, youtubeStreamKey } = req.body;
    
    if (!userId || !youtubeStreamKey) {
        return res.status(400).json({ error: 'Missing userId or youtubeStreamKey' });
    }

    // Store the stream key for this user
    activeStreams[userId] = {
        streamKey: youtubeStreamKey,
        ffmpeg: null
    };

    console.log(`Stream initialized for user ${userId} with key ${youtubeStreamKey.substring(0, 4)}***`);
    
    return res.status(200).json({ message: 'Stream initialized', userId });
});

// Route to stop streaming
app.post('/stop-stream', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    if (activeStreams[userId] && activeStreams[userId].ffmpeg) {
        try {
            activeStreams[userId].ffmpeg.stdin.end();
            activeStreams[userId].ffmpeg.kill();
            console.log(`Stream stopped for user ${userId}`);
            delete activeStreams[userId];
            return res.status(200).json({ message: 'Stream stopped' });
        } catch (error) {
            console.error(`Error stopping stream for user ${userId}:`, error);
            return res.status(500).json({ error: 'Failed to stop stream' });
        }
    } else {
        return res.status(404).json({ error: 'No active stream found for this user' });
    }
});

io.on('connection', (socket) => {
    console.log('Client connected to streaming socket');
    let userId = null;

    // User identification
    socket.on('identify', (data) => {
        userId = data.userId;
        console.log(`Socket identified for user ${userId}`);
        
        // Check if we have a stream key for this user
        if (!activeStreams[userId] || !activeStreams[userId].streamKey) {
            socket.emit('stream-error', 'No stream initialized for this user');
            return;
        }
        
        const youtubeRtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${activeStreams[userId].streamKey}`;
        
        try {
            // Spawn FFmpeg process for streaming
            const ffmpeg = spawn('ffmpeg', [
                '-i', 'pipe:0',          // Input from stdin
                '-c:v', 'libx264',       // Video codec
                '-preset', 'ultrafast',  // Encoding preset
                '-b:v', '2500k',         // Video bitrate
                '-maxrate', '2500k',     
                '-bufsize', '5000k',     
                '-pix_fmt', 'yuv420p',   // Pixel format
                '-g', '60',              // Keyframe interval
                '-c:a', 'aac',           // Audio codec
                '-b:a', '128k',          // Audio bitrate
                '-f', 'flv',             // Output format
                youtubeRtmpUrl           // User-specific YouTube RTMP URL
            ], { 
                stdio: ['pipe', 'pipe', 'pipe'] 
            });

            // Store ffmpeg instance
            activeStreams[userId].ffmpeg = ffmpeg;

            // Log FFmpeg stdout
            ffmpeg.stdout.on('data', (data) => {
                console.log(`FFmpeg stdout (user ${userId}): ${data.toString()}`);
            });

            // Log FFmpeg stderr
            ffmpeg.stderr.on('data', (data) => {
                console.error(`FFmpeg stderr (user ${userId}): ${data.toString()}`);
            });

            // Log FFmpeg error events
            ffmpeg.on('error', (error) => {
                console.error(`FFmpeg Process Error (user ${userId}):`, error);
                socket.emit('stream-error', 'FFmpeg process error');
            });

            // Log FFmpeg exit
            ffmpeg.on('exit', (code, signal) => {
                console.log(`FFmpeg process exited for user ${userId} with code ${code} and signal ${signal}`);
                if (activeStreams[userId]) {
                    activeStreams[userId].ffmpeg = null;
                }
            });

            socket.emit('stream-ready', { status: 'ready' });
            
        } catch (spawnError) {
            console.error(`Error spawning FFmpeg process for user ${userId}:`, spawnError);
            socket.emit('stream-error', 'Failed to start streaming process');
        }
    });

    // Handle stream data from client
    socket.on('stream', (data) => {
        if (!userId || !activeStreams[userId] || !activeStreams[userId].ffmpeg) {
            socket.emit('stream-error', 'No active streaming process');
            return;
        }
        
        try {
            // Write video chunks to FFmpeg stdin
            const ffmpeg = activeStreams[userId].ffmpeg;
            if (ffmpeg && ffmpeg.stdin && !ffmpeg.stdin.destroyed) {
                ffmpeg.stdin.write(data);
            } else {
                console.error(`FFmpeg stdin is not available for user ${userId}`);
                socket.emit('stream-error', 'FFmpeg process not ready');
            }
        } catch (error) {
            console.error(`Error writing to FFmpeg for user ${userId}:`, error);
            socket.emit('stream-error', 'Error writing to stream');
        }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected from streaming socket${userId ? ` (user ${userId})` : ''}`);
        if (userId && activeStreams[userId] && activeStreams[userId].ffmpeg) {
            try {
                activeStreams[userId].ffmpeg.stdin.end();
                activeStreams[userId].ffmpeg.kill();
                activeStreams[userId].ffmpeg = null;
                console.log(`FFmpeg process stopped for user ${userId} on disconnect`);
            } catch (error) {
                console.error(`Error killing FFmpeg process for user ${userId}:`, error);
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Multi-user streaming server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server');
    
    // Kill all active FFmpeg processes
    for (const userId in activeStreams) {
        if (activeStreams[userId].ffmpeg) {
            try {
                activeStreams[userId].ffmpeg.stdin.end();
                activeStreams[userId].ffmpeg.kill();
                console.log(`Stopped stream for user ${userId}`);
            } catch (error) {
                console.error(`Error stopping stream for user ${userId}:`, error);
            }
        }
    }
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});