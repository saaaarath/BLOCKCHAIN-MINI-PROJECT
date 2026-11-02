const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const Factory = await hre.ethers.getContractFactory('PersonalHealthRecord');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const artifact = await hre.artifacts.readArtifact('PersonalHealthRecord');
  const output = { address, abi: artifact.abi };
  const destination = path.resolve(__dirname, '../../frontend/src/contracts/PersonalHealthRecord.json');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(output, null, 2));
  console.log(`PersonalHealthRecord deployed to ${address}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
