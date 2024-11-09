'use client';

import Image from "next/image";
import { ConnectButton, MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import thirdwebIcon from "@public/thirdweb.svg";
import { client } from "./client";
import { defineChain, getContract, toEther } from "thirdweb";
import { bsc } from "thirdweb/chains";
import { getContractMetadata } from "thirdweb/extensions/common";
import { claimTo, getActiveClaimCondition, getTotalClaimedSupply, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { useEffect, useState } from "react";

export default function CommunityNFTPage() {
  const account = useActiveAccount();
  const [quantity, setQuantity] = useState(1);
  const [referrerId, setReferrerId] = useState(null);

  // Define chain and contract details
  const chain = defineChain(bsc);
  const contract = getContract({
    client: client,
    chain: chain,
    address: "0x28f6Ff4FeC066b2a6D995ed74567413F3649BB42"
  });

  // Fetch contract metadata and conditions
  const { data: contractMetadata } = useReadContract(getContractMetadata, { contract: contract });
  const { data: claimedSupply } = useReadContract(getTotalClaimedSupply, { contract: contract });
  const { data: totalNFTSupply } = useReadContract(nextTokenIdToMint, { contract: contract });
  const { data: claimCondition } = useReadContract(getActiveClaimCondition, { contract: contract });

  useEffect(() => {
    // Extract referrerId from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get("clientId");
    if (referrer) {
      setReferrerId(referrer);
      // Call backend to validate or log the referrer if needed
      console.log("Referrer ID:", referrer);
    }
  }, []);

  const getPrice = (quantity) => {
    const total = quantity * parseInt(claimCondition?.pricePerToken.toString() || "0");
    return toEther(BigInt(total));
  }

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex flex-col items-center container max-w-screen-lg mx-auto">
      <header className="flex justify-between w-full py-4">
        <h1 className="text-2xl md:text-6xl font-semibold text-zinc-100">Community NFT</h1>
        <ConnectButton client={client} chain={chain} />
      </header>

      <div className="py-10 text-center">
        <div className="flex flex-col items-center">
          {contractMetadata ? (
            <>
              <MediaRenderer client={client} src={contractMetadata.image} className="rounded-xl" />
              <h2 className="text-2xl font-semibold mt-4">{contractMetadata.name}</h2>
              <p className="text-lg mt-2">{contractMetadata.description}</p>
            </>
          ) : (
            <p>Loading...</p>
          )}

          {claimedSupply && totalNFTSupply ? (
            <p className="text-lg mt-2 font-bold">
              Total NFT Supply: {claimedSupply}/{totalNFTSupply}
            </p>
          ) : (
            <p>Loading...</p>
          )}

          <div className="flex flex-row items-center justify-center my-4">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="bg-black text-white px-4 py-2 rounded-md mr-4">-</button>
            <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} className="w-10 text-center border border-gray-300 rounded-md bg-black text-white" />
            <button onClick={() => setQuantity(quantity + 1)} className="bg-black text-white px-4 py-2 rounded-md mr-4">+</button>
          </div>

          <TransactionButton
            transaction={() => claimTo({
              contract: contract,
              to: account?.address || "",
              quantity: BigInt(quantity),
            })}
            onTransactionConfirmed={() => {
              alert("NFT Claimed!");
              setQuantity(1);
            }}
          >
            {`Claim NFT (${getPrice(quantity)} ETH)`}
          </TransactionButton>
        </div>
      </div>
    </main>
  );
}
