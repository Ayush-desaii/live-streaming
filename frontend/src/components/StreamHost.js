import React, { useEffect, useRef } from 'react';

const StreamHost = () => {
    const screenVideo = useRef(null);

    useEffect(() => {
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
            .then(stream => {
                screenVideo.current.srcObject = stream;
            });
    }, []);

    return <video ref={screenVideo} autoPlay playsInline />;
};

export default StreamHost;
