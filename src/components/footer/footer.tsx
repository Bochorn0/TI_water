import { Box, Container, Typography, Grid, Link, TextField, Button } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#06153A',
        color: 'white',
        pt: 0,
        pb: 3,
      }}
    >
      {/* Newsletter Section */}
      <Box
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          py: 5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontSize: 24 }}>💧</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    ¡Mantente fresco con las novedades!
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Suscríbete para estar enterado de lo más reciente en la industria y de nuestras
                    promociones
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box component="form" sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="Enter Email Address"
                  variant="outlined"
                  size="small"
                  sx={{
                    flex: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                      },
                    },
                    '& input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.6)',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'secondary.main',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    px: 3,
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                    },
                  }}
                >
                  SIGN ME UP
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ pt: 6, mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1.5rem' }}>
              TI WATER
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                <FacebookIcon fontSize="small" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                <InstagramIcon fontSize="small" />
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Contacto
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
              Blvr. Josemaría Escrivá de Balaguer 184
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
              Villas Residencial, 83105 Hermosillo, Son.
            </Typography>
            <Typography
              variant="body2"
              component="a"
              href="mailto:Ventas@tiwater.com.mx"
              sx={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', display: 'block', mb: 1, '&:hover': { color: 'primary.light' } }}
            >
              Ventas@tiwater.com.mx
            </Typography>
            <Typography
              variant="body2"
              component="a"
              href="tel:+526624400662"
              sx={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', display: 'block', '&:hover': { color: 'primary.light' } }}
            >
              +52 (662) 440 0662
            </Typography>
          </Grid>

        </Grid>

        <Box
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            pt: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            © {new Date().getFullYear()} TI Water®
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

