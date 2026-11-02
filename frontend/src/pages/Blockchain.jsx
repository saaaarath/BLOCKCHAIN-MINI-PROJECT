import { useEffect, useState } from 'react';
import { ExternalLink, Network } from 'lucide-react';
import api, { getApiError } from '../lib/api';
import { Badge, Card, EmptyState, ErrorMessage, Loading } from '../components/ui';
import { PageTitle } from './Dashboard';
export default function Blockchain() {
  const [records, setRecords] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/blockchain/history').then(({ data }) => setRecords(data.records || [])).catch((e) => setError(getApiError(e))); }, []);
  return <PageTitle title="Blockchain history" subtitle="A transparent view of your on-chain record references."><ErrorMessage message={error} /><Card>{error ? <EmptyState icon={Network} title="Blockchain unavailable" description="Check that Hardhat is running and the current contract has been deployed." /> : records === null ? <Loading /> : records.length ? <div className="table-wrap"><table><thead><tr><th>Record ID</th><th>Patient wallet</th><th>Timestamp</th><th>Status</th><th /></tr></thead><tbody>{records.map((record) => <tr key={record.recordId}><td><strong>{record.recordId}</strong></td><td className="mono">{record.patient.slice(0, 10)}…</td><td>{new Date(Number(record.timestamp) * 1000).toLocaleString()}</td><td><Badge tone="secure">Confirmed</Badge></td><td><a className="icon-link" href={import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL ? `${import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL}/address/${record.patient}` : '#'} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a></td></tr>)}</tbody></table></div> : <EmptyState icon={Network} title="No blockchain activity" description="Confirmed record references will appear here." />}</Card></PageTitle>;
}
