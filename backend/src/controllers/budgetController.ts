import { Request, Response } from 'express';
import prisma from '../db';

export const getBudgetsByProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  try {
    const budgets = await prisma.budget.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(budgets);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar orçamentos.' });
  }
};

export const getBudgetById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado.' });
    }

    return res.json(budget);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar orçamento.' });
  }
};

export const createBudget = async (req: Request, res: Response) => {
  const { projectId, version, items, notes } = req.body;

  if (!projectId || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'ID do projeto e itens do orçamento são obrigatórios.' });
  }

  try {
    // Calcula o total geral somando quantidade * valor unitário
    let computedTotal = 0;
    const mappedItems = items.map((item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitValue = parseFloat(item.unitValue) || 0;
      const totalValue = quantity * unitValue;
      computedTotal += totalValue;
      return {
        description: item.description || '',
        quantity,
        unitValue,
        totalValue,
      };
    });

    // Auto-geração da versão caso não fornecida
    let finalVersion = version;
    if (!finalVersion) {
      const count = await prisma.budget.count({
        where: { projectId: parseInt(projectId) },
      });
      finalVersion = `V${count + 1}`;
    }

    const budget = await prisma.budget.create({
      data: {
        projectId: parseInt(projectId),
        version: finalVersion,
        items: mappedItems,
        totalValue: computedTotal,
        notes,
      },
    });

    return res.status(201).json(budget);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar orçamento.' });
  }
};

export const cloneBudget = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const sourceBudget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
    });

    if (!sourceBudget) {
      return res.status(404).json({ error: 'Orçamento original não encontrado.' });
    }

    const count = await prisma.budget.count({
      where: { projectId: sourceBudget.projectId },
    });

    const cloned = await prisma.budget.create({
      data: {
        projectId: sourceBudget.projectId,
        version: `V${count + 1}`,
        items: sourceBudget.items as any,
        totalValue: sourceBudget.totalValue,
        notes: sourceBudget.notes ? `Cópia de ${sourceBudget.version}. ${sourceBudget.notes}` : `Cópia de ${sourceBudget.version}`,
      },
    });

    return res.status(201).json(cloned);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao clonar orçamento.' });
  }
};

export const approveBudget = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado.' });
    }

    // Executa em transação para garantir integridade
    const [updatedBudget] = await prisma.$transaction([
      prisma.budget.update({
        where: { id: budget.id },
        data: { approved: true },
      }),
      prisma.budget.updateMany({
        where: {
          projectId: budget.projectId,
          id: { not: budget.id },
        },
        data: { approved: false },
      }),
      prisma.project.update({
        where: { id: budget.projectId },
        data: {
          totalValue: budget.totalValue,
          status: 'Aprovado', // Move automaticamente o projeto para a etapa Aprovado
        },
      }),
    ]);

    return res.json(updatedBudget);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao aprovar orçamento.' });
  }
};

export const deleteBudget = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
    });

    if (!budget) {
      return res.status(404).json({ error: 'Orçamento não encontrado.' });
    }

    await prisma.budget.delete({
      where: { id: budget.id },
    });

    // Se o orçamento deletado era o aprovado, zera o valor total do projeto
    if (budget.approved) {
      await prisma.project.update({
        where: { id: budget.projectId },
        data: { totalValue: 0.0 },
      });
    }

    return res.json({ message: 'Orçamento deletado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar orçamento.' });
  }
};
