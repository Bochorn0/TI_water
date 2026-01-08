import { Box, Container, Typography } from '@mui/material';

export function IntroSection() {
  return (
    <Box
      id="nosotros"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', maxWidth: '900px', mx: 'auto' }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 3,
              color: 'text.primary',
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            No importa dónde estés, el agua pura siempre debe ser una prioridad. Tenemos la
            solución ideal para ti.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

