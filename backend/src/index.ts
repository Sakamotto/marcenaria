import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', router);

// Rota padrão de status
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    version: '1.1.0',
    service: 'CRM Marcenaria API'
  });
});

// Tratamento global de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado na aplicação:', err);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

// Inicializa o servidor
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`===================================================`);
    console.log(` Servidor CRM Marcenaria rodando na porta ${port}`);
    console.log(` URL base: http://localhost:${port}/api`);
    console.log(`===================================================`);
  });
}

export default app;
