import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { uploadFileToS3 } from "@/lib/s3"

export async function POST(req: NextRequest) {
  try {
   const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const roomId = formData.get("roomId") as string

    if (!file || !roomId) {
      return NextResponse.json({ error: "File and room ID required" }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileUrl = await uploadFileToS3(buffer, file.name, file.type)

    return NextResponse.json({ fileUrl })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
