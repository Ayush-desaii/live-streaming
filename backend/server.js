const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const startStreaming = require('./ffmpeg');


const app = express();
app.use(cors());

app.get('/start-stream', (req, res) => {
    startStreaming(process.env.STREAM_KEY);
    res.send('Streaming started');
});

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('offer', (data) => socket.broadcast.emit('offer', data));
    socket.on('answer', (data) => socket.broadcast.emit('answer', data));
    socket.on('candidate', (data) => socket.broadcast.emit('candidate', data));

    socket.on('disconnect', () => console.log('User disconnected'));
});

server.listen(5000, () => console.log('Server running on port 5000'));
