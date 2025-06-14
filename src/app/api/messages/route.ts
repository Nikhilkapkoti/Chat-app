import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get("roomId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 })
    }

    console.log(`Loading messages for room: ${roomId}`)

    const db = await getDatabase()
    const messages = await db
      .collection("messages")
      .find({ roomId })
      .sort({ timestamp: 1 }) // Sort by timestamp ascending (oldest first)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    // Convert ObjectId to string for JSON serialization
    const serializedMessages = messages.map((msg) => ({
      ...msg,
      _id: msg._id.toString(),
      timestamp: msg.timestamp.toISOString(),
    }))

    console.log(`Found ${serializedMessages.length} messages for room ${roomId}`)

    return NextResponse.json({
      messages: serializedMessages,
      count: serializedMessages.length,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
