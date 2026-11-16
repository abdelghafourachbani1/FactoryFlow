import { isInstalledRep, installRep } from '../repositories/admin.reposetorie.js';

export async function checkadmin() { return isInstalledRep(); }
export async function createAdminser(name, email, password, dependencies = {}) {
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8) {
    const error = new Error('Nom, adresse e-mail valide et mot de passe de 8 caractères minimum requis.'); error.statusCode = 400; throw error;
  }
  const installed = await (dependencies.isInstalled || isInstalledRep)();
  if (installed) { const error = new Error('Application déjà installée.'); error.statusCode = 409; throw error; }
  return (dependencies.install || installRep)(name.trim(), email.trim().toLowerCase(), password);
}
