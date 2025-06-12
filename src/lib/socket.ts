import type { Server as NetServer } from "http"
import type { NextApiRequest, NextApiResponse } from "next"
import { Server as ServerIO } from "socket.io"
import { getDatabase } from "./mongodb"

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log("Socket is already running")
  } else {
    console.log("Socket is initializing")
    const io = new ServerIO(res.socket.server, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ["GET", "POST"],
      },
    })
    res.socket.server.io = io

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      socket.on("join-room", async (roomId: string, userId: string) => {
        socket.join(roomId)
        socket.to(roomId).emit("user-joined", { userId, socketId: socket.id })

        // Update user online status
        const db = await getDatabase()
        await db.collection("users").updateOne(
          { userId },
          {
            $set: {
              isOnline: true,
              lastSeen: new Date(),
              socketId: socket.id,
            },
          },
          { upsert: true },
        )
      })

      socket.on("send-message", async (data) => {
        const { roomId, message, userId, username } = data

        // Save message to database
        const db = await getDatabase()
        const messageDoc = {
          roomId,
          userId,
          username,
          message,
          timestamp: new Date(),
          type: "text",
        }

        await db.collection("messages").insertOne(messageDoc)

        // Broadcast message to room
        io.to(roomId).emit("receive-message", messageDoc)
      })

      socket.on("typing", (data) => {
        socket.to(data.roomId).emit("user-typing", {
          userId: data.userId,
          username: data.username,
          isTyping: data.isTyping,
        })
      })

      socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id)

        // Update user offline status
        const db = await getDatabase()
        await db.collection("users").updateOne(
          { socketId: socket.id },
          {
            $set: {
              isOnline: false,
              lastSeen: new Date(),
            },
            $unset: { socketId: 1 },
          },
        )
      })
    })
  }
  res.end()
}

export default SocketHandler
