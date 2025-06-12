"use client"

import { format } from "date-fns"
import Image from "next/image"

interface Message {
  _id: string
  roomId: string
  userId: string
  username: string
  message: string
  timestamp: Date
  type: "text" | "image"
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isImage = message.type === "image" || message.message.match(/\.(jpeg|jpg|gif|png)$/)

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        {!isOwn && <div className="text-xs font-semibold mb-1">{message.username}</div>}

        {isImage ? (
          <div className="space-y-2">
            <Image
              src={message.message || "/placeholder.svg"}
              alt="Shared image"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>
        ) : (
          <div className="break-words">{message.message}</div>
        )}

        <div className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
          {format(new Date(message.timestamp), "HH:mm")}
        </div>
      </div>
    </div>
  )
}
