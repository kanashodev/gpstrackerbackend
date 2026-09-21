const crypto = require('crypto');
const db = require('../database');

function cadastrarMotorista() {
    const hash = crypto.randomBytes(32).toString('hex');

    const stmt = db.prepare(`
        INSERT INTO motoristas (hash)
        VALUES (?)
    `);

    const result = stmt.run(hash);

    return {
        id: Number(result.lastInsertRowid),
        hash,
    };
}

function listarMotoristas() {
    return db.prepare(`
        SELECT
            id,
            hash,
            data_cadastro
        FROM motoristas
        ORDER BY id
    `).all();
}

function buscarMotoristaPorId(id) {
    return db.prepare(`
        SELECT
            id,
            hash,
            data_cadastro
        FROM motoristas
        WHERE id = ?
    `).get(id);
}

function deletarMotorista(id) {
    const result = db.prepare(`
        DELETE FROM motoristas
        WHERE id = ?
    `).run(id);

    return result.changes > 0;
}

module.exports = {
    cadastrarMotorista,
    listarMotoristas,
    buscarMotoristaPorId,
    deletarMotorista,
};
