import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

export function ContactSection() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    empresa: 'Residencial',
    telefono: '',
    tipoSolucion: '',
    mensaje: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('¡Gracias! Tu mensaje ha sido enviado. Nos pondremos en contacto contigo pronto.');
    setFormData({
      nombre: '',
      correo: '',
      empresa: 'Residencial',
      telefono: '',
      tipoSolucion: '',
      mensaje: '',
    });
  };

  return (
    <Box
      id="contacto"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={0} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: { xs: 4, md: 6 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
                  Solicita una asesoría gratuita
                </Typography>
                <Typography variant="body1" sx={{ mb: 5, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.8 }}>
                  Déjanos tus datos y nuestro equipo te ayudará a encontrar la mejor solución en
                  purificación de agua para tu negocio o residencia. Responde unas breves preguntas para
                  brindarte la mejor opción personalizada.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Visítanos
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Blvr. Josemaría Escrivá de Balaguer 184, Villas Residencial, 83105 Hermosillo, Son.
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Envíanos un correo
                    </Typography>
                    <Typography
                      variant="body2"
                      component="a"
                      href="mailto:Ventas@tiwater.com.mx"
                      sx={{ color: 'rgba(255, 255, 255, 0.9)', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Ventas@tiwater.com.mx
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Contact us
                    </Typography>
                    <Typography
                      variant="body2"
                      component="a"
                      href="tel:+526624400662"
                      sx={{ color: 'rgba(255, 255, 255, 0.9)', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      +52 (662) 440 0662
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  mt: 4,
                  bgcolor: 'white',
                  borderRadius: 2,
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography sx={{ fontSize: 20 }}>💬</Typography>
                </Box>
                <Typography sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.95rem' }}>
                  ¡Cotiza sin compromiso y mejora tu calidad de vida hoy mismo!
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              sx={{ boxShadow: 3, height: '100%', borderRadius: 0 }}
            >
              <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    1
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ¡Cotiza sin compromiso y mejora tu calidad de vida hoy mismo!
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Correo"
                        name="correo"
                        type="email"
                        value={formData.correo}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Empresa"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        required
                      >
                        <MenuItem value="Residencial">Residencial</MenuItem>
                        <MenuItem value="Industria">Industria</MenuItem>
                        <MenuItem value="Comercial">Comercial</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Teléfono"
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Tipo de Solución"
                        name="tipoSolucion"
                        value={formData.tipoSolucion}
                        onChange={handleChange}
                      >
                        <MenuItem value="">Selecciona una opción</MenuItem>
                        <MenuItem value="Sistema de ósmosis inversa">
                          Sistema de ósmosis inversa
                        </MenuItem>
                        <MenuItem value="Filtración UV">Filtración UV</MenuItem>
                        <MenuItem value="Filtros de carbón activado">
                          Filtros de carbón activado
                        </MenuItem>
                        <MenuItem value="No estoy seguro, necesito asesoría">
                          No estoy seguro, necesito asesoría
                        </MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Cuéntanos"
                        name="mensaje"
                        value={formData.mensaje}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        sx={{
                          mt: 2,
                          background: 'linear-gradient(135deg, #0A7CFF 0%, #00BCD4 100%)',
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0062CC 0%, #008BA3 100%)',
                          },
                        }}
                      >
                        Enviar
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

