/** Right nav rail only at this width and above; below uses bottom nav */
export const DESKTOP_NAV_MIN_PX = 1300;

export const desktopNavMediaQuery = `(min-width: ${DESKTOP_NAV_MIN_PX}px)`;

/** For MUI `sx` object keys */
export const desktopNavSx = `@media ${desktopNavMediaQuery}` as const;
