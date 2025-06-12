"use client"

import { Users } from "lucide-react"

interface OnlineUsersProps {
  users: string[]
}

export default function OnlineUsers({ users }: OnlineUsersProps) {
  return (
    <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-800">Online ({users.length})</h3>
      </div>

      <div className="space-y-2">
        {users.map((userId) => (
          <div key={userId} className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">User {userId.slice(0, 8)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
