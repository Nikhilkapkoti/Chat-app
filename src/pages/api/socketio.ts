import type { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";
import type { Server as NetServer } from "http";
import { getDatabase } from "@/lib/mongodb";

type ServerIOInstance = ServerIO; // Explicit type for Socket.IO server instance

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: ServerIOInstance;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log("Socket is already running");
    res.end();
    return;
  }

  console.log("Socket is initializing");
  const io = new ServerIO(res.socket.server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  res.socket.server.io = io;

  const onlineUsers = new Map<string, Map<string, { socketId: string; username: string; userId: string }>>();

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join-room", async (data: { roomId: string; userId: string; username: string }) => {
      const { roomId, userId, username } = data;
      console.log(`User ${username} (${userId}) joining room ${roomId}`);

      Array.from(socket.rooms).forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      socket.join(roomId);

      if (!onlineUsers.has(roomId)) {
        onlineUsers.set(roomId, new Map());
      }

      onlineUsers.get(roomId)!.set(userId, {
        socketId: socket.id,
        username,
        userId,
      });

      const roomUsers = Array.from(onlineUsers.get(roomId)!.values());
      console.log(`Users in room ${roomId}:`, roomUsers);
      io.to(roomId).emit("room-users-updated", roomUsers);

      try {
        const db = await getDatabase();
        await db.collection("users").updateOne(
          { userId },
          {
            $set: {
              username,
              isOnline: true,
              lastSeen: new Date(),
              socketId: socket.id,
              currentRoom: roomId,
            },
          },
          { upsert: true },
        );
      } catch (error) {
        console.error("Error updating user status:", error);
      }
    });

    socket.on(
      "send-message",
      async (data: { roomId: string; message: string; userId: string; username: string }) => {
        console.log("Received send-message:", data);
        const { roomId, message, userId, username } = data;

        try {
          const db = await getDatabase();
          const messageDoc = {
            roomId,
            userId,
            username,
            message,
            timestamp: new Date(),
            type: message.startsWith("https://") ? ("image" as const) : ("text" as const),
          };

          const result = await db.collection("messages").insertOne(messageDoc);
          console.log("Message saved to database:", result.insertedId);

          const messageWithId = {
            ...messageDoc,
            _id: result.insertedId.toString(),
          };

          io.to(roomId).emit("receive-message", messageWithId);
          console.log(`Message broadcasted to room ${roomId}:`, messageWithId);
        } catch (error) {
          console.error("Error saving/broadcasting message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      },
    );

    socket.on("typing", (data: { roomId: string; userId: string; username: string; isTyping: boolean }) => {
      console.log("Typing event:", data);
      socket.to(data.roomId).emit("user-typing", data);
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);

      for (const [roomId, users] of onlineUsers.entries()) {
        for (const [userId, userData] of users.entries()) {
          if (userData.socketId === socket.id) {
            users.delete(userId);

            const roomUsers = Array.from(users.values());
            io.to(roomId).emit("room-users-updated", roomUsers);

            try {
              const db = await getDatabase();
              await db.collection("users").updateOne(
                { userId },
                {
                  $set: {
                    isOnline: false,
                    lastSeen: new Date(),
                  },
                  $unset: { socketId: "", currentRoom: "" },
                },
              );
            } catch (error) {
              console.error("Error updating user offline status:", error);
            }
            break;
          }
        }
      }
    });
  });

  console.log("Socket.IO server initialized");
  res.end();
};

export default SocketHandler;