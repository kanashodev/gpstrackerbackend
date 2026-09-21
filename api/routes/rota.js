const express = require('express');

const router = express.Router();

const db = require('../../database');


// ========================================
// CONSULTAR ROTA
// ========================================

router.post('/rota', (req, res) => {

    if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        return res.status(400).json({
            hasRoute: false,
            erro: 'Formato inválido'
        });
    }

    const { hash } = req.body;

    if (
        typeof hash !== 'string' ||
        hash.trim() === ''
    ) {
        return res.status(400).json({
            hasRoute: false,
            erro: 'Formato inválido'
        });
    }

    const hashLimpo = hash.trim();

    const motorista = db.prepare(`
        SELECT id
        FROM motoristas
        WHERE hash = ?
    `).get(hashLimpo);

    if (!motorista) {
        return res.status(401).json({
            hasRoute: false,
            erro: 'Hash inválido'
        });
    }

    const rota = db.prepare(`
        SELECT
            id,
            quantidade_notas
        FROM rotas
        WHERE motorista_id = ?
        AND status = 'ativa'
        LIMIT 1
    `).get(motorista.id);

    if (!rota) {
        return res.status(200).json({
            hasRoute: false
        });
    }

    const notas = db.prepare(`
        SELECT numero_nota
        FROM notas_rota
        WHERE rota_id = ?
        ORDER BY id ASC
    `).all(rota.id);

    const resposta = {
        hasRoute: true,
        rotaId: rota.id,
        quantidadeDeNotas: notas.length
    };

    notas.forEach((nota, index) => {
        resposta[`nota${index + 1}`] = nota.numero_nota;
    });

    return res.status(200).json(resposta);
});


// ========================================
// FINALIZAR ROTA
// ========================================

router.post('/rota/finalizar', (req, res) => {

    // ------------------------------------
    // Validação do formato
    // ------------------------------------

    if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        return res.status(400).json({
            hasRoute: false,
            erro: 'Formato inválido'
        });
    }

    const {
        hash,
        rotaId,
        quantidadeDeNotas,
        isDone
    } = req.body;


    // ------------------------------------
    // Validação do hash
    // ------------------------------------

    if (
        typeof hash !== 'string' ||
        hash.trim() === ''
    ) {
        return res.status(400).json({
            hasRoute: false,
            erro: 'Formato inválido'
        });
    }


    // ------------------------------------
    // Validação da rota
    // ------------------------------------

    if (
        typeof rotaId !== 'number' ||
        !Number.isInteger(rotaId) ||
        rotaId <= 0
    ) {
        return res.status(400).json({
            hasRoute: false,
            erro: 'Rota ID inválido'
        });
    }


    // ------------------------------------
    // Validação da quantidade de notas
    // ------------------------------------

    if (
        typeof quantidadeDeNotas !== 'number' ||
        !Number.isInteger(quantidadeDeNotas) ||
        quantidadeDeNotas < 0
    ) {
        return res.status(400).json({
            hasRoute: false,
            erro: 'Quantidade de notas inválida'
        });
    }


    // ------------------------------------
    // Validação do isDone
    // ------------------------------------

    if (isDone !== true) {
        return res.status(400).json({
            hasRoute: false,
            erro: 'isDone deve ser true'
        });
    }


    const hashLimpo = hash.trim();


    // ------------------------------------
    // Busca motorista
    // ------------------------------------

    const motorista = db.prepare(`
        SELECT id, hash
        FROM motoristas
        WHERE hash = ?
    `).get(hashLimpo);


    if (!motorista) {
        return res.status(401).json({
            hasRoute: false,
            erro: 'Hash inválido'
        });
    }


    // ------------------------------------
    // Busca rota
    // ------------------------------------

    const rota = db.prepare(`
        SELECT
            id,
            motorista_id,
            caminhao_id,
            nome,
            quantidade_notas,
            status
        FROM rotas
        WHERE id = ?
    `).get(rotaId);


    if (!rota) {
        return res.status(404).json({
            hasRoute: false,
            erro: 'Rota não encontrada'
        });
    }


    // ------------------------------------
    // Verifica se a rota pertence
    // ao motorista do hash
    // ------------------------------------

    if (rota.motorista_id !== motorista.id) {
        return res.status(403).json({
            hasRoute: false,
            erro: 'Rota não pertence ao motorista'
        });
    }


    // ------------------------------------
    // Verifica se já foi finalizada
    // ------------------------------------

    if (rota.status !== 'ativa') {
        return res.status(409).json({
            hasRoute: false,
            erro: 'Rota já finalizada'
        });
    }


    // ------------------------------------
    // Verifica quantidade de notas
    // ------------------------------------

    const notasBanco = db.prepare(`
        SELECT numero_nota
        FROM notas_rota
        WHERE rota_id = ?
        ORDER BY id ASC
    `).all(rotaId);


    if (quantidadeDeNotas !== notasBanco.length) {
        return res.status(400).json({
            hasRoute: false,
            erro: 'Quantidade de notas não corresponde à rota'
        });
    }


    // ====================================
    // FINALIZAÇÃO
    // ====================================

    const finalizar = db.transaction(() => {

        const agora = new Date();

        const horaFinalizacao =
            agora.toTimeString().slice(0, 8);

        // Finaliza rota
        db.prepare(`
            UPDATE rotas
            SET
                status = 'finalizada',
                hora_finalizacao = ?
            WHERE id = ?
        `).run(
            horaFinalizacao,
            rotaId
        );


        // Libera motorista
        db.prepare(`
            UPDATE motoristas
            SET status = 'disponivel'
            WHERE id = ?
        `).run(
            motorista.id
        );
    });


    try {

        finalizar();

    } catch (erro) {

        console.error(erro);

        return res.status(500).json({
            hasRoute: false,
            erro: 'Erro interno ao finalizar rota'
        });
    }


    // ====================================
    // RESPOSTA
    // ====================================

    return res.status(200).json({

        hasRoute: false,

        rotaId: rota.id,

        quantidadeDeNotas: notasBanco.length,

        ...Object.fromEntries(
            notasBanco.map((nota, index) => [
                `nota${index + 1}`,
                nota.numero_nota
            ])
        ),

        isDone: true,

        mensagem: `Rota ${rota.nome} Finalizada`
    });
});


module.exports = router;