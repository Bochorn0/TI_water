import { Box, Container, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import FactoryIcon from '@mui/icons-material/Factory';
import { motion } from 'framer-motion';

const sectors = [
  {
    title: 'Residencial',
    icon: <HomeIcon sx={{ fontSize: 40, color: 'white' }} />,
    description:
      'Ofrecer soluciones de purificación de agua para hogares, mejorando la calidad del agua potable y protegiendo la salud de las familias.',
  },
  {
    title: 'Comercial',
    icon: <BusinessIcon sx={{ fontSize: 40, color: 'white' }} />,
    description:
      'Brindar sistemas personalizados para negocios como restaurantes, cafeterías, oficinas y hoteles, asegurando agua limpia y segura para sus operaciones y clientes.',
  },
  {
    title: 'Industrial',
    icon: <FactoryIcon sx={{ fontSize: 40, color: 'white' }} />,
    description:
      'Desarrollar soluciones especializadas para la industria manufacturera, de alimentos y bebidas, farmacéutica o cualquier sector que requiera agua pura para sus procesos.',
  },
];

export function Sectors() {
  return (
    <Box
      id="sectores"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#F0F7FF',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle, rgba(10, 124, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.5,
        },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {sectors.map((sector, index) => (
            <Grid item xs={12} md={4} key={sector.title}>
              <Card
                component={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-5px)',
                    transition: 'all 0.3s',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                  <Box
                    sx={{
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {sector.icon}
                    </Box>
                  </Box>
                  <Typography variant="h5" component="h3" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                    {sector.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                    {sector.description}
                  </Typography>
                  <Button
                    variant="text"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'white',
                      },
                    }}
                  >
                    MÁS INFORMACIÓN
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

