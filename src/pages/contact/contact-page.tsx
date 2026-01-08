import { Helmet } from 'react-helmet-async';
import { Header } from 'src/components/header';
import { Footer } from 'src/components/footer';
import { ContactSection } from 'src/components/contact-section';
import { Box, Container, Typography } from '@mui/material';
import contactBannerImage from '/assets/contact-banner.png';

export function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contáctanos - TI Water</title>
        <meta
          name="description"
          content="¿Tienes dudas o necesitas una asesoría? Contáctanos y te ayudaremos a encontrar la mejor solución en purificación de agua."
        />
      </Helmet>

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box component="main" sx={{ flex: 1, mt: '100px' }}>
          {/* Hero Section with Banner */}
          <Box
            sx={{
              position: 'relative',
              minHeight: { xs: '400px', md: '500px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: `url(${contactBannerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.4)',
              },
            }}
          >
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  textAlign: 'center',
                  mb: 4,
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                Contáctanos
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  color: 'white',
                  lineHeight: 1.8,
                  maxWidth: '700px',
                  mx: 'auto',
                  textAlign: 'center',
                  opacity: 0.95,
                }}
              >
                ¿Tienes dudas o necesitas una asesoría? Contáctanos y te ayudaremos a encontrar la mejor solución en
                purificación de agua.
              </Typography>
            </Container>
          </Box>

          <ContactSection />
        </Box>
        <Footer />
      </Box>
    </>
  );
}
