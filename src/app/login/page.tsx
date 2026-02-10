import { signIn } from "@/lib/auth";
import { Bot, Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Bot className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Welcome to VladsBot</h1>
        <p className="text-muted-foreground mb-8">
          Sign in to access your personal AI assistant with full command support.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("authentik", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="glass-button-primary w-full rounded-xl px-6 py-3 font-medium flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Sign in with Authentik
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Secure authentication powered by Authentik SSO
        </p>
      </div>
    </div>
  );
}
