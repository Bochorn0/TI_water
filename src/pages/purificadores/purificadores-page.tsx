import { Helmet } from 'react-helmet-async';
import { Header } from 'src/components/header';
import { Footer } from 'src/components/footer';
import { ContactSection } from 'src/components/contact-section';
import { Box, Container, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SavingsIcon from '@mui/icons-material/Savings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import mockupIphoneImage from '/assets/mockup-iphone.png';
import sistemaOsmosisImage from '/assets/sistema-osmosis.png';

const reasons = [
  {
    title: 'Agua Pura Siempre Disponible',
    description:
      'Disfruta de agua 100% filtrada y libre de impurezas en cualquier momento, sin depender de agua embotellada ni preocuparte por su calidad.',
    icon: <CheckCircleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
  },
  {
    title: 'Control Total desde tu Celular',
    description:
      'Monitorea en tiempo real la calidad del agua, la cantidad filtrada y el estado de los filtros con una app fácil de usar.',
    icon: <PhoneAndroidIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
  },
  {
    title: 'Ahorro Inteligente y Sostenible',
    description:
      'Reduce costos operativos y elimina el gasto en agua embotellada. Una inversión que se paga sola mientras cuidas el planeta.',
    icon: <SavingsIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
  },
  {
    title: 'Filtros Siempre en Óptimas Condiciones',
    description:
      'Recibe alertas sobre cuándo es momento de cambiar los filtros, asegurando que tu sistema funcione al máximo rendimiento sin interrupciones.',
    icon: <NotificationsActiveIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
  },
];


export function PurificadoresPage() {
  return (
    <>
      <Helmet>
        <title>Purificadores de Agua - TI Water</title>
        <meta
          name="description"
          content="Sistemas de ósmosis inversa de última tecnología para agua pura y segura. Control desde tu celular y filtros siempre en óptimas condiciones."
        />
      </Helmet>

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box component="main" sx={{ flex: 1, mt: '100px' }}>
          {/* Hero Section with Blue Background */}
          <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'primary.main', color: 'white' }}>
            <Container maxWidth="lg">
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      mb: 6,
                      fontWeight: 700,
                      color: 'white',
                      fontSize: { xs: '1.75rem', md: '2.5rem' },
                    }}
                  >
                    4 Razones para Elegir Ti Water Ósmosis Inversa
                  </Typography>

                  <Grid container spacing={4}>
                    {reasons.map((reason, index) => (
                      <Grid item xs={12} sm={6} key={reason.title}>
                        <Box
                          component={motion.div}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              mb: 1,
                              fontWeight: 700,
                              color: 'white',
                            }}
                          >
                            {reason.title}
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.8 }}>
                            {reason.description}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      component="img"
                      src={mockupIphoneImage}
                      alt="Mockup iPhone Ti Water App"
                      sx={{
                        width: { xs: 200, md: 300 },
                        height: 'auto',
                        maxWidth: '100%',
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* Product Section */}
          <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
            <Container maxWidth="lg">
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      component="img"
                      src={sistemaOsmosisImage}
                      alt="Sistema Ósmosis Inversa TI Water OI 400 GPD"
                      sx={{
                        width: '100%',
                        height: 'auto',
                        maxWidth: '100%',
                        borderRadius: 2,
                        boxShadow: 4,
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <Typography
                      variant="h4"
                      component="h2"
                      sx={{
                        mb: 2,
                        fontWeight: 700,
                        color: 'text.primary',
                      }}
                    >
                      OI 400 GPD
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 4,
                        color: 'text.secondary',
                      }}
                    >
                      Purificación de alto rendimiento para cualquier sector.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 1 }}>
                          <CheckCircleIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Filtración de 5 etapas
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', ml: 5 }}>
                          Sedimentos, carbón activado, membrana de ósmosis inversa y post-filtro.
                        </Typography>
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 1 }}>
                          <CheckCircleIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Elimina hasta el 99% de impurezas
                          </Typography>
                        </Box>
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 1 }}>
                          <CheckCircleIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Monitoreo en tiempo real
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', ml: 5 }}>
                          Compatible con sensores para medir TDS, calidad del agua y vida de tus filtros.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>

          {/* CTA Section with Video */}
          <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
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
                      variant="h3"
                      component="h2"
                      sx={{
                        mb: 2,
                        fontWeight: 700,
                        color: 'primary.main',
                      }}
                    >
                      Agua Pura, Sin Preocupaciones.
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 4,
                        color: 'text.secondary',
                      }}
                    >
                      Más Ahorro, Más Confianza
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '1rem', md: '1.125rem' },
                        color: 'text.secondary',
                        lineHeight: 1.8,
                      }}
                    >
                      Tu negocio o hogar merece más que un simple filtro. Merece un sistema inteligente que trabaja sin
                      descanso para brindarte agua libre de impurezas, reduciendo costos y eliminando preocupaciones. No solo
                      cuidas tu salud, también optimizas tu inversión y contribuyes a un planeta con menos residuos plásticos.
                      Es una solución que se paga sola: menos gastos, más confianza y una fuente inagotable de agua pura lista
                      para ti. Haz el cambio hoy y disfruta de la tranquilidad de saber que el agua que consumes es realmente
                      segura.
                    </Typography>
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
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 aspect ratio
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: 4,
                    }}
                  >
                    <iframe
                      src="https://www.youtube.com/embed/2WKe0TWd1r8?si=l1Y5i8xc5vJxYmav"
                      title="TI Water Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                      }}
                    />
                  </Box>
                </Grid>
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
