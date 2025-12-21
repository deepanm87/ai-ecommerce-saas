import { ClerkProvider } from "@clerk/nextjs"
import { SanityLive } from "@/sanity/lib/live"
import { CartStoreProvider } from "@/lib/store/cart-store-provider"
import { ChatStoreProvider } from "@/lib/store/chat-store-provider"
import { Header } from "@/components/app/Header"
import { CartSheet } from "@/components/app/CartSheet"
import { ChatSheet } from "@/components/app/ChatSheet"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <CartStoreProvider>
        <ChatStoreProvider>
          <Header />
          <main>
            {children}
          </main>
          <CartSheet />
          <ChatSheet />
        </ChatStoreProvider>
        <SanityLive />
      </CartStoreProvider>
    </ClerkProvider>
  )
}