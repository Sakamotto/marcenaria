import { Response } from 'express';
import prisma from '../db';

export const getTasks = async (req: any, res: Response) => {
  const { projectId, completed, dueDateStart, dueDateEnd } = req.query;
  try {
    const where: any = {
      project: {
        client: {
          tenantId: req.user.tenantId
        }
      }
    };
    if (projectId) {
      where.projectId = parseInt(String(projectId));
    }
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }
    if (dueDateStart || dueDateEnd) {
      where.dueDate = {};
      if (dueDateStart) {
        where.dueDate.gte = new Date(String(dueDateStart));
      }
      if (dueDateEnd) {
        where.dueDate.lte = new Date(String(dueDateEnd));
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            name: true,
            client: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    return res.json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar tarefas.' });
  }
};

export const getTaskById = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: {
          client: {
            tenantId: req.user.tenantId
          }
        }
      },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    return res.json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar tarefa.' });
  }
};

export const createTask = async (req: any, res: Response) => {
  const { projectId, title, description, dueDate } = req.body;

  if (!projectId || !title) {
    return res.status(400).json({ error: 'ID do projeto e título da tarefa são obrigatórios.' });
  }

  try {
    // Valida se o projeto pertence à marcenaria do usuário
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        client: {
          tenantId: req.user.tenantId
        }
      }
    });

    if (!project) {
      return res.status(403).json({ error: 'Acesso negado ao projeto.' });
    }

    const task = await prisma.task.create({
      data: {
        projectId: parseInt(projectId),
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return res.status(201).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
};

export const updateTask = async (req: any, res: Response) => {
  const { id } = req.params;
  const { title, description, dueDate, completed } = req.body;

  try {
    const taskExists = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: {
          client: {
            tenantId: req.user.tenantId
          }
        }
      }
    });

    if (!taskExists) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: completed !== undefined ? completed : undefined,
      },
    });
    return res.json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
};

export const toggleTask = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const currentTask = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: {
          client: {
            tenantId: req.user.tenantId
          }
        }
      },
    });

    if (!currentTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const task = await prisma.task.update({
      where: { id: currentTask.id },
      data: { completed: !currentTask.completed },
    });

    return res.json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao alternar status da tarefa.' });
  }
};

export const deleteTask = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const taskExists = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: {
          client: {
            tenantId: req.user.tenantId
          }
        }
      }
    });

    if (!taskExists) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    await prisma.task.delete({
      where: { id: parseInt(id) },
    });
    return res.json({ message: 'Tarefa deletada com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar tarefa.' });
  }
};
