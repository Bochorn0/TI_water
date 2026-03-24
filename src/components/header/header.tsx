import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import logoImage from '/assets/ti-water-logo.png';
import { useAuth } from 'src/auth/auth-context';
import { canManageTiwaterCatalog } from 'src/auth/permissions';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showAdminCatalog = canManageTiwaterCatalog(user);

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
      <Box sx={{ px: 2, pb: 1 }}>
        {showAdminCatalog ? (
          <>
            <Button
              fullWidth
              component={Link}
              to="/admin/catalogo"
              sx={{ color: 'white', mb: 1 }}
            >
              Catálogo (admin)
            </Button>
            <Button fullWidth onClick={handleLogout} sx={{ color: 'white', mb: 1 }}>
              Cerrar sesión
            </Button>
          </>
        ) : (
          <Button fullWidth component={Link} to="/login" sx={{ color: 'white', mb: 1 }}>
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

            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1,
              }}
            >
              {showAdminCatalog ? (
                <>
                  <Button color="inherit" component={Link} to="/admin/catalogo">
                    Catálogo
                  </Button>
                  <Button color="inherit" onClick={handleLogout}>
                    Salir
                  </Button>
                </>
              ) : (
                <Button color="inherit" component={Link} to="/login">
                  Admin
                </Button>
              )}
              <Button variant="contained" color="primary" component={Link} to="/cotizaciones" sx={{ px: 3 }}>
                ¡Cotiza!
              </Button>
            </Box>

            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ ml: 'auto', display: { md: 'none' }, color: 'white' }}
            >
              <MenuIcon />
            </IconButton>
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

