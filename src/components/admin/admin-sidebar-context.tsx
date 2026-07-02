import { createContext, useContext } from 'react';

/** Set by `AdminLayout` so `Header` can open the admin drawer on small screens. */
export const AdminSidebarOpenContext = createContext<null | (() => void)>(null);

export function useAdminSidebarOpen() {
  return useContext(AdminSidebarOpenContext);
}
