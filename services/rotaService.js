
const db = require('../database');

function buscarMotoristasDisponiveis() {
    return db.prepare(`
        SELECT id, hash, status
        FROM motoristas
        WHERE status = 'disponivel'
        ORDER BY id
    `).all();
}

function buscarTodosMotoristas() {
    return db.prepare(`
        SELECT id, hash, status
        FROM motoristas
        ORDER BY id
    `).all();
}

function buscarTodosCaminhoes() {
    return db.prepare(`
        SELECT id, nome, placa
        FROM caminhoes
        ORDER BY id
    `).all();
}

function criarRota({ motoristaId, caminhaoId, nomeRota, notas }) {
    const motorista = db.prepare(`
        SELECT id, hash, status
        FROM motoristas
        WHERE id = ?
    `).get(motoristaId);

    if (!motorista) {
        throw new Error('Motorista não encontrado.');
    }

    if (motorista.status !== 'disponivel') {
        throw new Error('Motorista já está ocupado/em rota.');
    }

    const caminhao = db.prepare(`
        SELECT id, nome, placa
        FROM caminhoes
        WHERE id = ?
    `).get(caminhaoId);

    if (!caminhao) {
        throw new Error('Caminhão não encontrado.');
    }

    const inserirRota = db.transaction(() => {
        const agora = new Date();
        const dataRota = agora.toISOString().slice(0, 10);
        const horaInicio = agora.toTimeString().slice(0, 8);

        const resultadoRota = db.prepare(`
            INSERT INTO rotas (
                motorista_id,
                caminhao_id,
                nome,
                quantidade_notas,
                data_criacao,
                data_rota,
                hora_inicio,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ativa')
        `).run(
            motoristaId,
            caminhaoId,
            nomeRota,
            notas.length,
            agora.toISOString(),
            dataRota,
            horaInicio
        );

        const rotaId = Number(resultadoRota.lastInsertRowid);

        const inserirNota = db.prepare(`
            INSERT INTO notas_rota (
                rota_id,
                numero_nota
            )
            VALUES (?, ?)
        `);

        for (const numeroNota of notas) {
            inserirNota.run(rotaId, numeroNota);
        }

        db.prepare(`
            UPDATE motoristas
            SET status = 'ocupado'
            WHERE id = ?
        `).run(motoristaId);

        return rotaId;
    });

    const rotaId = inserirRota();

    return {
        id: rotaId,
        motoristaId,
        motoristaHash: motorista.hash,
        caminhaoId,
        caminhaoNome: caminhao.nome,
        caminhaoPlaca: caminhao.placa,
        nomeRota,
        quantidadeNotas: notas.length,
        notas,
        status: 'ativa'
    };
}

function buscarRotasAtivas() {
    return db.prepare(`
        SELECT
            r.id,
            r.nome,
            r.quantidade_notas,
            r.data_rota,
            r.hora_inicio,
            r.status,
            m.id AS motorista_id,
            m.hash AS motorista_hash,
            c.id AS caminhao_id,
            c.nome AS caminhao_nome,
            c.placa AS caminhao_placa
        FROM rotas r
        INNER JOIN motoristas m ON m.id = r.motorista_id
        INNER JOIN caminhoes c ON c.id = r.caminhao_id
        WHERE r.status = 'ativa'
        ORDER BY r.id DESC
    `).all();
}

function buscarRotasFinalizadas(data) {
    return db.prepare(`
        SELECT
            r.id,
            r.nome,
            r.quantidade_notas,
            r.data_rota,
            r.hora_inicio,
            r.hora_finalizacao,
            r.status,
            m.id AS motorista_id,
            m.hash AS motorista_hash,
            c.id AS caminhao_id,
            c.nome AS caminhao_nome,
            c.placa AS caminhao_placa
        FROM rotas r
        INNER JOIN motoristas m ON m.id = r.motorista_id
        INNER JOIN caminhoes c ON c.id = r.caminhao_id
        WHERE r.status = 'finalizada'
          AND r.data_rota = ?
        ORDER BY r.id DESC
    `).all(data);
}

function buscarNotasDaRota(rotaId) {
    return db.prepare(`
        SELECT id, numero_nota
        FROM notas_rota
        WHERE rota_id = ?
        ORDER BY id
    `).all(rotaId);
}

function finalizarRota(rotaId) {
    const rota = db.prepare(`
        SELECT id, motorista_id, status
        FROM rotas
        WHERE id = ?
    `).get(rotaId);

    if (!rota) {
        throw new Error('Rota não encontrada.');
    }

    if (rota.status === 'finalizada') {
        throw new Error('Essa rota já está finalizada.');
    }

    const agora = new Date();
    const horaFinalizacao = agora.toTimeString().slice(0, 8);

    const finalizar = db.transaction(() => {
        db.prepare(`
            UPDATE rotas
            SET status = 'finalizada',
                hora_finalizacao = ?
            WHERE id = ?
        `).run(horaFinalizacao, rotaId);

        db.prepare(`
            UPDATE motoristas
            SET status = 'disponivel'
            WHERE id = ?
        `).run(rota.motorista_id);
    });

    finalizar();

    return {
        id: rotaId,
        status: 'finalizada',
        horaFinalizacao
    };
}

module.exports = {
    criarRota,
    buscarMotoristasDisponiveis,
    buscarTodosMotoristas,
    buscarTodosCaminhoes,
    buscarRotasAtivas,
    buscarRotasFinalizadas,
    buscarNotasDaRota,
    finalizarRota
};
