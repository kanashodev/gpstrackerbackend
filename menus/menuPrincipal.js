const readline = require('readline');
const { spawn } = require('child_process');
const path = require('path');

const menuMotoristas = require('./menuMotoristas');
const menuGps = require('./menuGps');
const menuCaminhoes = require('./menuCaminhoes');
const menuRotas = require('./menuRotas');

function criarInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function perguntar(rl, pergunta) {
    return new Promise(resolve => {
        rl.question(pergunta, resposta => {
            resolve(resposta);
        });
    });
}

function abrirTeste() {
    const pastaProjeto = path.join(__dirname, '..');
    const caminhoTeste = path.join(
        pastaProjeto,
        'api',
        'teste',
        'testeapi.js'
    );

    if (process.platform === 'darwin') {
        // macOS
        const comando = `cd "${pastaProjeto}" && node "${caminhoTeste}"`;

        const script = `
            tell application "Terminal"
                do script "${comando.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"
                activate
            end tell
        `;

        spawn('osascript', ['-e', script], {
            detached: true,
            stdio: 'ignore'
        }).unref();

    } else if (process.platform === 'linux') {
        // Linux
        spawn(
            'gnome-terminal',
            [
                '--',
                'bash',
                '-c',
                `cd "${pastaProjeto}" && node "${caminhoTeste}"; exec bash`
            ],
            {
                detached: true,
                stdio: 'ignore'
            }
        ).unref();

    } else {
        console.log('\nSistema operacional não suportado.');
    }
}

async function menuPrincipal() {
    const rl = criarInterface();

    while (true) {
        const enterwait = (
            await perguntar(rl, "Aperte Enter Para Cotinuar:")
        ).trim();

        console.clear();

        console.log("\n========================================");
        console.log("    SISTEMA DE GERENCIAMENTO DE ROTAS");
        console.log("========================================");
        console.log("1 - Motoristas");
        console.log("2 - GPS");
        console.log("3 - Caminhões");
        console.log("4 - Rotas");
        console.log("0 - Sair");
        console.log("========================================");

        const opcao = (
            await perguntar(rl, "Escolha: ")
        ).trim();

        if (opcao === '1') {
            await menuMotoristas(rl);

        } else if (opcao === '2') {
            await menuGps(rl);

        } else if (opcao === '3') {
            await menuCaminhoes(rl);

        } else if (opcao === '4') {
            await menuRotas(rl);

        } else if (opcao === 'teste') {
            abrirTeste();

        } else if (opcao === '0') {
            console.log("\nEncerrando sistema...");
            rl.close();
            break;

        } else {
            console.log("\nOpção inválida.");
        }
    }
}

module.exports = menuPrincipal;