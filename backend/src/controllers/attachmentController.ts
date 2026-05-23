import { Response } from 'express';
import prisma from '../db';
import { getSupabaseClient } from '../supabase';

export const uploadAttachment = async (req: any, res: Response) => {
  const { projectId, title } = req.body;
  const file = req.file;

  if (!projectId) {
    return res.status(400).json({ error: 'ID do projeto é obrigatório.' });
  }

  if (!file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(400).json({
      error: 'Supabase Storage não configurado. Adicione SUPABASE_URL e SUPABASE_KEY válidos no arquivo backend/.env.',
    });
  }

  try {
    // Valida se o projeto pertence à marcenaria do usuário
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        client: {
          tenantId: req.user.tenantId
        }
      },
    });
    if (!project) {
      return res.status(403).json({ error: 'Acesso negado ao projeto.' });
    }

    // Cria um nome de arquivo único estruturado com o prefixo do tenant
    const timestamp = Date.now();
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `tenant_${req.user.tenantId}/project_${projectId}/${timestamp}_${cleanFileName}`;

    // Faz upload para o bucket 'crm-marcenaria-files'
    const { data, error } = await supabase.storage
      .from('crm-marcenaria-files')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Erro de upload Supabase:', error);
      return res.status(500).json({ error: `Erro no upload do Supabase: ${error.message}` });
    }

    // Obtém a URL pública do arquivo (usada como referência para extrairmos o caminho depois)
    const { data: publicUrlData } = supabase.storage
      .from('crm-marcenaria-files')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return res.status(500).json({ error: 'Falha ao obter URL pública do arquivo.' });
    }

    const publicUrl = publicUrlData.publicUrl;

    // Registra o anexo no banco de dados
    const attachment = await prisma.attachment.create({
      data: {
        projectId: parseInt(projectId),
        url: publicUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        title: title || file.originalname,
        size: file.size,
      },
    });

    return res.status(201).json(attachment);
  } catch (error) {
    console.error('Erro no upload de anexo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao salvar anexo.' });
  }
};

export const deleteAttachment = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: parseInt(id),
        project: {
          client: {
            tenantId: req.user.tenantId
          }
        }
      },
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado.' });
    }

    // Tenta deletar do Supabase Storage se estiver configurado
    const supabase = getSupabaseClient();
    if (supabase) {
      // Extrai o caminho do arquivo a partir da URL pública
      const bucketIndicator = '/crm-marcenaria-files/';
      const index = attachment.url.indexOf(bucketIndicator);
      if (index !== -1) {
        const filePath = attachment.url.substring(index + bucketIndicator.length);
        const { error } = await supabase.storage
          .from('crm-marcenaria-files')
          .remove([filePath]);

        if (error) {
          console.warn('Alerta: Não foi possível deletar arquivo do Supabase Storage:', error.message);
        }
      }
    }

    // Remove do banco de dados
    await prisma.attachment.delete({
      where: { id: attachment.id },
    });

    return res.json({ message: 'Anexo deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar anexo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao deletar anexo.' });
  }
};

export const downloadAttachment = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: parseInt(id),
        project: {
          client: {
            tenantId: req.user.tenantId
          }
        }
      },
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado.' });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(400).json({
        error: 'Supabase Storage não configurado. Adicione SUPABASE_URL e SUPABASE_KEY válidos no arquivo backend/.env.',
      });
    }

    // Extrai o caminho do arquivo a partir da URL guardada no banco
    const bucketIndicator = '/crm-marcenaria-files/';
    const index = attachment.url.indexOf(bucketIndicator);
    if (index === -1) {
      return res.status(400).json({ error: 'URL do anexo inválida ou malformada.' });
    }

    const filePath = attachment.url.substring(index + bucketIndicator.length);

    // Gera um link assinado curto (60 segundos)
    const { data, error } = await supabase.storage
      .from('crm-marcenaria-files')
      .createSignedUrl(filePath, 60);

    if (error || !data || !data.signedUrl) {
      console.error('Erro ao gerar Signed URL para download:', error);
      return res.status(500).json({ error: 'Erro ao gerar link de download do Supabase.' });
    }

    // Redireciona o navegador para o link assinado de curta duração
    return res.redirect(data.signedUrl);
  } catch (error) {
    console.error('Erro ao baixar anexo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao processar download.' });
  }
};
