import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Rating } from '@mui/material';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';

const testimonials = [
  {
    name: 'Maria Mendez',
    role: 'Gerente Cafeteria',
    comment:
      'Desde que instalé el purificador de Ti Water, el agua en mi hogar sabe increíble. Es un alivio saber que mi familia está consumiendo agua pura y saludable todos los días',
    rating: 5,
  },
  {
    name: 'Ernesto Camacho',
    role: 'Gerente cafeteria',
    comment:
      'El sistema de purificación ha hecho una gran diferencia en mi negocio. Ahora, mis clientes notan el sabor más limpio de nuestras bebidas y comidas. Excelente inversión.',
    rating: 5,
  },
  {
    name: 'Fernando Gutierrez',
    role: 'Dueño Gimnasio',
    comment:
      'El servicio de Ti Water es excepcional. Nuestros clientes siempre tienen agua purificada disponible, y eso nos distingue de la competencia.',
    rating: 4,
  },
  {
    name: 'Carolina Martinez',
    role: 'RH - Corporativo C',
    comment:
      'El servicio de mantenimiento es impecable, y el agua siempre es de calidad. Ti Water es la solución perfecta para nuestras necesidades diarias en la oficina',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: 'background.paper',
        background: 'linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: 'text.primary',
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          Algunos comentarios positivos que nos inspiran a seguir adelante 💧
        </Typography>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} sm={6} key={testimonial.name}>
              <Card
                component={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                sx={{
                  height: '100%',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-3px)',
                    transition: 'all 0.3s',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      mb: 3,
                      fontStyle: 'italic',
                      lineHeight: 1.8,
                    }}
                  >
                    "{testimonial.comment}"
                  </Typography>
                  <Box>
                    <Rating
                      value={testimonial.rating}
                      readOnly
                      sx={{
                        mb: 2,
                        '& .MuiRating-iconFilled': {
                          color: '#FFC107',
                        },
                      }}
                      icon={<StarIcon fontSize="inherit" />}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 50,
                          height: 50,
                        }}
                      >
                        {testimonial.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

