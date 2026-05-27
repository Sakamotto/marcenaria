import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="plans-container min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-slate-900 to-slate-950 text-slate-100 flex flex-col justify-center items-center">
      
      <!-- Cabeçalho -->
      <div class="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4" *ngIf="isTrialExpired()">
          ⚠️ Período de Teste Expirado
        </div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4" *ngIf="isTrialActive()">
          ✨ Período de Teste Ativo (Restam {{ getDaysLeft() }} dias)
        </div>
        <h1 class="text-4xl sm:text-5xl font-black tracking-tight bg-linear-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent mb-6">
          Escolha o Plano Ideal para sua Marcenaria
        </h1>
        <p class="text-lg text-slate-400 max-w-2xl mx-auto font-light">
          Gerencie clientes, projetos, orçamentos e otimize o fluxo da sua oficina de ponta a ponta. Libere o acesso completo instantaneamente.
        </p>
      </div>

      <!-- Grid de Planos -->
      <div class="grid md:grid-cols-2 gap-8 max-w-4xl w-full px-2">
        
        <!-- PLANO SOLO -->
        <div class="relative flex flex-col p-8 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-slate-700 group hover:-translate-y-1">
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-slate-100 mb-2">Marceneiro Solo</h3>
            <p class="text-sm text-slate-450 mb-6">Ideal para profissionais autônomos organizarem sua marcenaria.</p>
            
            <div class="flex items-baseline text-slate-100 mb-8">
              <span class="text-4xl font-extrabold tracking-tight">R$ 79</span>
              <span class="ml-1 text-xl font-semibold text-slate-550">/mês</span>
            </div>

            <!-- Features -->
            <ul class="space-y-4 mb-8">
              <li class="flex items-start">
                <div class="flex-shrink-0 text-emerald-400 bg-emerald-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">1 Usuário (Acesso individual)</p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0 text-emerald-400 bg-emerald-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">Clientes e Projetos Ilimitados</p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0 text-emerald-400 bg-emerald-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">Orçamentos Rápidos em PDF</p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0 text-emerald-400 bg-emerald-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">Agenda e Controle de Prazos</p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0 text-emerald-400 bg-emerald-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">Suporte por E-mail</p>
              </li>
            </ul>
          </div>

          <!-- Ação -->
          <div class="mt-8">
            <button 
              (click)="openConfirmModal('SOLO')"
              [disabled]="currentPlan() === 'SOLO'"
              [class]="currentPlan() === 'SOLO' 
                ? 'w-full py-4 px-6 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold cursor-default text-center' 
                : 'w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:text-white font-bold transition-all duration-200 text-center cursor-pointer'"
            >
              {{ currentPlan() === 'SOLO' ? 'Seu Plano Ativo' : (currentPlan() === 'PRO' ? 'Alterar para Solo' : 'Assinar Plano Solo') }}
            </button>
          </div>
        </div>

        <!-- PLANO PRO -->
        <div class="relative flex flex-col p-8 bg-slate-900/80 border-2 border-amber-500/40 rounded-3xl backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-amber-500 group hover:-translate-y-1">
          <!-- Ribbon de Destaque -->
          <div class="absolute -top-4 right-6 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
            Mais Vendido
          </div>
          
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-slate-100 mb-2">Marcenaria Pro</h3>
            <p class="text-sm text-slate-400 mb-6">Completo para equipes e marcenarias em crescimento acelerado.</p>
            
            <div class="flex items-baseline text-slate-100 mb-8">
              <span class="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">R$ 149</span>
              <span class="ml-1 text-xl font-semibold text-slate-400">/mês</span>
            </div>

            <!-- Features -->
            <ul class="space-y-4 mb-8">
              <li class="flex items-start">
                <div class="flex-shrink-0 text-amber-400 bg-amber-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-200 font-medium">Usuários Ilimitados (Toda a equipe)</p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0 text-amber-400 bg-amber-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">Painel Kanban Otimizado (Modo Oficina)</p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0 text-amber-400 bg-amber-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">Anexos de Projetos e Imagens (10GB)</p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0 text-amber-400 bg-amber-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">Clientes, Projetos e Orçamentos Ilimitados</p>
              </li>
              <li class="flex items-start">
                <div class="flex-shrink-0 text-amber-400 bg-amber-500/10 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">✓</div>
                <p class="ml-3 text-sm text-slate-300">Suporte Prioritário via WhatsApp</p>
              </li>
            </ul>
          </div>

          <!-- Ação -->
          <div class="mt-8">
            <button 
              (click)="openConfirmModal('PRO')"
              [disabled]="currentPlan() === 'PRO'"
              [class]="currentPlan() === 'PRO' 
                ? 'w-full py-4 px-6 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold cursor-default text-center' 
                : 'w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-755 text-slate-950 hover:text-slate-900 font-extrabold shadow-lg hover:shadow-amber-500/20 transition-all duration-200 text-center cursor-pointer'"
            >
              {{ currentPlan() === 'PRO' ? 'Seu Plano Ativo' : 'Assinar Plano Pro' }}
            </button>
          </div>
        </div>

      </div>

      <!-- Botão Voltar para Dashboard (Se não expirado) -->
      <div class="mt-12" *ngIf="!isTrialExpired()">
        <a href="/dashboard" class="text-sm text-slate-450 hover:text-slate-200 transition-colors flex items-center gap-2">
          ← Voltar para o Dashboard
        </a>
      </div>

      <!-- Modal de Confirmação de Assinatura Asaas -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" *ngIf="modalPlan()">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
          <h4 class="text-2xl font-extrabold text-slate-100 mb-3">
            Contratar {{ modalPlanName() }}
          </h4>
          <p class="text-sm text-slate-450 mb-5 font-light leading-relaxed">
            Preencha seus dados de faturamento para gerar sua assinatura recorrente mensal. Você será redirecionado para a página de faturas segura do Asaas para concluir o pagamento.
          </p>

          <form (ngSubmit)="confirmSubscription()" #billingForm="ngForm" class="space-y-4 text-left">
            <!-- CPF / CNPJ -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" for="cnpjOrCpf">CPF ou CNPJ</label>
              <input
                type="text"
                id="cnpjOrCpf"
                name="cnpjOrCpf"
                required
                [(ngModel)]="cnpjOrCpfInput"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-hidden focus:border-amber-500 transition-colors"
                placeholder="Ex: 00.000.000/0001-00 ou CPF"
              />
            </div>

            <!-- Telefone -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" for="billingPhone">Telefone de Contato</label>
              <input
                type="text"
                id="billingPhone"
                name="billingPhone"
                required
                [(ngModel)]="billingPhoneInput"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-hidden focus:border-amber-500 transition-colors"
                placeholder="Ex: (47) 99999-9999"
              />
            </div>

            <!-- Erro de Chamada -->
            <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold !mt-4" *ngIf="errorMsg()">
              {{ errorMsg() }}
            </div>

            <div class="flex gap-4 !mt-6">
              <button 
                type="button"
                (click)="closeModal()" 
                [disabled]="loading()"
                class="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-350 font-bold border border-slate-700 hover:bg-slate-750 transition-all duration-150 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                [disabled]="loading() || !billingForm.valid"
                class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold shadow-lg hover:shadow-emerald-500/10 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span *ngIf="loading()">Processando...</span>
                <span *ngIf="!loading()">Ir para Pagamento</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .plans-container {
      font-family: 'Outfit', sans-serif;
    }
  `]
})
export class Plans implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly currentPlan = signal<string | null>(null);
  protected readonly trialEndsAt = signal<string | null>(null);
  protected readonly modalPlan = signal<'SOLO' | 'PRO' | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  protected cnpjOrCpfInput = '';
  protected billingPhoneInput = '';

  ngOnInit() {
    this.updateLocalState();
    this.route.queryParams.subscribe(params => {
      if (params['upgrade'] === 'PRO') {
        this.openConfirmModal('PRO');
      }
    });
  }

  private updateLocalState() {
    const user = this.authService.currentUser();
    if (user) {
      this.currentPlan.set(user.tenantPlan || 'TRIAL');
      this.trialEndsAt.set(user.trialEndsAt || null);
    }
  }

  protected isTrialExpired(): boolean {
    if (this.currentPlan() !== 'TRIAL') return false;
    const endsAt = this.trialEndsAt();
    if (!endsAt) return false;
    return new Date() > new Date(endsAt);
  }

  protected isTrialActive(): boolean {
    if (this.currentPlan() !== 'TRIAL') return false;
    const endsAt = this.trialEndsAt();
    if (!endsAt) return true;
    return new Date() <= new Date(endsAt);
  }

  protected getDaysLeft(): number {
    const endsAt = this.trialEndsAt();
    if (!endsAt) return 0;
    const diff = new Date(endsAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  }

  protected modalPlanName(): string {
    return this.modalPlan() === 'PRO' ? 'Marcenaria Pro' : 'Marceneiro Solo';
  }

  protected openConfirmModal(plan: 'SOLO' | 'PRO') {
    this.modalPlan.set(plan);
    this.cnpjOrCpfInput = '';
    this.billingPhoneInput = '';
    this.errorMsg.set(null);
  }

  protected closeModal() {
    this.modalPlan.set(null);
  }

  protected confirmSubscription() {
    const plan = this.modalPlan();
    if (!plan || !this.cnpjOrCpfInput || !this.billingPhoneInput) return;

    this.loading.set(true);
    this.errorMsg.set(null);

    this.authService.subscribe(plan, this.cnpjOrCpfInput, this.billingPhoneInput).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.closeModal();
        
        // Redireciona o usuário para o link de checkout do Asaas recebido
        if (res.invoiceUrl) {
          window.location.href = res.invoiceUrl;
        } else {
          this.errorMsg.set('Erro ao carregar link de checkout. Tente novamente.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.error || 'Erro ao realizar assinatura. Tente novamente.');
      }
    });
  }
}
