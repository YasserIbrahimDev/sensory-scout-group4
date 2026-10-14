import { NavLink } from 'react-router-dom';
import { Heart, Home, Map, MapPin, Search, Settings, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/profile', label: 'Profile', icon: User },
];

function NavItemLink({ to, label, icon: Icon }: NavItem) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
      >
        <Icon className="nav-link__icon" aria-hidden="true" />
        <span className="nav-link__label">{label}</span>
      </NavLink>
    </li>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand" aria-label="Sensory Scout home">
        <MapPin className="brand__icon" aria-hidden="true" />
        <span className="brand__name">
          Sensory <span className="brand__accent">Scout</span>
        </span>
      </NavLink>

      <nav className="sidebar__nav" aria-label="Main">
        <ul className="nav-list">
          {mainNav.map((item) => (
            <NavItemLink key={item.to} {...item} />
          ))}
        </ul>
        <ul className="nav-list nav-list--bottom">
          <NavItemLink to="/settings" label="Settings" icon={Settings} />
        </ul>
      </nav>
    </aside>
  );
}
