import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o semeamento do banco de dados (Seeding)...');

  // 1. Criar Tenants de demonstração
  console.log('Semeando inquilinos (Tenants)...');
  const tenant1 = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Marcenaria Sakamotto',
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Oficina de Móveis Premium',
    },
  });

  // 2. Criar Usuários padrão
  const salt = await bcrypt.genSalt(10);
  const hashAdmin = await bcrypt.hash('admin123', salt);
  const hashCarpenter = await bcrypt.hash('oficina123', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@marcenaria.com' },
    update: {},
    create: {
      tenantId: tenant1.id,
      email: 'admin@marcenaria.com',
      password: hashAdmin,
      role: 'ADMIN',
    },
  });

  const carpenter = await prisma.user.upsert({
    where: { email: 'oficina@marcenaria.com' },
    update: {},
    create: {
      tenantId: tenant1.id,
      email: 'oficina@marcenaria.com',
      password: hashCarpenter,
      role: 'CARPENTER',
    },
  });

  const adminTenant2 = await prisma.user.upsert({
    where: { email: 'admin@premium.com' },
    update: {},
    create: {
      tenantId: tenant2.id,
      email: 'admin@premium.com',
      password: hashAdmin,
      role: 'ADMIN',
    },
  });

  console.log('Usuários padrão semeados com sucesso:');
  console.log(' - Admin Sakamotto: admin@marcenaria.com / admin123');
  console.log(' - Marceneiro Sakamotto: oficina@marcenaria.com / oficina123');
  console.log(' - Admin Premium: admin@premium.com / admin123');

  // 3. Limpar dados anteriores (apenas para garantir que o seed não duplique se for executado do zero)
  // Nota: Não limpamos os usuários para permitir upserts limpos.
  const clientCount = await prisma.client.count();
  if (clientCount > 0) {
    console.log('Dados de clientes já existentes. Pulando criação de clientes e projetos mockados.');
    return;
  }

  // 4. Criar Clientes mockados
  console.log('Semeando clientes...');
  const client1 = await prisma.client.create({
    data: {
      tenantId: tenant1.id,
      name: 'Carlos Souza',
      phone: '(11) 98765-4321',
      email: 'carlos.souza@gmail.com',
      workAddress: 'Rua das Palmeiras, 123 - Apto 42 - Pinheiros, São Paulo - SP',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      tenantId: tenant1.id,
      name: 'Mariana Santos',
      phone: '(11) 99876-5432',
      email: 'mariana.santos@outlook.com',
      workAddress: 'Av. Paulista, 1000 - Casa 3 - Cerqueira César, São Paulo - SP',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      tenantId: tenant1.id,
      name: 'Ricardo Lima',
      phone: '(21) 97654-3210',
      email: 'ricardo.lima@yahoo.com.br',
      workAddress: 'Rua Voluntários da Pátria, 450 - Botafogo, Rio de Janeiro - RJ',
    },
  });

  const clientTenant2 = await prisma.client.create({
    data: {
      tenantId: tenant2.id,
      name: 'Roberto Alencar (Móveis Premium)',
      phone: '(11) 95555-4444',
      email: 'roberto.alencar@premium.com',
      workAddress: 'Al. Lorena, 500 - Jardins, São Paulo - SP',
    },
  });

  const projectTenant2 = await prisma.project.create({
    data: {
      clientId: clientTenant2.id,
      name: 'Closet Master Premium',
      description: 'Closet planejado de alto padrão em MDF lacado.',
      status: 'Aprovado',
      totalValue: 35000.0,
    },
  });

  // 4. Criar Projetos
  console.log('Semeando projetos...');
  
  // Projeto 1: Cozinha (Carlos Souza) - Em Produção
  const project1 = await prisma.project.create({
    data: {
      clientId: client1.id,
      name: 'Cozinha Planejada MDF Naval',
      description: 'Cozinha completa sob medida com portas em MDF Naval cinza sagrado, puxadores pretos perfil gola, pistões a gás e amortecimento em todas as portas.',
      status: 'Em produção',
      totalValue: 22500.0,
    },
  });

  // Projeto 2: Painel de TV (Mariana Santos) - Aprovado
  const project2 = await prisma.project.create({
    data: {
      clientId: client2.id,
      name: 'Painel de TV Ripado + Rack',
      description: 'Painel ripado em freijó natural de 2.40m x 2.80m, com rack suspenso com gavetas de corrediças telescópicas toque amortecido e canaletas com iluminação fita LED quente.',
      status: 'Aprovado',
      totalValue: 7500.0,
    },
  });

  // Projeto 3: Quarto (Mariana Santos) - Lead
  const project3 = await prisma.project.create({
    data: {
      clientId: client2.id,
      name: 'Armário de Quarto Suíte Casal',
      description: 'Closet integrado planejado com portas de correr espelhadas, gaveteiros internos com divisórias para joias e acabamento premium no padrão linho.',
      status: 'Lead',
      totalValue: 0.0, // Sem orçamento aprovado ainda
    },
  });

  // Projeto 4: Loft Completo (Ricardo Lima) - Negociação
  const project4 = await prisma.project.create({
    data: {
      clientId: client3.id,
      name: 'Mobiliário Completo Loft',
      description: 'Projeto integrado para Loft de 45m² incluindo cozinha americana integrada, home office compacto, cama baú e armários de banheiro com espelheira.',
      status: 'Negociação',
      totalValue: 0.0,
    },
  });

  // 5. Criar Orçamentos para os Projetos
  console.log('Semeando orçamentos...');
  
  // Orçamentos para Projeto 1 (Cozinha) - Versão Única Aprovada
  await prisma.budget.create({
    data: {
      projectId: project1.id,
      version: 'V1',
      approved: true,
      totalValue: 22500.0,
      notes: 'Entrada de 60% no fechamento + saldo na entrega da montagem. Prazo de 35 dias úteis.',
      items: [
        {
          description: 'Módulos inferiores da bancada e torre quente em MDF Naval ultra resistente',
          quantity: 1,
          unitValue: 12000.0,
          totalValue: 12000.0,
        },
        {
          description: 'Módulos aéreos com portas de vidro canelado e perfil de alumínio preto',
          quantity: 1,
          unitValue: 6500.0,
          totalValue: 6500.0,
        },
        {
          description: 'Ferragens Blum (dobradiças e corrediças slow-close) + puxadores perfil gola pretos',
          quantity: 1,
          unitValue: 4000.0,
          totalValue: 4000.0,
        },
      ] as any,
    },
  });

  // Orçamentos para Projeto 2 (Painel Ripado) - Duas Versões (V1 pendente, V2 aprovada)
  await prisma.budget.create({
    data: {
      projectId: project2.id,
      version: 'V1',
      approved: false,
      totalValue: 6800.0,
      notes: 'Orçamento preliminar com painel liso (sem ripas)',
      items: [
        {
          description: 'Painel de TV MDF Liso padrão Freijó',
          quantity: 1,
          unitValue: 3500.0,
          totalValue: 3500.0,
        },
        {
          description: 'Rack suspenso com 3 gavetas (puxador cava)',
          quantity: 1,
          unitValue: 3300.0,
          totalValue: 3300.0,
        },
      ] as any,
    },
  });

  await prisma.budget.create({
    data: {
      projectId: project2.id,
      version: 'V2',
      approved: true,
      totalValue: 7500.0,
      notes: 'Versão atualizada solicitada pelo cliente incluindo o painel ripado e kit de iluminação LED quente embutida.',
      items: [
        {
          description: 'Painel ripado sob medida em freijó natural',
          quantity: 1,
          unitValue: 4200.0,
          totalValue: 4200.0,
        },
        {
          description: 'Rack suspenso com 3 gavetas (corrediça invisível toque amortecido)',
          quantity: 1,
          unitValue: 2800.0,
          totalValue: 2800.0,
        },
        {
          description: 'Kit iluminação LED embutido quente com canaletas de alumínio difusoras e fonte oculta',
          quantity: 1,
          unitValue: 500.0,
          totalValue: 500.0,
        },
      ] as any,
    },
  });

  // Orçamentos para Projeto 4 (Loft) - Versão Rascunho Negociação
  await prisma.budget.create({
    data: {
      projectId: project4.id,
      version: 'V1',
      approved: false,
      totalValue: 34200.0,
      notes: 'Condições de pagamento especiais para o loft completo: 40% entrada + 6x no boleto.',
      items: [
        {
          description: 'Mobiliário Cozinha Loft Americana compacta',
          quantity: 1,
          unitValue: 14500.0,
          totalValue: 14500.0,
        },
        {
          description: 'Home Office integrado com estante suspensa em carvalho',
          quantity: 1,
          unitValue: 6800.0,
          totalValue: 6800.0,
        },
        {
          description: 'Cama casal com baú elevatório pistões hidráulicos e cabeceira estofada',
          quantity: 1,
          unitValue: 8400.0,
          totalValue: 8400.0,
        },
        {
          description: 'Gabinete de Banheiro com espelheira embutida e porta-toalhas oculto',
          quantity: 1,
          unitValue: 4500.0,
          totalValue: 4500.0,
        },
      ] as any,
    },
  });

  // 6. Criar Tarefas
  console.log('Semeando tarefas...');
  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  
  const in5Days = new Date();
  in5Days.setDate(in5Days.getDate() + 5);

  const in8Days = new Date();
  in8Days.setDate(in8Days.getDate() + 8);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Tarefas Projeto 1
  await prisma.task.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'Comprar corrediças ocultas blumotion',
        completed: true,
        dueDate: new Date(),
      },
      {
        projectId: project1.id,
        title: 'Cortar chapas de MDF cinza naval no galpão',
        completed: true,
        dueDate: new Date(),
      },
      {
        projectId: project1.id,
        title: 'Aplicar fita de borda nos painéis da cozinha',
        completed: false,
        dueDate: in3Days,
      },
      {
        projectId: project1.id,
        title: 'Montagem dos módulos da torre de eletros na oficina',
        completed: false,
        dueDate: in5Days,
      },
      {
        projectId: project1.id,
        title: 'Agendar entrega e instalação com o cliente',
        completed: false,
        dueDate: in8Days,
      },
    ],
  });

  // Tarefas Projeto 2
  await prisma.task.createMany({
    data: [
      {
        projectId: project2.id,
        title: 'Comprar fitas LED quente e fontes de alumínio',
        completed: false,
        dueDate: tomorrow,
      },
      {
        projectId: project2.id,
        title: 'Preparar ripas em freijó natural na serra esquadrejadeira',
        completed: false,
        dueDate: in3Days,
      },
    ],
  });

  // Tarefas Projeto 4
  await prisma.task.createMany({
    data: [
      {
        projectId: project4.id,
        title: 'Ajustar medidas finas no loft (após gesso da obra)',
        completed: true,
        dueDate: new Date(),
      },
      {
        projectId: project4.id,
        title: 'Apresentar projeto 3D renderizado V2 com alterações de cores',
        completed: false,
        dueDate: tomorrow,
      },
    ],
  });

  console.log('Semeamento do banco de dados concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o semeamento:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
