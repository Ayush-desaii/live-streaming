import React from 'react';
import VideoCall from './components/VideoCall';
import StreamHost from './components/StreamHost';

function App() {
    return (
        <div>
            <h1>Live Streaming App</h1>
            <VideoCall />
            <StreamHost />
            <button onClick={() => fetch('http://localhost:5000/start-stream')}>Start Live Stream</button>
        </div>
    );
}

export default App;
