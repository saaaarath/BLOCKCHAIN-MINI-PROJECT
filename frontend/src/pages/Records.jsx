import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, Search, Trash2 } from 'lucide-react';
import api, { getApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, EmptyState, ErrorMessage, Loading } from '../components/ui';
import { PageTitle } from './Dashboard';
import { useToast } from '../components/Toast';

export default function Records() {
  const { user } = useAuth(); const { notify } = useToast(); const [records, setRecords] = useState(null); const [search, setSearch] = useState(''); const [category, setCategory] = useState('ALL'); const [error, setError] = useState('');
  const load = () => api.get('/records').then(({ data }) => setRecords(data.records || [])).catch((e) => setError(getApiError(e)));
  useEffect(() => {
    load();
  }, []);
  const filtered = useMemo(() => (records || []).filter((r) => `${r.title} ${r.category} ${r.description || ''}`.toLowerCase().includes(search.toLowerCase()) && (category === 'ALL' || r.category === category)), [records, search, category]);
  const download = async (record) => { try { const response = await api.get(`/records/${record.recordId}/download`, { responseType: 'blob' }); const url = URL.createObjectURL(response.data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = record.title; anchor.click(); URL.revokeObjectURL(url); notify('Document downloaded'); } catch (e) { notify(getApiError(e), 'error'); } };
  const remove = async (record) => { if (!window.confirm(`Delete "${record.title}"? This cannot be undone.`)) return; try { await api.delete(`/records/${record.recordId}`); notify('Record deleted'); load(); } catch (e) { notify(getApiError(e), 'error'); } };
  return <PageTitle title="Medical records" subtitle={user.role === 'PATIENT' ? 'Your encrypted health documents.' : 'Records shared with you by patients.'}><ErrorMessage message={error} /><Card><div className="toolbar"><div className="search-box"><Search size={17} /><input placeholder="Search records…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="ALL">All categories</option>{['Prescription', 'Blood Report', 'MRI', 'X-ray', 'Lab Report', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></div>{records === null ? <Loading /> : filtered.length ? <div className="table-wrap"><table><thead><tr><th>Record</th><th>Category</th><th>Uploaded</th><th>Security</th><th /></tr></thead><tbody>{filtered.map((record) => <tr key={record.recordId}><td><div className="table-primary"><div className="table-icon"><FileText size={16} /></div><div><strong>{record.title}</strong><span>{record.recordId.slice(0, 16)}…</span></div></div></td><td>{record.category}</td><td>{new Date(record.createdAt).toLocaleDateString()}</td><td><Badge tone="secure">Encrypted</Badge></td><td><div className="row-actions"><button title="View details" onClick={() => notify(record.description || 'No description available', 'info')}><Eye size={16} /></button><button title="Download" onClick={() => download(record)}><Download size={16} /></button>{user.role === 'PATIENT' && <button title="Delete" onClick={() => remove(record)}><Trash2 size={16} /></button>}</div></td></tr>)}</tbody></table></div> : <EmptyState icon={FileText} title="No matching records" description={search || category !== 'ALL' ? 'Try adjusting your filters.' : 'There are no records available yet.'} />}</Card></PageTitle>;
}
