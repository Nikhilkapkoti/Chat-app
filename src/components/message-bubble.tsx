"use client"

interface Message {
  _id: string
  roomId: string
  userId: string
  username: string
  message: string
  timestamp: Date | string
  type: "text" | "image"
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        {!isOwn && <div className="text-xs font-semibold mb-1">{message.username}</div>}

        <div className="break-words whitespace-pre-wrap">{message.message}</div>

        <div className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
