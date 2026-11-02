import { useEffect, useState } from 'react';
import { Check, ExternalLink, ShieldCheck, UserRound, X } from 'lucide-react';
import api, { getApiError } from '../lib/api';
import { getContract, shortenAddress } from '../lib/wallet';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, EmptyState, ErrorMessage, Loading } from '../components/ui';
import { PageTitle } from './Dashboard';
import { useToast } from '../components/Toast';

export default function Access() {
  const { user } = useAuth(); const { notify } = useToast(); const [requests, setRequests] = useState(null); const [error, setError] = useState(''); const load = () => api.get('/access/requests').then(({ data }) => setRequests(data.requests || [])).catch((e) => setError(getApiError(e)));
  useEffect(() => {
    load();
  }, []);
  const change = async (request, action) => { const doctor = request.doctorId; const patient = request.patientId; try { const wallet = await getContract(); if (wallet.address.toLowerCase() !== user.walletAddress.toLowerCase()) throw new Error('Connected wallet does not match your registered wallet.'); if (user.role === 'PATIENT') { const method = action === 'approve' ? 'grantAccess' : action === 'reject' ? 'rejectAccess' : 'revokeAccess'; const transaction = await wallet.contract[method](doctor.walletAddress); const receipt = await transaction.wait(); await api.post(`/access/${action}`, { doctorId: doctor._id, transactionHash: receipt.hash }); } else { const transaction = await wallet.contract.requestAccess(patient.walletAddress); const receipt = await transaction.wait(); await api.post('/access/request', { patientId: patient._id, transactionHash: receipt.hash }); } notify(`Access ${action}d`); load(); } catch (e) { notify(e.response ? getApiError(e) : e.message, 'error'); } };
  if (!requests) return <PageTitle title="Access requests" subtitle="Review who can access encrypted records."><Loading /></PageTitle>;
  return <PageTitle title="Access requests" subtitle={user.role === 'PATIENT' ? 'Review and control clinician access to your records.' : 'Request and manage patient access.'}><ErrorMessage message={error} /><Card>{requests.length ? <div className="request-list">{requests.map((request) => { const person = user.role === 'PATIENT' ? request.doctorId : request.patientId; return <div className="request-row" key={request._id}><div className="request-avatar"><UserRound size={18} /></div><div className="request-info"><strong>{person?.name || 'Unknown user'}</strong><span>{person?.specialization || person?.walletAddress || shortenAddress(person?.walletAddress)}</span></div><Badge tone={request.status === 'APPROVED' ? 'secure' : request.status === 'PENDING' ? 'warning' : 'neutral'}>{request.status}</Badge><div className="request-actions">{user.role === 'PATIENT' && request.status === 'PENDING' && <><Button variant="secondary" onClick={() => change(request, 'reject')}><X size={15} /> Reject</Button><Button onClick={() => change(request, 'approve')}><Check size={15} /> Approve</Button></>}{user.role === 'PATIENT' && request.status === 'APPROVED' && <Button variant="danger" onClick={() => window.confirm('Revoke this doctor’s access?') && change(request, 'revoke')}>Revoke</Button>}{user.role === 'DOCTOR' && request.status === 'PENDING' && <span className="muted">Awaiting patient approval</span>}</div></div>; })}</div> : <EmptyState icon={ShieldCheck} title="No access requests" description="Requests and permissions will appear here." />}</Card></PageTitle>;
}
