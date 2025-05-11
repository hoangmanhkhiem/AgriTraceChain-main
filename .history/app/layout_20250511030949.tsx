import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import './globals.css' 
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { WalletProvider } from "@/context/wallet-context"  // Thêm dòng này
import { MeshProvider } from "@meshsdk/react"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AgriTraceChain - Blockchain Agricultural Traceability",
  description: "Trace agricultural products from farm to table using blockchain technology",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <WalletProvider>
          <MeshProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
        </ThemeProvider>
        ></MeshProvider>
        </WalletProvider>
      </body>
    </html>
  )
}
