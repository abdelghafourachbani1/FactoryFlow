import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMaterialRequirements, getAllOrdersService, startOrderService, createOrderService, completeOrderService } from '../services/ordreFabrication.service.js';
import { createAdminser } from '../services/admin.service.js';
import { createProductSer } from '../services/product.service.js';

function sessionHarness() {
  return { startTransaction() {}, async commitTransaction() {}, async abortTransaction() {}, endSession() {} };
}
function orderFixture(status = 'PLANIFIED') {
  return {
    _id: 'order-1', status, operator: { _id: 'operator-1' }, quantityToProduce: 10,
    compositionSnapshot: [
      { rawMaterial: 'steel-id', quantityRequiredPerUnit: 2 },
      { rawMaterial: 'oil-id', quantityRequiredPerUnit: 3 }
    ]
  };
}
const operator = { userId: 'operator-1', role: 'OPERATOR' };

test('calcule les besoins en multipliant la recette par la quantité commandée', () => {
  const order = {
    quantityToProduce: 10,
    compositionSnapshot: [
      { rawMaterial: 'acier-id', quantityRequiredPerUnit: 2 },
      { rawMaterial: { _id: 'solvant-id' }, quantityRequiredPerUnit: 3 }
    ]
  };
  assert.deepEqual(calculateMaterialRequirements(order), [
    { rawMaterial: 'acier-id', quantity: 20 },
    { rawMaterial: 'solvant-id', quantity: 30 }
  ]);
});

test('refuse une pagination invalide avant toute requête', async () => {
  await assert.rejects(getAllOrdersService({ page: '0', limit: '10' }), /Pagination invalide/);
  await assert.rejects(getAllOrdersService({ page: '1', limit: '101' }), /Pagination invalide/);
});

test('refuse un statut de filtre inconnu avant toute requête', async () => {
  await assert.rejects(getAllOrdersService({ status: 'BROKEN', page: 1, limit: 10 }), /Statut invalide/);
});

test('applique les filtres et pagination aux résultats du repository', async () => {
  let observed;
  const result = await getAllOrdersService({ status: 'PLANIFIED', product: '507f1f77bcf86cd799439011', page: '2', limit: '5' }, 'operator-1', async (filter, skip, limit) => {
    observed = { filter, skip, limit };
    return { orders: ['order'], total: 6 };
  });
  assert.deepEqual(observed, {
    filter: { operator: 'operator-1', status: 'PLANIFIED', product: '507f1f77bcf86cd799439011' },
    skip: 5,
    limit: 5
  });
  assert.equal(result.totalPages, 2);
  assert.deepEqual(result.data, ['order']);
});

test('crée un ordre avec un instantané indépendant de la recette produit', async () => {
  let persisted;
  const composition = [{ rawMaterial: { _id: '507f1f77bcf86cd799439011' }, quantityRequired: 2 }];
  await createOrderService({ product: '507f1f77bcf86cd799439012', operator: '507f1f77bcf86cd799439013', quantityToProduce: 10, plannedDate: '2026-12-01', reference: 'OF-1' }, {
    findProduct: async () => ({ composition }),
    findUser: async () => ({ role: 'OPERATOR' }),
    createOrder: async order => { persisted = order; return order; }
  });
  composition[0].quantityRequired = 999;
  assert.deepEqual(persisted.compositionSnapshot, [{ rawMaterial: '507f1f77bcf86cd799439011', quantityRequiredPerUnit: 2 }]);
});

test('un stock insuffisant ne provoque aucune déduction et annule la transaction', async () => {
  const session = sessionHarness();
  let aborts = 0, deductions = 0, movements = 0;
  session.abortTransaction = async () => { aborts++; };
  await assert.rejects(startOrderService('order-1', operator, {
    startSession: async () => session,
    findOrder: async () => orderFixture(),
    findMaterial: async id => ({ _id: id, name: id, stockQuantity: id === 'steel-id' ? 5 : 100 }),
    deductMaterial: async () => { deductions++; },
    recordMovement: async () => { movements++; }
  }), /Stock insuffisant/);
  assert.equal(deductions, 0);
  assert.equal(movements, 0);
  assert.equal(aborts, 1);
});

test('une erreur à l’écriture du mouvement abort la transaction', async () => {
  const session = sessionHarness();
  let aborted = false, deductions = 0;
  session.abortTransaction = async () => { aborted = true; };
  await assert.rejects(startOrderService('order-1', operator, {
    startSession: async () => session,
    findOrder: async () => orderFixture(),
    findMaterial: async id => ({ _id: id, name: id, stockQuantity: 100 }),
    deductMaterial: async () => { deductions++; return { _id: 'material' }; },
    recordMovement: async () => { throw new Error('write failed'); }
  }), /write failed/);
  assert.equal(deductions, 1);
  assert.equal(aborted, true);
});

test('un démarrage valide déduit chaque besoin et enregistre les mouvements une fois', async () => {
  const session = sessionHarness();
  const deducted = [], movements = [];
  const order = orderFixture();
  const result = await startOrderService('order-1', operator, {
    startSession: async () => session,
    findOrder: async () => order,
    findMaterial: async id => ({ _id: id, name: id, stockQuantity: 100 }),
    deductMaterial: async (id, quantity) => { deducted.push([id, quantity]); return { _id: id }; },
    recordMovement: async movement => movements.push(movement),
    changeStatus: async () => ({ modifiedCount: 1 })
  });
  assert.equal(result.status, 'IN_PROGRESS');
  assert.deepEqual(deducted, [['steel-id', 20], ['oil-id', 30]]);
  assert.deepEqual(movements.map(item => item.quantity), [20, 30]);
});

test('un second démarrage est refusé avant toute déduction', async () => {
  const session = sessionHarness();
  let deductions = 0;
  await assert.rejects(startOrderService('order-1', operator, {
    startSession: async () => session,
    findOrder: async () => orderFixture('IN_PROGRESS'),
    deductMaterial: async () => { deductions++; }
  }), /Statut actuel : IN_PROGRESS/);
  assert.equal(deductions, 0);
});

test('termine un ordre en cours et met à jour le stock fini dans la transaction', async () => {
  const session = sessionHarness();
  let added = 0, changedFrom = '', changedTo = '';
  const order = { _id: 'order-1', status: 'IN_PROGRESS', operator: { _id: 'operator-1' }, product: { _id: 'product-1' }, quantityToProduce: 10 };
  const result = await completeOrderService('order-1', operator, {
    startSession: async () => session,
    findOrder: async () => order,
    addFinishedProduct: async (id, quantity) => { added += quantity; return { _id: id }; },
    changeStatus: async (id, from, to) => { changedFrom = from; changedTo = to; return { modifiedCount: 1 }; }
  });
  assert.equal(result.status, 'COMPLETED');
  assert.equal(added, 10);
  assert.equal(changedFrom, 'IN_PROGRESS');
  assert.equal(changedTo, 'COMPLETED');
});

test('une seconde installation est refusée sans créer de compte', async () => {
  let installs = 0;
  await assert.rejects(createAdminser('Admin', 'admin@example.com', 'long-password', {
    isInstalled: async () => true,
    install: async () => { installs++; }
  }), /Application déjà installée/);
  assert.equal(installs, 0);
});

test('des données invalides à l’installation ne déclenchent pas le repository', async () => {
  let installs = 0;
  await assert.rejects(createAdminser('Admin', 'pas-une-adresse', 'password-long', {
    isInstalled: async () => false,
    install: async () => { installs++; }
  }), /adresse e-mail valide/);
  assert.equal(installs, 0);
});

test('une composition rejette les matières en doublon et les matières inconnues', async () => {
  let creates = 0;
  const dependencies = {
    findByReference: async () => null,
    findMaterial: async id => id === '507f1f77bcf86cd799439011' ? { _id: id } : null,
    createProduct: async data => { creates++; return data; }
  };
  const base = { name: 'Pièce test', reference: 'PIECE-TEST' };
  await assert.rejects(createProductSer({ ...base, composition: [
    { rawMaterial: '507f1f77bcf86cd799439011', quantityRequired: 1 },
    { rawMaterial: '507f1f77bcf86cd799439011', quantityRequired: 2 }
  ] }, dependencies), /en double/);
  await assert.rejects(createProductSer({ ...base, composition: [
    { rawMaterial: '507f1f77bcf86cd799439012', quantityRequired: 1 }
  ] }, dependencies), /introuvable/);
  assert.equal(creates, 0);
});
