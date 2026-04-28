import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

type NavLinkCardProps = {
  description: string;
  title: string;
  to: string;
  badge?: number;
};

export function NavLinkCard({ description, title, to, badge }: NavLinkCardProps) {
  const previousBadgeRef = useRef(badge ?? 0);
  const [isBadgePulsing, setIsBadgePulsing] = useState(false);

  useEffect(() => {
    const previous = previousBadgeRef.current;
    const current = badge ?? 0;

    if (current > previous && current > 0) {
      setIsBadgePulsing(true);
      const timeout = window.setTimeout(() => setIsBadgePulsing(false), 820);
      previousBadgeRef.current = current;
      return () => window.clearTimeout(timeout);
    }

    previousBadgeRef.current = current;
  }, [badge]);

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
          <span
            className={`nav-link-card__badge${
              isBadgePulsing ? ' nav-link-card__badge--pulse' : ''
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <small>{description}</small>
    </NavLink>
  );
}
