import {createMatierPrrep,allmatierPrrep,matierPrByIdrep,matierPrByRefrep,deleteMatierrep,updatMatierrep, lowStockRep, hasMaterialReferencesRep, ensureMatierPrIndexesRep} from '../repositories/matierPr.reposetorie.js';
import mongoose from 'mongoose';
import { addMaterialStockInSession, createStockMovementInSession, listStockMovements } from '../repositories/stock.repository.js';

export async function createMatierPrSer(data, userId) {
    let {referance} = data;
    if (!data.name?.trim() || !referance?.trim() || !data.unit?.trim()) throw new Error('Nom, référence et unité sont obligatoires.');
    for (const key of ['stockQuantity', 'alertThreshold']) if (data[key] !== undefined && (!Number.isFinite(Number(data[key])) || Number(data[key]) < 0)) throw new Error(`${key} doit être un nombre positif ou nul.`);
    let matier = await matierPrByRefrep(referance)
    if(matier){
        const error = new Error("cette reference deja existe"); error.statusCode = 409; throw error;
    }else{
        await ensureMatierPrIndexesRep();
        const session = await mongoose.startSession();
        try {
            let matier;
            await session.withTransaction(async () => {
                matier = await createMatierPrrep(data, session);
                if (Number(data.stockQuantity || 0) > 0) await createStockMovementInSession({ rawMaterial: matier._id, type: 'ENTRY', quantity: Number(data.stockQuantity), user: userId }, session);
            });
            return matier;
        } finally { await session.endSession(); }
    }
}

export async function getAllMatierPrSer() {
    return await allmatierPrrep();
}

export async function getMatierPrByIdSer(id) {
    let matier = await matierPrByIdrep(id);
    if(matier == null){
        const error = new Error("matier n'exist pas"); error.statusCode = 404; throw error;
    }
    return matier;
}

export async function updateMatierPrSer(id, data) {
    await getMatierPrByIdSer(id);
    if ('stockQuantity' in data) throw new Error('Utilisez l’endpoint d’entrée de stock pour modifier la quantité disponible.');
    if (data.alertThreshold !== undefined && Number(data.alertThreshold) < 0) throw new Error('Le seuil doit être positif ou nul.');
    if (data.referance !== undefined) {
        const existing = await matierPrByRefrep(data.referance);
        if (existing && existing._id.toString() !== id) { const error = new Error('Cette référence matière existe déjà.'); error.statusCode = 409; throw error; }
    }
    return await updatMatierrep(id,data);
}

export async function deleteMatierPrSer(id) {
   await getMatierPrByIdSer(id);
   if (await hasMaterialReferencesRep(id)) { const error = new Error('Suppression impossible : cette matière est utilisée par une recette, un ordre ou un mouvement.'); error.statusCode = 409; throw error; }
   return await deleteMatierrep(id);
}

export async function addStockService(id, quantity, userId) {
    await getMatierPrByIdSer(id);
    if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
        throw new Error("la quantity doit etre more then zero");
    }
    const session = await mongoose.startSession();
    try {
        let updated;
        await session.withTransaction(async () => {
            updated = await addMaterialStockInSession(id, Number(quantity), session);
            await createStockMovementInSession({ rawMaterial: id, type: 'ENTRY', quantity: Number(quantity), user: userId }, session);
        });
        return updated;
    } finally { await session.endSession(); }
}

export async function getLowStockService() { return lowStockRep(); }
export async function getMovementsService(query = {}) {
    const filter = {};
    if (query.rawMaterial) {
        if (!mongoose.isValidObjectId(query.rawMaterial)) { const error = new Error('Identifiant de matière invalide.'); error.statusCode = 400; throw error; }
        filter.rawMaterial = query.rawMaterial;
    }
    if (query.type) {
        if (!['ENTRY', 'EXIT'].includes(query.type)) { const error = new Error('Type de mouvement invalide.'); error.statusCode = 400; throw error; }
        filter.type = query.type;
    }
    const limit = query.limit === undefined ? 100 : Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) { const error = new Error('La limite doit être comprise entre 1 et 500.'); error.statusCode = 400; throw error; }
    return listStockMovements(filter, limit);
}
