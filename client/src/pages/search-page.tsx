import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchUsers } from '@/features/users/api/search-users';
import type { UserSearchResult } from '@/types/user';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchUsers(query);
      setResults(data);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-card">
      <div className="section-heading">
        <p className="eyebrow">Discover</p>
        <h2>Search people</h2>
      </div>

      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-row">
          <input
            className="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            autoComplete="off"
          />
          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {searched && results.length === 0 && (
        <div className="info-panel" style={{ marginTop: '1.5rem' }}>
          <h3>No users found</h3>
          <p>Try a different username.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="user-card-list">
          {results.map((user) => (
            <div className="user-card" key={user.id}>
              <div className="user-card__avatar">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="user-card__info">
                <strong>@{user.username}</strong>
                {user.bio && <span>{user.bio}</span>}
              </div>
              <Link className="user-card__action" to={`/profile/${user.id}`}>
                View profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
