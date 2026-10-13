import { createProductRep, allProductsRep, productByIdRep, productByRefRep, updateProductRep, deleteProductRep 
} from '../repositories/product.repository.js';
import { matierPrByIdrep } from '../repositories/matierPr.repository.js'; 

async function validateComposition(composition) {
    if (!composition || !Array.isArray(composition)) return;
    const seenIds = new Set();
    for (let item of composition) {
        if (seenIds.has(item.rawMaterial.toString())) {
            throw new Error(`La matière première ${item.rawMaterial} est en double dans la composition.`);
        }
        seenIds.add(item.rawMaterial.toString());

        const rawMatExists = await matierPrByIdrep(item.rawMaterial);
        if (!rawMatExists) {
            throw new Error(`Matière première introuvable avec l'ID : ${item.rawMaterial}`);
        }
    }
}

export async function createProductSer(data) {
    let { reference, composition } = data;

    let existing = await productByRefRep(reference);
    if (existing) {
        throw new Error("Cette référence de produit existe déjà.");
    }

    await validateComposition(composition);

    return await createProductRep(data);
}

export async function getAllProductsSer() {
    return await allProductsRep();
}

export async function getProductByIdSer(id) {
    let product = await productByIdRep(id);
    if (!product) {
        throw new Error("Produit introuvable.");
    }
    return product;
}

export async function updateProductSer(id, data) {
    await getProductByIdSer(id); 

    if (data.composition) {
        await validateComposition(data.composition);
    }

    return await updateProductRep(id, data);
}

export async function deleteProductSer(id) {
    await getProductByIdSer(id); 
    return await deleteProductRep(id);
}