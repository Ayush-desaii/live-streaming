const { spawn } = require('child_process');
require('dotenv').config();

function startStreaming(streamKey) {
    const ffmpeg = spawn('ffmpeg', [
        '-f', 'avfoundation', '-i', '1:0',
        '-vcodec', 'libx264', '-preset', 'ultrafast',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${streamKey}`
    ]);

    ffmpeg.stderr.on('data', (data) => console.log(data.toString()));
    ffmpeg.on('close', () => console.log('Streaming stopped'));
}

module.exports = startStreaming;
