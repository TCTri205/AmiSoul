'use client';

import Header from "@/components/layout/Header";
import { ChatContainer, InputArea } from "@/components/chat";

export default function Home() {
  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto shadow-2xl relative bg-transparent">
      <Header />
      
      <ChatContainer />
      
      <InputArea />
      
      {/* Visual background effect integration for chat area if needed */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-white/5 dark:bg-black/5" />
    </div>
  );
}
