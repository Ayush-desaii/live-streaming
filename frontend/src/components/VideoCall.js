import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // WebSocket server

const VideoCall = () => {
    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const [peer, setPeer] = useState(new RTCPeerConnection());

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localVideo.current.srcObject = stream;
                stream.getTracks().forEach(track => peer.addTrack(track, stream));
            });

        peer.ontrack = (event) => {
            remoteVideo.current.srcObject = event.streams[0];
        };

        socket.on('offer', async (offer) => {
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('answer', answer);
        });

        socket.on('answer', (answer) => peer.setRemoteDescription(new RTCSessionDescription(answer)));
        socket.on('candidate', (candidate) => peer.addIceCandidate(new RTCIceCandidate(candidate)));

        peer.onicecandidate = (event) => {
            if (event.candidate) socket.emit('candidate', event.candidate);
        };

        return () => peer.close();
    }, []);

    return (
        <div>
            <video ref={localVideo} autoPlay playsInline muted />
            <video ref={remoteVideo} autoPlay playsInline />
        </div>
    );
};

export default VideoCall;
