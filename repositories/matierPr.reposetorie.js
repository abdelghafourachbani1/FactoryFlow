import MatierPr from '../models/matierPr.model.js';

export async function createMatierPrrep(data) {
    let {name,referance,unit,stockQuantity } = data
    let matier = await MatierPr.create({name,referance,unit, stockQuantity})
    return matier
}

export async function allmatierPrrep() {
    let matiers = await MatierPr.find({});
    return matiers;
}

export async function matierPrByIdrep(id) {
    let matier = await MatierPr.findOne({_id : id});
    return matier;
}

export async function matierPrByRefrep(ref) {
    let matier = await MatierPr.findOne({referance : ref});
    return matier;
}

export async function deleteMatierrep(id) {
    let matier = await MatierPr.deleteOne({_id : id});
    return matier;
}

export async function updatMatierrep(id,data) {
    let {name,referance,unit,stockQuantity } = data
    let matier = await MatierPr.findByIdAndUpdate(
        id, 
        { name, referance, unit, stockQuantity },
        { new: true } 
    );
    return matier;
}