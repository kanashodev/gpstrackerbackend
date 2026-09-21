const db = require('../database');

function cadastrarCaminhao(nome, placa) {
    const dataCadastro = new Date().toISOString();

    const sql = `
        INSERT INTO caminhoes (
            nome,
            placa,
            data_cadastro
        )
        VALUES (?, ?, ?)
    `;

    const resultado = db.prepare(sql).run(
        nome,
        placa,
        dataCadastro
    );

    return {
        id: resultado.lastInsertRowid,
        nome,
        placa,
        dataCadastro
    };
}

function buscarTodosCaminhoes() {
    const sql = `
        SELECT
            id,
            nome,
            placa,
            data_cadastro
        FROM caminhoes
        ORDER BY id ASC
    `;

    return db.prepare(sql).all();
}

function buscarCaminhaoPorId(id) {
    const sql = `
        SELECT
            id,
            nome,
            placa,
            data_cadastro
        FROM caminhoes
        WHERE id = ?
    `;

    return db.prepare(sql).get(id);
}

function deletarCaminhao(id) {
    const sql = `
        DELETE FROM caminhoes
        WHERE id = ?
    `;

    const resultado = db.prepare(sql).run(id);

    return resultado.changes > 0;
}

module.exports = {
    cadastrarCaminhao,
    buscarTodosCaminhoes,
    buscarCaminhaoPorId,
    deletarCaminhao
};