import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const defaultConfig = {
  brand: 'Medicalshop Jaen',
  topText: 'Para profesionales de la salud y estudiantes',
  city: 'Jaen, Peru',
  heroTitle: 'Medicalshop Jaen',
  heroText: 'Uniformes, calzado, insumos, equipos medicos y mobiliario hospitalario con atencion directa por WhatsApp.',
  catalogTitle: 'Catalogo medico',
  catalogText: 'Filtra por producto, categoria y precio. Cada producto abre WhatsApp con el mensaje listo.',
  categoriesText: 'Cada familia tiene su propio espacio visual para ubicar rapidamente lo que necesitas.',
  aboutTitle: 'Tu salud tambien se viste bien',
  aboutText: 'Medicalshop Jaen atiende a profesionales y estudiantes con productos seleccionados por comodidad, durabilidad y presentacion profesional.',
  address: 'Calle Garcilaso de la Vega 714, Jaen.',
  phone: '932 122 822',
  whatsapp: '51932122822',
  specialty: 'productos medicos, ropa medica e insumos.',
  accent: '#0059b8'
};

const defaultProducts = [
  ['Uniforme medico azul','Uniformes medicos',89,'/assets/coleccion.jpeg'],
  ['Bata medica blanca','Mandiles y batas',95,'/assets/coleccion.jpeg'],
  ['Calzado medico','Calzado medico',75,'/assets/coleccion.jpeg'],
  ['Silla de ruedas','Sillas de ruedas',280,'/assets/equipos.jpeg'],
  ['Cama hospitalaria','Mobiliario hospitalario',950,'/assets/equipos.jpeg'],
  ['Insumos de curacion','Materiales e insumos medicos',35,'/assets/hero.png'],
  ['Baston de apoyo','Ayudas de movilidad',65,'/assets/equipos.jpeg'],
  ['Gorros y accesorios','Accesorios medicos',25,'/assets/coleccion.jpeg']
].map((p, i) => ({ id: i + 1, name: p[0], category: p[1], price: p[2], image: p[3] }));

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  body: JSON.stringify(body)
});

const secret = () => process.env.ADMIN_PASSWORD || '';
const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('hex');
const tokenFor = () => {
  const payload = JSON.stringify({ exp: Date.now() + 1000 * 60 * 60 * 12 });
  return Buffer.from(payload).toString('base64url') + '.' + sign(payload);
};
const verify = (token = '') => {
  if (!secret() || !token.includes('.')) return false;
  const [body, mac] = token.split('.');
  const payload = Buffer.from(body, 'base64url').toString('utf8');
  if (sign(payload) !== mac) return false;
  return JSON.parse(payload).exp > Date.now();
};

const store = () => getStore('medicalshop-content');
const readData = async () => {
  const existing = await store().get('site', { type: 'json' });
  return existing || { config: defaultConfig, products: defaultProducts, updatedAt: null };
};

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') return json(200, await readData());

    if (event.httpMethod === 'POST') {
      if (!secret()) return json(500, { error: 'ADMIN_PASSWORD no esta configurado en Netlify.' });
      const body = event.body ? JSON.parse(event.body) : {};
      if (body.password !== secret()) return json(401, { error: 'Clave incorrecta' });
      return json(200, { token: tokenFor() });
    }

    if (event.httpMethod === 'PUT') {
      const auth = event.headers.authorization || event.headers.Authorization || '';
      if (!verify(auth.replace('Bearer ', ''))) return json(401, { error: 'Sesion no autorizada' });
      const body = event.body ? JSON.parse(event.body) : {};
      const data = {
        config: { ...defaultConfig, ...(body.config || {}) },
        products: Array.isArray(body.products) ? body.products : defaultProducts,
        updatedAt: new Date().toISOString()
      };
      await store().setJSON('site', data);
      return json(200, data);
    }

    return json(405, { error: 'Metodo no permitido' });
  } catch (error) {
    return json(500, { error: error.message });
  }
};
