// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PersonalHealthRecord {
    struct MedicalRecord {
        string recordId;
        string cidHash;
        string metadataHash;
        uint256 timestamp;
        address patient;
    }

    address public immutable owner;
    mapping(address => bool) public registeredDoctors;
    mapping(address => bool) public registeredPatients;
    mapping(address => MedicalRecord[]) private patientRecords;
    mapping(address => mapping(address => bool)) private access;
    mapping(address => mapping(address => bool)) private pendingRequests;
    mapping(address => address[]) private requesters;

    event RecordUploaded(address indexed patient, string indexed recordId, string cidHash, string metadataHash, uint256 timestamp);
    event AccessRequested(address indexed patient, address indexed doctor);
    event AccessGranted(address indexed patient, address indexed doctor);
    event AccessRejected(address indexed patient, address indexed doctor);
    event AccessRevoked(address indexed patient, address indexed doctor);
    event PatientRegistered(address indexed patient);

    modifier onlyOwner() { require(msg.sender == owner, "Only owner"); _; }
    modifier onlyPatient(address patient) { require(msg.sender == patient, "Only patient"); _; }
    modifier onlyDoctor() { require(registeredDoctors[msg.sender], "Only registered doctor"); _; }

    constructor() { owner = msg.sender; }

    function registerDoctor(address doctor) external onlyOwner {
        require(doctor != address(0), "Invalid doctor");
        registeredPatients[doctor] = false;
        registeredDoctors[doctor] = true;
    }

    function registerPatient() external {
        require(!registeredDoctors[msg.sender], "Doctors cannot register as patients");
        registeredPatients[msg.sender] = true;
        emit PatientRegistered(msg.sender);
    }

    function addMedicalRecord(string calldata recordId, string calldata cidHash, string calldata metadataHash) external {
        require(registeredPatients[msg.sender], "Patient registration required");
        require(bytes(recordId).length > 0 && bytes(cidHash).length > 0, "Invalid record reference");
        uint256 timestamp = block.timestamp;
        patientRecords[msg.sender].push(MedicalRecord(recordId, cidHash, metadataHash, timestamp, msg.sender));
        emit RecordUploaded(msg.sender, recordId, cidHash, metadataHash, timestamp);
    }

    function getMedicalRecords(address patient) external view returns (MedicalRecord[] memory) {
        require(msg.sender == patient || access[patient][msg.sender], "Record access denied");
        return patientRecords[patient];
    }

    function requestAccess(address patient) external onlyDoctor {
        require(patient != address(0) && !access[patient][msg.sender], "Already authorized");
        if (!pendingRequests[patient][msg.sender]) {
            pendingRequests[patient][msg.sender] = true;
            requesters[patient].push(msg.sender);
            emit AccessRequested(patient, msg.sender);
        }
    }

    function grantAccess(address doctor) external onlyPatient(msg.sender) {
        require(pendingRequests[msg.sender][doctor], "No pending request");
        pendingRequests[msg.sender][doctor] = false;
        access[msg.sender][doctor] = true;
        emit AccessGranted(msg.sender, doctor);
    }

    function rejectAccess(address doctor) external onlyPatient(msg.sender) {
        require(pendingRequests[msg.sender][doctor], "No pending request");
        pendingRequests[msg.sender][doctor] = false;
        emit AccessRejected(msg.sender, doctor);
    }

    function revokeAccess(address doctor) external onlyPatient(msg.sender) {
        require(access[msg.sender][doctor], "No active access");
        access[msg.sender][doctor] = false;
        emit AccessRevoked(msg.sender, doctor);
    }

    function hasAccess(address patient, address doctor) external view returns (bool) {
        return access[patient][doctor];
    }

    function getAccessRequests() external view returns (address[] memory doctors) {
        address[] memory all = requesters[msg.sender];
        uint256 count;
        for (uint256 i; i < all.length; i++) if (pendingRequests[msg.sender][all[i]]) count++;
        doctors = new address[](count);
        uint256 index;
        for (uint256 i; i < all.length; i++) {
            if (pendingRequests[msg.sender][all[i]]) doctors[index++] = all[i];
        }
    }
}
