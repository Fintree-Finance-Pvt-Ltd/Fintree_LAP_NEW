import {
  useEffect,
  useState,
} from "react";

import {
  administrationApi,
} from "../administrationApi.js";

/*
 * Supports both possible Axios response shapes:
 *
 * response.data = [...]
 *
 * or:
 *
 * response.data = {
 *   success: true,
 *   data: [...]
 * }
 */
const extractResponseList = (
  response,
) => {
  if (
    Array.isArray(response?.data)
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.data,
    )
  ) {
    return response.data.data;
  }

  return [];
};

const getDisplayText = (
  value,
  fallback = "Not Assigned",
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const normalizedValue =
    String(value).trim();

  return normalizedValue ||
    fallback;
};

const formatUserCount = (
  value,
) => {
  const parsedValue =
    Number(value);

  const count =
    Number.isFinite(parsedValue)
      ? parsedValue
      : 0;

  return `${count} ${
    count === 1
      ? "user"
      : "users"
  }`;
};

const HubCard = ({
  hub,
}) => {
  return (
    <article className="administration-card">
      <div className="administration-card-heading">
        <h2>
          {getDisplayText(
            hub?.name,
            "Unnamed Hub",
          )}
        </h2>

        <span className="administration-title-line" />
      </div>

      <div className="administration-card-body">
        <div className="administration-detail-row">
          <span className="administration-detail-label">
            ASM
          </span>

          <strong className="administration-detail-value">
            {getDisplayText(
              hub?.asm,
            )}
          </strong>
        </div>

        <div className="administration-detail-row">
          <span className="administration-detail-label">
            ACM
          </span>

          <strong className="administration-detail-value">
            {getDisplayText(
              hub?.acm,
            )}
          </strong>
        </div>

        <div className="administration-detail-row">
          <span className="administration-detail-label">
            Linked Spokes
          </span>

          <strong className="administration-detail-value">
            {Number(
              hub?.linkedSpokesCount ??
                0,
            )}
          </strong>
        </div>

        <div className="administration-detail-row">
          <span className="administration-detail-label">
            Credit Team
          </span>

          <strong className="administration-detail-value">
            {formatUserCount(
              hub?.creditTeamCount,
            )}
          </strong>
        </div>

        <div className="administration-detail-row">
          <span className="administration-detail-label">
            Operations
          </span>

          <strong className="administration-detail-value">
            {formatUserCount(
              hub?.operationsCount,
            )}
          </strong>
        </div>
      </div>
    </article>
  );
};

const SpokeCard = ({
  spoke,
}) => {
  const coverageRadius =
    spoke?.coverageRadiusKm !==
      null &&
    spoke?.coverageRadiusKm !==
      undefined &&
    spoke?.coverageRadiusKm !==
      ""
      ? `${spoke.coverageRadiusKm} KM`
      : "Not Available";

  return (
    <article className="administration-card">
      <div className="administration-card-heading">
        <h2>
          {getDisplayText(
            spoke?.name,
            "Unnamed Spoke",
          )}
        </h2>

        <span className="administration-title-line" />
      </div>

      <div className="administration-card-body">
        <div className="administration-detail-row">
          <span className="administration-detail-label">
            BM
          </span>

          <strong className="administration-detail-value">
            {formatUserCount(
              spoke?.bmCount,
            )}
          </strong>
        </div>

        <div className="administration-detail-row">
          <span className="administration-detail-label">
            CM
          </span>

          <strong className="administration-detail-value">
            {formatUserCount(
              spoke?.cmCount,
            )}
          </strong>
        </div>

        <div className="administration-detail-row">
          <span className="administration-detail-label">
            RMs
          </span>

          <strong className="administration-detail-value">
            {formatUserCount(
              spoke?.rmCount,
            )}
          </strong>
        </div>

        <div className="administration-detail-row">
          <span className="administration-detail-label">
            Coverage Radius
          </span>

          <strong className="administration-detail-value">
            {coverageRadius}
          </strong>
        </div>

        <div className="administration-detail-row">
          <span className="administration-detail-label">
            Hub
          </span>

          <strong className="administration-detail-value">
            {getDisplayText(
              spoke?.hubName,
              "Not Available",
            )}
          </strong>
        </div>
      </div>
    </article>
  );
};

const LoadingCard = () => {
  return (
    <article className="administration-card administration-loading-card">
      <div className="administration-skeleton administration-skeleton-title" />

      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          className="administration-skeleton-row"
          key={index}
        >
          <div className="administration-skeleton administration-skeleton-label" />

          <div className="administration-skeleton administration-skeleton-value" />
        </div>
      ))}
    </article>
  );
};

const Administration = () => {
  const [
    hubs,
    setHubs,
  ] = useState([]);

  const [
    spokes,
    setSpokes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    reloadKey,
    setReloadKey,
  ] = useState(0);

  useEffect(() => {
    const controller =
      new AbortController();

    const fetchAdministrationData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            hubResponse,
            spokeResponse,
          ] = await Promise.all([
            administrationApi
              .getHubAdministration({
                signal:
                  controller.signal,
              }),

            administrationApi
              .getSpokeAdministration({
                signal:
                  controller.signal,
              }),
          ]);

          if (
            controller.signal.aborted
          ) {
            return;
          }

          setHubs(
            extractResponseList(
              hubResponse,
            ),
          );

          setSpokes(
            extractResponseList(
              spokeResponse,
            ),
          );
        } catch (
          requestError
        ) {
          if (
            controller.signal.aborted ||
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError"
          ) {
            return;
          }

          setError(
            requestError?.response
              ?.data?.message ||
              requestError?.message ||
              "Unable to fetch administration data.",
          );
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setLoading(false);
          }
        }
      };

    fetchAdministrationData();

    return () => {
      controller.abort();
    };
  }, [
    reloadKey,
  ]);

  const hasAdministrationData =
    hubs.length > 0 ||
    spokes.length > 0;

  return (
    <>
      <style>
        {`
          .administration-page {
            width: 100%;
            min-height: 100%;
            padding: 24px;
            background:
              radial-gradient(
                circle at top right,
                rgba(31, 194, 191, 0.08),
                transparent 28%
              ),
              #f5f7fc;
            color: #152d58;
            box-sizing: border-box;
          }

          .administration-hero {
            position: relative;
            min-height: 118px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 26px 28px;
            margin-bottom: 20px;
            overflow: hidden;
            border-radius: 24px;
            background:
              linear-gradient(
                110deg,
                #6455e8 0%,
                #4a54c5 45%,
                #27bcb8 100%
              );
            box-shadow:
              0 16px 40px
              rgba(48, 64, 154, 0.2);
          }

          .administration-hero::before {
            content: "";
            position: absolute;
            width: 220px;
            height: 220px;
            left: -70px;
            top: -75px;
            border-radius: 50%;
            border:
              28px solid
              rgba(23, 219, 207, 0.42);
          }

          .administration-hero::after {
            content: "";
            position: absolute;
            width: 180px;
            height: 180px;
            right: -55px;
            bottom: -105px;
            border-radius: 50%;
            background:
              rgba(255, 255, 255, 0.08);
          }

          .administration-hero-content {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 16px;
            min-width: 0;
          }

          .administration-hero-icon {
            width: 50px;
            height: 50px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border:
              1px solid
              rgba(255, 255, 255, 0.35);
            border-radius: 15px;
            background:
              rgba(255, 255, 255, 0.13);
            box-shadow:
              inset 0 1px 0
              rgba(255, 255, 255, 0.2);
            color: #ffffff;
            font-size: 25px;
          }

          .administration-hero-text {
            min-width: 0;
          }

          .administration-hero h1 {
            margin: 0;
            color: #ffffff;
            font-size: clamp(
              23px,
              2vw,
              32px
            );
            font-weight: 800;
            line-height: 1.2;
            letter-spacing: -0.6px;
          }

          .administration-hero p {
            margin: 9px 0 0;
            color:
              rgba(255, 255, 255, 0.88);
            font-size: 14px;
            line-height: 1.5;
          }

          .administration-save-button {
            position: relative;
            z-index: 1;
            min-height: 42px;
            padding: 0 18px;
            flex-shrink: 0;
            border:
              1px solid
              rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            background:
              rgba(255, 255, 255, 0.16);
            color: #ffffff;
            font: inherit;
            font-size: 13px;
            font-weight: 700;
            cursor: not-allowed;
            opacity: 0.78;
          }

          .administration-error {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 16px;
            margin-bottom: 18px;
            border:
              1px solid
              #f3b8b8;
            border-radius: 14px;
            background: #fff3f3;
            color: #9d2525;
          }

          .administration-error p {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
          }

          .administration-retry-button {
            min-height: 36px;
            padding: 0 15px;
            border:
              1px solid
              #d44949;
            border-radius: 9px;
            background: #ffffff;
            color: #b22e2e;
            font: inherit;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
          }

          .administration-grid {
            display: grid;
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
            gap: 16px;
            align-items: stretch;
          }

          .administration-card {
            min-width: 0;
            min-height: 255px;
            padding: 23px 22px 18px;
            border:
              1px solid
              #dce4f2;
            border-radius: 20px;
            background:
              rgba(255, 255, 255, 0.96);
            box-shadow:
              0 10px 28px
              rgba(31, 52, 94, 0.07);
            box-sizing: border-box;
          }

          .administration-card-heading {
            margin-bottom: 11px;
          }

          .administration-card-heading h2 {
            margin: 0;
            overflow: hidden;
            color: #142e5c;
            font-size: 16px;
            font-weight: 800;
            line-height: 1.4;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .administration-title-line {
            display: block;
            width: 34px;
            height: 3px;
            margin-top: 8px;
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                #5658e8,
                #10b8bc
              );
          }

          .administration-card-body {
            width: 100%;
          }

          .administration-detail-row {
            min-height: 43px;
            display: grid;
            grid-template-columns:
              minmax(100px, 1fr)
              minmax(120px, 1.35fr);
            align-items: center;
            gap: 16px;
            border-bottom:
              1px solid
              #e8edf5;
          }

          .administration-detail-row:last-child {
            border-bottom: 0;
          }

          .administration-detail-label {
            color: #75839d;
            font-size: 13px;
            line-height: 1.4;
          }

          .administration-detail-value {
            min-width: 0;
            color: #183664;
            font-size: 13px;
            font-weight: 750;
            line-height: 1.4;
            text-align: right;
            overflow-wrap: anywhere;
          }

          .administration-empty-state {
            grid-column: 1 / -1;
            min-height: 230px;
            display: grid;
            place-items: center;
            padding: 30px;
            border:
              1px dashed
              #bdc9dc;
            border-radius: 20px;
            background:
              rgba(255, 255, 255, 0.75);
            text-align: center;
          }

          .administration-empty-state h2 {
            margin: 0 0 8px;
            color: #193862;
            font-size: 18px;
          }

          .administration-empty-state p {
            margin: 0;
            color: #76849c;
            font-size: 14px;
          }

          .administration-stage-section {
            margin-top: 18px;
            padding: 22px;
            border:
              1px solid
              #dce4f2;
            border-radius: 20px;
            background: #ffffff;
            box-shadow:
              0 10px 28px
              rgba(31, 52, 94, 0.06);
          }

          .administration-section-heading {
            margin-bottom: 14px;
          }

          .administration-section-heading h2 {
            margin: 0;
            color: #17335f;
            font-size: 17px;
            font-weight: 800;
          }

          .administration-table-wrapper {
            width: 100%;
            overflow-x: auto;
            border:
              1px solid
              #dce3f1;
            border-radius: 14px;
          }

          .administration-table {
            width: 100%;
            min-width: 760px;
            border-collapse: collapse;
          }

          .administration-table th {
            padding: 13px 14px;
            border-bottom:
              1px solid
              #cbd5e8;
            background: #f0f1ff;
            color: #5056b6;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.45px;
            text-align: left;
            text-transform: uppercase;
          }

          .administration-table td {
            padding: 18px 14px;
            color: #75839a;
            font-size: 13px;
            text-align: center;
          }

          .administration-loading-card {
            overflow: hidden;
          }

          .administration-skeleton {
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                #edf1f7 25%,
                #f8f9fc 50%,
                #edf1f7 75%
              );
            background-size: 200% 100%;
            animation:
              administrationSkeleton
              1.25s
              infinite linear;
          }

          .administration-skeleton-title {
            width: 42%;
            height: 18px;
            margin-bottom: 24px;
          }

          .administration-skeleton-row {
            min-height: 42px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            border-bottom:
              1px solid
              #edf0f5;
          }

          .administration-skeleton-label {
            width: 32%;
            height: 11px;
          }

          .administration-skeleton-value {
            width: 38%;
            height: 11px;
          }

          @keyframes administrationSkeleton {
            0% {
              background-position:
                200% 0;
            }

            100% {
              background-position:
                -200% 0;
            }
          }

          @media (
            max-width: 1200px
          ) {
            .administration-grid {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }
          }

          @media (
            max-width: 760px
          ) {
            .administration-page {
              padding: 14px;
            }

            .administration-hero {
              min-height: auto;
              align-items: flex-start;
              flex-direction: column;
              padding: 22px 18px;
              border-radius: 18px;
            }

            .administration-hero-content {
              align-items: flex-start;
            }

            .administration-save-button {
              width: 100%;
            }

            .administration-grid {
              grid-template-columns:
                minmax(0, 1fr);
            }

            .administration-card {
              min-height: auto;
              padding: 20px 17px 15px;
              border-radius: 16px;
            }

            .administration-detail-row {
              grid-template-columns:
                minmax(90px, 1fr)
                minmax(110px, 1.3fr);
              gap: 10px;
            }

            .administration-stage-section {
              padding: 17px;
              border-radius: 16px;
            }

            .administration-error {
              align-items: stretch;
              flex-direction: column;
            }
          }
        `}
      </style>

      <main className="administration-page">
        <header className="administration-hero">
          <div className="administration-hero-content">
            <div
              className="administration-hero-icon"
              aria-hidden="true"
            >
              ✦
            </div>

            <div className="administration-hero-text">
              <h1>
                Organisation &amp;
                Workflow Administration
              </h1>

              <p>
                Configure Hub &amp; Spoke
                mapping, roles, teams,
                authorities and stage
                ownership.
              </p>
            </div>
          </div>

          <button
            className="administration-save-button"
            type="button"
            disabled
            title="No save configuration API is currently configured."
          >
            Save Configuration
          </button>
        </header>

        {error && (
          <div
            className="administration-error"
            role="alert"
          >
            <p>{error}</p>

            <button
              className="administration-retry-button"
              type="button"
              onClick={() =>
                setReloadKey(
                  (previousValue) =>
                    previousValue + 1,
                )
              }
            >
              Retry
            </button>
          </div>
        )}

        <section
          className="administration-grid"
          aria-label="Hub and Spoke administration"
        >
          {loading &&
            Array.from({
              length: 3,
            }).map(
              (_, index) => (
                <LoadingCard
                  key={index}
                />
              ),
            )}

          {!loading &&
            !error &&
            hubs.map((hub) => (
              <HubCard
                key={`hub-${hub.id}`}
                hub={hub}
              />
            ))}

          {!loading &&
            !error &&
            spokes.map(
              (spoke) => (
                <SpokeCard
                  key={`spoke-${spoke.id}`}
                  spoke={spoke}
                />
              ),
            )}

          {!loading &&
            !error &&
            !hasAdministrationData && (
              <div className="administration-empty-state">
                <div>
                  <h2>
                    No administration
                    data found
                  </h2>

                  <p>
                    Create Hubs, Spokes
                    and assign users to
                    Spoke locations to
                    display data here.
                  </p>
                </div>
              </div>
            )}
        </section>


      </main>
    </>
  );
};

export default Administration;