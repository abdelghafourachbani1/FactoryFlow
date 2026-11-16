import { createProductRep, allProductsRep, productByIdRep, productByRefRep, updateProductRep, deleteProductRep, productHasOrdersRep
} from '../repositories/product.repository.js';
import { matierPrByIdrep } from '../repositories/matierPr.reposetorie.js';
import mongoose from 'mongoose';

async function validateComposition(composition, findMaterial = matierPrByIdrep) {
    if (!Array.isArray(composition) || composition.length === 0) throw new Error('La composition doit contenir au moins une matière.');
    const seenIds = new Set();
    for (let item of composition) {
        if (!item?.rawMaterial || !mongoose.isValidObjectId(item.rawMaterial) || !Number.isFinite(Number(item.quantityRequired)) || Number(item.quantityRequired) <= 0) {
            throw new Error('Chaque composant doit référencer une matière existante et avoir une quantité strictement positive.');
        }
        if (seenIds.has(item.rawMaterial.toString())) {
            throw new Error(`La matière première ${item.rawMaterial} est en double dans la composition.`);
        }
        seenIds.add(item.rawMaterial.toString());

        const rawMatExists = await findMaterial(item.rawMaterial);
        if (!rawMatExists) {
            throw new Error(`Matière première introuvable avec l'ID : ${item.rawMaterial}`);
        }
    }
}

export async function createProductSer(data, dependencies = {}) {
    const findByReference = dependencies.findByReference || productByRefRep;
    const createProduct = dependencies.createProduct || createProductRep;
    const findMaterial = dependencies.findMaterial || matierPrByIdrep;
    let { reference, composition } = data;
    if (!data.name?.trim() || !reference?.trim()) throw new Error('Le nom et la référence du produit sont obligatoires.');
    if ('stockQuantity' in data) throw new Error('Le stock de produits finis est alimenté à la fin d’un ordre.');

    let existing = await findByReference(reference);
    if (existing) {
        const error = new Error("Cette référence de produit existe déjà."); error.statusCode = 409; throw error;
    }

    await validateComposition(composition, findMaterial);

    const productData = { name: data.name.trim(), reference: reference.trim(), composition };
    if (data.price !== undefined) productData.price = data.price;
    return createProduct(productData);
}

export async function getAllProductsSer() {
    return await allProductsRep();
}

export async function getProductByIdSer(id) {
    let product = await productByIdRep(id);
    if (!product) {
        const error = new Error("Produit introuvable."); error.statusCode = 404; throw error;
    }
    return product;
}

export async function updateProductSer(id, data) {
    await getProductByIdSer(id); 
    if ('stockQuantity' in data) throw new Error('Le stock de produits finis est modifié à la fin d’un ordre.');

    if (data.reference) {
        const existing = await productByRefRep(data.reference);
        if (existing && existing._id.toString() !== id) { const error = new Error('Cette référence de produit existe déjà.'); error.statusCode = 409; throw error; }
    }

    if (data.composition) {
        await validateComposition(data.composition);
    }
    const allowed = ['name', 'reference', 'composition', 'price'];
    if (Object.keys(data).some(key => !allowed.includes(key))) throw new Error('Champ de modification non autorisé.');
    if (data.name !== undefined && !data.name.trim()) throw new Error('Le nom du produit ne peut pas être vide.');
    const update = { ...data };
    if (update.name) update.name = update.name.trim();
    if (update.reference) update.reference = update.reference.trim();
    return await updateProductRep(id, update);
}

export async function deleteProductSer(id) {
    await getProductByIdSer(id); 
    if (await productHasOrdersRep(id)) { const error = new Error('Suppression impossible : des ordres de fabrication référencent ce produit.'); error.statusCode = 409; throw error; }
    return await deleteProductRep(id);
}
