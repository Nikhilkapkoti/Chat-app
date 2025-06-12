
export async function GET() {
  return new Response("Socket.IO server is running", { status: 200 })
}

export async function POST() {
  // This will be handled by the Socket.IO server
  return new Response("Socket.IO POST handler", { status: 200 })
}
