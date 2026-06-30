import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppCard from '../../../components/common/AppCard.jsx';
import PageHeader from '../../../components/common/PageHeader.jsx';
import { dashboardApi } from '../dashboardApi.js';

const pipeline = [
  { stage: 'Lead', count: 18 },
  { stage: 'BM', count: 9 },
  { stage: 'Credit', count: 6 },
  { stage: 'Disb', count: 3 }
];

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.summary });
  return <><PageHeader title="Dashboard" subtitle="Pipeline health, collections and operational queues" /><div className="grid gap-4 md:grid-cols-4">{['Applications', 'BM Queue', 'Disbursements', 'Collections'].map((label, index) => <AppCard key={label}><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-bold text-[#0f3d66]">{index === 0 ? data?.meta?.total ?? 0 : pipeline[index]?.count ?? 0}</div></AppCard>)}</div><AppCard className="mt-4 h-80"><ResponsiveContainer><BarChart data={pipeline}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stage" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#0f8b8d" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></AppCard></>;
}
