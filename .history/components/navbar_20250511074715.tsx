"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet, Leaf, Menu, X, Copy, ExternalLink, LogOut, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useWallet, useWalletList } from '@meshsdk/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  // MeshSDK wallet states
  const { connected, wallet, name, connect, disconnect } = useWallet();
  const wallets = useWalletList();
  
  // UI states
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [walletBalance, setWalletBalance] = useState<string>('0')
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false)
  
  const pathname = usePathname()
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside wallet dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setWalletDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch wallet address and balance when connected
  useEffect(() => {
    async function fetchWalletInfo() {
      if (wallet && connected) {
        try {
          // Get wallet address
          const usedAddresses = await wallet.getUsedAddresses();
          if (usedAddresses && usedAddresses.length > 0) {
            setWalletAddress(usedAddresses[0]);
          }
          
          // Get wallet balance
          const lovelace = await wallet.getLovelace();
          // Convert lovelace to ADA
          const adaBalance = (parseInt(lovelace) / 1000000).toFixed(2);
          setWalletBalance(adaBalance);
        } catch (error) {
          console.error("Error fetching wallet info:", error);
        }
      }
    }
    
    if (connected) {
      fetchWalletInfo();
      // Refresh balance every 30 seconds
      const intervalId = setInterval(fetchWalletInfo, 30000);
      return () => clearInterval(intervalId);
    }
  }, [wallet, connected]);

  // Handle wallet connection
  const handleConnectWallet = () => {
    setWalletDropdownOpen(!walletDropdownOpen);
  };
  
  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      alert("Address copied to clipboard");
    }
  };
  
  // View in explorer
  const viewInExplorer = () => {
    if (walletAddress) {
      window.open(`https://preprod.cardanoscan.io/address/${walletAddress}`, "_blank");
    }
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "How It Works", path: "/how-it-works" },
    ...(connected
      ? [
          { name: "Dashboard", path: "/dashboard" },
          { name: "My Products", path: "/products" },
        ]
      : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">AgriTraceChain</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.path ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline-block max-w-[100px] truncate">
                    {walletAddress ? 
                      `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 
                      name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>My Wallet</span>
                    <span className="text-sm font-normal text-muted-foreground">{name}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium mb-1">Balance</div>
                  <div className="text-lg font-bold">{walletBalance} ₳</div>
                </div>
                
                <DropdownMenuSeparator />
                
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium mb-1">Wallet Address</div>
                  <div className="text-xs text-muted-foreground truncate">{walletAddress}</div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={copyAddressToClipboard}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={viewInExplorer}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Explorer
                    </Button>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/products">My Products</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/transactions">Transactions</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => disconnect()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="relative" ref={walletDropdownRef}>
              <Button onClick={handleConnectWallet}>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
              
              {walletDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-1 z-50">
                  {wallets.map((walletOption, index) => (
                    <button
                      key={index}
                      className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-md"
                      onClick={() => {
                        connect(walletOption.name);
                        setWalletDropdownOpen(false);
                      }}
                    >
                      {walletOption.name === "eternl" && (
                        <span className="w-5 h-5 mr-2 flex-shrink-0 bg-[#c80364] rounded-full"></span>
                      )}
                      {walletOption.name === "nami" && (
                        <span className="w-5 h-5 mr-2 flex-shrink-0 bg-[#349ea3] rounded-full"></span>
                      )}
                      {walletOption.name === "flint" && (
                        <span className="w-5 h-5 mr-2 flex-shrink-0 bg-[#000000] rounded-full"></span>
                      )}
                      {walletOption.name === "typhon" && (
                        <span className="w-5 h-5 mr-2 flex-shrink-0 bg-[#0051ff] rounded-full"></span>
                      )}
                      {walletOption.name === "gerowallet" && (
                        <span className="w-5 h-5 mr-2 flex-shrink-0 bg-[#762a27] rounded-full"></span>
                      )}
                      {walletOption.name === "begin" && (
                        <span className="w-5 h-5 mr-2 flex-shrink-0 bg-[#f2ae1c] rounded-full"></span>
                      )}
                      {walletOption.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden container py-4 border-t">
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.path ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}