"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  Wallet,
  Loader2,
  CoinsIcon,
  Clock,
  SendHorizontal,
  ArrowRight,
  ChevronDown,
  LogOut,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Update the NETWORKS object to only include Monad Testnet
const NETWORKS = {
  monad: {
    chainId: 10143,
    chainName: "Monad Testnet",
    rpcUrls: ["https://testnet-rpc.monad.xyz"],
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
    blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
  },
};

const ADMIN_ADDRESS = "0xE178763C41b2A8F2C55b7D1E49941537e9EbC641";

// Add these types after the Donor type
type NetworkStatus = "connected" | "wrong_network" | "disconnected";

export default function DepositPage() {
  // ... existing states ...
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("monad");
  const [nextClaimTime, setNextClaimTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [faucetAmount, setFaucetAmount] = useState<string>("0");
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [verifierAddress, setVerifierAddress] = useState("");

  // Add these states after the existing states
  const [networkStatus, setNetworkStatus] =
    useState<NetworkStatus>("disconnected");

  // Contract address - replace with your actual contract address
  const CONTRACT_ADDRESS = "0xa896128aA0452300139787d2401B912e2D91726c";

  // Contract ABI remains the same...
  const CONTRACT_ABI = [
    {
      inputs: [{ internalType: "address", name: "_verifier", type: "address" }],
      name: "",
      outputs: null,
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Deposited",
      outputs: null,
      stateMutability: "",
      type: "event",
    },
    {
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "claimant",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "FaucetClaimed",
      outputs: null,
      stateMutability: "",
      type: "event",
    },
    {
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "recipient",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Withdrawn",
      outputs: null,
      stateMutability: "",
      type: "event",
    },
    {
      inputs: [],
      name: "claimFaucet",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "deposit",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "faucetAmount",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "lockTime",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "nextAccessTime",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "verifier",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address payable", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "withdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "admins",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  // Add this function after the existing functions
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;

    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const monadChainId = NETWORKS.monad.chainId;

      if (chainId === `0x${Number.parseInt(monadChainId).toString(16)}`) {
        setNetworkStatus("connected");
        return true;
      } else {
        setNetworkStatus("wrong_network");
        return false;
      }
    } catch (error) {
      console.error("Error checking network:", error);
      return false;
    }
  }, []);

  // ... existing useEffect ...

  useEffect(() => {
    if (account) {
      updateContractInfo();
      const interval = setInterval(() => {
        updateTimeLeft();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      checkIfAdmin();
    }
  }, [account]);

  // Add network monitoring
  useEffect(() => {
    if (window.ethereum && account) {
      checkNetwork();

      const handleChainChanged = () => {
        checkNetwork();
      };

      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account, checkNetwork]);

  const checkIfAdmin = async () => {
    if (!window.ethereum || !account) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      // Check both admin positions (0 and 1)
      const admin0 = await contract.admins(0);
      const admin1 = await contract.admins(1);

      // Check if the current account matches either admin address
      setIsAdmin(
        account.toLowerCase() === admin0.toLowerCase() ||
          account.toLowerCase() === admin1.toLowerCase()
      );
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  // Add logout function
  const handleLogout = () => {
    setAccount("");
    setNetworkStatus("disconnected");
    setIsAdmin(false);
    setContractBalance("0");
    setFaucetAmount("0");
    setNextClaimTime(0);
    setTimeLeft("");

    toast({
      title: "Disconnected",
      description: "Wallet has been disconnected",
    });
  };

  const updateContractInfo = async () => {
    if (!window.ethereum || !account) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      // Get contract balance
      const balance = await provider.getBalance(CONTRACT_ADDRESS);
      setContractBalance(ethers.formatEther(balance));

      // Get faucet amount
      const amount = await contract.faucetAmount();
      setFaucetAmount(ethers.formatEther(amount));

      // Get next access time for current account
      const nextAccess = await contract.nextAccessTime(account);
      setNextClaimTime(Number(nextAccess));
      updateTimeLeft();
    } catch (error) {
      console.error("Error updating contract info:", error);
    }
  };

  const updateTimeLeft = () => {
    if (nextClaimTime === 0) return;

    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = nextClaimTime - now;

    if (timeRemaining <= 0) {
      setTimeLeft("");
      return;
    }

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    setTimeLeft(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    );
  };

  const switchNetwork = async (networkName: string) => {
    if (!window.ethereum) return;

    const network = NETWORKS[networkName as keyof typeof NETWORKS];
    setIsSwitchingNetwork(true);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
      setSelectedNetwork(networkName);
      toast({
        title: "Network Changed",
        description: `Switched to ${network.chainName}`,
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [network],
          });
          setSelectedNetwork(networkName);
          toast({
            title: "Network Added",
            description: `Added and switched to ${network.chainName}`,
          });
        } catch (addError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not add network",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not switch network",
        });
      }
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        variant: "destructive",
        title: "Wallet not found",
        description: "Please install MetaMask or another Web3 wallet",
      });
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      // Switch to selected network after connecting
      await switchNetwork(selectedNetwork);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(
          0,
          6
        )}...${accounts[0].slice(-4)}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect wallet",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Modify the handleDeposit function to check network first
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !account) return;

    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      toast({
        variant: "destructive",
        title: "Wrong Network",
        description: "Please switch to Monad Testnet",
      });
      return;
    }

    try {
      setIsDepositing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const tx = await contract.deposit({
        value: ethers.parseEther(amount),
      });

      toast({
        title: "Transaction Sent",
        description: "Please wait for confirmation...",
      });

      await tx.wait();
      await updateContractInfo();

      toast({
        title: "Success",
        description: "Deposit successful!",
      });

      setAmount("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: "Failed to deposit funds",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  // Similarly modify handleClaim and handleCustomSend to check network first
  const handleClaim = async () => {
    if (!account) return;

    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      toast({
        variant: "destructive",
        title: "Wrong Network",
        description: "Please switch to Monad Testnet",
      });
      return;
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      if (nextClaimTime > now) {
        toast({
          variant: "destructive",
          title: "Cannot Claim Yet",
          description: `Please wait ${timeLeft} before claiming again`,
        });
        return;
      }

      setIsClaiming(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const tx = await contract.claimFaucet();

      toast({
        title: "Claim Initiated",
        description: "Please wait for confirmation...",
      });

      await tx.wait();
      await updateContractInfo();

      toast({
        title: "Success",
        description: `Successfully claimed ${faucetAmount} ${
          NETWORKS[selectedNetwork as keyof typeof NETWORKS].nativeCurrency
            .symbol
        }!`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Claim Failed",
        description: error.message || "Failed to claim from faucet",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCustomSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !isAdmin || !customAmount || !recipientAddress) return;

    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      toast({
        variant: "destructive",
        title: "Wrong Network",
        description: "Please switch to Monad Testnet",
      });
      return;
    }

    try {
      setIsSending(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const tx = await contract.withdraw(
        recipientAddress,
        ethers.parseEther(customAmount)
      );

      toast({
        title: "Transaction Sent",
        description: "Please wait for confirmation...",
      });

      await tx.wait();
      await updateContractInfo();

      toast({
        title: "Success",
        description: `Successfully sent ${customAmount} ${
          NETWORKS[selectedNetwork as keyof typeof NETWORKS].nativeCurrency
            .symbol
        } to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
      });

      setCustomAmount("");
      setRecipientAddress("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: error.message || "Failed to send tokens",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Modify the NetworkStatus component
  const NetworkStatus = () => {
    if (!account) return null;

    return (
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
        {networkStatus === "wrong_network" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => switchNetwork("monad")}
            className="ml-2"
          >
            Switch to Monad
          </Button>
        )}
      </div>
    );
  };

  const NetworkSelector = () => (
    <div className="space-y-2">
      <Label>Select Network</Label>
      <Select
        value={selectedNetwork}
        onValueChange={(value) => {
          if (account) {
            switchNetwork(value);
          }
          setSelectedNetwork(value);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select network" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monad">Monad Testnet</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const ConnectWalletButton = () => (
    <Button
      className="w-full"
      onClick={connectWallet}
      disabled={isConnecting || isSwitchingNetwork}
    >
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
  );

  // Add these components before your return statement
  const Title = () => (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent mb-4">
        Monad Testnet Faucet
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground">
        Test, Play, and Build on Monad Testnet
      </p>
    </div>
  );

  const Footer = () => (
    <footer className="w-full py-6 mt-8 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Image
              src="https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public"
              alt="Monad Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="text-sm text-muted-foreground">
              <p>Powered by Zhen</p>
              <p>Built with ❤️ for the community</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://testnet.monadexplorer.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
            >
              Explorer <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );

  const ContractInfoCard = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Image
            src="https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public"
            alt="Monad Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <CardTitle>Contract Info</CardTitle>
            <CardDescription>
              Current contract status and balance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Contract Balance</Label>
            <p className="text-lg font-medium">
              {contractBalance}{" "}
              {
                NETWORKS[selectedNetwork as keyof typeof NETWORKS]
                  .nativeCurrency.symbol
              }
            </p>
          </div>
          <div>
            <Label>Faucet Amount</Label>
            <p className="text-lg font-medium">
              {faucetAmount}{" "}
              {
                NETWORKS[selectedNetwork as keyof typeof NETWORKS]
                  .nativeCurrency.symbol
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DepositCard = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Image
            src="https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public"
            alt="Monad Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <CardTitle>Deposit Fund</CardTitle>
            <CardDescription>Deposit funds to the Faucet</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <NetworkSelector />

        {!account ? (
          <ConnectWalletButton />
        ) : (
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">Connected Account</Label>
              <Input
                id="account"
                value={`${account.slice(0, 6)}...${account.slice(-4)}`}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (
                {
                  NETWORKS[selectedNetwork as keyof typeof NETWORKS]
                    .nativeCurrency.symbol
                }
                )
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isDepositing || !amount || isSwitchingNetwork}
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Depositing...
                </>
              ) : (
                "Deposit"
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Make sure you have enough{" "}
        {
          NETWORKS[selectedNetwork as keyof typeof NETWORKS].nativeCurrency
            .symbol
        }{" "}
        to cover the deposit and gas fees
      </CardFooter>
    </Card>
  );

  const ClaimCard = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Image
            src="https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public"
            alt="Monad Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <CardTitle>Claim Faucet</CardTitle>
            <CardDescription>
              Claim {faucetAmount}{" "}
              {
                NETWORKS[selectedNetwork as keyof typeof NETWORKS]
                  .nativeCurrency.symbol
              }{" "}
              from the faucet
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!account ? (
          <ConnectWalletButton />
        ) : (
          <>
            {timeLeft && (
              <div className="bg-secondary p-4 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-secondary-foreground">
                  <Clock className="h-5 w-5" />
                  <div className="text-center">
                    <p className="font-medium">Next claim available in:</p>
                    <p className="text-2xl font-bold tracking-wider">
                      {timeLeft}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleClaim}
              disabled={isClaiming || isSwitchingNetwork || !!timeLeft}
            >
              {isClaiming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <CoinsIcon className="mr-2 h-4 w-4" />
                  Claim Tokens
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        You can claim {faucetAmount}{" "}
        {
          NETWORKS[selectedNetwork as keyof typeof NETWORKS].nativeCurrency
            .symbol
        }{" "}
        once every 24 hours
      </CardFooter>
    </Card>
  );

  const AdminCard = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Image
            src="https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public"
            alt="Monad Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <CardTitle>Admin Control</CardTitle>
            <CardDescription>Send custom amount to any address</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCustomSend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customAmount">
              Amount (
              {
                NETWORKS[selectedNetwork as keyof typeof NETWORKS]
                  .nativeCurrency.symbol
              }
              )
            </Label>
            <Input
              id="customAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.0"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSending || !customAmount || !recipientAddress}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendHorizontal className="mr-2 h-4 w-4" />
                Send Tokens
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Admin only: Send any amount of tokens to any address
      </CardFooter>
    </Card>
  );

  const features = {
    faucet: { status: "active", href: "/" },
    bridge: { status: "active", href: "/bridge" },
    swap: { status: "active", href: "/swap" },
  };
  const Navbar = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Image
              src="https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public"
              alt="Monad Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-bold">MONAD</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {Object.entries(features).map(([key, { status, href }]) => (
              <Button
                key={key}
                variant="ghost"
                className={`text-sm ${
                  status === "soon" ? "opacity-50 cursor-not-allowed" : ""
                }`}
                asChild
                disabled={status === "soon"}
              >
                <a
                  href={href}
                  onClick={(e) => status === "soon" && e.preventDefault()}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </a>
              </Button>
            ))}
          </div>

          {/* Wallet & Network Status */}
          <div className="flex items-center space-x-4">
            {account ? (
              <div className="relative">
                <NetworkStatus />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {`${account.slice(0, 6)}...${account.slice(-4)}`}
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover border">
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ConnectWalletButton />
            )}
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Rest of your page content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <Title />
        {/* ... rest of the components */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {account && <ContractInfoCard />}
          <DepositCard />
          <ClaimCard />
          {isAdmin && <AdminCard />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
