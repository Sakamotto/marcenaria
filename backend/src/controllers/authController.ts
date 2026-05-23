import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    // Para simplificar o MVP, se não houver usuários cadastrados, cria um admin padrão.
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const defaultTenant = await prisma.tenant.create({
        data: { name: 'Marcenaria Padrão' }
      });
      await prisma.user.create({
        data: {
          name: 'Administrador Padrão',
          email: 'admin@marcenaria.com',
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: defaultTenant.id
        },
      });
      console.log('Usuário admin padrão criado: admin@marcenaria.com / admin123');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const secret = process.env.JWT_SECRET || 'super-secret-key-marcenaria-mvp';
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
      secret,
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

export const me = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        tenant: {
          select: { name: true }
        }
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { marcenariaName, name, email, password } = req.body;

  if (!marcenariaName || !name || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: marcenariaName }
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id
        }
      });

      return { user, tenant };
    });

    const secret = process.env.JWT_SECRET || 'super-secret-key-marcenaria-mvp';
    const token = jwt.sign(
      { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, tenantId: result.user.tenantId },
      secret,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.user.tenantId,
        tenantName: result.tenant.name,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name
      }
    });
  } catch (error) {
    console.error('Erro no autocadastro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
