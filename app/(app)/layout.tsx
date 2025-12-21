import { ClerkProvider } from "@clerk/nextjs"
import { SanityLive } from "@/sanity/lib/live"
import { CartStoreProvider } from "@/lib/store/cart-store-provider"
import { ChatStoreProvider } from "@/lib/store/chat-store-provider"
import { Header } from "@/components/app/Header"
import { CartSheet } from "@/components/app/CartSheet"
import { ChatSheet } from "@/components/app/ChatSheet"
import { AppShell } from "@/components/app/AppShell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <CartStoreProvider>
        <ChatStoreProvider>
          <AppShell>
            <Header />
            <main>
              {children}
            </main>
          </AppShell>
          <CartSheet />
          <ChatSheet />
        </ChatStoreProvider>
        <SanityLive />
      </CartStoreProvider>
    </ClerkProvider>
  )
}