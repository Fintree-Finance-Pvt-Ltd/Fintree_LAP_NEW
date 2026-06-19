export default function ApplicationSummary({ application }) {
  return <div className="grid gap-3 text-sm md:grid-cols-3"><span>Stage: {application?.stage}</span><span>Status: {application?.status}</span><span>Version: {application?.version}</span></div>;
}
