import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from 'src/auth/auth-context';
import {
  canManageTiwaterCatalog,
  canManageUsersAndRoles,
} from 'src/auth/permissions';

export function AccountMenu() {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showAdminTools = canManageTiwaterCatalog(user) || canManageUsersAndRoles(user);

  const handleClose = () => setAnchor(null);

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/');
  };

  if (!user) return null;

  const label = user.nombre?.trim() || user.email;
  const initial = (label[0] || '?').toUpperCase();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={user.email}>
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          size="small"
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open}
          sx={{ color: 'white' }}
        >
          <Avatar
            src={user.avatar?.startsWith('data:') || user.avatar?.startsWith('http') ? user.avatar : undefined}
            sx={{ width: 36, height: 36, bgcolor: 'primary.dark', fontSize: '0.9rem' }}
          >
            {initial}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        id="account-menu"
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user.email}
          </Typography>
          {user.role?.name && (
            <Typography variant="caption" color="text.secondary">
              Rol: {user.role.name}
            </Typography>
          )}
        </Box>
        <Divider />
        {showAdminTools && (
          <MenuItem component={Link} to="/admin" onClick={handleClose}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            Herramientas admin
          </MenuItem>
        )}
        <MenuItem component={Link} to="/admin/ajustes" onClick={handleClose}>
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          Mi cuenta
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}
