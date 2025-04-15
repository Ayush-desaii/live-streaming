import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatComponent = ({ roomId, username: initialUsername, serverUrl }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [username, setUsername] = useState(initialUsername || '');
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [usernameInput, setUsernameInput] = useState(initialUsername || '');
    const [isEditingUsername, setIsEditingUsername] = useState(!initialUsername);
    
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Initialize socket connection
    useEffect(() => {
        if (!roomId) return;
        
        // Connect to socket server
        const newSocket = io(serverUrl || 'https://1e7c-49-36-83-170.ngrok-free.app', {
            query: { username },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        setSocket(newSocket);
        
        // Setup event listeners
        newSocket.on('connect', () => {
            console.log('Connected to chat server');
            setIsConnected(true);
            newSocket.emit('join-chat', roomId);
        });
        
        newSocket.on('chat-joined', (data) => {
            setMessages(data.messages || []);
            setUsers(data.users || []);
        });
        
        newSocket.on('new-message', (message) => {
            setMessages(prevMessages => [...prevMessages, message]);
        });
        
        newSocket.on('user-joined', (user) => {
            setUsers(prevUsers => [...prevUsers.filter(u => u.userId !== user.userId), user]);
            
            // Add system message
            const systemMessage = {
                id: Date.now().toString(),
                system: true,
                text: `${user.username} joined the chat`,
                timestamp: Date.now()
            };
            setMessages(prevMessages => [...prevMessages, systemMessage]);
        });
        
        newSocket.on('user-left', (user) => {
            setUsers(prevUsers => prevUsers.filter(u => u.userId !== user.userId));
            
            // Add system message
            const systemMessage = {
                id: Date.now().toString(),
                system: true,
                text: `${user.username} left the chat`,
                timestamp: Date.now()
            };
            setMessages(prevMessages => [...prevMessages, systemMessage]);
        });
        
        newSocket.on('username-changed', (data) => {
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.userId === data.userId 
                        ? { ...user, username: data.newUsername } 
                        : user
                )
            );
            
            // Add system message
            const systemMessage = {
                id: Date.now().toString(),
                system: true,
                text: `${data.oldUsername} changed name to ${data.newUsername}`,
                timestamp: Date.now()
            };
            setMessages(prevMessages => [...prevMessages, systemMessage]);
        });
        
        newSocket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            setIsConnected(false);
        });
        
        // Cleanup on unmount
        return () => {
            newSocket.disconnect();
        };
    }, [roomId, username, serverUrl]);
    
    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    
    // Handle sending messages
    const sendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !socket || !isConnected) return;
        
        socket.emit('send-message', { text: messageInput.trim() });
        setMessageInput('');
    };
    
    // Handle username change
    const updateUsername = (e) => {
        e.preventDefault();
        if (!usernameInput.trim() || !socket || !isConnected) return;
        
        const newUsername = usernameInput.trim();
        setUsername(newUsername);
        socket.emit('update-username', newUsername);
        setIsEditingUsername(false);
    };
    
    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full max-h-screen border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Chat Header */}
            <div className="bg-blue-50 px-4 py-3 flex justify-between items-center">
                <h3 className="font-semibold text-base text-gray-800">
                    Live Chat {roomId && `- Room: ${roomId}`}
                </h3>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
                    {users.length} online
                </span>
            </div>
            
            {/* Message Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-5">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map(message => (
                        <div 
                            key={message.id} 
                            className={`max-w-[85%] ${
                                message.system 
                                    ? 'self-center bg-transparent text-gray-500 text-xs italic py-1 px-2' 
                                    : message.userId === socket?.id
                                        ? 'self-end bg-blue-500 text-white rounded-2xl py-2 px-4 shadow-sm'
                                        : 'self-start bg-white text-gray-800 rounded-2xl py-2 px-4 shadow-sm'
                            }`}
                        >
                            {!message.system && (
                                <div className="text-xs mb-1 font-medium opacity-80">
                                    {message.username} • {formatTime(message.timestamp)}
                                </div>
                            )}
                            <div>{message.text}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {/* User Controls */}
            {isEditingUsername ? (
                <form onSubmit={updateUsername} className="flex p-2 border-t border-gray-200 bg-blue-50">
                    <input 
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="Enter your username"
                        className="flex-1 py-2 px-3 rounded-md border border-gray-300 text-sm mr-2"
                    />
                    <button 
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-md font-medium"
                    >
                        Set Name
                    </button>
                </form>
            ) : (
                <>
                    {/* User Info */}
                    <div className="flex justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm">
                        <div>
                            Chatting as: <strong>{username}</strong>
                        </div>
                        <button
                            onClick={() => setIsEditingUsername(true)}
                            className="text-blue-500 hover:text-blue-700"
                        >
                            Change
                        </button>
                    </div>
                    
                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="flex p-3 border-t border-gray-200 bg-white">
                        <input 
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={!isConnected}
                            className="flex-1 py-3 px-4 rounded-full border border-gray-300 text-sm mr-2"
                        />
                        <button 
                            type="submit"
                            disabled={!isConnected || !messageInput.trim()}
                            className={`bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center ${
                                messageInput.trim() && isConnected 
                                    ? 'opacity-100 cursor-pointer hover:bg-blue-600' 
                                    : 'opacity-60 cursor-not-allowed'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatComponent;