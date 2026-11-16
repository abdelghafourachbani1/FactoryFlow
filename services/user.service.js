import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmailrep, createUserRep, findUserByIdRep } from '../repositories/user.reposetorie.js';

export async function loginService(email, password) {
  if (!email || !password) { const error = new Error('Email et mot de passe requis.'); error.statusCode = 400; throw error; }
  const user = await findUserByEmailrep(email.toLowerCase().trim());
  if (!user || !(await bcrypt.compare(password, user.password))) { const error = new Error('Email ou mot de passe invalide.'); error.statusCode = 401; throw error; }
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET doit être configuré.');
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}

export async function createOperatorService(data, role = 'OPERATOR') {
  const name = data.name?.trim(); const email = data.email?.trim().toLowerCase(); const password = data.password;
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8) { const error = new Error('Nom, email valide et mot de passe de 8 caractères minimum requis.'); error.statusCode = 400; throw error; }
  return createUserRep({ name, email, password, role });
}

export async function createAdminUserService(data) { return createOperatorService(data, 'ADMIN'); }

export async function getProfileService(userId) { return findUserByIdRep(userId); }
