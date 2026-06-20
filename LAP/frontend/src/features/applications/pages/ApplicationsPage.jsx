import { Button } from '../../../components/ui/button.jsx';

import { Link } from 'react-router-dom';
import AppCard from '../../../components/common/AppCard.jsx';
import AppLoader from '../../../components/common/AppLoader.jsx';
import PageHeader from '../../../components/common/PageHeader.jsx';
import ApplicationTable from '../components/ApplicationTable.jsx';
import { useApplications } from '../hooks/useApplications.js';

export default function ApplicationsPage() {
  const { data, isLoading } = useApplications();
  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="LAP-LIP origination pipeline"
        actions={
          <Button asChild variant="contained" size="sm">
            <Link to="/applications/create">Create</Link>
          </Button>
        }
      />
      <AppCard>
        {isLoading ? <AppLoader /> : <ApplicationTable rows={data?.data ?? []} />}
      </AppCard>
    </>
  );
}

