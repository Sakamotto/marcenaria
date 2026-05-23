import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';

export const updateProfile = async (req: any, res: Response) => {
  const { name, email, password } = req.body;
  const userId = req.user.id;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  try {
    // Verifica e-mail duplicado
    const emailExists = await prisma.user.findFirst({
      where: { email, id: { not: userId } }
    });
    if (emailExists) {
      return res.status(400).json({ error: 'Este e-mail já está em uso por outro usuário.' });
    }

    const data: any = { name, email };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      }
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      include: { tenant: true }
    });

    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      tenantId: updatedUser.tenantId,
      tenantName: updatedUser.tenant.name
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil próprio:', error);
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

export const getUsers = async (req: any, res: Response) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }

  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.user.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    return res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
};

export const createUser = async (req: any, res: Response) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }

  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        tenantId: req.user.tenantId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
};

export const updateUser = async (req: any, res: Response) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }

  const { id } = req.params;
  const { name, email, password, role } = req.body;
  const targetUserId = parseInt(id);

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Nome, e-mail e papel são obrigatórios.' });
  }

  try {
    const userExists = await prisma.user.findFirst({
      where: { id: targetUserId, tenantId: req.user.tenantId }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Segurança: impede que o admin logado altere o próprio papel
    if (targetUserId === req.user.id && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Você não pode revogar seu próprio acesso de Administrador.' });
    }

    // Verifica e-mail duplicado
    const emailExists = await prisma.user.findFirst({
      where: { email, id: { not: targetUserId } }
    });
    if (emailExists) {
      return res.status(400).json({ error: 'Este e-mail já está em uso por outro usuário.' });
    }

    const data: any = { name, email, role };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      }
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(password, salt);
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
};

export const deleteUser = async (req: any, res: Response) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }

  const { id } = req.params;
  const targetUserId = parseInt(id);

  if (targetUserId === req.user.id) {
    return res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
  }

  try {
    const userExists = await prisma.user.findFirst({
      where: { id: targetUserId, tenantId: req.user.tenantId }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await prisma.user.delete({
      where: { id: targetUserId }
    });

    return res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
};
