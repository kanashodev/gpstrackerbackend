const Database = require('better-sqlite3');

const db = new Database('database.db');

db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS motoristas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL UNIQUE,
        data_cadastro TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL DEFAULT 'disponivel'
    );

    CREATE TABLE IF NOT EXISTS gps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        motorista_id INTEGER NOT NULL UNIQUE,
        data_cadastro TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS caminhoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        placa TEXT NOT NULL UNIQUE,
        data_cadastro TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rotas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        motorista_id INTEGER NOT NULL,
        caminhao_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        quantidade_notas INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'ativa',
        data_criacao TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (motorista_id) REFERENCES motoristas(id) ON DELETE CASCADE,
        FOREIGN KEY (caminhao_id) REFERENCES caminhoes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notas_rota (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rota_id INTEGER NOT NULL,
        numero_nota TEXT NOT NULL,
        FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gps_pontos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rota_id INTEGER NOT NULL,
        ponto TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        data_hora_gps TEXT NOT NULL,
        data_hora_recebimento TEXT,
        FOREIGN KEY (rota_id) REFERENCES rotas(id) ON DELETE CASCADE
    );
`);

// Mantém bancos criados em versões anteriores compatíveis com a nova coluna de status.
const colunasRotas = db.prepare('PRAGMA table_info(rotas)').all();
const possuiStatus = colunasRotas.some(coluna => coluna.name === 'status');

if (!possuiStatus) {
    db.exec(`
        ALTER TABLE rotas
        ADD COLUMN status TEXT NOT NULL DEFAULT 'ativa';
    `);
}


// Migração para bancos criados em versões anteriores.
// Adiciona os novos campos sem apagar os dados existentes.
function adicionarColunaSeNaoExiste(tabela, coluna, definicao) {
    const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all();

    if (!colunas.some(c => c.name === coluna)) {
        db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
    }
}

adicionarColunaSeNaoExiste(
    'motoristas',
    'status',
    "TEXT NOT NULL DEFAULT 'disponivel'"
);

adicionarColunaSeNaoExiste(
    'rotas',
    'data_rota',
    "TEXT NOT NULL DEFAULT (date('now'))"
);

adicionarColunaSeNaoExiste(
    'rotas',
    'hora_inicio',
    "TEXT NOT NULL DEFAULT (time('now'))"
);

adicionarColunaSeNaoExiste(
    'rotas',
    'hora_finalizacao',
    'TEXT'
);

adicionarColunaSeNaoExiste(
    'rotas',
    'status',
    "TEXT NOT NULL DEFAULT 'ativa'"
);

// ======================================================
// MIGRAÇÃO GPS
// ======================================================

// Adiciona a coluna ponto em bancos antigos.
adicionarColunaSeNaoExiste(
    'gps_pontos',
    'ponto',
    'TEXT'
);

// Índice para impedir ponto duplicado dentro da mesma rota.
db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_gps_pontos_rota_ponto
    ON gps_pontos (rota_id, ponto);
`);

module.exports = db;