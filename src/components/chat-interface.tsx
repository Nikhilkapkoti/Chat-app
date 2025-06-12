"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { io, type Socket } from "socket.io-client"
import ChatSidebar from "./chat-sidebar"
import ChatRoom from "./chat-room"
import OnlineUsers from "./online-users"

interface Message {
  _id: string
  roomId: string
  userId: string
  username: string
  message: string
  timestamp: Date
  type: "text" | "image"
}

interface Room {
  id: string
  name: string
  type: "public" | "private"
}

export default function ChatInterface() {
  const { user } = useUser()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentRoom, setCurrentRoom] = useState<string>("general")
  const [messages, setMessages] = useState<Message[]>([])
  const [rooms] = useState<Room[]>([
    { id: "general", name: "General", type: "public" },
    { id: "random", name: "Random", type: "public" },
    { id: "tech", name: "Tech Talk", type: "public" },
  ])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL!, {
      path: "/api/socketio",
    })

    socketInstance.on("connect", () => {
      console.log("Connected to server")
      if (user) {
        socketInstance.emit("join-room", currentRoom, user.id)
      }
    })

    socketInstance.on("receive-message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    socketInstance.on("user-joined", (data) => {
      setOnlineUsers((prev) => [...prev, data.userId])
    })

    socketInstance.on("user-typing", (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => [...prev, data.username])
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username))
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [user, currentRoom])

  const sendMessage = (message: string) => {
    if (socket && user) {
      socket.emit("send-message", {
        roomId: currentRoom,
        message,
        userId: user.id,
        username: user.firstName || user.emailAddresses[0].emailAddress,
      })
    }
  }

  const handleTyping = (isTyping: boolean) => {
    if (socket && user) {
      socket.emit("typing", {
        roomId: currentRoom,
        userId: user.id,
        username: user.firstName || user.emailAddresses[0].emailAddress,
        isTyping,
      })
    }
  }

  const switchRoom = (roomId: string) => {
    if (socket && user) {
      socket.emit("leave-room", currentRoom)
      socket.emit("join-room", roomId, user.id)
      setCurrentRoom(roomId)
      setMessages([])
      // Load messages for new room
      loadMessages(roomId)
    }
  }

  const loadMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/messages?roomId=${roomId}`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  useEffect(() => {
    loadMessages(currentRoom)
  }, [currentRoom])

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar rooms={rooms} currentRoom={currentRoom} onRoomChange={switchRoom} />
      <div className="flex-1 flex flex-col">
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
  )
}
