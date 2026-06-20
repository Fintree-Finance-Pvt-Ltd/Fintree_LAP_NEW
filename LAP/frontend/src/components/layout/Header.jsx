import { FaBars } from "react-icons/fa";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
      <button
        type="button"
        aria-label="menu"
        title="menu"
        className="rounded-md p-2 hover:bg-slate-100"
      >
        <FaBars />
      </button>
      <div className="text-sm font-semibold text-slate-600">
        NBFC Loan Origination System
      </div>
    </header>
  );
}

