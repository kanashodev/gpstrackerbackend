
const db = require('../database');

function buscarMotorista(motoristaId) {
    return db.prepare(`
        SELECT id, hash
        FROM motoristas
        WHERE id = ?
    `).get(motoristaId);
}

function cadastrarGps(motoristaId) {
    const motorista = buscarMotorista(motoristaId);

    if (!motorista) {
        return {
            sucesso: false,
            erro: 'Motorista não encontrado.',
        };
    }

    const gpsExistente = db.prepare(`
        SELECT id
        FROM gps
        WHERE motorista_id = ?
    `).get(motoristaId);

    if (gpsExistente) {
        return {
            sucesso: false,
            erro: 'Este motorista já possui um GPS cadastrado.',
        };
    }

    const result = db.prepare(`
        INSERT INTO gps (motorista_id)
        VALUES (?)
    `).run(motoristaId);

    return {
        sucesso: true,
        gpsId: Number(result.lastInsertRowid),
        motoristaId: motorista.id,
        hash: motorista.hash,
    };
}


// ======================================================
// SALVAR PONTO GPS
// ======================================================

function salvarPontoGps({
    hash,
    rotaId,
    ponto,
    latitude,
    longitude,
    dataHoraGps
}) {

    // ------------------------------------------
    // 1. Verificar motorista pelo hash
    // ------------------------------------------

    const motorista = db.prepare(`
        SELECT id, hash
        FROM motoristas
        WHERE hash = ?
    `).get(hash);

    if (!motorista) {
        return {
            sucesso: false,
            status: 404,
            erro: 'Motorista não encontrado.'
        };
    }


    // ------------------------------------------
    // 2. Verificar se a rota pertence ao motorista
    // ------------------------------------------

    const rota = db.prepare(`
        SELECT id, motorista_id, status
        FROM rotas
        WHERE id = ?
        AND motorista_id = ?
    `).get(rotaId, motorista.id);

    if (!rota) {
        return {
            sucesso: false,
            status: 404,
            erro: 'Rota não encontrada para este motorista.'
        };
    }


    // ------------------------------------------
    // 3. Verificar se a rota está ativa
    // ------------------------------------------

    if (rota.status !== 'ativa') {
        return {
            sucesso: false,
            status: 400,
            erro: 'A rota não está ativa.'
        };
    }


    // ------------------------------------------
    // 4. Verificar ponto duplicado
    // ------------------------------------------

    const pontoExistente = db.prepare(`
        SELECT id
        FROM gps_pontos
        WHERE rota_id = ?
        AND ponto = ?
    `).get(rotaId, ponto);

    if (pontoExistente) {
        return {
            sucesso: false,
            status: 409,
            erro: 'Este ponto já foi registrado para esta rota.',
            ponto
        };
    }


    // ------------------------------------------
    // 5. Data/hora de recebimento
    // ------------------------------------------

    const dataHoraRecebimento = new Date().toISOString();


    // ------------------------------------------
    // 6. Salvar ponto
    // ------------------------------------------

    const resultado = db.prepare(`
        INSERT INTO gps_pontos (
            rota_id,
            ponto,
            latitude,
            longitude,
            data_hora_gps,
            data_hora_recebimento
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        rotaId,
        ponto,
        latitude,
        longitude,
        dataHoraGps,
        dataHoraRecebimento
    );


    // ------------------------------------------
    // 7. Retorno
    // ------------------------------------------

    return {
        sucesso: true,
        id: Number(resultado.lastInsertRowid),
        rotaId,
        ponto,
        latitude,
        longitude,
        dataHoraGps,
        dataHoraRecebimento
    };
}


// ======================================================
// BUSCAR PONTOS DE UMA ROTA
// ======================================================

function buscarPontosDaRota(rotaId) {

    // ------------------------------------------
    // 1. Buscar dados da rota
    // ------------------------------------------

    const rota = db.prepare(`
        SELECT
            id,
            nome,
            data_rota,
            hora_inicio,
            hora_finalizacao
        FROM rotas
        WHERE id = ?
    `).get(rotaId);

    if (!rota) {
        return null;
    }


    // ------------------------------------------
    // 2. Buscar pontos GPS da rota
    // ------------------------------------------

    const pontos = db.prepare(`
        SELECT
            ponto,
            latitude,
            longitude,
            data_hora_gps,
            data_hora_recebimento
        FROM gps_pontos
        WHERE rota_id = ?
        ORDER BY id ASC
    `).all(rotaId);


    // ------------------------------------------
    // 3. Criar link único do Google Maps
    // ------------------------------------------

    const linkGoogleMaps =
        `https://www.google.com/maps/dir/${pontos
            .map(ponto => `${ponto.latitude},${ponto.longitude}`)
            .join('/')}`;


    // ------------------------------------------
    // 4. Retornar dados
    // ------------------------------------------

    return {
        rotaId: rota.id,
        nomeRota: rota.nome,
        dataRota: rota.data_rota,
        horaInicio: rota.hora_inicio,
        horaFinalizacao: rota.hora_finalizacao,
        pontos,
        linkGoogleMaps
    };
}


module.exports = {
    cadastrarGps,
    buscarMotorista,
    salvarPontoGps,
    buscarPontosDaRota
};

