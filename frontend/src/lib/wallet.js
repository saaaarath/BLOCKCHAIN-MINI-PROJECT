import { BrowserProvider, Contract, getAddress } from 'ethers';
import contractArtifact from '../contracts/PersonalHealthRecord.json';

export const hasWallet = () => typeof window !== 'undefined' && Boolean(window.ethereum);
const expectedChainId = Number(import.meta.env.VITE_CHAIN_ID || 31337);
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || contractArtifact.address;
const expectedChainIdHex = `0x${expectedChainId.toString(16)}`;

const ensureExpectedNetwork = async () => {
  const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (currentChainId === expectedChainIdHex) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: expectedChainIdHex }]
    });
  } catch (error) {
    if (error.code !== 4902) throw new Error(`Please approve switching MetaMask to chain ID ${expectedChainId}.`);
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: expectedChainIdHex,
        chainName: 'Hardhat Local',
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['http://127.0.0.1:8545']
      }]
    });
  }
};

export const connectWallet = async () => {
  if (!hasWallet()) throw new Error('MetaMask is not installed.');
  const provider = new BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  await ensureExpectedNetwork();
  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  const address = await signer.getAddress();
  const chainId = Number(network.chainId);
  if (chainId !== expectedChainId) throw new Error(`MetaMask is not connected to Hardhat Local (chain ID ${expectedChainId}).`);
  return { provider, signer, address: getAddress(address), chainId };
};

export const getContract = async () => {
  const wallet = await connectWallet();
  return { ...wallet, contract: new Contract(contractAddress, contractArtifact.abi, wallet.signer) };
};

export const shortenAddress = (address = '') => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Not connected';
