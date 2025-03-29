const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// YouTube RTMP stream key (replace with your actual key)
const YOUTUBE_STREAM_KEY = '9sp1-0u48-uk1c-p9w9-1ark';
const YOUTUBE_RTMP_URL = `rtmp://a.rtmp.youtube.com/live2/${YOUTUBE_STREAM_KEY}`;

io.on('connection', (socket) => {
    console.log('Client connected to streaming socket');

    let ffmpeg = null;

    try {
        // Spawn FFmpeg process for streaming
        ffmpeg = spawn('ffmpeg', [
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
            YOUTUBE_RTMP_URL         // Destination RTMP URL
        ], { 
            stdio: ['pipe', 'pipe', 'pipe'] 
        });

        // Log FFmpeg stdout
        ffmpeg.stdout.on('data', (data) => {
            console.log(`FFmpeg stdout: ${data.toString()}`);
        });

        // Log FFmpeg stderr
        ffmpeg.stderr.on('data', (data) => {
            console.error(`FFmpeg stderr: ${data.toString()}`);
        });

        // Log FFmpeg error events
        ffmpeg.on('error', (error) => {
            console.error('FFmpeg Process Error:', error);
        });

        // Log FFmpeg exit
        ffmpeg.on('exit', (code, signal) => {
            console.log(`FFmpeg process exited with code ${code} and signal ${signal}`);
        });

        // Handle stream data from client
        socket.on('stream', (data) => {
            try {
                // Write video chunks to FFmpeg stdin
                if (ffmpeg && ffmpeg.stdin && !ffmpeg.stdin.destroyed) {
                    ffmpeg.stdin.write(data);
                } else {
                    console.error('FFmpeg stdin is not available');
                }
            } catch (error) {
                console.error('Error writing to FFmpeg:', error);
            }
        });

        // Cleanup on disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected from streaming socket');
            if (ffmpeg) {
                try {
                    ffmpeg.stdin.end();
                    ffmpeg.kill();
                } catch (error) {
                    console.error('Error killing FFmpeg process:', error);
                }
            }
        });

    } catch (spawnError) {
        console.error('Error spawning FFmpeg process:', spawnError);
        socket.emit('stream-error', 'Failed to start streaming process');
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Streaming server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});