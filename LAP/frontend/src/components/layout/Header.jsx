import { IconButton } from '@mui/material';
import { Menu } from '@mui/icons-material';

export default function Header() {
  return <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4"><IconButton aria-label="menu"><Menu /></IconButton><div className="text-sm font-semibold text-slate-600">NBFC Loan Origination System</div></header>;
}
