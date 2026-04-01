import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordPublicSiteHit } from 'src/utils/site-visits';

/** Records one hit per browser session on first public route (not /admin). */
export function SiteVisitTracker() {
  const location = useLocation();

  useEffect(() => {
    recordPublicSiteHit();
  }, [location.pathname]);

  return null;
}
