import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ChatInterface from "@/components/chat-interface"

export default async function Home() {
  const { userId } = await auth(); //

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <main className="h-screen bg-gray-100">
      <ChatInterface />
    </main>
  )
}
