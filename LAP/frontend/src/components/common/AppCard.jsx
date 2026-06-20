import { Card } from '../../components/ui/card.jsx';

export default function AppCard({ children, className = '' }) {
  return (
    <Card className={`p-5 ${className}`}>{children}</Card>
  );
}

