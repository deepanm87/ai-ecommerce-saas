import { ClerkProvider } from "@clerk/nextjs"
import { SanityLive } from "@/sanity/lib/live"
import { CartStoreProvider } from "@/lib/store/cart-store-provider"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <CartStoreProvider>
        <main>
          {children}
        </main>
        <SanityLive />
      </CartStoreProvider>
    </ClerkProvider>
  )
}