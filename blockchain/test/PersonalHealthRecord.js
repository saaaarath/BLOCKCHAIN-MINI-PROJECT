const { expect } = require('chai');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

describe('PersonalHealthRecord', function () {
  async function setup() {
    const [owner, patient, doctor, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('PersonalHealthRecord');
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    await contract.registerDoctor(doctor.address);
    await contract.connect(patient).registerPatient();
    return { contract, owner, patient, doctor, stranger };
  }

  it('registers records and emits an event', async function () {
    const { contract, patient } = await setup();
    await expect(contract.connect(patient).addMedicalRecord('r-1', 'cid-1', 'meta-1'))
      .to.emit(contract, 'RecordUploaded').withArgs(patient.address, 'r-1', 'cid-1', 'meta-1', anyValue);
    expect((await contract.connect(patient).getMedicalRecords(patient.address)).length).to.equal(1);
  });

  it('restricts patient registration and owner-controlled doctor registration', async function () {
    const { contract, patient, doctor, stranger } = await setup();
    await expect(contract.connect(doctor).registerPatient()).to.be.revertedWith('Doctors cannot register as patients');
    await expect(contract.connect(stranger).addMedicalRecord('r-1', 'cid-1', 'meta-1')).to.be.revertedWith('Patient registration required');
    await expect(contract.connect(patient).addMedicalRecord('r-1', 'cid-1', 'meta-1')).not.to.be.reverted;
    await expect(contract.connect(patient).registerDoctor(stranger.address)).to.be.revertedWith('Only owner');
  });

  it('prevents unauthorized record retrieval', async function () {
    const { contract, patient, stranger } = await setup();
    await contract.connect(patient).addMedicalRecord('r-1', 'cid-1', 'meta-1');
    await expect(contract.connect(stranger).getMedicalRecords(patient.address)).to.be.revertedWith('Record access denied');
  });

  it('supports request, grant, and revoke', async function () {
    const { contract, patient, doctor } = await setup();
    await expect(contract.connect(doctor).requestAccess(patient.address)).to.emit(contract, 'AccessRequested');
    expect((await contract.connect(patient).getAccessRequests())[0]).to.equal(doctor.address);
    await expect(contract.connect(patient).grantAccess(doctor.address)).to.emit(contract, 'AccessGranted');
    expect(await contract.hasAccess(patient.address, doctor.address)).to.equal(true);
    await expect(contract.connect(patient).revokeAccess(doctor.address)).to.emit(contract, 'AccessRevoked');
    expect(await contract.hasAccess(patient.address, doctor.address)).to.equal(false);
  });

  it('supports patient rejection and blocks unregistered doctors', async function () {
    const { contract, patient, stranger } = await setup();
    await expect(contract.connect(stranger).requestAccess(patient.address)).to.be.revertedWith('Only registered doctor');
    const [, , doctor] = await ethers.getSigners();
    await contract.connect(doctor).requestAccess(patient.address);
    await expect(contract.connect(patient).rejectAccess(doctor.address)).to.emit(contract, 'AccessRejected');
  });
});
