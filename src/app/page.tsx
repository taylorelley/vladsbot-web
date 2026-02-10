import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Chat } from "@/components/Chat";

export default async function HomePage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 max-w-4xl mx-auto w-full overflow-hidden">
        <Chat />
      </div>
    </main>
  );
}
