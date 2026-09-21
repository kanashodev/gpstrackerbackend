const express = require('express');

const authRouter = require('./routes/auth');
const rotaRouter = require('./routes/rota');
const gpsRoutes = require('./routes/gps');
const app = express();

const PORT = 3000;

// Permite receber JSON
app.use(express.json());


// ========================================
// LOG DAS REQUISIÇÕES
// ========================================

app.use((req, res, next) => {

    res.on('finish', () => {

        const hash =
            req.body &&
            typeof req.body.hash === 'string'
                ? req.body.hash
                : 'Não informado';

        const agora = new Date();

        const dataHora =
            agora.toLocaleDateString('pt-BR') +
            ' ' +
            agora.toLocaleTimeString('pt-BR');

        console.log('');
        console.log('========================================');
        console.log(`[Requisição recebida - HTTP ${res.statusCode}]`);
        console.log(`[Origem: Hash: ${hash}]`);
        console.log(`[Data/Hora: ${dataHora}]`);

        // Resultado da operação
        if (req.path === '/rota' && res.statusCode === 200) {

            if (res.locals.rotaEntregue === true) {
                console.log('[Rota: Entregue]');
            } else {
                console.log('[Rota: Não encontrada]');
            }

        } else if (
            req.path === '/rota/finalizar' &&
            res.statusCode === 200
        ) {

            console.log('[Rota: Finalizada]');
        }

        console.log('========================================');
    });

    next();
});


// ========================================
// ROTAS
// ========================================

app.use('/', authRouter);
app.use('/', rotaRouter);
app.use('/gps', gpsRoutes);

// ========================================
// JSON INVÁLIDO
// ========================================

app.use((err, req, res, next) => {

    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        'body' in err
    ) {

        return res.status(400).json({
            hasRoute: false,
            erro: 'JSON inválido'
        });
    }

    next(err);
});


// ========================================
// ERRO INTERNO
// ========================================

app.use((err, req, res, next) => {

    console.error(err);

    return res.status(500).json({
        erro: 'Erro interno do servidor'
    });
});


// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {

    console.log(`API rodando na porta ${PORT}`);
});