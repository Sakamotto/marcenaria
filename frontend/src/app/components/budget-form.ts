import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BudgetService, Budget, BudgetItem } from '../services/budget';
import { ProjectService, Project } from '../services/project';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- 1. INTERACTIVE SYSTEM CONTAINER (Hidden in Printing) -->
    <div class="budget-container animate-fade-in no-print">
      <!-- Header / Breadcrumbs -->
      <div class="budget-header">
        <div class="breadcrumbs">
          <a [routerLink]="['/project', projectId()]">📁 Projeto</a> / 
          <span>{{ isNew() ? 'Novo Orçamento' : 'Orçamento ' + budget()?.version }}</span>
        </div>
        
        <div class="header-main">
          <h1 class="gradient-text">
            {{ isNew() ? 'Criar Orçamento' : 'Orçamento ' + (budget()?.version || '') }}
          </h1>
          <div class="budget-status-badges" *ngIf="!isNew() && budget()">
            <span class="badge badge-aprov" *ngIf="budget()?.approved">Aprovado</span>
            <span class="badge badge-negoc" *ngIf="!budget()?.approved">Pendente</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons Row -->
      <div class="action-bar glass-card">
        <div class="left-actions">
          <a [routerLink]="['/project', projectId()]" class="btn btn-secondary">
            ⬅️ Voltar ao Projeto
          </a>
        </div>
        <div class="right-actions" *ngIf="!isNew() && budget()">
          <button (click)="printBudget()" class="btn btn-secondary">
            🖨️ Imprimir / Salvar PDF
          </button>
          <button (click)="cloneBudget()" class="btn btn-secondary">
            🔀 Clonar (Nova Versão)
          </button>
          <button 
            *ngIf="!budget()?.approved" 
            (click)="approveBudget()" 
            class="btn btn-primary"
          >
            ✅ Aprovar Orçamento
          </button>
          <button 
            *ngIf="!budget()?.approved" 
            (click)="deleteBudget()" 
            class="btn btn-danger"
          >
            🗑️ Excluir
          </button>
        </div>
      </div>

      <!-- Main Layout Grid: Form on Left, Client info on Right -->
      <div class="budget-grid">
        
        <!-- Budget Form/Table Panel -->
        <div class="glass-card main-panel">
          <h3 class="panel-title">📝 Itens do Orçamento</h3>
          
          <!-- Mode: View/Read-Only (Existing Budget) -->
          <div *ngIf="!isNew() && budget()">
            <table class="budget-table-view">
              <thead>
                <tr>
                  <th>Descrição do Item</th>
                  <th class="text-center" style="width: 100px;">Qtd</th>
                  <th class="text-right" style="width: 150px;">Valor Unit.</th>
                  <th class="text-right" style="width: 150px;">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of budget()?.items">
                  <td>{{ item.description }}</td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-right">{{ item.unitValue | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                  <td class="text-right">{{ (item.quantity * item.unitValue) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right font-bold">Total Geral:</td>
                  <td class="text-right font-bold total-val-highlight">
                    {{ budget()?.totalValue | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </td>
                </tr>
              </tfoot>
            </table>

            <!-- Observations / Notes -->
            <div class="notes-display-box" *ngIf="budget()?.notes">
              <strong>Observações / Notas:</strong>
              <p>{{ budget()?.notes }}</p>
            </div>
          </div>

          <!-- Mode: Create (New Budget) -->
          <div *ngIf="isNew()">
            <form (ngSubmit)="saveBudget()" #budgetForm="ngForm">
              
              <!-- Option to edit version manually, or auto-generate -->
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label class="form-label" for="budget-version">Versão (Opcional)</label>
                  <input 
                    type="text" 
                    id="budget-version"
                    name="version" 
                    class="form-input" 
                    [(ngModel)]="newBudgetVersion"
                    placeholder="Ex: V1, V2 (Deixe em branco para auto-gerar)"
                  />
                </div>
              </div>

              <!-- Editable items list -->
              <div class="items-editor">
                <table class="budget-table-edit">
                  <thead>
                    <tr>
                      <th>Descrição do Item *</th>
                      <th style="width: 90px;">Qtd *</th>
                      <th style="width: 140px;">Unitário (R$) *</th>
                      <th style="width: 120px;" class="text-right">Total</th>
                      <th style="width: 50px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of items(); let idx = index">
                      <td>
                        <input 
                          type="text" 
                          [(ngModel)]="item.description" 
                          name="item-desc-{{idx}}" 
                          class="form-input table-input" 
                          placeholder="Ex: Armário aéreo em MDF 18mm"
                          required
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          [(ngModel)]="item.quantity" 
                          (input)="calculateTotals()"
                          name="item-qty-{{idx}}" 
                          class="form-input table-input text-center" 
                          min="1" 
                          required
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          [(ngModel)]="item.unitValue" 
                          (input)="calculateTotals()"
                          name="item-val-{{idx}}" 
                          class="form-input table-input text-right" 
                          min="0" 
                          step="0.01"
                          required
                        />
                      </td>
                      <td class="text-right val-col">
                        {{ ((item.quantity || 0) * (item.unitValue || 0)) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                      </td>
                      <td class="text-center">
                        <button 
                          type="button" 
                          (click)="removeItemRow(idx)" 
                          class="btn-icon-delete"
                          title="Remover Item"
                          *ngIf="items().length > 1"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <button type="button" (click)="addItemRow()" class="btn btn-secondary btn-sm btn-add-row">
                  ➕ Adicionar Linha
                </button>
              </div>

              <!-- Observations / Notes -->
              <div class="form-group" style="margin-top: 24px;">
                <label class="form-label" for="budget-notes-input">Observações / Condições de Pagamento</label>
                <textarea 
                  id="budget-notes-input"
                  name="notes" 
                  class="form-input text-area" 
                  rows="4" 
                  [(ngModel)]="notes"
                  placeholder="Ex: Entrada de 50% + 3x no cartão. Prazo de entrega: 30 dias úteis."
                ></textarea>
              </div>

              <div class="form-actions" style="margin-top: 24px;">
                <div class="total-summary-box">
                  <span class="total-label">Total do Orçamento:</span>
                  <span class="total-value">{{ grandTotal() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                </div>
                
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  [disabled]="!budgetForm.valid || saving()"
                >
                  {{ saving() ? 'Salvando...' : '💾 Salvar Orçamento' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Project & Client Info Panel -->
        <div class="glass-card info-panel">
          <h3 class="panel-title">👤 Informações de Faturamento</h3>
          <div class="info-content" *ngIf="project()">
            <div class="info-item">
              <span class="info-label">Projeto:</span>
              <span class="info-val font-bold">{{ project()?.name }}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-item">
              <span class="info-label">Cliente:</span>
              <span class="info-val">{{ project()?.client?.name }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Telefone:</span>
              <span class="info-val">{{ project()?.client?.phone }}</span>
            </div>

            <div class="info-item" *ngIf="project()?.client?.email">
              <span class="info-label">E-mail:</span>
              <span class="info-val">{{ project()?.client?.email }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Endereço da Obra:</span>
              <span class="info-val work-address">{{ project()?.client?.workAddress }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 2. PRINT-ONLY CLEAN HTML LAYOUT (Visible in window.print()) -->
    <div class="printable-budget print-only">
      <div class="print-header">
        <div class="print-company-info">
          <h2>{{ authService.currentUser()?.tenantName || 'Marcena.net' }}</h2>
          <p>Móveis Planejados sob Medida de Alta Qualidade</p>
          <p>Contato: {{ authService.currentUser()?.email }}</p>
        </div>
        <div class="print-budget-meta text-right">
          <h1>ORÇAMENTO</h1>
          <p><strong>Orçamento Versão:</strong> {{ isNew() ? newBudgetVersion || 'DRAFT' : budget()?.version }}</p>
          <p><strong>Data:</strong> {{ (isNew() ? todayDate : budget()?.createdAt) | date:'dd/MM/yyyy' }}</p>
          <p *ngIf="!isNew() && budget()?.approved"><strong>Status:</strong> APROVADO</p>
        </div>
      </div>

      <div class="print-divider"></div>

      <div class="print-client-section">
        <h3>DADOS DO CLIENTE</h3>
        <table class="print-client-table">
          <tr>
            <td><strong>Cliente:</strong> {{ project()?.client?.name }}</td>
            <td><strong>WhatsApp/Tel:</strong> {{ project()?.client?.phone }}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Endereço da Obra:</strong> {{ project()?.client?.workAddress }}</td>
          </tr>
          <tr *ngIf="project()?.client?.email">
            <td colspan="2"><strong>E-mail:</strong> {{ project()?.client?.email }}</td>
          </tr>
        </table>
      </div>

      <div class="print-project-section">
        <h3>DESCRIÇÃO DO PROJETO / SERVIÇO</h3>
        <p><strong>Nome do Projeto:</strong> {{ project()?.name }}</p>
        <p *ngIf="project()?.description">{{ project()?.description }}</p>
      </div>

      <div class="print-items-section">
        <h3>ITENS E ESPECIFICAÇÕES</h3>
        <table class="print-items-table">
          <thead>
            <tr>
              <th>Descrição do Item</th>
              <th style="width: 80px; text-align: center;">Qtd</th>
              <th style="width: 130px; text-align: right;">Unitário</th>
              <th style="width: 140px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of (isNew() ? items() : budget()?.items)">
              <td>{{ item.description }}</td>
              <td style="text-align: center;">{{ item.quantity }}</td>
              <td style="text-align: right;">{{ item.unitValue | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td style="text-align: right;">{{ ((item.quantity || 0) * (item.unitValue || 0)) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: bold; border-top: 2px solid #000;">Valor Total Geral:</td>
              <td style="text-align: right; font-weight: bold; font-size: 14pt; border-top: 2px solid #000;">
                {{ (isNew() ? grandTotal() : budget()?.totalValue) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="print-notes-section" *ngIf="isNew() ? notes : budget()?.notes">
        <h3>OBSERVAÇÕES E CONDIÇÕES</h3>
        <p class="print-notes-text">{{ isNew() ? notes : budget()?.notes }}</p>
      </div>

      <div class="print-signatures">
        <div class="signature-line">
          <div class="line"></div>
          <p>{{ authService.currentUser()?.tenantName || 'Marcena.net' }}</p>
        </div>
        <div class="signature-line">
          <div class="line"></div>
          <p>{{ project()?.client?.name }} (Cliente)</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .budget-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .budget-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .breadcrumbs {
      font-size: 13px;
      color: hsl(var(--text-muted));
    }
    .breadcrumbs a {
      color: hsl(var(--text-muted));
      text-decoration: none;
    }
    .breadcrumbs a:hover {
      text-decoration: underline;
    }
    .header-main {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-main h1 {
      font-size: 32px;
    }

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
    }
    .right-actions {
      display: flex;
      gap: 10px;
    }

    .budget-grid {
      display: grid;
      grid-template-columns: 3fr 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 1000px) {
      .budget-grid {
        grid-template-columns: 1fr;
      }
    }

    .panel-title {
      font-size: 18px;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      padding-bottom: 10px;
    }

    /* Table View styles */
    .budget-table-view {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .budget-table-view th, .budget-table-view td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    .budget-table-view th {
      font-size: 12px;
      text-transform: uppercase;
      color: hsl(var(--text-muted));
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .budget-table-view td {
      font-size: 14px;
      color: hsl(var(--text-main));
    }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .font-bold { font-weight: 700; }
    .total-val-highlight {
      font-size: 18px;
      color: #4ade80 !important;
    }

    .notes-display-box {
      background: rgba(0, 0, 0, 0.015);
      border: 1px solid rgba(0, 0, 0, 0.03);
      padding: 16px;
      border-radius: var(--radius-sm);
      margin-top: 20px;
    }
    .notes-display-box strong {
      display: block;
      font-size: 13px;
      color: hsl(var(--text-muted));
      margin-bottom: 8px;
    }
    .notes-display-box p {
      font-size: 14px;
      white-space: pre-wrap;
      color: hsl(var(--text-main));
      line-height: 1.5;
    }

    /* Table Edit styles */
    .budget-table-edit {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .budget-table-edit th {
      padding: 8px 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: hsl(var(--text-muted));
      font-weight: 600;
    }
    .budget-table-edit td {
      padding: 6px;
    }
    .table-input {
      padding: 8px 12px;
      font-size: 13px;
    }
    .val-col {
      font-size: 13px;
      font-weight: 600;
      color: hsl(var(--text-main));
    }
    .btn-icon-delete {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: bold;
      transition: var(--transition-smooth);
    }
    .btn-icon-delete:hover {
      background: #ef4444;
      color: white;
    }
    .btn-add-row {
      margin-top: 10px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .text-area {
      resize: vertical;
    }
    
    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      padding-top: 20px;
    }
    .total-summary-box {
      display: flex;
      flex-direction: column;
    }
    .total-label {
      font-size: 12px;
      color: hsl(var(--text-muted));
      text-transform: uppercase;
      font-weight: 600;
    }
    .total-value {
      font-size: 26px;
      font-weight: 800;
      color: #4ade80;
    }

    /* Info Panel on the right */
    .info-panel {
      padding: 24px;
    }
    .info-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: hsl(var(--text-muted));
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .info-val {
      font-size: 14px;
      color: hsl(var(--text-main));
    }
    .work-address {
      font-size: 13px;
      color: hsl(var(--text-muted));
      line-height: 1.4;
    }
    .divider {
      height: 1px;
      background: rgba(0, 0, 0, 0.05);
      margin: 4px 0;
    }

    /* Print-Only HTML layout CSS details */
    .printable-budget {
      background: white !important;
      color: black !important;
      font-family: Arial, sans-serif;
      padding: 0;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .print-company-info h2 {
      font-size: 20px;
      color: black !important;
      margin-bottom: 4px;
    }
    .print-company-info p {
      font-size: 10px;
      color: #555 !important;
      margin: 2px 0;
    }
    .print-budget-meta h1 {
      font-size: 28px;
      margin: 0 0 6px 0;
      color: black !important;
      letter-spacing: 2px;
    }
    .print-budget-meta p {
      font-size: 11px;
      margin: 4px 0;
    }
    .print-divider {
      height: 2px;
      background-color: #000;
      margin: 15px 0;
    }
    .print-client-section h3, 
    .print-project-section h3, 
    .print-items-section h3,
    .print-notes-section h3 {
      font-size: 12px;
      text-transform: uppercase;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin: 20px 0 10px 0;
      color: black !important;
      font-weight: bold;
    }
    .print-client-table {
      width: 100%;
      font-size: 11px;
      border-collapse: collapse;
    }
    .print-client-table td {
      padding: 6px 0;
      color: black !important;
    }
    .print-project-section p {
      font-size: 11px;
      color: black !important;
      line-height: 1.4;
    }
    .print-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 10px;
    }
    .print-items-table th {
      background-color: #f2f2f2 !important;
      border: 1px solid #ddd !important;
      padding: 8px 10px;
      font-weight: bold;
      color: black !important;
    }
    .print-items-table td {
      border: 1px solid #ddd !important;
      padding: 8px 10px;
      color: black !important;
    }
    .print-notes-text {
      font-size: 10px;
      white-space: pre-wrap;
      line-height: 1.4;
      color: black !important;
    }
    .print-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding: 0 40px;
    }
    .signature-line {
      width: 250px;
      text-align: center;
    }
    .signature-line .line {
      border-bottom: 1px solid #000;
      margin-bottom: 6px;
    }
    .signature-line p {
      font-size: 11px;
      color: black !important;
    }
  `]
})
export class BudgetForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly budgetService = inject(BudgetService);
  private readonly projectService = inject(ProjectService);
  protected readonly authService = inject(AuthService);

  // States
  protected readonly projectId = signal<number>(0);
  protected readonly budgetId = signal<number | null>(null);
  protected readonly isNew = signal<boolean>(true);
  protected readonly saving = signal<boolean>(false);

  // Loaded Entities
  protected readonly project = signal<Project | null>(null);
  protected readonly budget = signal<Budget | null>(null);

  // Form Fields
  protected newBudgetVersion = '';
  protected notes = '';
  protected readonly items = signal<BudgetItem[]>([
    { description: '', quantity: 1, unitValue: 0 }
  ]);
  protected readonly grandTotal = signal<number>(0);
  protected readonly todayDate = new Date();

  ngOnInit() {
    // 1. Resolve projectId or budgetId from route
    this.route.paramMap.subscribe((params) => {
      const pId = params.get('projectId');
      const bId = params.get('id');

      if (pId) {
        this.projectId.set(parseInt(pId));
        this.isNew.set(true);
        this.loadProjectDetails(this.projectId());
      } else if (bId) {
        const id = parseInt(bId);
        this.budgetId.set(id);
        this.isNew.set(false);
        this.loadBudgetDetails(id);
      }
    });
  }

  private loadProjectDetails(id: number) {
    this.projectService.getProjectById(id).subscribe({
      next: (project) => this.project.set(project),
      error: (err) => console.error('Erro ao buscar projeto:', err)
    });
  }

  private loadBudgetDetails(id: number) {
    this.budgetService.getBudgetById(id).subscribe({
      next: (budget) => {
        this.budget.set(budget);
        this.projectId.set(budget.projectId);
        if (budget.project) {
          this.project.set(budget.project as any);
        }
      },
      error: (err) => console.error('Erro ao buscar orçamento:', err)
    });
  }

  protected addItemRow() {
    this.items.update((current) => [...current, { description: '', quantity: 1, unitValue: 0 }]);
    this.calculateTotals();
  }

  protected removeItemRow(index: number) {
    this.items.update((current) => current.filter((_, i) => i !== index));
    this.calculateTotals();
  }

  protected calculateTotals() {
    let total = 0;
    for (const item of this.items()) {
      const qty = item.quantity || 0;
      const unit = item.unitValue || 0;
      total += qty * unit;
    }
    this.grandTotal.set(total);
  }

  protected saveBudget() {
    if (this.items().some((i) => !i.description || i.quantity <= 0 || i.unitValue < 0)) {
      alert('Por favor, preencha todos os campos obrigatórios com valores válidos.');
      return;
    }

    this.saving.set(true);
    const payload: Partial<Budget> = {
      projectId: this.projectId(),
      version: this.newBudgetVersion.trim() || undefined,
      items: this.items(),
      notes: this.notes.trim() || undefined
    };

    this.budgetService.createBudget(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/project', this.projectId()]);
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Erro ao salvar orçamento:', err);
        alert(err.error?.error || 'Erro ao criar orçamento. Verifique se os dados estão corretos.');
      }
    });
  }

  protected cloneBudget() {
    const id = this.budgetId();
    if (!id) return;
    this.budgetService.cloneBudget(id).subscribe({
      next: (cloned) => {
        this.router.navigate(['/budget', cloned.id]).then(() => {
          this.loadBudgetDetails(cloned.id);
        });
      },
      error: (err) => {
        console.error('Erro ao clonar orçamento:', err);
        alert('Erro ao clonar orçamento.');
      }
    });
  }

  protected approveBudget() {
    const id = this.budgetId();
    if (!id) return;
    if (!confirm('Deseja realmente aprovar esta versão de orçamento? Isto definirá o valor total do projeto e atualizará seu status para Aprovado.')) {
      return;
    }
    this.budgetService.approveBudget(id).subscribe({
      next: () => {
        this.loadBudgetDetails(id);
      },
      error: (err) => {
        console.error('Erro ao aprovar orçamento:', err);
        alert('Erro ao aprovar orçamento.');
      }
    });
  }

  protected deleteBudget() {
    const id = this.budgetId();
    if (!id) return;
    if (!confirm('Deseja realmente excluir permanentemente este orçamento?')) {
      return;
    }
    this.budgetService.deleteBudget(id).subscribe({
      next: () => {
        this.router.navigate(['/project', this.projectId()]);
      },
      error: (err) => {
        console.error('Erro ao excluir orçamento:', err);
        alert('Erro ao excluir orçamento.');
      }
    });
  }

  protected printBudget() {
    window.print();
  }
}
