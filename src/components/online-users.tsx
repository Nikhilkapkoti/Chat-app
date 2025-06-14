import React from "react";

interface OnlineUser {
  userId: string;
  username: string;
  socketId: string;
}

interface OnlineUsersProps {
  users: OnlineUser[];
}

export default function OnlineUsers({ users }: OnlineUsersProps) {
  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Online Users</h3>
      {users.length === 0 ? (
        <p className="text-gray-500">No users online</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.userId} className="text-gray-700">
              {user.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}