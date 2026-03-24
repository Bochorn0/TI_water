import { Box, Container, Typography, Grid, Button } from '@mui/material';
import { motion } from 'framer-motion';

export function Products() {
  return (
    <Box  
      id="productos"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  mb: 3,
                  color: 'text.primary',
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  fontWeight: 700,
                }}
              >
                Fabricamos una variedad de productos de alta calidad.
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  color: 'text.secondary',
                  lineHeight: 1.8,
                  mb: 4,
                }}
              >
                En Ti Water, nos especializamos en la fabricación de sistemas avanzados de purificación
                y accesorios de alta calidad. Diseñados para satisfacer las necesidades residenciales,
                comerciales e industriales, nuestros productos garantizan un agua más limpia, segura y
                con mejor sabor. Innovación y excelencia respaldan cada solución que ofrecemos.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
                href="#nosotros"
              >
                MAS SOBRE NOSOTROS
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              sx={{
                position: 'relative',
                height: { xs: 300, md: 400 },
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  textAlign: 'center',
                  p: 3,
                  zIndex: 1,
                }}
              >
                Especialistas en purificación de agua
              </Typography>
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

