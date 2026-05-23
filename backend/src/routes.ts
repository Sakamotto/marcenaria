import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from './middleware/auth';
import { login, me, signup } from './controllers/authController';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from './controllers/clientController';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  patchProjectStatus,
  deleteProject,
} from './controllers/projectController';
import {
  getBudgetsByProject,
  getBudgetById,
  createBudget,
  cloneBudget,
  approveBudget,
  deleteBudget,
} from './controllers/budgetController';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
} from './controllers/taskController';
import {
  uploadAttachment,
  deleteAttachment,
  downloadAttachment,
} from './controllers/attachmentController';
import {
  updateProfile,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from './controllers/userController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Autenticação ---
router.post('/auth/login', login);
router.post('/auth/signup', signup);
router.get('/auth/me', authenticateToken, me);

// --- Clientes ---
router.get('/clients', authenticateToken, getClients);
router.get('/clients/:id', authenticateToken, getClientById);
router.post('/clients', authenticateToken, createClient);
router.put('/clients/:id', authenticateToken, updateClient);
router.delete('/clients/:id', authenticateToken, deleteClient);

// --- Projetos ---
router.get('/projects', authenticateToken, getProjects);
router.get('/projects/:id', authenticateToken, getProjectById);
router.post('/projects', authenticateToken, createProject);
router.put('/projects/:id', authenticateToken, updateProject);
router.patch('/projects/:id/status', authenticateToken, patchProjectStatus);
router.delete('/projects/:id', authenticateToken, deleteProject);

// --- Orçamentos ---
router.get('/budgets/project/:projectId', authenticateToken, getBudgetsByProject);
router.get('/budgets/:id', authenticateToken, getBudgetById);
router.post('/budgets', authenticateToken, createBudget);
router.post('/budgets/:id/clone', authenticateToken, cloneBudget);
router.patch('/budgets/:id/approve', authenticateToken, approveBudget);
router.delete('/budgets/:id', authenticateToken, deleteBudget);

// --- Tarefas ---
router.get('/tasks', authenticateToken, getTasks);
router.get('/tasks/:id', authenticateToken, getTaskById);
router.post('/tasks', authenticateToken, createTask);
router.put('/tasks/:id', authenticateToken, updateTask);
router.patch('/tasks/:id/toggle', authenticateToken, toggleTask);
router.delete('/tasks/:id', authenticateToken, deleteTask);

// --- Anexos ---
router.post('/attachments', authenticateToken, upload.single('file'), uploadAttachment);
router.delete('/attachments/:id', authenticateToken, deleteAttachment);
router.get('/attachments/:id/download', authenticateToken, downloadAttachment);

// --- Usuários e Equipe ---
router.put('/users/profile', authenticateToken, updateProfile);
router.get('/users', authenticateToken, getUsers);
router.post('/users', authenticateToken, createUser);
router.put('/users/:id', authenticateToken, updateUser);
router.delete('/users/:id', authenticateToken, deleteUser);

export default router;
