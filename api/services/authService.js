const db = require('../../database');

function autenticarHash(hash) {
    const motorista = db.prepare(`
        SELECT id, hash, status
        FROM motoristas
        WHERE hash = ?
    `).get(hash);

    if (!motorista) {
        return null;
    }

    return motorista;
}

module.exports = {
    autenticarHash
};
