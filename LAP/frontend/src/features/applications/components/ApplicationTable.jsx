import { Link } from 'react-router-dom';
import DataTable from '../../../components/tables/DataTable.jsx';
import StatusChip from '../../../components/common/StatusChip.jsx';

export default function ApplicationTable({ rows = [] }) {
  return <DataTable rows={rows} columns={[{ key: 'applicationNumber', label: 'Application' }, { key: 'customerName', label: 'Customer' }, { key: 'stage', label: 'Stage' }, { key: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> }, { key: 'id', label: 'Action', render: (row) => <Link className="font-semibold text-[#0f3d66]" to={`/applications/${row.id}`}>Open</Link> }]} />;
}
