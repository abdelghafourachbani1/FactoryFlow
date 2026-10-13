import {createMatierPrrep,allmatierPrrep,matierPrByIdrep,matierPrByRefrep,deleteMatierrep,updatMatierrep , incrementStockRep} from '../repositories/matierPr.reposetorie.js';

export async function createMatierPrSer(data) {
    let {referance} = data;
    let matier = await matierPrByRefrep(referance)
    if(matier){
        throw new Error("cette referance deja exist");
    }else{
        return await createMatierPrrep(data)
    }
}

export async function getAllMatierPrSer() {
    return await allmatierPrrep();
}

export async function getMatierPrByIdSer(id) {
    let matier = await matierPrByIdrep(id);
    if(matier == null){
        throw new Error("matier n'exist pas");
    }
    return matier;
}

export async function updateMatierPrSer(id, data) {
    await getMatierPrByIdSer(id);
    return await updatMatierrep(id,data);
}

export async function deleteMatierPrSer(id) {
   await getMatierPrByIdSer(id);
   return await deleteMatierrep(id);
}

export async function addStockService(id, quantity) {
    await getMatierPrByIdSer(id);
    if (!quantity || quantity <= 0) {
        throw new Error("la quantity doit etre more then zero");
    }
    return await incrementStockRep(id, quantity);
}