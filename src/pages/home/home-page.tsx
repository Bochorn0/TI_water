import { Helmet } from 'react-helmet-async';
import { Header } from 'src/components/header';
import { Footer } from 'src/components/footer';
import { Hero } from 'src/components/hero';
import { IntroSection } from 'src/components/intro-section';
import { Sectors } from 'src/components/sectors';
import { Products } from 'src/components/products';
import { Testimonials } from 'src/components/testimonials';
import { ContactSection } from 'src/components/contact-section';
import { Box } from '@mui/material';

export function HomePage() {
  return (
    <>
      <Helmet>
        <title>TI Water - Agua pura, segura y confiable</title>
        <meta
          name="description"
          content="Tecnología innovadora en purificación de agua para garantizar calidad y bienestar. Soluciones residenciales, comerciales e industriales."
        />
      </Helmet>

      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box component="main" sx={{ flex: 1 }}>
          <Hero />
          <IntroSection />
          <Sectors />
          <Products />
          <Testimonials />
          <ContactSection />
        </Box>
        <Footer />
      </Box>
    </>
  );
}

