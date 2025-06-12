"use client"

import { UserButton } from "@clerk/nextjs"
import { Hash, Lock } from "lucide-react"

interface Room {
  id: string
  name: string
  type: "public" | "private"
}

interface ChatSidebarProps {
  rooms: Room[]
  currentRoom: string
  onRoomChange: (roomId: string) => void
}

export default function ChatSidebar({ rooms, currentRoom, onRoomChange }: ChatSidebarProps) {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Chat App</h1>
      </div>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Channels</h3>
          <div className="space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomChange(room.id)}
                className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left hover:bg-gray-700 ${
                  currentRoom === room.id ? "bg-gray-700" : ""
                }`}
              >
                {room.type === "public" ? <Hash className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                <span className="text-sm">{room.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm">Profile</span>
        </div>
      </div>
    </div>
  )
}
