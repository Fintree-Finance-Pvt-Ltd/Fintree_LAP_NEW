import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppCard from '../../../components/common/AppCard.jsx';
import PageHeader from '../../../components/common/PageHeader.jsx';
import ApplicationForm from '../components/ApplicationForm.jsx';
import { useCreateApplication } from '../hooks/useApplications.js';

export default function CreateApplicationPage() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();
  const mutation = useCreateApplication();
  const submit = (event) => {
    event.preventDefault();
    mutation.mutate(form, { onSuccess: (response) => navigate(`/applications/${response.data.id}`) });
  };
  return <><PageHeader title="Create application" /><AppCard><ApplicationForm value={form} onChange={setForm} onSubmit={submit} /></AppCard></>;
}
