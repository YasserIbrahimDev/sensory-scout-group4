import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Move focus to the main content on page change so screen reader
  // and keyboard users start at the top of the new page.
  // Also return to the top of the page, like a normal page load.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" className="app__main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
