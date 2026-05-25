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
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      const defaultTenant = await prisma.tenant.create({
        data: { 
          name: 'Marcenaria Padrão',
          plan: 'TRIAL',
          trialEndsAt: trialEndsAt
        }
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
        tenantPlan: user.tenant.plan,
        trialEndsAt: user.tenant.trialEndsAt,
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
          select: { 
            name: true,
            plan: true,
            trialEndsAt: true
          }
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
      tenantName: user.tenant.name,
      tenantPlan: user.tenant.plan,
      trialEndsAt: user.tenant.trialEndsAt
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
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      const tenant = await tx.tenant.create({
        data: { 
          name: marcenariaName,
          plan: 'TRIAL',
          trialEndsAt: trialEndsAt
        }
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
        tenantPlan: result.tenant.plan,
        trialEndsAt: result.tenant.trialEndsAt,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        plan: result.tenant.plan,
        trialEndsAt: result.tenant.trialEndsAt
      }
    });
  } catch (error) {
    console.error('Erro no autocadastro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

export const subscribe = async (req: any, res: Response) => {
  const { plan, cnpjOrCpf, phone } = req.body;

  if (!plan || !['SOLO', 'PRO'].includes(plan)) {
    return res.status(400).json({ error: 'Plano inválido. Selecione SOLO ou PRO.' });
  }
  if (!cnpjOrCpf) {
    return res.status(400).json({ error: 'CPF ou CNPJ é obrigatório para faturamento.' });
  }
  if (!phone) {
    return res.status(400).json({ error: 'Telefone é obrigatório para faturamento.' });
  }

  const asaasKey = process.env.ASAAS_API_KEY;
  const asaasUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

  if (!asaasKey) {
    console.error('Erro: ASAAS_API_KEY não configurada no arquivo .env.');
    return res.status(500).json({ error: 'Erro de configuração do gateway de pagamento.' });
  }

  try {
    // 1. Obter o Tenant e Usuário Administrador
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tenant: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    let customerId = user.tenant.asaasCustomerId;

    // 2. Se não existir o cliente no Asaas, cria um
    if (!customerId) {
      const customerPayload = {
        name: user.tenant.name,
        email: user.email,
        phone: phone,
        cpfCnpj: cnpjOrCpf.replace(/\D/g, ''), // Limpa máscara
        notificationDisabled: true
      };

      const customerRes = await fetch(`${asaasUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasKey
        },
        body: JSON.stringify(customerPayload)
      });

      const customerData: any = await customerRes.json();
      if (!customerRes.ok) {
        console.error('Erro ao criar cliente no Asaas:', customerData);
        return res.status(400).json({ error: customerData.errors?.[0]?.description || 'Erro ao cadastrar cliente no Asaas.' });
      }

      customerId = customerData.id;
      
      // Salva no banco de dados o Customer ID
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          asaasCustomerId: customerId,
          cnpjOrCpf: cnpjOrCpf,
          billingPhone: phone
        }
      });
    }

    // 3. Criar a Assinatura (Subscription)
    const planValue = plan === 'PRO' ? 149.00 : 79.00;
    const planName = plan === 'PRO' ? 'Marcenaria Pro' : 'Marceneiro Solo';
    
    // Próximo vencimento: hoje formatado como YYYY-MM-DD
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    const callbackUrl = process.env.ASAAS_CALLBACK_URL || 'http://localhost:4200/dashboard';

    const subscriptionPayload = {
      customer: customerId,
      billingType: 'UNDEFINED',
      value: planValue,
      nextDueDate: formattedDate,
      cycle: 'MONTHLY',
      description: `Assinatura ${planName} - CRM Marcenaria`,
      callback: {
        successUrl: callbackUrl,
        autoRedirect: true
      }
    };

    const subRes = await fetch(`${asaasUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasKey
      },
      body: JSON.stringify(subscriptionPayload)
    });

    const subData: any = await subRes.json();
    if (!subRes.ok) {
      console.error('Erro ao criar assinatura no Asaas:', subData);
      return res.status(400).json({ error: subData.errors?.[0]?.description || 'Erro ao criar assinatura no Asaas.' });
    }

    const subscriptionId = subData.id;

    // Atualiza o Tenant com a assinatura
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        asaasSubscriptionId: subscriptionId
      }
    });

    // 4. Buscar a fatura pendente (primeiro pagamento da assinatura)
    const paymentRes = await fetch(`${asaasUrl}/payments?subscription=${subscriptionId}`, {
      method: 'GET',
      headers: {
        'access_token': asaasKey
      }
    });

    const paymentData: any = await paymentRes.json();
    if (!paymentRes.ok || !paymentData.data || paymentData.data.length === 0) {
      console.error('Erro ao buscar faturas da assinatura:', paymentData);
      return res.status(400).json({ error: 'Erro ao obter link de pagamento do Asaas.' });
    }

    // Pega a fatura pendente mais recente
    const invoiceUrl = paymentData.data[0].invoiceUrl;

    return res.json({
      message: 'Faturamento gerado com sucesso. Redirecionando para o pagamento...',
      invoiceUrl
    });
  } catch (error) {
    console.error('Erro ao processar assinatura:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao processar a assinatura.' });
  }
};
