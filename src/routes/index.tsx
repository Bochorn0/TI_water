import { Routes, Route } from 'react-router-dom';
import { HomePage } from 'src/pages/home';
import { AboutPage } from 'src/pages/about';
import { PurificadoresPage } from 'src/pages/purificadores';
import { ContactPage } from 'src/pages/contact';
import { CotizacionesPage } from 'src/pages/quotes';

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/purificadores" element={<PurificadoresPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/cotizaciones" element={<CotizacionesPage />} />
    </Routes>
  );
}

