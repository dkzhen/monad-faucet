"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut, Wallet, Loader2, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface NavbarProps {
  account: string
  isConnecting: boolean
  isSwitchingNetwork: boolean
  networkStatus: "connected" | "wrong_network" | "disconnected"
  onConnect: () => void
  onDisconnect: () => void
  onSwitchNetwork: () => void
}

// Remove features array at the top
const features = [{ name: "Faucet", path: "/", status: "active" }]

export function Navbar({
  account,
  isConnecting,
  isSwitchingNetwork,
  networkStatus,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: NavbarProps) {
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobileMenuOpen(false)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const NetworkStatus = () => (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          networkStatus === "connected"
            ? "bg-green-500"
            : networkStatus === "wrong_network"
              ? "bg-red-500"
              : "bg-gray-500"
        }`}
      />
      <span className="text-sm">
        {networkStatus === "connected"
          ? "Monad Testnet"
          : networkStatus === "wrong_network"
            ? "Wrong Network"
            : "Not Connected"}
      </span>
    </div>
  )

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-full overflow-hidden border">
              <Image
                src="https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public"
                alt="Monad Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <span className="font-bold text-xl">MONAD</span>
          </Link>

          {/* Update the features mapping in the JSX to only show Faucet */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {features.map((feature) => (
              <Button
                key={feature.name}
                variant={pathname === feature.path ? "secondary" : "ghost"}
                className={`text-sm ${feature.status === "soon" ? "opacity-50 cursor-not-allowed" : ""}`}
                asChild={feature.status !== "soon"}
                disabled={feature.status === "soon"}
              >
                {feature.status === "soon" ? (
                  <span>{feature.name}</span>
                ) : (
                  <Link href={feature.path}>{feature.name}</Link>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {account ? (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden md:flex items-center gap-2">
                  <NetworkStatus />
                  {`${account.slice(0, 6)}...${account.slice(-4)}`}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {networkStatus === "wrong_network" && (
                  <DropdownMenuItem onClick={onSwitchNetwork}>Switch to Monad</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDisconnect}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={onConnect} disabled={isConnecting || isSwitchingNetwork} className="hidden md:flex">
              {isConnecting || isSwitchingNetwork ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isConnecting ? "Connecting..." : "Switching Network..."}
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t"
          >
            <div className="container py-4 space-y-4">
              {features.map((feature) => (
                <Button
                  key={feature.name}
                  variant={pathname === feature.path ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left ${
                    feature.status === "soon" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  asChild={feature.status !== "soon"}
                  disabled={feature.status === "soon"}
                >
                  {feature.status === "soon" ? (
                    <span>{feature.name}</span>
                  ) : (
                    <Link href={feature.path}>{feature.name}</Link>
                  )}
                </Button>
              ))}
              {account ? (
                <>
                  <div className="flex items-center justify-between">
                    <NetworkStatus />
                    <span className="font-medium">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
                  </div>
                  {networkStatus === "wrong_network" && (
                    <Button onClick={onSwitchNetwork} className="w-full">
                      Switch to Monad
                    </Button>
                  )}
                  <Button onClick={onDisconnect} variant="outline" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={onConnect} disabled={isConnecting || isSwitchingNetwork} className="w-full">
                  {isConnecting || isSwitchingNetwork ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isConnecting ? "Connecting..." : "Switching Network..."}
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

