import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import heroImage from '/assets/hero-banner.jpg';

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
        </Box>
      </Container>
    </Box>
  );
}

