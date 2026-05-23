import { Response } from 'express';
import prisma from '../db';

export const getClients = async (req: any, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      where: { tenantId: req.user.tenantId },
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(clients);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
};

export const getClientById = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const client = await prisma.client.findFirst({
      where: { id: parseInt(id), tenantId: req.user.tenantId },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    return res.json(client);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar cliente.' });
  }
};

export const createClient = async (req: any, res: Response) => {
  const { name, phone, email, workAddress } = req.body;

  if (!name || !phone || !workAddress) {
    return res.status(400).json({ error: 'Nome, telefone e endereço da obra são obrigatórios.' });
  }

  try {
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email,
        workAddress,
        tenantId: req.user.tenantId
      },
    });
    return res.status(201).json(client);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar cliente.' });
  }
};

export const updateClient = async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, phone, email, workAddress } = req.body;

  try {
    const clientExists = await prisma.client.findFirst({
      where: { id: parseInt(id), tenantId: req.user.tenantId }
    });

    if (!clientExists) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: { name, phone, email, workAddress },
    });
    return res.json(client);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
};

export const deleteClient = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const clientExists = await prisma.client.findFirst({
      where: { id: parseInt(id), tenantId: req.user.tenantId }
    });

    if (!clientExists) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    await prisma.client.delete({
      where: { id: parseInt(id) },
    });
    return res.json({ message: 'Cliente deletado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar cliente.' });
  }
};
