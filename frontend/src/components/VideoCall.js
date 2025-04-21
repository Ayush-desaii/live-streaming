// VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import WhiteboardComponent from "./WhiteBoard";
import StreamHost from "./StreamHost";


// Firebase Config
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
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const VideoCall = () => {
  // State and Refs
  const [pc, setPc] = useState(null);
  const [callId, setCallId] = useState("");
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showCallIdPopup, setShowCallIdPopup] = useState(false);
  const [peer, setPeer] = useState("peer")
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
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    // Add tracks to PeerConnection
    stream.getTracks().forEach((track) => pc?.addTrack(track, stream));
  };

 // Create Call (Offer)
const createCall = async () => {
  if (!pc) return;

  // Get username from localStorage
  const streamDetails = JSON.parse(localStorage.getItem('streamDetails') || '{}');
  const username = streamDetails.name || 'Anonymous';

  // Create a new call document
  const callDoc = doc(collection(firestore, "calls"));
  const offerCandidatesRef = collection(callDoc, "offerCandidates");
  const answerCandidatesRef = collection(callDoc, "answerCandidates");

  setCallId(callDoc.id);
  setShowCallIdPopup(true);

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

  // Add creator's username to the call document
  await setDoc(callDoc, { 
    offer,
    creatorName: username
  });

  onSnapshot(callDoc, (snapshot) => {
    const data = snapshot.data();
    if (data?.answer && !pc.currentRemoteDescription) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      
      // You can access the answerer's name here
      if (data.answererName) {
        console.log(`Call answered by: ${data.answererName}`);
        setPeer(data.answererName)
        // Update UI or state with the answerer's name
      }
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

  // Get username from localStorage
  const streamDetails = JSON.parse(localStorage.getItem('streamDetails') || '{}');
  const username = streamDetails.name || 'Anonymous';

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
  
  // You can access the creator's name here
  if (callData.creatorName) {
    console.log(`Joining call created by: ${callData.creatorName}`);
    setPeer(callData.creatorName)
    // Update UI or state with the creator's name
  }
  
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  // Update the call doc with answer and answerer's name
  await updateDoc(callDoc, { 
    answer,
    answererName: username
  });

  onSnapshot(offerCandidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });
};
  return (
    <div className="max-w-6xl mx-auto p-4 font-sans">
      {/* <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          Video Call
        </h1>
        <p className="text-gray-600">Connect with others through real-time video calls</p>
      </div> */}

      <div className="flex flex-row items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-1">
          {`${JSON.parse(localStorage.getItem("streamDetails") || "{}").title || "You"}`}
        </h2>

        <div className="flex flex-row ml-auto gap-4">

        <StreamHost />

        <button
          onClick={() => setShowWhiteboard(!showWhiteboard)}
          className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          {showWhiteboard ? "Hide Whiteboard" : "Show Whiteboard"}
        </button>
        </div>
      </div>

      {showWhiteboard || (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Local Stream */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md">
            <div className="bg-blue-50 p-3 flex justify-between items-center">
              <h3 className="m-0 font-semibold text-base text-gray-800">
                Local Stream
              </h3>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
                  {`${JSON.parse(localStorage.getItem("streamDetails") || "{}").name || "You"}`}
              </span>
            </div>
            <div className="bg-black aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
            </div>
          </div>

          {/* Remote Stream */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md">
            <div className="bg-blue-50 p-3 flex justify-between items-center">
              <h3 className="m-0 font-semibold text-base text-gray-800">
                Remote Stream
              </h3>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
                {peer}
              </span>
            </div>
            <div className="bg-black aspect-video">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
            </div>
          </div>
        </div>
      )}

      {/* TLDraw Whiteboard (conditionally shown) */}
      {showWhiteboard && (
        <div className="flex w-full gap-5 mb-6">
          {/* Whiteboard */}
          <div className="flex-1">
            <WhiteboardComponent roomId={callId} />
          </div>

          {/* Video Section */}
          <div className="w-[30%] flex flex-col gap-5">
            {/* Local Stream */}
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md h-[50%]">
              <div className="bg-blue-50 p-3 flex justify-between items-center">
                <h3 className="m-0 font-semibold text-base text-gray-800">
                  Local Stream
                </h3>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
                  {`${JSON.parse(localStorage.getItem("streamDetails") || "{}").name || "You"}`}
                </span>
              </div>
              <div className="bg-black aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                ></video>
              </div>
            </div>

            {/* Remote Stream */}
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md h-[50%]">
              <div className="bg-blue-50 p-3 flex justify-between items-center">
                <h3 className="m-0 font-semibold text-base text-gray-800">
                  Remote Stream
                </h3>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
                  {peer}
                </span>
              </div>
              <div className="bg-black aspect-video">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                ></video>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-raw gap-9">
        {/* Start Webcam Section */}
        <div className="border border-gray-200 rounded-lg p-5 shadow-md w-[25%]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">
              1
            </span>
            Start your Webcam
          </h2>
          <button
            onClick={startWebcam}
            className="bg-blue-600 text-white border-none py-2 px-4 rounded-md text-base cursor-pointer font-medium flex items-center gap-2"
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
        <div className="border border-gray-200 rounded-lg p-5 shadow-md w-[32%]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">
              2
            </span>
            Create a new Call
          </h2>

          <div className="flex flex-row gap-2 flex-wrap">
          <button
            onClick={createCall}
            className="bg-white text-blue-600 border border-blue-600 py-2 px-4 rounded-md text-base cursor-pointer font-medium flex items-center gap-2"
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
          <button
            onClick={() => setShowCallIdPopup(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-1"
            title="View Call ID"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ID
          </button>
          )}
          </div>

          {showCallIdPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
                <h3 className="text-lg font-semibold mb-4 text-center">Your Call ID</h3>
                <div className="flex items-center justify-between bg-gray-100 border rounded px-3 py-2 mb-4">
                  <span className="text-sm break-all">{callId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(callId);
                      alert("Call ID copied to clipboard!");
                    }}
                    className="ml-4 text-blue-600 font-medium hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => setShowCallIdPopup(false)}
                  className="block mx-auto bg-blue-600 text-white py-1 px-4 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Join Call Section */}
        <div className="border border-gray-200 rounded-lg p-5 shadow-md w-[43%]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">
              3
            </span>
            Join a Call
          </h2>

          <div className="flex flex-row gap-2 flex-wrap">
            <input
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              placeholder="Enter call ID"
              className="flex-1 min-w-[200px] py-2 px-3 rounded-md border border-gray-300 text-base"
            />
            <button
              onClick={answerCall}
              className="bg-blue-50 text-blue-600 border-none py-2 px-4 rounded-md text-base cursor-pointer font-medium flex items-center gap-2"
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
