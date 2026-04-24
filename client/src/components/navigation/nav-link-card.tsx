import { NavLink } from 'react-router-dom';

type NavLinkCardProps = {
  description: string;
  title: string;
  to: string;
  badge?: number;
};

export function NavLinkCard({ description, title, to, badge }: NavLinkCardProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-link-card${isActive ? ' nav-link-card--active' : ''}`
      }
    >
      <span className="nav-link-card__title-row">
        {title}
        {badge != null && badge > 0 && (
          <span className="nav-link-card__badge">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <small>{description}</small>
    </NavLink>
  );
}
