import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import NebulaVaultABI from './abis/NebulaVault.json'; // Assuming ABI is available
import ERC721ABI from './abis/ERC721.json'; // Assuming ERC721 ABI is available

const NEBULA_VAULT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Placeholder, replace with deployed address

function VaultInterface({ provider, signer, account }) {
    const [collectionAddress, setCollectionAddress] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [userNFTs, setUserNFTs] = useState([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (account && provider) {
            fetchUserNFTs();
        }
    }, [account, provider]);

    const fetchUserNFTs = async () => {
        setStatus("Fetching user NFTs...");
        try {
            // This is a simplified mock. In a real app, you'd query an indexer or scan events.
            // For the MVP, we'll assume the user has some NFTs they can input.
            // A more robust solution would involve querying OpenSea API or similar.
            setUserNFTs([
                { collection: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", id: "1" },
                { collection: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", id: "2" },
                { collection: "0xabcdef1234567890abcdef1234567890abcdef", id: "101" },
            ]);
            setStatus("NFTs loaded (mock data).");
        } catch (error) {
            console.error("Error fetching user NFTs:", error);
            setStatus(`Error fetching NFTs: ${error.message}`);
        }
    };

    const handleDeposit = async () => {
        if (!signer || !collectionAddress || !tokenId) {
            setStatus("Please connect wallet and enter NFT details.");
            return;
        }

        setStatus("Approving NFT...");
        try {
            const nftContract = new ethers.Contract(collectionAddress, ERC721ABI, signer);
            const approvalTx = await nftContract.approve(NEBULA_VAULT_ADDRESS, tokenId);
            await approvalTx.wait();
            setStatus("NFT approved. Depositing...");

            const vaultContract = new ethers.Contract(NEBULA_VAULT_ADDRESS, NebulaVaultABI, signer);
            const depositTx = await vaultContract.deposit(collectionAddress, tokenId);
            await depositTx.wait();
            setStatus("NFT deposited successfully! NebulaTokens minted.");
            fetchUserNFTs(); // Refresh NFT list
        } catch (error) {
            console.error("Deposit failed:", error);
            setStatus(`Deposit failed: ${error.message}`);
        }
    };

    const handleWithdraw = async () => {
        if (!signer || !collectionAddress || !tokenId) {
            setStatus("Please connect wallet and enter NFT details.");
            return;
        }

        setStatus("Withdrawing NFT...");
        try {
            const vaultContract = new ethers.Contract(NEBULA_VAULT_ADDRESS, NebulaVaultABI, signer);
            const withdrawTx = await vaultContract.withdraw(collectionAddress, tokenId);
            await withdrawTx.wait();
            setStatus("NFT withdrawn successfully!");
            fetchUserNFTs(); // Refresh NFT list
        } catch (error) {
            console.error("Withdraw failed:", error);
            setStatus(`Withdraw failed: ${error.message}`);
        }
    };

    return (
        <div className="vault-interface panel">
            <h3>Nebula Vault</h3>
            <p>Deposit your NFTs to earn yield.</p>

            <div className="input-group">
                <input
                    type="text"
                    placeholder="NFT Collection Address (e.g., 0x...)"
                    value={collectionAddress}
                    onChange={(e) => setCollectionAddress(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="NFT Token ID (e.g., 123)"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                />
            </div>
            <div className="button-group">
                <button onClick={handleDeposit} disabled={!signer}>Deposit NFT</button>
                <button onClick={handleWithdraw} disabled={!signer}>Withdraw NFT</button>
            </div>

            {status && <p className="status-message">{status}</p>}

            <h4>Your NFTs (Mock Data)</h4>
            {userNFTs.length > 0 ? (
                <ul>
                    {userNFTs.map((nft, index) => (
                        <li key={index}>
                            Collection: {nft.collection.substring(0, 6)}...{nft.collection.substring(nft.collection.length - 4)}, ID: {nft.id}
                            <button onClick={() => { setCollectionAddress(nft.collection); setTokenId(nft.id); }}>Select</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No NFTs found in your wallet (mock data).</p>
            )}
        </div>
    );
}

export default VaultInterface;