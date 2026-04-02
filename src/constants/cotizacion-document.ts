/** Datos del emisor en cotizaciones (panel y, si aplica, PDF/correo manual). Ajusta RFC y razón social reales. */
export const COTIZACION_EMISOR = {
  tradeMark: 'TI WATER',
  legalName: 'TI WATER — Soluciones en purificación de agua',
  rfc: '',
  /** Texto bajo totales (cuentas bancarias, condiciones). Usa \n para saltos. */
  footerLegal:
    'Precios sujetos a cambio sin previo aviso. Vigencia de cotización según acuerdo comercial.',
};

export const COTIZACION_LUGAR_DEFAULT = 'HERMOSILLO, SONORA';
export const COTIZACION_MONEDA = 'MXN';

/** Unidad por defecto si el producto no trae categoría útil */
export const COTIZACION_UNIDAD_DEFAULT = 'SERVICIO';
