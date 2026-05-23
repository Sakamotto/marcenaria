import { Request, Response } from 'express';
import prisma from '../db';
import { getSupabaseClient } from '../supabase';

export const getProjects = async (req: Request, res: Response) => {
  const { status } = req.query;
  try {
    const where: any = {};
    if (status) {
      where.status = String(status);
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: { name: true, phone: true },
        },
        _count: {
          select: {
            tasks: { where: { completed: false } },
            budgets: true,
          },
        },
        budgets: {
          where: { approved: true },
          select: { id: true, totalValue: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(projects);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar projetos.' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        budgets: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    // Se o Supabase estiver configurado, assina temporariamente as URLs dos anexos (2 horas)
    const supabase = getSupabaseClient();
    if (supabase && project.attachments.length > 0) {
      const attachmentsWithSignedUrls = await Promise.all(
        project.attachments.map(async (att) => {
          const bucketIndicator = '/crm-marcenaria-files/';
          const index = att.url.indexOf(bucketIndicator);
          if (index !== -1) {
            const filePath = att.url.substring(index + bucketIndicator.length);
            try {
              const { data, error } = await supabase.storage
                .from('crm-marcenaria-files')
                .createSignedUrl(filePath, 7200); // 2 horas (7200 segundos)

              if (!error && data && data.signedUrl) {
                return {
                  ...att,
                  url: data.signedUrl,
                };
              }
            } catch (err) {
              console.warn(`Erro ao assinar URL do arquivo ${att.fileName}:`, err);
            }
          }
          return att;
        })
      );
      
      return res.json({
        ...project,
        attachments: attachmentsWithSignedUrls,
      });
    }

    return res.json(project);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar projeto.' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  const { clientId, name, description, status } = req.body;

  if (!clientId || !name) {
    return res.status(400).json({ error: 'Nome do projeto e ID do cliente são obrigatórios.' });
  }

  try {
    const project = await prisma.project.create({
      data: {
        clientId: parseInt(clientId),
        name,
        description,
        status: status || 'Lead',
      },
      include: {
        client: true,
      },
    });
    return res.status(201).json(project);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar projeto.' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  try {
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        status,
      },
    });
    return res.json(project);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
};

export const patchProjectStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status é obrigatório.' });
  }

  try {
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    return res.json(project);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar status do projeto.' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.project.delete({
      where: { id: parseInt(id) },
    });
    return res.json({ message: 'Projeto deletado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao deletar projeto.' });
  }
};
