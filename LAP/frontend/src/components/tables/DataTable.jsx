import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

export default function DataTable({ columns = [], rows = [] }) {
  return <Table size="small"><TableHead><TableRow>{columns.map((column) => <TableCell key={column.key}>{column.label}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.id}>{columns.map((column) => <TableCell key={column.key}>{column.render ? column.render(row) : row[column.key]}</TableCell>)}</TableRow>)}</TableBody></Table>;
}
