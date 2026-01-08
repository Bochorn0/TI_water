import { Helmet } from 'react-helmet-async';
import { Header } from 'src/components/header';
import { Footer } from 'src/components/footer';
import { ContactSection } from 'src/components/contact-section';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ShieldIcon from '@mui/icons-material/Shield';
import StarIcon from '@mui/icons-material/Star';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MemoryIcon from '@mui/icons-material/Memory';
import logoImage from '/assets/ti-water-logo.png';
import tecnicoImage from '/assets/tecnico-chaleco-azul.jpg';
import especialistasImage from '/assets/somos-especialistas.jpg';

const values = [
  {
    title: 'Innovación continua',
    icon: <LightbulbIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    description: 'Aplicamos tecnología de vanguardia para garantizar agua pura y segura.',
  },
  {
    title: 'Compromiso con la calidad',
    icon: <CheckCircleIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    description: 'Cada producto y servicio cumple con los más altos estándares.',
  },
  {
    title: 'Sostenibilidad ambiental',
    icon: <WaterDropIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    description: 'Reducimos el impacto ambiental ofreciendo soluciones eficientes y responsables',
  },
  {
    title: 'Cercanía con nuestros clientes',
    icon: <HandshakeIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    description: 'Escuchamos, entendemos y diseñamos soluciones adaptadas a cada necesidad.',
  },
  {
    title: 'Transparencia y confianza',
    icon: <ShieldIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    description: 'Proporcionamos información clara y asesoría honesta en cada decisión.',
  },
  {
    title: 'Excelencia en el servicio',
    icon: <StarIcon sx={{ fontSize: 50, color: 'primary.main' }} />,
    description: 'Brindamos atención personalizada y soporte continuo para garantizar la mejor experiencia',
  },
];

const stats = [
  { number: '1200+', label: 'Sistemas de purificación instalados', icon: '💧' },
  { number: '12000 L', label: 'Agua filtrada por Ti Water', icon: '📦' },
  { number: '98%', label: 'Reducción de materiales malos', icon: '⚙️' },
];

const features = [
  {
    title: 'Soluciones personalizada',
    description: 'Adaptamos nuestros sistemas a las especificaciones de cada cliente.',
    icon: <EditIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
  },
  {
    title: 'Atención al Cliente 24/7',
    description: 'Siempre disponibles para resolver cualquier duda o inconveniente.',
    icon: <AccessTimeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
  },
  {
    title: 'Tecnología de Punta:',
    description: 'Usamos los métodos más avanzados en purificación de agua para asegurar eficiencia y calidad.',
    icon: <MemoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
  },
];

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Sobre Nosotros - TI Water</title>
        <meta
          name="description"
          content="En Ti Water, nos especializamos en ofrecer soluciones avanzadas de filtración de agua que mejoran la calidad del agua para necesidades residenciales y comerciales."
        />
      </Helmet>

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box component="main" sx={{ flex: 1, mt: '100px' }}>
          {/* Hero Section with Logo */}
          <Box
            sx={{
              position: 'relative',
              minHeight: { xs: '400px', md: '500px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: `url(${tecnicoImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <Box
              component="img"
              src={logoImage}
              alt="TI Water"
              sx={{
                position: 'relative',
                zIndex: 1,
                height: { xs: 150, md: 200 },
                opacity: 0.9,
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
              }}
            />
          </Box>

          {/* About Section with Text and Image */}
          <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
            <Container maxWidth="lg">
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      mb: 4,
                      fontWeight: 700,
                      color: 'primary.main',
                    }}
                  >
                    Sobre Nosotros
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      color: 'text.secondary',
                      lineHeight: 1.8,
                    }}
                  >
                    En Ti Water, nos especializamos en ofrecer soluciones avanzadas de filtración de agua que mejoran la
                    calidad del agua para necesidades residenciales y comerciales. Nuestros sistemas de filtración de última
                    tecnología eliminan impurezas como metales, cloro y productos químicos nocivos, asegurando que el agua
                    que consumes no solo sea más limpia, sino también tenga un mejor sabor. Estamos comprometidos con la
                    entrega de productos de alta calidad que promuevan la salud, ahorren costos y apoyen la sostenibilidad
                    al reducir la necesidad de agua embotellada. Con un enfoque en la innovación, confiabilidad y
                    satisfacción del cliente, Ti Water es tu aliado confiable para lograr soluciones de agua purificada.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    component="img"
                    src={especialistasImage}
                    alt="Somos especialistas en purificación de agua"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 2,
                      objectFit: 'contain',
                      boxShadow: 4,
                    }}
                  />
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* Values Section */}
          <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
            <Container maxWidth="lg">
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  textAlign: 'center',
                  mb: 6,
                  fontWeight: 700,
                  color: 'text.primary',
                }}
              >
                Nuestros Valores
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  textAlign: 'center',
                  mb: 6,
                  color: 'text.secondary',
                  fontSize: '1.125rem',
                  maxWidth: '700px',
                  mx: 'auto',
                }}
              >
                Compromiso, innovación y sostenibilidad en cada gota. Creemos en soluciones que transforman la calidad
                del agua y la vida de las personas.
              </Typography>

              <Grid container spacing={4}>
                {values.map((value, index) => (
                  <Grid item xs={12} sm={6} md={4} key={value.title}>
                    <Card
                      component={motion.div}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      sx={{
                        height: '100%',
                        textAlign: 'center',
                        boxShadow: 2,
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-5px)',
                          transition: 'all 0.3s',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>{value.icon}</Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                          {value.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {value.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* Stats Section */}
          <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#0099cc', color: 'white' }}>
            <Container maxWidth="lg">
              <Grid container spacing={4}>
                {stats.map((stat, index) => (
                  <Grid item xs={12} md={4} key={stat.label}>
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      <Typography sx={{ fontSize: 48, mb: 2 }}>{stat.icon}</Typography>
                      <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
                        {stat.number}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* Features Section */}
          <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
            <Container maxWidth="lg">
              <Grid container spacing={4}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={4} key={feature.title}>
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
                          transform: 'translateY(-5px)',
                          transition: 'all 0.3s',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          {feature.icon}
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {feature.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          <ContactSection />
        </Box>
        <Footer />
      </Box>
    </>
  );
}
