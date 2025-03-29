import React from "react";
import StreamHost from "./components/StreamHost";
import VideoCall from "./components/VideoCall";

function App() {
    return (
        <div>
            <h1>Live Streaming Video Call</h1>
            <StreamHost />
            <VideoCall />
        </div>
    );
}

export default App;
