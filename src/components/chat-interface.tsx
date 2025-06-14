"use client"

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import io from "socket.io-client";
import type { Socket as SocketIOClientSocket } from "socket.io-client";
import ChatSidebar from "./chat-sidebar";
import ChatRoom from "./chat-room";
import OnlineUsers from "./online-users";

interface Message {
  _id: string;
  roomId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string | Date;
  type: "text" | "image";
}

interface Room {
  id: string;
  name: string;
  type: "public" | "private";
}

interface OnlineUser {
  userId: string;
  username: string;
  socketId: string;
}

export default function ChatInterface() {
  const { user } = useUser();
  const [socket, setSocket] = useState<SocketIOClientSocket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string>("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms] = useState<Room[]>([
    { id: "general", name: "General", type: "public" },
    { id: "random", name: "Random", type: "public" },
    { id: "tech", name: "Tech Talk", type: "public" },
  ]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    console.log("Initializing socket connection...");
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      path: "/api/socketio",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { secret: process.env.NEXT_PUBLIC_SOCKET_IO_SECRET },
    });

    socketInstance.on("connect", () => {
      console.log("Connected to server:", socketInstance.id);
      setIsConnected(true);
      socketInstance.emit("join-room", {
        roomId: currentRoom,
        userId: user.id,
        username: user.username || user.firstName || user.emailAddresses[0].emailAddress.split("@")[0],
      });
    });

    socketInstance.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    socketInstance.on("reconnect", (attempt: number) => {
      console.log("Reconnected to server on attempt:", attempt);
      setIsConnected(true);
      socketInstance.emit("join-room", {
        roomId: currentRoom,
        userId: user.id,
        username: user.username || user.firstName || user.emailAddresses[0].emailAddress.split("@")[0],
      });
    });

    socketInstance.on("reconnect_error", (error: Error) => {
      console.error("Socket reconnect error:", error.message);
      setIsConnected(false);
    });

    socketInstance.on("disconnect", (reason: string) => {
      console.log("Disconnected from server:", reason);
      setIsConnected(false);
    });

    socketInstance.on("receive-message", (message: Message) => {
      console.log("Received message:", message);
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, { ...message, timestamp: new Date(message.timestamp) }];
      });
    });

    socketInstance.on("room-users-updated", (users: OnlineUser[]) => {
      console.log("Online users updated:", users);
      setOnlineUsers(users);
    });

    socketInstance.on("user-typing", ({ userId, username, isTyping }: { userId: string; username: string; isTyping: boolean }) => {
      if (userId !== user.id) {
        setTypingUsers((prev) => {
          if (isTyping && !prev.includes(username)) {
            return [...prev, username];
          } else if (!isTyping) {
            return prev.filter((u) => u !== username);
          }
          return prev;
        });
      }
    });

    socketInstance.on("error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
      alert(`Error: ${error.message}`);
    });

    setSocket(socketInstance);

    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [user]);

  useEffect(() => {
    if (socket && user && isConnected && currentRoom) {
      console.log("Switching to room:", currentRoom);
      socket.emit("join-room", {
        roomId: currentRoom,
        userId: user.id,
        username: user.username || user.firstName || user.emailAddresses[0].emailAddress.split("@")[0],
      });
      setMessages([]);
    }
  }, [currentRoom, socket, user, isConnected]); // Dependencies include currentRoom to handle room switches

  const sendMessage = useCallback(
    (message: string) => {
      if (socket && user && isConnected && socket.connected) {
        const messageData = {
          roomId: currentRoom,
          message: message.trim(),
          userId: user.id,
          username: user.username || user.firstName || user.emailAddresses[0].emailAddress.split("@")[0],
        };
        console.log("Sending message:", messageData);
        socket.emit("send-message", messageData);
      } else {
        console.error("Cannot send message - socket not connected", { socket: !!socket, user: !!user, isConnected, connected: socket?.connected });
        alert("Not connected to server. Please refresh the page.");
      }
    },
    [socket, user, currentRoom, isConnected],
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (socket && user && isConnected && socket.connected) {
        socket.emit("typing", {
          roomId: currentRoom,
          userId: user.id,
          username: user.username || user.firstName || user.emailAddresses[0].emailAddress.split("@")[0],
          isTyping,
        });
      }
    },
    [socket, user, currentRoom, isConnected],
  );

  const switchRoom = (roomId: string) => {
    console.log("Switching room to:", roomId);
    setCurrentRoom(roomId);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar rooms={rooms} currentRoom={currentRoom} onRoomChange={switchRoom} />
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">#{currentRoom}</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
        <ChatRoom
          messages={messages}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          typingUsers={typingUsers}
          currentRoom={currentRoom}
        />
      </div>
      <OnlineUsers users={onlineUsers} />
    </div>
  );
}
