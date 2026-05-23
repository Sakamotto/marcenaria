import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService, Client } from '../services/client';
import { ProjectService } from '../services/project';
import { Router } from '@angular/router';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  template: `
    <div class="clients-container animate-fade-in">
      <div class="clients-header">
        <div>
          <h1 class="gradient-text">Clientes</h1>
          <p>Cadastre e gerencie a carteira de clientes da marcenaria.</p>
        </div>
        <button (click)="openModal()" class="btn btn-primary">➕ Novo Cliente</button>
      </div>

      <!-- Barra de Busca -->
      <div class="search-bar-wrapper glass-card">
        🔍 <input 
          type="text" 
          placeholder="Buscar cliente por nome, telefone ou e-mail..." 
          class="search-input" 
          [(ngModel)]="searchQuery"
          (input)="filterClients()"
        />
      </div>

      <!-- Grid de Clientes -->
      <div class="clients-grid" *ngIf="filteredClients().length > 0; else emptyState">
        <div class="client-card glass-card" *ngFor="let client of filteredClients()">
          <div class="client-info">
            <h3>{{ client.name }}</h3>
            <div class="client-detail-item">📞 {{ client.phone }}</div>
            <div class="client-detail-item" *ngIf="client.email">✉️ {{ client.email }}</div>
            <div class="client-detail-item address">📍 {{ client.workAddress }}</div>
          </div>
          
          <div class="client-meta">
            <span class="project-count-badge">
              📁 {{ client._count?.projects || 0 }} Projeto(s)
            </span>
          </div>

          <div class="client-actions">
            <button (click)="openCreateProjectModal(client)" class="btn btn-secondary btn-sm" title="Novo Projeto">
              📁 Novo Projeto
            </button>
            <button (click)="openModal(client)" class="btn btn-secondary btn-sm" title="Editar Cliente">
              ✏️ Editar
            </button>
            <button (click)="deleteClient(client.id)" class="btn btn-danger btn-sm" title="Excluir Cliente">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="glass-card empty-state">
          <p>Nenhum cliente encontrado.</p>
        </div>
      </ng-template>
    </div> <!-- Fechando clients-container aqui -->

      <!-- Modal de Cliente (Cadastro/Edição) -->
      <div class="modal-backdrop" *ngIf="isModalOpen()">
        <div class="modal-card modal-wide glass-panel animate-fade-in">
          <div class="modal-header">
            <h3>{{ selectedClient() ? 'Editar Cliente' : 'Novo Cliente' }}</h3>
            <button (click)="closeModal()" class="close-btn">✕</button>
          </div>
          
          <form (ngSubmit)="saveClient(clientForm)" #clientForm="ngForm">
            <div class="form-group">
              <label class="form-label required" for="modal-name">Nome Completo</label>
              <input 
                type="text" 
                id="modal-name" 
                name="name" 
                class="form-input" 
                [(ngModel)]="clientModel.name" 
                required
                #nameCtrl="ngModel"
                placeholder="Ex: Ricardo Lima"
              />
              <div *ngIf="nameCtrl.invalid && (nameCtrl.touched || nameCtrl.dirty)" class="form-error-msg">
                ⚠️ O nome completo é obrigatório.
              </div>
            </div>
            
            <div class="form-grid-row">
              <div class="form-group">
                <label class="form-label required" for="modal-phone">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  id="modal-phone" 
                  name="phone" 
                  class="form-input" 
                  [(ngModel)]="clientModel.phone" 
                  [required]="true"
                  #phoneCtrl="ngModel"
                  mask="(00) 0000-0000||(00) 00000-0000"
                  [dropSpecialCharacters]="false"
                  placeholder="Ex: (21) 97654-3210"
                />
                <div *ngIf="phoneCtrl.invalid && (phoneCtrl.touched || phoneCtrl.dirty)" class="form-error-msg">
                  ⚠️ O telefone é obrigatório.
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="modal-email">E-mail (opcional)</label>
                <input 
                  type="email" 
                  id="modal-email" 
                  name="email" 
                  class="form-input" 
                  [(ngModel)]="clientModel.email"
                  placeholder="Ex: ricardo@gmail.com"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label required" for="modal-address">Endereço da Obra / Entrega</label>
              <textarea 
                id="modal-address" 
                name="workAddress" 
                class="form-input" 
                [(ngModel)]="clientModel.workAddress" 
                required
                #addressCtrl="ngModel"
                rows="2"
                placeholder="Rua, número, bairro, cidade - UF"
              ></textarea>
              <div *ngIf="addressCtrl.invalid && (addressCtrl.touched || addressCtrl.dirty)" class="form-error-msg">
                ⚠️ O endereço da obra é obrigatório.
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Criar Projeto para Cliente -->
      <div class="modal-backdrop" *ngIf="isProjectModalOpen()">
        <div class="glass-panel modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Novo Projeto para {{ clientForProject()?.name }}</h3>
            <button (click)="closeProjectModal()" class="close-btn">✕</button>
          </div>
          
          <form (ngSubmit)="saveProject(projectForm)" #projectForm="ngForm">
            <div class="form-group">
              <label class="form-label required" for="project-name">Nome do Projeto</label>
              <input 
                type="text" 
                id="project-name" 
                name="projectName" 
                class="form-input" 
                [(ngModel)]="projectModel.name" 
                required
                #projNameCtrl="ngModel"
                placeholder="ex: Cozinha Planejada MDF Louro Freijó"
              />
              <div *ngIf="projNameCtrl.invalid && (projNameCtrl.touched || projNameCtrl.dirty)" class="form-error-msg">
                ⚠️ O nome do projeto é obrigatório.
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="project-desc">Descrição / Detalhes</label>
              <textarea 
                id="project-desc" 
                name="projectDescription" 
                class="form-input" 
                rows="4"
                [(ngModel)]="projectModel.description"
                placeholder="Detalhes sobre módulos, puxadores, ferragens ou observações gerais..."
              ></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeProjectModal()" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                Criar Projeto
              </button>
            </div>
          </form>
        </div>
      </div>
  `,
  styles: [`
    .clients-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      width: 100%;
    }
    .clients-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .clients-header h1 {
      font-size: 32px;
      margin-bottom: 6px;
    }
    .clients-header p {
      color: hsl(var(--text-muted));
    }
    
    /* Search Bar */
    .search-bar-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
    }
    .search-input {
      background: transparent;
      border: none;
      outline: none;
      color: hsl(var(--text-main));
      font-size: 15px;
      width: 100%;
    }

    /* Grid */
    .clients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .client-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
    }
    .client-info h3 {
      font-size: 18px;
      margin-bottom: 12px;
    }
    .client-detail-item {
      font-size: 13px;
      color: hsl(var(--text-muted));
      margin-bottom: 6px;
    }
    .client-detail-item.address {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .project-count-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border-radius: 20px;
    }

    .client-actions {
      display: flex;
      gap: 8px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      padding-top: 14px;
      margin-top: auto;
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    /* Modais */
    .empty-state {
      padding: 60px;
      text-align: center;
      color: hsl(var(--text-muted));
      font-size: 15px;
    }
  `]
})
export class Clients implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  protected clients = signal<Client[]>([]);
  protected filteredClients = signal<Client[]>([]);
  protected searchQuery = '';

  // Modal de cliente
  protected readonly isModalOpen = signal(false);
  protected readonly selectedClient = signal<Client | null>(null);
  protected clientModel = {
    name: '',
    phone: '',
    email: '',
    workAddress: '',
  };

  // Modal de projeto
  protected readonly isProjectModalOpen = signal(false);
  protected readonly clientForProject = signal<Client | null>(null);
  protected projectModel = {
    name: '',
    description: '',
  };

  ngOnInit() {
    this.loadClients();
  }

  private loadClients() {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.filterClients();
      },
      error: (err) => console.error('Erro ao carregar clientes:', err)
    });
  }

  protected filterClients() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredClients.set(this.clients());
      return;
    }
    this.filteredClients.set(
      this.clients().filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          (c.email && c.email.toLowerCase().includes(query))
      )
    );
  }

  protected openModal(client?: Client) {
    if (client) {
      this.selectedClient.set(client);
      this.clientModel = {
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        workAddress: client.workAddress,
      };
    } else {
      this.selectedClient.set(null);
      this.clientModel = { name: '', phone: '', email: '', workAddress: '' };
    }
    this.isModalOpen.set(true);
  }

  protected closeModal() {
    this.isModalOpen.set(false);
  }

  protected saveClient(form: any) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    const clientData = { ...this.clientModel };
    const client = this.selectedClient();
    
    if (client) {
      this.clientService.updateClient(client.id, clientData).subscribe({
        next: () => {
          this.loadClients();
          this.closeModal();
        },
        error: (err) => console.error('Erro ao editar cliente:', err)
      });
    } else {
      this.clientService.createClient(clientData).subscribe({
        next: () => {
          this.loadClients();
          this.closeModal();
        },
        error: (err) => console.error('Erro ao cadastrar cliente:', err)
      });
    }
  }

  protected deleteClient(id: number) {
    if (confirm('Tem certeza de que deseja deletar este cliente? Isso removerá permanentemente todos os seus projetos e orçamentos vinculados.')) {
      this.clientService.deleteClient(id).subscribe({
        next: () => this.loadClients(),
        error: (err) => console.error('Erro ao deletar cliente:', err)
      });
    }
  }

  protected openCreateProjectModal(client: Client) {
    this.clientForProject.set(client);
    this.projectModel = { name: '', description: '' };
    this.isProjectModalOpen.set(true);
  }

  protected closeProjectModal() {
    this.isProjectModalOpen.set(false);
  }

  protected saveProject(form: any) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    const client = this.clientForProject();
    if (!client) return;

    const projectData = {
      clientId: client.id,
      name: this.projectModel.name,
      description: this.projectModel.description,
      status: 'Lead',
    };

    this.projectService.createProject(projectData).subscribe({
      next: (newProject) => {
        this.closeProjectModal();
        this.router.navigate(['/project', newProject.id]);
      },
      error: (err) => console.error('Erro ao criar projeto:', err)
    });
  }

}
