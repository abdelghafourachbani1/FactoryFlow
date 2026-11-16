import User from '../models/user.model.js';
import Installation from '../models/installation.model.js';

export async function findAdmin() {
    let admin = await User.findOne({role : 'ADMIN'})
    return admin;
}

export async function createAdminrep(name,email,password) {
    let role = 'ADMIN';
    let newadmin = await User.create({name,email,password,role})
    return newadmin;
}

export async function isInstalledRep() { return Boolean(await Installation.exists({ key: 'installed' }) || await User.exists({ role: 'ADMIN' })); }
export async function installRep(name, email, password) {
    const session = await User.startSession();
    try {
        await Promise.all([Installation.init(), User.init()]);
        let created;
        await session.withTransaction(async () => {
            if (await Installation.exists({ key: 'installed' }).session(session) || await User.exists({ role: 'ADMIN' }).session(session)) {
                const error = new Error('Application déjà installée.'); error.statusCode = 409; throw error;
            }
            [created] = await User.create([{ name, email, password, role: 'ADMIN' }], { session });
            await Installation.create([{ key: 'installed' }], { session });
        });
        return created;
    } finally { await session.endSession(); }
}
