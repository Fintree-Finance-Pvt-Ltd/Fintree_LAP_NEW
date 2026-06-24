import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { applicationsApi } from "../../features/applications/applicationsApi.js";
import Header from "./Header.jsx";

function getApplicationIdFromRoute(params, searchState) {
  const idFromParams = params?.applicationId;
  if (idFromParams) return idFromParams;

  // fallback: sometimes navigation state may include an id
  const maybeId = searchState?.applicationId;
  return maybeId ?? null;
}

export default function HeaderContainer() {
  const location = useLocation();
  const params = useParams();

  const applicationId = getApplicationIdFromRoute(params, location?.state);

  const {
    data: appListResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["header-applications"],
    queryFn: () => applicationsApi.list(),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  const applicationList = useMemo(() => {
    const raw = appListResponse?.data;
    if (Array.isArray(raw)) return raw;
    // if backend ever returns { data: { ... } }
    return [];
  }, [appListResponse]);

  const currentApplication = useMemo(() => {
    if (!applicationId) return null;
    return applicationList.find((a) => String(a?.id) === String(applicationId)) || null;
  }, [applicationId, applicationList]);

  // Header expects these props.
  return (
    <Header
      currentApplication={currentApplication}
      onApplicationChange={() => {}}
      applicationList={applicationList}
      isLoading={isLoading}
      error={error}
    />
  );
}

