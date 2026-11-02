import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:5000';
const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';
const suffix = crypto.randomUUID();
const patient = {
  name: `Integration Patient ${suffix}`,
  email: `patient-${suffix}@example.test`,
  password: 'StrongIntegrationPassword123!',
  role: 'PATIENT',
  walletAddress: '0x0000000000000000000000000000000000000001'
};
const doctor = {
  name: `Integration Doctor ${suffix}`,
  email: `doctor-${suffix}@example.test`,
  password: 'StrongIntegrationPassword123!',
  role: 'DOCTOR',
  walletAddress: '0x0000000000000000000000000000000000000002'
};

const request = (path, options = {}) => fetch(`${baseUrl}${path}`, options);
const json = (body) => ({ headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

before(async () => {
  if (!runIntegration) return;
  await mongoose.connect(process.env.MONGODB_URI);
});

after(async () => {
  if (!runIntegration) return;
  await mongoose.connection.collection('users').deleteMany({ email: { $in: [patient.email, doctor.email] } });
  await mongoose.disconnect();
});

test('registers, logs in, persists identity, and rejects invalid JWT', { skip: !runIntegration }, async () => {
  const registered = await request('/api/auth/register', { method: 'POST', ...json(patient) });
  assert.equal(registered.status, 201);
  const registeredBody = await registered.json();
  assert.equal(registeredBody.user.email, patient.email);
  assert.ok(registeredBody.accessToken);

  const login = await request('/api/auth/login', { method: 'POST', ...json({ email: patient.email, password: patient.password }) });
  assert.equal(login.status, 200);
  const loginBody = await login.json();
  const me = await request('/api/auth/me', { headers: { authorization: `Bearer ${loginBody.accessToken}` } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.email, patient.email);

  const invalid = await request('/api/auth/me', { headers: { authorization: 'Bearer invalid-token' } });
  assert.equal(invalid.status, 401);
  if (process.env.JWT_SECRET) {
    const expired = jwt.sign({ sub: registeredBody.user.id }, process.env.JWT_SECRET, { expiresIn: -1 });
    const expiredResponse = await request('/api/auth/me', { headers: { authorization: `Bearer ${expired}` } });
    assert.equal(expiredResponse.status, 401);
  }
});

test('enforces role boundaries and rejects invalid uploads', { skip: !runIntegration }, async () => {
  const login = await request('/api/auth/login', { method: 'POST', ...json({ email: patient.email, password: patient.password }) });
  const token = (await login.json()).accessToken;
  const doctorDirectory = await request('/api/users/patients', { headers: { authorization: `Bearer ${token}` } });
  assert.equal(doctorDirectory.status, 403);

  const form = new FormData();
  form.append('title', 'Invalid upload');
  form.append('category', 'Other');
  form.append('file', new Blob(['not a medical image'], { type: 'text/plain' }), 'invalid.txt');
  const upload = await request('/api/records/upload', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form });
  assert.equal(upload.status, 415);
});

test('doctor and patient receive isolated empty record and blockchain views', { skip: !runIntegration }, async () => {
  const doctorRegistration = await request('/api/auth/register', { method: 'POST', ...json(doctor) });
  assert.equal(doctorRegistration.status, 201);
  const doctorToken = (await doctorRegistration.json()).accessToken;
  const patientLogin = await request('/api/auth/login', { method: 'POST', ...json({ email: patient.email, password: patient.password }) });
  const patientToken = (await patientLogin.json()).accessToken;

  const patientRecords = await request('/api/records', { headers: { authorization: `Bearer ${patientToken}` } });
  const doctorRecords = await request('/api/records', { headers: { authorization: `Bearer ${doctorToken}` } });
  assert.deepEqual((await patientRecords.json()).records, []);
  assert.deepEqual((await doctorRecords.json()).records, []);

  const history = await request('/api/blockchain/history', { headers: { authorization: `Bearer ${patientToken}` } });
  assert.equal(history.status, 200);
  assert.deepEqual((await history.json()).records, []);
});
