import { Request, Response } from 'express';
import prisma from '../db';

export const handleAsaasWebhook = async (req: Request, res: Response) => {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedToken = req.headers['asaas-access-token'];

  // Validar token de acesso do Webhook para segurança
  if (webhookToken && receivedToken !== webhookToken) {
    console.warn('Alerta: Recebida chamada de Webhook com token inválido do Asaas.');
    return res.status(401).json({ error: 'Token de acesso inválido.' });
  }

  const { event, payment, subscription } = req.body;

  if (!event) {
    return res.status(400).json({ error: 'Evento do webhook não especificado.' });
  }

  // Eventos de interesse do faturamento do CRM
  const interestEvents = [
    'PAYMENT_RECEIVED',
    'PAYMENT_CONFIRMED',
    'PAYMENT_OVERDUE',
    'PAYMENT_DELETED',
    'SUBSCRIPTION_DELETED'
  ];

  if (!interestEvents.includes(event)) {
    console.log(`[Asaas Webhook] Evento ${event} recebido e ignorado.`);
    return res.json({ received: true, message: `Evento ${event} ignorado.` });
  }

  const customerId = payment?.customer || subscription?.customer;
  const subscriptionId = payment?.subscription || subscription?.id;

  if (!customerId) {
    return res.status(400).json({ error: 'Identificador de cliente (customer) não encontrado no payload.' });
  }

  console.log(`[Asaas Webhook] Recebido Evento: ${event} | Customer: ${customerId} | Subscription: ${subscriptionId}`);

  try {
    // Buscar o Tenant correspondente pelo asaasCustomerId
    const tenant = await prisma.tenant.findFirst({
      where: { asaasCustomerId: customerId }
    });

    if (!tenant) {
      console.warn(`[Asaas Webhook] Tenant não encontrado no sistema para o Customer ID: ${customerId}`);
      // Retorna 200 OK para que o Asaas pare de enviar tentativas de entrega
      return res.json({ received: true, message: 'Tenant não localizado no CRM.' });
    }

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      // Determinar plano pelo valor da cobrança
      // Solo: R$ 79.00 | Pro: R$ 149.00
      const paidValue = payment?.value || subscription?.value || 0;
      let plan = 'SOLO';
      if (paidValue >= 120.00) {
        plan = 'PRO';
      }

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          plan,
          trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Define data de trial distante apenas como fallback
        }
      });
      console.log(`[Asaas Webhook] Pagamento confirmado! Marcenaria "${tenant.name}" desbloqueada no plano ${plan}.`);

    } else if (event === 'PAYMENT_OVERDUE' || event === 'SUBSCRIPTION_DELETED' || event === 'PAYMENT_DELETED') {
      // Bloquear acesso do Tenant rebaixando para o TRIAL expirado
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          plan: 'TRIAL',
          trialEndsAt: new Date(0) // Expira imediatamente
        }
      });
      console.log(`[Asaas Webhook] Bloqueio efetuado! Marcenaria "${tenant.name}" bloqueada por falta de pagamento ou cancelamento.`);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Asaas Webhook] Erro ao processar webhook:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao processar webhook.' });
  }
};
