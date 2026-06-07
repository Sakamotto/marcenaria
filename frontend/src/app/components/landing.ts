import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular: boolean;
  ctaText: string;
}

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page-container min-h-screen bg-slate-50/70 text-slate-800 font-sans selection:bg-blue-500/20 selection:text-blue-700">
      
      <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="marcena_icon_square.png" alt="Logo Marcena.net" class="w-8 h-8 object-contain rounded-lg shadow-xs" />
          <span class="logo-text text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Marcena.net
          </span>
        </div>
        <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#funcionalidades" class="hover:text-blue-600 transition-colors">Funcionalidades</a>
          <a href="#modo-oficina" class="hover:text-blue-600 transition-colors">Modo Oficina 🛠️</a>
          <a href="#planos" class="hover:text-blue-600 transition-colors">Preços</a>
          <a href="#faq" class="hover:text-blue-600 transition-colors">FAQ</a>
        </nav>
        <div class="flex items-center gap-2 sm:gap-3">
          <a routerLink="/login" class="inline-flex items-center justify-center px-2 sm:px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            Entrar
          </a>
          <a routerLink="/register" class="inline-flex items-center justify-center px-3 py-1.5 sm:px-5 sm:py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
            <span class="hidden sm:inline">Cadastrar Marcenaria</span>
            <span class="inline sm:hidden">Cadastrar</span>
          </a>
        </div>
      </header>

      <!-- HERO SECTION -->
      <section class="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div class="space-y-6 text-center lg:text-left">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200/50 rounded-full text-xs font-semibold text-blue-700">
            ✨ O único CRM pensado para Marceneiros
          </span>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Do orçamento completo à <span class="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">instalação final</span>.
          </h1>
          <p class="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
            Controle projetos, organize tarefas de produção, envie orçamentos profissionais em PDF e integre sua oficina de forma totalmente segura e visual.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <a routerLink="/register" class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl shadow-blue-500/20 text-center transition-all hover:-translate-y-0.5">
              Experimentar Grátis
            </a>
            <a href="#funcionalidades" class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center transition-colors">
              Conhecer Recursos
            </a>
          </div>
          <div class="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-slate-500">
            <span>✓ Teste grátis por 14 dias</span>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ SaaS Multi-tenant Seguro</span>
          </div>
        </div>

        <!-- HERO GRAPHICAL MOCKUP (CSS KANBAN) -->
        <div class="relative w-full max-w-xl mx-auto lg:max-w-none">
          <!-- Background decoration circles -->
          <div class="absolute -top-10 -left-10 w-48 h-48 bg-blue-300/20 rounded-full blur-3xl animate-float-slow"></div>
          <div class="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-300/20 rounded-full blur-3xl animate-float-slower"></div>

          <!-- Glassmorphic Mockup Card Container -->
          <div class="relative bg-white/90 border border-slate-200/80 shadow-2xl rounded-2xl p-6 backdrop-blur-lg animate-float-mockup">
            <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-red-400"></span>
                <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span class="w-3 h-3 rounded-full bg-green-400"></span>
              </div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Quadro Kanban de Projetos</span>
            </div>

            <!-- Simplified Kanban Columns Layout -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Column 1 -->
              <div class="bg-blue-50/40 border border-blue-100 rounded-xl p-3 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/50 px-2 py-0.5 rounded-md">Lead</span>
                  <span class="text-[11px] text-slate-400">2</span>
                </div>
                <!-- Card 1 -->
                <div class="bg-white border border-slate-150 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div class="text-xs font-bold text-slate-800">Cozinha Planejada MDF</div>
                  <div class="text-[10px] text-slate-400 mt-1">👤 Ricardo Sakamotto</div>
                  <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                    <span class="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">📋 4</span>
                    <span class="text-[10px] font-bold text-blue-600">R$ 18.500</span>
                  </div>
                </div>
                <!-- Card 2 -->
                <div class="bg-white border border-slate-150 rounded-lg p-3 shadow-sm">
                  <div class="text-xs font-bold text-slate-800">Armário Banheiro Suspenso</div>
                  <div class="text-[10px] text-slate-400 mt-1">👤 Carlos Ferreira</div>
                </div>
              </div>

              <!-- Column 2 -->
              <div class="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md">Aprovado</span>
                  <span class="text-[11px] text-slate-400">1</span>
                </div>
                <!-- Card 3 -->
                <div class="bg-white border border-slate-150 rounded-lg p-3 shadow-sm border-l-4 border-emerald-500">
                  <div class="text-xs font-bold text-slate-800">Painel Ripado + Rack TV</div>
                  <div class="text-[10px] text-slate-400 mt-1">👤 Pedro Sakamotto</div>
                  <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                    <span class="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">📋 8</span>
                    <span class="text-[10px] font-bold text-emerald-600">R$ 6.200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PAIN VS SOLUTION (COMPARATIVO) -->
      <section class="bg-slate-100/80 border-y border-slate-200/40 py-16 lg:py-20">
        <div class="max-w-7xl mx-auto px-6">
          <div class="text-center space-y-3 mb-16 max-w-xl mx-auto">
            <h2 class="text-3xl font-bold tracking-tight text-slate-900">Como você gerencia sua marcenaria hoje?</h2>
            <p class="text-slate-600">Chega de planilhas desatualizadas, anotações de medidas perdidas e retrabalho na produção.</p>
          </div>

          <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <!-- Pains Card -->
            <div class="bg-white border border-red-100 shadow-lg rounded-2xl p-8 space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-red-50">
                <span class="text-2xl">❌</span>
                <h3 class="text-lg font-bold text-red-900">Sem Sistema de CRM</h3>
              </div>
              <ul class="space-y-4 text-sm text-slate-600">
                <li class="flex items-start gap-2.5">
                  <span class="text-red-500 mt-0.5">●</span>
                  <span>Orçamentos demoram dias para ficar prontos e são fáceis de esquecer.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-red-500 mt-0.5">●</span>
                  <span>Plantas baixas e arquivos dos clientes ficam perdidos em conversas de WhatsApp.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-red-500 mt-0.5">●</span>
                  <span>Ajudantes da oficina têm acesso a valores confidenciais ou se perdem nos prazos.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-red-500 mt-0.5">●</span>
                  <span>Falta de histórico de versões de orçamentos causa mal-entendidos com o cliente.</span>
                </li>
              </ul>
            </div>

            <!-- Solutions Card -->
            <div class="bg-white border border-blue-100 shadow-lg rounded-2xl p-8 space-y-6">
              <div class="flex items-center gap-3 pb-4 border-b border-blue-50">
                <span class="text-2xl">✅</span>
                <h3 class="text-lg font-bold text-blue-900">Com o Marcena.net</h3>
              </div>
              <ul class="space-y-4 text-sm text-slate-600">
                <li class="flex items-start gap-2.5">
                  <span class="text-blue-600 mt-0.5">●</span>
                  <span>Emita orçamentos profissionais e versões em PDF detalhado em apenas 2 minutos.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-blue-600 mt-0.5">●</span>
                  <span>Organização centralizada de anexos e plantas em buckets na nuvem seguros.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-blue-600 mt-0.5">●</span>
                  <span>**Modo Oficina exclusivo**: tela na bancada da oficina oculta preços e dados confidenciais.</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="text-blue-600 mt-0.5">●</span>
                  <span>Visualização dinâmica por Kanban e calendário interativo de tarefas de produção.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES SECTION -->
      <section id="funcionalidades" class="max-w-7xl mx-auto px-6 py-20 space-y-16">
        <div class="text-center space-y-4 max-w-xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Tudo o que sua marcenaria precisa para crescer
          </h2>
          <p class="text-slate-600">
            Uma plataforma de ponta a ponta desenvolvida especificamente para o dia a dia e fluxo produtivo do marceneiro.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-6 space-y-4">
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl text-blue-600">
              📋
            </div>
            <h3 class="text-lg font-bold text-slate-800">Quadro Kanban Visual</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Arraste e solte os projetos entre as colunas de produção (Lead, Orçamento Enviado, Negociação, Aprovado, Em Produção, Instalação e Finalizado).
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-6 space-y-4">
            <div class="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl text-purple-600">
              💰
            </div>
            <h3 class="text-lg font-bold text-slate-800">Gestão e Emissão de Orçamentos</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Crie orçamentos estruturados com itens dinâmicos. Duplique orçamentos para criar novas versões e imprima em formato de fatura profissional ou salve em PDF.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-6 space-y-4">
            <div class="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl text-green-600">
              📅
            </div>
            <h3 class="text-lg font-bold text-slate-800">Calendário de Tarefas Interativo</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Monitore prazos de vencimento de montagens e fabricações. Gerencie checklists de produção e marque tarefas como concluídas com cliques rápidos na grade de dias.
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-6 space-y-4">
            <div class="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl text-orange-600">
              📎
            </div>
            <h3 class="text-lg font-bold text-slate-800">Armazenamento Seguro de Anexos</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Salve fotos do local, desenhos técnicos e contratos diretamente no projeto. Os arquivos são armazenados no Supabase e acessados com links assinados seguros.
            </p>
          </div>

          <!-- Feature 5 -->
          <div class="bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-6 space-y-4">
            <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl text-indigo-600">
              👥
            </div>
            <h3 class="text-lg font-bold text-slate-800">SaaS Multi-tenant e Equipe</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Segregação de dados total entre inquilinos. Como administrador, convide seus marceneiros e gerencie permissões de acesso específicas para cada membro da equipe.
            </p>
          </div>

          <!-- Feature 6 -->
          <div class="bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow rounded-2xl p-6 space-y-4">
            <div class="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-2xl text-cyan-600">
              📱
            </div>
            <h3 class="text-lg font-bold text-slate-800">Acesso Mobile Responsivo</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Acompanhe sua marcenaria do celular. Toda a interface se adapta para o uso em obras, medições no cliente ou acompanhamento rápido na oficina.
            </p>
          </div>
        </div>
      </section>

      <!-- SPOTLIGHT: MODO OFICINA -->
      <section id="modo-oficina" class="relative bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-20 overflow-hidden">
        <!-- Parallax background pattern/grid -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-float-slower pointer-events-none"></div>

        <div class="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-6">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-400">
              🛠️ Exclusividade para Produção
            </span>
            <h2 class="text-3xl md:text-4xl font-extrabold tracking-tight">
              Apresentamos o único <span class="text-amber-400">Modo Oficina</span> do mercado
            </h2>
            <p class="text-slate-300 text-base leading-relaxed">
              Deixe um tablet ou monitor fixo na área de corte da sua marcenaria. Com o Modo Oficina ativado, seus ajudantes e montadores visualizam a lista de tarefas pendentes e acompanham a linha de produção de forma interativa.
            </p>
            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-3">
                <span class="text-amber-400">✓</span>
                <span class="text-sm font-medium text-slate-200">Valores financeiros de orçamentos e lucros ficam 100% ocultos.</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-amber-400">✓</span>
                <span class="text-sm font-medium text-slate-200">Os dados de contato pessoal e telefone dos clientes são omitidos.</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-amber-400">✓</span>
                <span class="text-sm font-medium text-slate-200">Sua marcenaria ganha agilidade e você mantém sigilo e segurança comercial.</span>
              </div>
            </div>
            <div class="pt-4">
              <a routerLink="/register" class="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-all hover:-translate-y-0.5">
                Experimentar o Modo Oficina
              </a>
            </div>
          </div>

          <!-- MOCKUP VISUAL MODO OFICINA (CSS) -->
          <div class="relative bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-6">
            <div class="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="text-amber-400">🛠️</span>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Modo Oficina (Bancada de Corte)</span>
              </div>
              <span class="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold uppercase">Restrito</span>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl">
                <div class="space-y-1">
                  <div class="text-sm font-bold text-slate-100">Cortar chapas MDF Cozinha</div>
                  <div class="text-xs text-slate-400">Projeto: Cozinha Planejada MDF</div>
                </div>
                <span class="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded font-bold">Pendente</span>
              </div>

              <div class="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl">
                <div class="space-y-1">
                  <div class="text-sm font-bold text-slate-100">Montagem gaveteiro corrediças</div>
                  <div class="text-xs text-slate-400">Projeto: Painel Ripado + Rack TV</div>
                </div>
                <span class="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded font-bold">Pendente</span>
              </div>

              <div class="flex items-center justify-between p-3.5 bg-slate-850 border border-slate-800 rounded-xl opacity-50 line-through">
                <div class="space-y-1">
                  <div class="text-sm font-bold text-slate-300">Medição técnica no local</div>
                  <div class="text-xs text-slate-500">Projeto: Armário Banheiro Suspenso</div>
                </div>
                <span class="text-xs bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded font-bold">Concluído</span>
              </div>
            </div>
            
            <!-- Floating badge warning -->
            <div class="absolute -bottom-4 left-4 right-4 sm:-left-4 sm:right-auto bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center justify-center gap-1.5 border border-red-500/50">
              <span>🔒</span> Valores e Contatos Ocultados com Sucesso
            </div>
          </div>
        </div>
      </section>

      <!-- TESTIMONIALS SECTION -->
      <section class="max-w-7xl mx-auto px-6 py-20 space-y-16">
        <div class="text-center space-y-4 max-w-xl mx-auto">
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">
            Aprovado por quem entende de marcenaria
          </h2>
          <p class="text-slate-600">
            Veja o depoimento de marceneiros que transformaram a gestão da sua produção e aumentaram o fechamento de orçamentos.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div *ngFor="let item of testimonials" class="bg-white border border-slate-200/60 shadow-md rounded-2xl p-8 flex flex-col justify-between">
            <div class="space-y-4">
              <!-- Rating Stars -->
              <div class="flex text-amber-400 text-lg">
                <span *ngFor="let star of [1,2,3,4,5]">★</span>
              </div>
              <p class="text-sm text-slate-600 leading-relaxed italic">
                "{{ item.quote }}"
              </p>
            </div>
            <div class="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
              <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
                {{ item.name.substring(0, 1) }}
              </div>
              <div>
                <div class="text-sm font-bold text-slate-800">{{ item.name }}</div>
                <div class="text-[11px] text-slate-400">{{ item.role }}, {{ item.company }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PRICING TIER SECTION -->
      <section id="planos" class="bg-slate-100/80 border-y border-slate-200/40 py-20">
        <div class="max-w-7xl mx-auto px-6 space-y-16">
          <div class="text-center space-y-4 max-w-xl mx-auto">
            <h2 class="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Planos simples e transparentes
            </h2>
            <p class="text-slate-600">
              Sem taxas ocultas ou fidelidade. Cancele quando quiser. Todos os planos incluem suporte.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div 
              *ngFor="let plan of plans" 
              class="relative bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col justify-between overflow-hidden"
              [class.border-blue-600]="plan.isPopular"
              [class.ring-4]="plan.isPopular"
              [class.ring-blue-600/10]="plan.isPopular"
            >
              <!-- Popular Badge -->
              <span *ngIf="plan.isPopular" class="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl shadow">
                Mais Popular
              </span>

              <div class="space-y-6">
                <div>
                  <h3 class="text-xl font-bold text-slate-900">{{ plan.name }}</h3>
                  <p class="text-xs text-slate-400 mt-1">{{ plan.description }}</p>
                </div>
                
                <div class="flex items-baseline gap-1">
                  <span class="text-4xl font-extrabold text-slate-900">{{ plan.price }}</span>
                  <span class="text-xs text-slate-400">/ {{ plan.period }}</span>
                </div>

                <hr class="border-slate-100" />

                <!-- Features list -->
                <ul class="space-y-3.5">
                  <li *ngFor="let feat of plan.features" class="flex items-start gap-2.5 text-sm text-slate-600">
                    <span class="text-blue-600 font-bold">✓</span>
                    <span>{{ feat }}</span>
                  </li>
                </ul>
              </div>

              <div class="pt-8">
                <a 
                  routerLink="/register" 
                  class="block w-full py-3 text-center text-sm font-bold rounded-xl transition-all cursor-pointer"
                  [class.bg-blue-600]="plan.isPopular"
                  [class.text-white]="plan.isPopular"
                  [class.hover:bg-blue-700]="plan.isPopular"
                  [class.shadow-lg]="plan.isPopular"
                  [class.shadow-blue-500/20]="plan.isPopular"
                  [class.bg-slate-100]="!plan.isPopular"
                  [class.text-slate-700]="!plan.isPopular"
                  [class.hover:bg-slate-200]="!plan.isPopular"
                >
                  {{ plan.ctaText }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ SECTION -->
      <section id="faq" class="max-w-4xl mx-auto px-6 py-20 space-y-12">
        <div class="text-center space-y-4">
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">Perguntas Frequentes</h2>
          <p class="text-slate-600">Tire suas dúvidas antes de começar</p>
        </div>

        <div class="space-y-4">
          <div *ngFor="let item of faqItems(); let i = index" class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              (click)="toggleFaq(i)" 
              class="w-full px-6 py-5 text-left font-bold text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <span>{{ item.question }}</span>
              <span class="text-sm text-slate-400 transition-transform duration-300" [class.rotate-180]="item.open">▼</span>
            </button>
            <div 
              class="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3 animate-fade-in"
              *ngIf="item.open"
            >
              {{ item.answer }}
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="bg-white border-t border-slate-200/60 py-12 px-6">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div class="flex items-center gap-2">
            <img src="marcena_icon_square.png" alt="Logo Marcena.net" class="w-6 h-6 object-contain rounded-md" />
            <span class="font-bold text-slate-700">Marcena.net</span>
          </div>
          <p>&copy; 2026 Marcena.net. Todos os direitos reservados. Feito com paixão para marcenarias brasileiras.</p>
          <div class="flex gap-4">
            <a routerLink="/login" class="hover:underline">Entrar</a>
            <a routerLink="/register" class="hover:underline">Criar Conta</a>
          </div>
        </div>
      </footer>

      <!-- Botão Flutuante do WhatsApp -->
      <a 
        href="https://wa.me/5527998858031?text=Olá! Gostaria de tirar algumas dúvidas sobre o Marcena.net." 
        target="_blank" 
        rel="noopener noreferrer"
        class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 group"
        title="Falar no WhatsApp"
      >
        <svg class="w-7 h-7 fill-current transition-transform group-hover:rotate-12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.475 1.332 4.992l-1.417 5.176 5.301-1.39a9.923 9.923 0 0 0 4.772 1.21h.004c5.505 0 9.988-4.482 9.988-9.988C22 6.482 17.518 2 12.012 2zm6.012 14.249c-.247.697-1.206 1.285-1.66 1.334-.413.045-.951.071-1.523-.112-.349-.111-.795-.274-1.39-.526-2.544-1.076-4.186-3.666-4.312-3.834-.127-.168-.937-1.246-.937-2.378 0-1.132.59-1.688.801-1.916.211-.228.464-.285.618-.285.154 0 .308.001.442.007.143.007.337-.056.527.408.196.48.67 1.636.729 1.758.059.122.099.263.018.423-.081.161-.122.26-.243.402-.121.142-.254.317-.363.426-.122.122-.25.254-.108.498.142.244.632 1.036 1.357 1.681.933.83 1.718 1.088 1.962 1.21.244.122.385.102.527-.061.142-.163.61-.712.772-.955.162-.244.325-.204.549-.122.224.082 1.42.671 1.664.793.244.122.406.183.467.285.061.102.061.59-.186 1.286z"/>
        </svg>
        <span class="absolute inset-0 rounded-full border border-emerald-500/60 animate-ping opacity-75 pointer-events-none" style="animation-duration: 2s;"></span>
      </a>
    </div>
  `,
  styles: [`
    .logo-text {
      font-family: 'Outfit', sans-serif;
    }
    h1, h2, h3 {
      font-family: 'Outfit', sans-serif;
    }
  `]
})
export class Landing implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly testimonials: Testimonial[] = [
    {
      name: 'Ricardo Sakamotto',
      role: 'Sócio-Fundador',
      company: 'Marcenaria Sakamotto',
      quote: 'Antes perdíamos muito tempo calculando orçamentos e as plantas viviam perdidas no WhatsApp. Agora crio propostas detalhadas em minutos e o cliente fecha na hora.',
      rating: 5
    },
    {
      name: 'Carlos Ferreira',
      role: 'Marceneiro Principal',
      company: 'Ferreira Móveis Planejados',
      quote: 'O Modo Oficina mudou tudo no galpão. Deixo o tablet com a lista de cortes para os ajudantes na serra e eles produzem sozinhos sem eu ter que revelar o preço dos projetos.',
      rating: 5
    },
    {
      name: 'Paula Medeiros',
      role: 'Designer de Interiores',
      company: 'Studio M Planejados',
      quote: 'Os clientes adoram receber o orçamento organizado em PDF com as condições de pagamento e versões de testes. Passa um profissionalismo enorme para nossa empresa.',
      rating: 5
    }
  ];

  protected readonly plans: Plan[] = [
    {
      name: 'Marceneiro Solo',
      price: 'R$ 79',
      period: 'mês',
      description: 'Perfeito para marceneiros autônomos.',
      features: [
        'Acesso a 1 usuário administrador',
        'Gestão de Clientes ilimitados',
        'Quadro Kanban e Calendário',
        'Emissão de Orçamentos ilimitados',
        'Geração de PDF / Modo Impressão',
        'Até 1GB de armazenamento de arquivos'
      ],
      isPopular: false,
      ctaText: 'Começar Teste Grátis'
    },
    {
      name: 'Marcenaria Pro',
      price: 'R$ 149',
      period: 'mês',
      description: 'Ideal para marcenarias com equipe e ajudantes.',
      features: [
        'Múltiplos usuários para equipe',
        'Modo Oficina exclusivo para ajudantes',
        'Ocultação inteligente de preços e contatos',
        'Gerenciamento de permissões de papéis',
        'Até 10GB de armazenamento de arquivos',
        'Suporte prioritário via WhatsApp'
      ],
      isPopular: true,
      ctaText: 'Começar Teste Grátis'
    }
  ];

  protected readonly faqItems = signal<FaqItem[]>([
    {
      question: 'Preciso cadastrar meu cartão de crédito para testar?',
      answer: 'Não! Você pode criar sua conta e experimentar todos os recursos da ferramenta gratuitamente por 14 dias sem informar nenhum dado de pagamento.',
      open: false
    },
    {
      question: 'Como funciona a segurança dos meus arquivos e plantas?',
      answer: 'Todos os seus anexos e desenhos técnicos são salvos de forma privada no Supabase Storage. O sistema gera links assinados temporários de 2 horas apenas para visualização de usuários autenticados da sua empresa.',
      open: false
    },
    {
      question: 'O que é o Modo Oficina e como ele protege minha marcenaria?',
      answer: 'É uma tela dedicada desenvolvida para rodar em computadores ou tablets na área de fabricação. Ela mostra apenas a lista de tarefas e cortes pendentes. Preços de venda, lucros e telefones dos clientes são omitidos automaticamente para segurança das informações da sua marcenaria.',
      open: false
    },
    {
      question: 'Posso usar o CRM pelo celular?',
      answer: 'Sim! A nossa interface é totalmente responsiva, se adaptando para celulares, tablets e computadores de forma muito fluida para você usar na obra ou no cliente.',
      open: false
    }
  ]);

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  protected toggleFaq(index: number) {
    this.faqItems.update((items) =>
      items.map((item, i) => i === index ? { ...item, open: !item.open } : item)
    );
  }
}
