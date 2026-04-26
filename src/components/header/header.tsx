import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useScrollTrigger,
  Slide,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import logoImage from '/assets/ti-water-logo.png';
import { Badge, Tooltip } from '@mui/material';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import { useAuth } from 'src/auth/auth-context';
import { useQuoteDraftOptional } from 'src/quote/quote-draft-context';
import { useAdminSidebarOpen } from 'src/components/admin/admin-sidebar-context';
import { AccountMenu } from './account-menu';

interface Props {
  window?: () => Window;
  children: React.ReactElement;
}

function HideOnScroll(props: Props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const quoteDraft = useQuoteDraftOptional();
  const quoteUnits = quoteDraft?.totalUnits ?? 0;
  const navigate = useNavigate();
  const location = useLocation();
  const openAdminSidebar = useAdminSidebarOpen();
  const isAdminPath = location.pathname.startsWith('/admin');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const menuItems = [
    { text: 'Nosotros', href: '/about' },
    { text: 'Purificadores de agua', href: '/purificadores' },
    { text: 'Catálogo', href: '/catalogo' },
    { text: 'Sectores', href: '/#sectores' },
    { text: 'Contacto', href: '/contact' },
  ];

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{ textAlign: 'center', width: 250, bgcolor: 'rgba(12, 16, 25, 0.95)', color: 'white', height: '100%' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Box
          component="img"
          src={logoImage}
          alt="TI Water"
          sx={{ height: 40, maxWidth: '100%' }}
        />
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {quoteUnits > 0 && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/cotizaciones" sx={{ color: 'primary.light' }}>
              <ListItemText primary={`Borrador de cotización (${quoteUnits})`} />
            </ListItemButton>
          </ListItem>
        )}
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.href}
              sx={{ textAlign: 'center', color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
            >
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ px: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {isAuthenticated ? (
          <>
            <Button fullWidth component={Link} to="/admin" sx={{ color: 'white' }}>
              Herramientas admin
            </Button>
            <Button fullWidth component={Link} to="/admin/ajustes" sx={{ color: 'white' }}>
              Mi cuenta
            </Button>
            <Button fullWidth onClick={handleLogout} sx={{ color: 'white' }}>
              Cerrar sesión
            </Button>
          </>
        ) : (
          <Button fullWidth component={Link} to="/login" sx={{ color: 'white' }}>
            Acceso admin
          </Button>
        )}
      </Box>
      <Button
        variant="contained"
        color="primary"
        component={Link}
        to="/cotizaciones"
        sx={{ m: 2, px: 3 }}
        fullWidth
      >
        ¡Cotiza!
      </Button>
    </Box>
  );

  return (
    <HideOnScroll>
      <AppBar position="fixed" sx={{ bgcolor: 'rgba(12, 16, 25, 0.95)', color: 'white', boxShadow: 1, minHeight: '100px' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1, minHeight: '100px' }}>
            <Box
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                flexGrow: { xs: 1, md: 0 },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src={logoImage}
                alt="TI Water"
                sx={{ height: 40, maxWidth: '100%' }}
              />
            </Box>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 4, gap: 2 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.href}
                  sx={{ color: 'white', fontWeight: 500, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Tooltip title="Productos añadidos a su cotización">
                <Badge color="error" badgeContent={quoteUnits} max={99} overlap="circular" invisible={quoteUnits === 0}>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/cotizaciones"
                    sx={{ fontWeight: 500, minWidth: 0 }}
                    startIcon={<RequestQuoteIcon sx={{ fontSize: 20 }} />}
                  >
                    Borrador{quoteUnits > 0 ? ` (${quoteUnits})` : ''}
                  </Button>
                </Badge>
              </Tooltip>
              <Button variant="contained" color="primary" component={Link} to="/cotizaciones" sx={{ px: 3 }}>
                ¡Cotiza!
              </Button>
              {isAuthenticated ? (
                <AccountMenu />
              ) : (
                <Button color="inherit" component={Link} to="/login" sx={{ fontWeight: 500 }}>
                  Admin
                </Button>
              )}
            </Box>

            <Box sx={{ ml: 'auto', display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5 }}>
              {isAdminPath && openAdminSidebar && (
                <IconButton
                  color="inherit"
                  aria-label="abrir menú del panel administración"
                  onClick={() => openAdminSidebar()}
                  sx={{ color: 'white' }}
                >
                  <ViewSidebarIcon />
                </IconButton>
              )}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerToggle}
                sx={{ color: 'white' }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          {drawer}
        </Drawer>
      </AppBar>
    </HideOnScroll>
  );
}
