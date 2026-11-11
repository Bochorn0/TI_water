import { Box, Container, Typography, Button } from '@mui/material';
import AndroidIcon from '@mui/icons-material/Android';
import { motion } from 'framer-motion';
import heroImage from '/assets/hero-banner.jpg';
import { ANDROID_APP_DOWNLOAD_PATH } from 'src/constants/app-download';

export function Hero() {
  return (
    <Box
      id="hero"
      sx={{
        mt: '100px',
        pt: '500px',
        pb: { xs: 8, md: 12 },
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{
            textAlign: { xs: 'center', md: 'left' },
            maxWidth: { xs: '100%', md: '600px' },
            mx: { xs: 'auto', md: 0 },
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', md: '3.5rem' },
              fontWeight: 700,
              mb: 3,
              lineHeight: 1.2,
            }}
          >
            Agua pura, segura y confiable para tu hogar, negocio o industria
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', md: '1.25rem' },
              mb: 4,
              opacity: 0.95,
              fontWeight: 400,
            }}
          >
            Tecnología innovadora en purificación de agua para garantizar calidad y bienestar
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Button
              variant="contained"
              size="large"
              href="#contacto"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
                transition: 'all 0.3s',
              }}
            >
              ¡Cotizar un sistema!
            </Button>
            <Button
              variant="outlined"
              size="large"
              href={ANDROID_APP_DOWNLOAD_PATH}
              startIcon={<AndroidIcon />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.85)',
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                },
              }}
            >
              Descargar app
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

