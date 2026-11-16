const baseUrl = (process.env.FACTORYFLOW_URL || 'http://localhost:3000').replace(/\/$/, '');
const email = process.env.DEMO_ADMIN_EMAIL;
const password = process.env.DEMO_ADMIN_PASSWORD;
const name = process.env.DEMO_ADMIN_NAME || 'Administrateur Démo';

async function request(path, { method = 'GET', token, body, expectedStatus } = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = await response.json();
  if (expectedStatus && response.status === expectedStatus) return result;
  if (!response.ok) throw new Error(`${method} ${path} (${response.status}): ${result.message || JSON.stringify(result)}`);
  if (expectedStatus) throw new Error(`${method} ${path}: statut attendu ${expectedStatus}, reçu ${response.status}`);
  return result;
}

const health = await request('/health');
if (health.database !== 'connected') throw new Error('MongoDB n’est pas connecté. Lancez Docker Compose et réessayez.');
const installation = await request('/installation/status');
if (!installation.isInstalled) {
  if (!email || !password) throw new Error('Définissez DEMO_ADMIN_EMAIL et DEMO_ADMIN_PASSWORD pour la première installation.');
  await request('/installation', { method: 'POST', body: { name, email, password } });
  console.log('Installation initiale et création du premier Admin terminées.');
}
if (!email || !password) throw new Error('Définissez DEMO_ADMIN_EMAIL et DEMO_ADMIN_PASSWORD pour vous connecter.');
const admin = (await request('/auth/login', { method: 'POST', body: { email, password } })).token;
await request('/installation', { method: 'POST', body: { name: 'Admin en double', email: `duplicate-${Date.now()}@example.test`, password: 'another-long-password' }, expectedStatus: 409 });

const suffix = Date.now().toString(36).toUpperCase();
const operatorEmail = `operateur-${suffix.toLowerCase()}@example.test`;
const operatorPassword = `Operateur-${suffix}-Safi!`;
const operator = (await request('/auth/users/operators', {
  method: 'POST', token: admin,
  body: { name: `Opérateur ${suffix}`, email: operatorEmail, password: operatorPassword }
})).data;
const material = (await request('/matierPr', {
  method: 'POST', token: admin,
  body: { name: `Acier démo ${suffix}`, referance: `DEMO-ACIER-${suffix}`, unit: 'kg', stockQuantity: 0, alertThreshold: 85 }
})).data;
await request(`/matierPr/${material._id}/stock`, { method: 'POST', token: admin, body: { quantity: 100 } });
const product = (await request('/products', {
  method: 'POST', token: admin,
  body: { name: `Pièce démo ${suffix}`, reference: `DEMO-PIECE-${suffix}`, composition: [{ rawMaterial: material._id, quantityRequired: 2 }] }
})).data;
const order = (await request('/orders', {
  method: 'POST', token: admin,
  body: { reference: `DEMO-OF-${suffix}`, product: product._id, operator: operator._id, quantityToProduce: 10, plannedDate: new Date(Date.now() + 86400000).toISOString() }
})).data;
const insufficientOrder = (await request('/orders', {
  method: 'POST', token: admin,
  body: { reference: `DEMO-OF-INSUFFISANT-${suffix}`, product: product._id, operator: operator._id, quantityToProduce: 1000, plannedDate: new Date(Date.now() + 86400000).toISOString() }
})).data;
await request(`/orders/${insufficientOrder._id}/start`, { method: 'POST', token: admin, expectedStatus: 409 });
const materialAfterRejectedStart = (await request(`/matierPr/${material._id}`, { token: admin })).data;
if (materialAfterRejectedStart.stockQuantity !== 100) throw new Error('Un ordre avec stock insuffisant a modifié le stock.');

const otherOperatorEmail = `autre-operateur-${suffix.toLowerCase()}@example.test`;
const otherOperatorPassword = `Autre-${suffix}-Safi!`;
await request('/auth/users/operators', { method: 'POST', token: admin, body: { name: `Autre opérateur ${suffix}`, email: otherOperatorEmail, password: otherOperatorPassword } });
const otherOperatorToken = (await request('/auth/login', { method: 'POST', body: { email: otherOperatorEmail, password: otherOperatorPassword } })).token;
await request(`/orders/${order._id}`, { token: otherOperatorToken, expectedStatus: 403 });
const otherOperatorOrders = await request('/orders', { token: otherOperatorToken });
if (otherOperatorOrders.data.some(item => String(item._id) === String(order._id))) throw new Error('Un opérateur voit l’ordre d’un autre opérateur.');

await request(`/products/${product._id}`, { method: 'PUT', token: admin, body: { composition: [{ rawMaterial: material._id, quantityRequired: 5 }] } });

const operatorToken = (await request('/auth/login', { method: 'POST', body: { email: operatorEmail, password: operatorPassword } })).token;
const assignedOrders = await request('/orders/mine', { token: operatorToken });
const started = await request(`/orders/${order._id}/start`, { method: 'POST', token: operatorToken });
await request(`/orders/${order._id}/start`, { method: 'POST', token: operatorToken, expectedStatus: 409 });
const materialAfterStart = (await request(`/matierPr/${material._id}`, { token: admin })).data;
const movements = await request('/matierPr/movements', { token: admin });
const alerts = await request('/matierPr/alerts', { token: admin });
const materialMovements = movements.data.filter(movement => String(movement.rawMaterial?._id || movement.rawMaterial) === String(material._id));
await request(`/orders/${order._id}/complete`, { method: 'POST', token: operatorToken });
const productAfterCompletion = (await request(`/products/${product._id}`, { token: admin })).data;
const history = await request('/orders/history', { token: operatorToken });

console.log(JSON.stringify({
  admin: email,
  operator: operatorEmail,
  assignedOrderCount: assignedOrders.data.length,
  insufficientStockRejectedWithoutDeduction: materialAfterRejectedStart.stockQuantity === 100,
  anotherOperatorWasDenied: !otherOperatorOrders.data.some(item => String(item._id) === String(order._id)),
  repeatedStartRejected: true,
  order: started.data.reference,
  rawMaterialStockAfterStart: materialAfterStart.stockQuantity,
  stockMovements: {
    entries: materialMovements.filter(movement => movement.type === 'ENTRY').length,
    exits: materialMovements.filter(movement => movement.type === 'EXIT').length
  },
  materialInLowStockAlerts: alerts.data.some(item => String(item._id) === String(material._id)),
  finishedProductStockAfterCompletion: productAfterCompletion.stockQuantity,
  operatorCompletedOrderCount: history.data.length
}, null, 2));
