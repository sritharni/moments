export function HomePage() {
  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Starter stack</p>
        <h2>Vite + React + TypeScript + Router + Axios</h2>
      </div>

      <p className="body-copy">
        This frontend lives in <code>client/</code> so it stays separate from
        your NestJS backend. The app uses React Router for page structure and a
        shared Axios instance for API calls.
      </p>

      <div className="info-grid">
        <article className="info-panel">
          <h3>Routing</h3>
          <p>
            Routes are defined in <code>src/app/router.tsx</code> and rendered
            through a reusable app shell layout.
          </p>
        </article>

        <article className="info-panel">
          <h3>API layer</h3>
          <p>
            Axios is centralized in <code>src/services/api/client.ts</code> so
            interceptors and auth headers can be added in one place.
          </p>
        </article>

        <article className="info-panel">
          <h3>Scalable structure</h3>
          <p>
            Pages, layouts, shared components, and feature folders are already
            separated to keep future growth manageable.
          </p>
        </article>
      </div>
    </section>
  );
}
