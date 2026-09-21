
const readline = require('readline');
const { exec } = require('child_process');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ======================================================
// BANCO DE DADOS
// ======================================================

const dbPath = path.join(__dirname, '../../database.db');

const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

console.log('BANCO USADO:', dbPath);


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


// ======================================================
// CONFIGURAÇÃO DO TXT
// ======================================================

const txtPath = path.join(__dirname, 'gps.txt');


// ======================================================
// PERGUNTAR
// ======================================================

function perguntar(pergunta) {
    return new Promise(resolve => {
        rl.question(pergunta, resposta => {
            resolve(resposta.trim());
        });
    });
}


// ======================================================
// EXECUTAR CURL
// ======================================================

function executarCurl(curl) {

    return new Promise(resolve => {

        console.log('\n========================================');
        console.log('CURL ENVIADO');
        console.log('========================================');
        console.log(curl);
        console.log('========================================\n');

        exec(curl, (erro, stdout, stderr) => {

            if (erro) {

                console.log('Erro ao executar curl:');
                console.log(erro.message);

                resolve(false);
                return;
            }

            console.log('========================================');
            console.log('RESPOSTA DA API');
            console.log('========================================');

            console.log(stdout);

            if (stderr) {
                console.log('ERRO:');
                console.log(stderr);
            }

            console.log('========================================\n');

            resolve(true);
        });

    });
}


// ======================================================
// ESPERAR
// ======================================================

function esperar(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}


// ======================================================
// LER TXT
// ======================================================

function lerPontosTxt() {

    // Se o arquivo não existir, cria vazio.
    if (!fs.existsSync(txtPath)) {
        fs.writeFileSync(txtPath, '', 'utf8');
    }

    const conteudo = fs.readFileSync(txtPath, 'utf8');

    const linhas = conteudo
        .split(/\r?\n/)
        .map(linha => linha.trim())
        .filter(linha => linha.length > 0);

    const pontos = [];

    linhas.forEach((linha, index) => {

        const partes = linha.split(',');

        if (partes.length !== 2) {

            console.log(
                `Linha ${index + 1} inválida: ${linha}`
            );

            return;
        }

        const latitude = Number(partes[0].trim());
        const longitude = Number(partes[1].trim());

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            console.log(
                `Linha ${index + 1} possui coordenadas inválidas: ${linha}`
            );

            return;
        }

        pontos.push({
            latitude,
            longitude
        });

    });

    return pontos;
}


// ======================================================
// BUSCAR MOTORISTA DA ROTA
// ======================================================

function buscarMotoristaDaRota(rotaId) {

    return db.prepare(`
        SELECT
            r.id,
            r.nome,
            r.motorista_id,
            m.hash
        FROM rotas r
        INNER JOIN motoristas m
            ON m.id = r.motorista_id
        WHERE r.id = ?
        AND r.status = 'ativa'
    `).get(rotaId);
}


// ======================================================
// 1 - TESTAR SE MOTORISTA TEM ROTA
// ======================================================

async function testarSeTemRota() {

    console.log('\n========================================');
    console.log('       TESTE - VERIFICAR ROTA');
    console.log('========================================');

    const motoristaId = await perguntar(
        'ID do motorista: '
    );

    const motorista = db.prepare(`
        SELECT id, hash
        FROM motoristas
        WHERE id = ?
    `).get(motoristaId);

    if (!motorista) {
        console.log('\nMotorista não encontrado.\n');
        return;
    }

    console.log(`\nMotorista encontrado: ${motorista.id}`);
    console.log(`Hash: ${motorista.hash}`);

    const json = JSON.stringify({
        hash: motorista.hash
    });

    const curl = `curl -X POST http://localhost:3000/rota -H "Content-Type: application/json" -d '${json}'`;

    await executarCurl(curl);
}


// ======================================================
// 2 - TESTAR RECEBIMENTO / FINALIZAÇÃO DA ROTA
// ======================================================

async function testarFinalizacaoRota() {

    console.log('\n========================================');
    console.log('       TESTE - FINALIZAR ROTA');
    console.log('========================================');

    const motoristaId = await perguntar(
        'ID do motorista: '
    );

    const motorista = db.prepare(`
        SELECT id, hash
        FROM motoristas
        WHERE id = ?
    `).get(motoristaId);

    if (!motorista) {
        console.log('\nMotorista não encontrado.\n');
        return;
    }

    const rota = db.prepare(`
        SELECT id, nome, quantidade_notas
        FROM rotas
        WHERE motorista_id = ?
        AND status = 'ativa'
        LIMIT 1
    `).get(motorista.id);

    if (!rota) {
        console.log('\nEsse motorista não possui rota ativa.\n');
        return;
    }

    console.log('\nRota encontrada:');
    console.log(`ID: ${rota.id}`);
    console.log(`Nome: ${rota.nome}`);
    console.log(`Quantidade de notas: ${rota.quantidade_notas}`);

    const notas = db.prepare(`
        SELECT numero_nota
        FROM notas_rota
        WHERE rota_id = ?
        ORDER BY id ASC
    `).all(rota.id);

    const dados = {
        hash: motorista.hash,
        rotaId: rota.id,
        quantidadeDeNotas: notas.length,
        isDone: true
    };

    notas.forEach((nota, index) => {
        dados[`nota${index + 1}`] = nota.numero_nota;
    });

    const json = JSON.stringify(dados);

    const curl = `curl -X POST http://localhost:3000/rota/finalizar -H "Content-Type: application/json" -d '${json}'`;

    await executarCurl(curl);
}


// ======================================================
// 3 - MOCK GPS MANUAL
// ======================================================

async function mockGps() {

    console.log('\n========================================');
    console.log('             MOCK GPS');
    console.log('========================================');

    const motoristaId = await perguntar(
        'ID do motorista: '
    );

    const motorista = db.prepare(`
        SELECT id, hash
        FROM motoristas
        WHERE id = ?
    `).get(motoristaId);

    if (!motorista) {
        console.log('\nMotorista não encontrado.\n');
        return;
    }

    const rota = db.prepare(`
        SELECT id, nome
        FROM rotas
        WHERE motorista_id = ?
        AND status = 'ativa'
        LIMIT 1
    `).get(motorista.id);

    if (!rota) {
        console.log('\nEsse motorista não possui rota ativa.\n');
        return;
    }

    console.log('\nRota encontrada:');
    console.log(`ID: ${rota.id}`);
    console.log(`Nome: ${rota.nome}`);

    const latitude = await perguntar(
        '\nLatitude: '
    );

    const longitude = await perguntar(
        'Longitude: '
    );

    const ponto = await perguntar(
        'Nome do ponto (ex: P0001): '
    );

    const dados = {
        hash: motorista.hash,
        rotaId: rota.id,
        ponto: ponto,
        latitude: Number(latitude),
        longitude: Number(longitude),
        dataHoraGps: new Date().toISOString()
    };

    const json = JSON.stringify(dados);

    const curl = `curl -X POST http://localhost:3000/gps -H "Content-Type: application/json" -d '${json}'`;

    await executarCurl(curl);
}


// ======================================================
// 4 - MOCK GPS LENDO TXT
// ======================================================

async function mockGpsTxt() {

    console.log('\n========================================');
    console.log('       MOCK GPS - ARQUIVO TXT');
    console.log('========================================');

    const pontos = lerPontosTxt();

    if (pontos.length === 0) {

        console.log('\nO arquivo gps.txt está vazio.');
        console.log('Nenhuma latitude/longitude para enviar.\n');

        return;
    }

    const rotaIdTexto = await perguntar(
        'ID da rota: '
    );

    const rotaId = Number(rotaIdTexto);

    if (!Number.isInteger(rotaId) || rotaId <= 0) {

        console.log('\nID da rota inválido.\n');

        return;
    }

    const rota = buscarMotoristaDaRota(rotaId);

    if (!rota) {

        console.log(
            '\nRota não encontrada ou não está ativa.\n'
        );

        return;
    }

    console.log('');
    console.log(`Rota encontrada: ${rota.id}`);
    console.log(`Nome: ${rota.nome}`);
    console.log(`Motorista ID: ${rota.motorista_id}`);
    console.log(`Total de pontos no TXT: ${pontos.length}`);

    console.log('');
    console.log('Intervalo padrão: 30 segundos.');

    const respostaIntervalo = await perguntar(
        'Pressione ENTER para usar 30 segundos ou digite 1 para definir outro intervalo: '
    );

    let intervaloSegundos = 30;

    if (respostaIntervalo === '1') {

        const valor = await perguntar(
            'Informe o intervalo em segundos: '
        );

        const numero = Number(valor);

        if (!Number.isFinite(numero) || numero <= 0) {

            console.log(
                '\nIntervalo inválido. Será usado 30 segundos.\n'
            );

        } else {

            intervaloSegundos = numero;

        }
    }

    console.log('');
    console.log(`Intervalo definido: ${intervaloSegundos} segundos.`);
    console.log('');
    console.log('Iniciando simulação...');

    for (let i = 0; i < pontos.length; i++) {

        const pontoAtual = pontos[i];

        const numeroPonto = i + 1;

        const nomePonto =
            `P${String(numeroPonto).padStart(4, '0')}`;

        const dados = {
            hash: rota.hash,
            rotaId: rota.id,
            ponto: nomePonto,
            latitude: pontoAtual.latitude,
            longitude: pontoAtual.longitude,
            dataHoraGps: new Date().toISOString()
        };

        const json = JSON.stringify(dados);

        const curl =
            `curl -X POST http://localhost:3000/gps ` +
            `-H "Content-Type: application/json" ` +
            `-d '${json}'`;

        console.log('');
        console.log('----------------------------------------');
        console.log(`PONTO ${numeroPonto}/${pontos.length}`);
        console.log(`Ponto: ${nomePonto}`);
        console.log(`Latitude: ${pontoAtual.latitude}`);
        console.log(`Longitude: ${pontoAtual.longitude}`);
        console.log(`Timestamp: ${dados.dataHoraGps}`);
        console.log('----------------------------------------');

        await executarCurl(curl);

        if (i < pontos.length - 1) {

            console.log(
                `Aguardando ${intervaloSegundos} segundos...`
            );

            await esperar(intervaloSegundos * 1000);
        }
    }

    console.log('');
    console.log('========================================');
    console.log('SIMULAÇÃO FINALIZADA');
    console.log(`Total de pontos enviados: ${pontos.length}`);
    console.log('========================================');
}


// ======================================================
// 5 - SIMULAÇÃO OFFLINE
// ======================================================

async function mockGpsOffline() {

    console.log('\n========================================');
    console.log('       SIMULAÇÃO - SEM INTERNET');
    console.log('========================================');

    const pontos = lerPontosTxt();

    if (pontos.length === 0) {

        console.log('\nO arquivo gps.txt está vazio.');
        console.log('Nenhuma latitude/longitude para simular.\n');

        return;
    }

    const rotaIdTexto = await perguntar(
        'ID da rota: '
    );

    const rotaId = Number(rotaIdTexto);

    if (!Number.isInteger(rotaId) || rotaId <= 0) {

        console.log('\nID da rota inválido.\n');

        return;
    }

    const rota = buscarMotoristaDaRota(rotaId);

    if (!rota) {

        console.log(
            '\nRota não encontrada ou não está ativa.\n'
        );

        return;
    }

    console.log('');
    console.log(`Rota encontrada: ${rota.id}`);
    console.log(`Nome: ${rota.nome}`);
    console.log(`Motorista ID: ${rota.motorista_id}`);
    console.log(`Total de pontos no TXT: ${pontos.length}`);

    console.log('');
    console.log('Intervalo padrão: 1 minuto.');

    const respostaIntervalo = await perguntar(
        'Pressione ENTER para usar 1 minuto ou digite 1 para definir outro intervalo: '
    );

    let intervaloSegundos = 60;

    if (respostaIntervalo === '1') {

        const valor = await perguntar(
            'Informe o intervalo da simulação em segundos: '
        );

        const numero = Number(valor);

        if (!Number.isFinite(numero) || numero <= 0) {

            console.log(
                '\nIntervalo inválido. Será usado 1 minuto.\n'
            );

        } else {

            intervaloSegundos = numero;

        }
    }

    console.log('');
    console.log(`Intervalo definido: ${intervaloSegundos} segundos.`);
    console.log('');
    console.log('Iniciando simulação offline...');

    // ==================================================
    // PONTOS 1, 2 E 3
    // ==================================================

    const quantidadeInicial =
        Math.min(3, pontos.length);

    for (let i = 0; i < quantidadeInicial; i++) {

        const pontoAtual = pontos[i];

        const numeroPonto = i + 1;

        const nomePonto =
            `P${String(numeroPonto).padStart(4, '0')}`;

        const dados = {
            hash: rota.hash,
            rotaId: rota.id,
            ponto: nomePonto,
            latitude: pontoAtual.latitude,
            longitude: pontoAtual.longitude,
            dataHoraGps: new Date().toISOString()
        };

        const json = JSON.stringify(dados);

        const curl =
            `curl -X POST http://localhost:3000/gps ` +
            `-H "Content-Type: application/json" ` +
            `-d '${json}'`;

        console.log('');
        console.log('----------------------------------------');
        console.log(`PONTO ${numeroPonto}/${pontos.length}`);
        console.log(`Ponto: ${nomePonto}`);
        console.log(`Latitude: ${pontoAtual.latitude}`);
        console.log(`Longitude: ${pontoAtual.longitude}`);
        console.log(`Timestamp: ${dados.dataHoraGps}`);
        console.log('Modo: ENVIO INDIVIDUAL');
        console.log('----------------------------------------');

        await executarCurl(curl);

        if (i < quantidadeInicial - 1) {

            console.log(
                `Aguardando ${intervaloSegundos} segundos...`
            );

            await esperar(intervaloSegundos * 1000);
        }
    }


    // ==================================================
    // PONTOS 4 ATÉ 8
    // ==================================================

    if (pontos.length > 3) {

        const inicioLote = 3;
        const fimLote = Math.min(8, pontos.length);

        const pontosLote = [];

        for (let i = inicioLote; i < fimLote; i++) {

            const pontoAtual = pontos[i];

            const numeroPonto = i + 1;

            pontosLote.push({
                ponto:
                    `P${String(numeroPonto).padStart(4, '0')}`,
                latitude: pontoAtual.latitude,
                longitude: pontoAtual.longitude,
                dataHoraGps: new Date().toISOString()
            });
        }

        const dados = {
            hash: rota.hash,
            rotaId: rota.id,
            pontos: pontosLote
        };

        const json = JSON.stringify(dados);

        const curl =
            `curl -X POST http://localhost:3000/gps ` +
            `-H "Content-Type: application/json" ` +
            `-d '${json}'`;

        console.log('');
        console.log('========================================');
        console.log('ENVIO EM LOTE');
        console.log('========================================');
        console.log(
            `Quantidade de pontos no lote: ${pontosLote.length}`
        );

        pontosLote.forEach(ponto => {

            console.log(
                `${ponto.ponto} | ` +
                `${ponto.latitude},${ponto.longitude} | ` +
                `${ponto.dataHoraGps}`
            );

        });

        console.log('========================================');

        await executarCurl(curl);

        if (pontos.length > fimLote) {

            console.log(
                `Aguardando ${intervaloSegundos} segundos...`
            );

            await esperar(intervaloSegundos * 1000);
        }
    }


    // ==================================================
    // RESTANTE DOS PONTOS
    // ==================================================

    if (pontos.length > 8) {

        for (let i = 8; i < pontos.length; i++) {

            const pontoAtual = pontos[i];

            const numeroPonto = i + 1;

            const nomePonto =
                `P${String(numeroPonto).padStart(4, '0')}`;

            const dados = {
                hash: rota.hash,
                rotaId: rota.id,
                ponto: nomePonto,
                latitude: pontoAtual.latitude,
                longitude: pontoAtual.longitude,
                dataHoraGps: new Date().toISOString()
            };

            const json = JSON.stringify(dados);

            const curl =
                `curl -X POST http://localhost:3000/gps ` +
                `-H "Content-Type: application/json" ` +
                `-d '${json}'`;

            console.log('');
            console.log('----------------------------------------');
            console.log(`PONTO ${numeroPonto}/${pontos.length}`);
            console.log(`Ponto: ${nomePonto}`);
            console.log(`Latitude: ${pontoAtual.latitude}`);
            console.log(`Longitude: ${pontoAtual.longitude}`);
            console.log(`Timestamp: ${dados.dataHoraGps}`);
            console.log('Modo: ENVIO INDIVIDUAL');
            console.log('----------------------------------------');

            await executarCurl(curl);

            if (i < pontos.length - 1) {

                console.log(
                    `Aguardando ${intervaloSegundos} segundos...`
                );

                await esperar(intervaloSegundos * 1000);
            }
        }
    }

    console.log('');
    console.log('========================================');
    console.log('SIMULAÇÃO OFFLINE FINALIZADA');
    console.log(`Total de pontos processados: ${pontos.length}`);
    console.log('========================================');
}


// ======================================================
// MENU
// ======================================================

async function menu() {

    while (true) {

        console.log('\n========================================');
        console.log('             TESTE DA API');
        console.log('========================================');
        console.log('1 - Testar se motorista tem rota');
        console.log('2 - Testar finalização da rota');
        console.log('3 - Mock GPS');
        console.log('4 - Mock GPS usando TXT');
        console.log('5 - Simulação GPS sem internet');
        console.log('0 - Sair');
        console.log('========================================');

        const opcao = await perguntar('Escolha: ');

        if (opcao === '1') {

            await testarSeTemRota();

        } else if (opcao === '2') {

            await testarFinalizacaoRota();

        } else if (opcao === '3') {

            await mockGps();

        } else if (opcao === '4') {

            await mockGpsTxt();

        } else if (opcao === '5') {

            await mockGpsOffline();

        } else if (opcao === '0') {

            break;

        } else {

            console.log('\nOpção inválida.');
        }
    }

    db.close();
    rl.close();
}

menu();

