'use client';

import Image from "next/image";
import { ConnectButton, MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import thirdwebIcon from "@public/thirdweb.svg";
import { client } from "./client";
import { defineChain, getContract, toEther } from "thirdweb";
import { bsc } from "thirdweb/chains";
import { getContractMetadata } from "thirdweb/extensions/common";
import { getActiveClaimCondition, getTotalClaimedSupply, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { useEffect, useState } from "react";

export default function Home() {
  const account = useActiveAccount();
  const chain = defineChain(bsc);
  const [quantity, setQuantity] = useState(1);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string>("USDT"); // Default payment token

  // Define contract and metadata
  const contract = getContract({
    client: client,
    chain: chain,
    address: "0x28f6Ff4FeC066b2a6D995ed74567413F3649BB42"
  });

  const { data: contractMetadata, isLoading: isContractMetadataLoading } = useReadContract(getContractMetadata, { contract });
  const { data: claimedSupply, isLoading: isClaimedSupplyLoading } = useReadContract(getTotalClaimedSupply, { contract });
  const { data: totalNFTSupply, isLoading: isTotalSupplyLoading } = useReadContract(nextTokenIdToMint, { contract });
  const { data: claimCondition } = useReadContract(getActiveClaimCondition, { contract });

  useEffect(() => {
    // Capture referrer from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    setReferrer(urlParams.get("ref"));
  }, []);

  const getPrice = (quantity: number) => {
    const total = quantity * parseInt(claimCondition?.pricePerToken.toString() || "0");
    return toEther(BigInt(total));
  };

  // Function to claim NFT and distribute OPE tokens
  const handleClaim = async () => {
    if (!account || !contract) return;

    try {
      // Call claimWithReferrer function on contract
      await contract.functions.claimWithReferrer(quantity, referrer, paymentToken);

      alert("NFT Claimed and reward distributed!");

      // Reset the quantity after claim
      setQuantity(1);

    } catch (error) {
      console.error("Claim failed:", error);
      alert("Failed to claim NFT.");
    }
  };

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20 text-center">
        <Header />
        <ConnectButton client={client} chain={chain} />
        <div className="flex flex-col items-center mt-4">
          {isContractMetadataLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <MediaRenderer client={client} src={contractMetadata?.image} className="rounded-xl" />
              <h2 className="text-2xl font-semibold mt-4">{contractMetadata?.name}</h2>
              <p className="text-lg mt-2">{contractMetadata?.description}</p>
            </>
          )}
          {isClaimedSupplyLoading || isTotalSupplyLoading ? (
            <p>Loading...</p>
          ) : (
            <p className="text-lg mt-2 font-bold">
              Total NFT Supply: {claimedSupply?.toString()}/{totalNFTSupply?.toString()}
            </p>
          )}
          <div className="flex flex-row items-center justify-center my-4">
            <button
              className="bg-black text-white px-4 py-2 rounded-md mr-4"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-10 text-center border border-gray-300 rounded-md bg-black text-white"
            />
            <button
              className="bg-black text-white px-4 py-2 rounded-md mr-4"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
          <TransactionButton onClick={handleClaim}>
            {`Claim NFT (${getPrice(quantity)} ETH)`}
          </TransactionButton>
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-row items-center">
      <Image
        src={thirdwebIcon}
        alt=""
        className="size-[150px] md:size-[150px]"
        style={{ filter: "drop-shadow(0px 0px 24px #a726a9a8)" }}
      />
      <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-6 text-zinc-100">
        NFT Claim App
      </h1>
    </header>
  );
}
