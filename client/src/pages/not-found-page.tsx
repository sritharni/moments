import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">404</p>
        <h2>That page does not exist.</h2>
      </div>

      <p className="body-copy">
        The route could not be found. Head back to the home page and keep
        building from there.
      </p>

      <Link className="action-link" to="/">
        Return home
      </Link>
    </section>
  );
}
