// WhiteboardComponent.jsx
import React from "react";
import { Tldraw } from 'tldraw';
import { useSyncDemo } from '@tldraw/sync';
import 'tldraw/tldraw.css';

const WhiteboardComponent = ({ roomId }) => {
  // Use the same roomId that is used for the video call
  const store = useSyncDemo({ roomId: roomId || "default-room" });
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md bg-white">
      <div className="bg-blue-50 p-3 flex justify-between items-center">
        <h3 className="m-0 font-semibold text-base text-gray-800">
          Shared Whiteboard
        </h3>
        {roomId && (
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
            Room: {roomId.substring(0, 8)}...
          </span>
        )}
      </div>
      
      <div style={{ height: "500px", width: "100%" }}>
        <Tldraw store={store} />
      </div>
    </div>
  );
};

export default WhiteboardComponent;