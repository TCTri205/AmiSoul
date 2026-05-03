import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4 rounded-3xl bg-white/20 p-8 backdrop-blur-md dark:bg-black/20">
        <h1 className="text-4xl font-bold tracking-tight">AmiSoul</h1>
        <p className="text-lg opacity-80">
          Start a conversation with Ami, your emotional companion.
        </p>
        <Button className="rounded-full px-8" size="lg">
          Start Chatting
        </Button>
      </div>
      
      <div className="mt-8 text-sm opacity-50">
        Safe Harbor Frontend initialized successfully.
      </div>
    </div>
  );
}
