import PageHeader from '../../../components/common/PageHeader.jsx';
import AppCard from '../../../components/common/AppCard.jsx';

export default function PlaceholderPage({ title = 'Module' }) {
  return <><PageHeader title={title} subtitle="Module shell ready for feature implementation" /><AppCard>Workflow, list, form and approval surfaces will be built here.</AppCard></>;
}
