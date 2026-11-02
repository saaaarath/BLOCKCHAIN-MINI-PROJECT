import { ethers } from 'ethers';
import { env } from '../config/env.js';
import artifact from '../../../frontend/src/contracts/PersonalHealthRecord.json' with { type: 'json' };
import { AppError } from '../utils/errors.js';

let provider;
let contract;
const getProvider = () => {
  if (!provider) provider = new ethers.JsonRpcProvider(env.blockchainRpcUrl);
  return provider;
};
const getContract = () => {
  if (!env.blockchainContractAddress) throw new AppError(503, 'Blockchain contract is not configured');
  if (!contract) contract = new ethers.Contract(env.blockchainContractAddress, artifact.abi, getProvider());
  return contract;
};

export const verifyWallet = (address) => {
  try { return ethers.getAddress(address); } catch { throw new AppError(400, 'Invalid wallet address'); }
};

export const hasBlockchainAccess = async (patientWallet, doctorWallet) =>
  getContract().hasAccess(verifyWallet(patientWallet), verifyWallet(doctorWallet));

export const readPatientRecords = async (patientWallet) => {
  const wallet = verifyWallet(patientWallet);
  const records = await getContract().getMedicalRecords(wallet, { from: wallet });
  return records.map((record) => ({
    recordId: record.recordId,
    cidHash: record.cidHash,
    metadataHash: record.metadataHash,
    timestamp: record.timestamp.toString(),
    patient: record.patient
  }));
};
export const readAccessRequests = async (patientWallet) => {
  const wallet = verifyWallet(patientWallet);
  return getContract().getAccessRequests({ from: wallet });
};

export const verifyRecordTransaction = async (transactionHash, patientWallet, recordId) => {
  const receipt = await getProvider().waitForTransaction(transactionHash, env.trustedBlockchainConfirmations);
  if (!receipt || receipt.status !== 1) throw new AppError(400, 'Blockchain transaction was not confirmed');
  const parsed = receipt.logs.map((log) => { try { return getContract().interface.parseLog(log); } catch { return null; } })
    .find((event) => event?.name === 'RecordUploaded');
  if (!parsed || parsed.args.patient.toLowerCase() !== patientWallet.toLowerCase() || parsed.args.recordId !== recordId) {
    throw new AppError(400, 'Blockchain record transaction does not match the record');
  }
  return receipt.hash;
};

export const verifyAccessTransaction = async (transactionHash, eventName, patientWallet, doctorWallet) => {
  const receipt = await getProvider().waitForTransaction(transactionHash, env.trustedBlockchainConfirmations);
  if (!receipt || receipt.status !== 1) throw new AppError(400, 'Blockchain transaction was not confirmed');
  const parsed = receipt.logs.map((log) => { try { return getContract().interface.parseLog(log); } catch { return null; } })
    .find((event) => event?.name === eventName);
  const patient = verifyWallet(patientWallet).toLowerCase();
  const doctor = verifyWallet(doctorWallet).toLowerCase();
  if (!parsed || parsed.args.patient.toLowerCase() !== patient || parsed.args.doctor.toLowerCase() !== doctor) {
    throw new AppError(400, `Blockchain transaction does not match ${eventName}`);
  }
  return receipt.hash;
};

export const getTransaction = async (hash) => getProvider().getTransactionReceipt(hash);
