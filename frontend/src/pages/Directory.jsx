import { useEffect, useState } from 'react';
import { Search, Stethoscope, UserRound, UserRoundPlus } from 'lucide-react';
import api, { getApiError } from '../lib/api';
import { getContract } from '../lib/wallet';
import { useAuth } from '../context/AuthContext';
import { Button, Card, EmptyState, ErrorMessage, Loading } from '../components/ui';
import { PageTitle } from './Dashboard';
import { useToast } from '../components/Toast';

export default function Directory() {
  const { user } = useAuth(); const { notify } = useToast(); const [people, setPeople] = useState(null); const [search, setSearch] = useState(''); const [error, setError] = useState('');
  useEffect(() => { api.get(user.role === 'PATIENT' ? '/users/doctors' : '/users/patients').then(({ data }) => setPeople(data.users || [])).catch((e) => setError(getApiError(e))); }, [user.role]);
  const request = async (person) => { try { const wallet = await getContract(); if (wallet.address.toLowerCase() !== user.walletAddress.toLowerCase()) throw new Error('Connected wallet does not match your registered wallet.'); const transaction = await wallet.contract.requestAccess(person.walletAddress); const receipt = await transaction.wait(); await api.post('/access/request', { patientId: person._id, transactionHash: receipt.hash }); notify('Access request sent'); } catch (e) { notify(e.response ? getApiError(e) : e.message, 'error'); } };
  const visible = (people || []).filter((person) => `${person.name} ${person.email || ''} ${person.walletAddress} ${person.specialization || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <PageTitle title={user.role === 'PATIENT' ? 'Doctor directory' : 'Patient directory'} subtitle={user.role === 'PATIENT' ? 'Find clinicians and review access.' : 'Request access to a patient’s records.'}><ErrorMessage message={error} /><Card><div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder={`Search ${user.role === 'PATIENT' ? 'doctors' : 'patients'}…`} value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>{people === null ? <Loading /> : visible.length ? <div className="directory-grid">{visible.map((person) => <div className="person-card" key={person._id}><div className="person-top"><div className="person-avatar">{user.role === 'PATIENT' ? <Stethoscope size={20} /> : <UserRound size={20} />}</div>{user.role === 'DOCTOR' && <Button variant="secondary" onClick={() => request(person)}><UserRoundPlus size={15} /> Request access</Button>}</div><h3>{person.name}</h3><p>{person.specialization || 'Patient'}</p><span>{person.organization || person.walletAddress}</span></div>)}</div> : <EmptyState icon={UserRound} title="No people found" description="Try a different search term." />}</Card></PageTitle>;
}
