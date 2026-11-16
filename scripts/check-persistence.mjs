const baseUrl = (process.env.FACTORYFLOW_URL || 'http://localhost:3000').replace(/\/$/, '');
const email = process.env.DEMO_ADMIN_EMAIL;
const password = process.env.DEMO_ADMIN_PASSWORD;
const orderReference = process.env.PERSISTENCE_ORDER_REFERENCE;
if (!email || !password || !orderReference) throw new Error('DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD et PERSISTENCE_ORDER_REFERENCE sont requis.');

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${path} (${response.status}): ${payload.message || 'requête échouée'}`);
  return payload;
}

const health = await request('/health');
if (health.database !== 'connected') throw new Error('MongoDB n’est pas reconnecté après redémarrage.');
const installation = await request('/installation/status');
if (!installation.isInstalled) throw new Error('Le marqueur d’installation n’a pas persisté.');
const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
const orders = await request('/orders?limit=100', { token: login.token });
if (!orders.data.some(order => order.reference === orderReference)) throw new Error(`L’ordre ${orderReference} n’a pas persisté.`);
console.log(`Persistance vérifiée : installation et ordre ${orderReference} retrouvés après redémarrage.`);
