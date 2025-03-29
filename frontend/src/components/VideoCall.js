import React, { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, addDoc, updateDoc } from "firebase/firestore";

// Firebase Config (DO NOT expose API keys publicly)
const firebaseConfig = {
  apiKey: "AIzaSyBFTOBUvLZHcNek34ZkC25GcWrbydJ2ADo",
  authDomain: "live-streaming-5bba9.firebaseapp.com",
  projectId: "live-streaming-5bba9",
  storageBucket: "live-streaming-5bba9.firebasestorage.app",
  messagingSenderId: "496057059904",
  appId: "1:496057059904:web:5b9d6abb231b294d8e2da5",
  measurementId: "G-23BHFF0XKQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// WebRTC Configuration
const servers = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  ],
  iceCandidatePoolSize: 10,
};

const VideoCall = () => {
  // State and Refs
  const [pc, setPc] = useState(null);
  const [callId, setCallId] = useState("");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // Initialize PeerConnection
  useEffect(() => {
    const newPc = new RTCPeerConnection(servers);
    setPc(newPc);
    remoteStreamRef.current = new MediaStream();

    newPc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    return () => newPc.close();
  }, []);

  // Start Webcam
  const startWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    // Add tracks to PeerConnection
    stream.getTracks().forEach((track) => pc?.addTrack(track, stream));
  };

  // Create Call (Offer)
  const createCall = async () => {
    if (!pc) return;
  
    // Create a new call document
    const callDoc = doc(collection(firestore, "calls"));
    const offerCandidatesRef = collection(callDoc, "offerCandidates");
    const answerCandidatesRef = collection(callDoc, "answerCandidates");
  
    setCallId(callDoc.id);
  
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(offerCandidatesRef, event.candidate.toJSON());
      }
    };
  
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
  
    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };
  
    await setDoc(callDoc, { offer });
  
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });
  
    onSnapshot(answerCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };
  
  // Answer Call
  const answerCall = async () => {
    if (!pc || !callId) return;
  
    const callDoc = doc(firestore, "calls", callId);
    const offerCandidatesRef = collection(callDoc, "offerCandidates");
    const answerCandidatesRef = collection(callDoc, "answerCandidates");
  
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(answerCandidatesRef, event.candidate.toJSON());
      }
    };
  
    const callDocSnap = await getDoc(callDoc);
    if (!callDocSnap.exists()) {
      console.error("Call document does not exist");
      return;
    }
  
    const callData = callDocSnap.data();
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
  
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
  
    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
  
    await updateDoc(callDoc, { answer });
  
    onSnapshot(offerCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "#3a86ff",
            marginBottom: "10px",
          }}
        >
          Video Call
        </h1>
        <p style={{ color: "#666" }}>Connect with others through real-time video calls</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Local Stream */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              background: "rgba(58, 134, 255, 0.1)",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontWeight: "600",
                fontSize: "16px",
                color: "#333",
              }}
            >
              Local Stream
            </h3>
            <span
              style={{
                background: "rgba(58, 134, 255, 0.2)",
                color: "#3a86ff",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >
              You
            </span>
          </div>
          <div
            style={{
              background: "#000",
              aspectRatio: "16/9",
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            ></video>
          </div>
        </div>

        {/* Remote Stream */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              background: "rgba(58, 134, 255, 0.1)",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontWeight: "600",
                fontSize: "16px",
                color: "#333",
              }}
            >
              Remote Stream
            </h3>
            <span
              style={{
                background: "rgba(58, 134, 255, 0.2)",
                color: "#3a86ff",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >
              Peer
            </span>
          </div>
          <div
            style={{
              background: "#000",
              aspectRatio: "16/9",
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            ></video>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Start Webcam Section */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#3a86ff",
                color: "white",
                fontSize: "14px",
              }}
            >
              1
            </span>
            Start your Webcam
          </h2>
          <button
            onClick={startWebcam}
            style={{
              background: "#3a86ff",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            Start Webcam
          </button>
        </div>

        {/* Create Call Section */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#3a86ff",
                color: "white",
                fontSize: "14px",
              }}
            >
              2
            </span>
            Create a new Call
          </h2>
          <button
            onClick={createCall}
            style={{
              background: "white",
              color: "#3a86ff",
              border: "1px solid #3a86ff",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Create Call (Offer)
          </button>

          {callId && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#f5f5f5",
                borderRadius: "6px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "4px",
                }}
              >
                Share this call ID with others:
              </p>
              <code
                style={{
                  display: "block",
                  padding: "8px",
                  background: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  overflowX: "auto",
                  fontSize: "14px",
                }}
              >
                {callId}
              </code>
            </div>
          )}
        </div>

        {/* Join Call Section */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#3a86ff",
                color: "white",
                fontSize: "14px",
              }}
            >
              3
            </span>
            Join a Call
          </h2>
          <p
            style={{
              color: "#666",
              marginBottom: "16px",
            }}
          >
            Answer the call from a different browser window or device
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <input
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              placeholder="Enter call ID"
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
            />
            <button
              onClick={answerCall}
              style={{
                background: "#f0f4ff",
                color: "#3a86ff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;