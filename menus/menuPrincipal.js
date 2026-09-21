const readline = require('readline');
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

async function menuPrincipal() {
    const rl = criarInterface();

    while (true) {
        const enterwait = (await perguntar(rl, "Aperte Enter Para Cotinuar:")).trim();
        console.clear()
        console.log("\n========================================");
        console.log("    SISTEMA DE GERENCIAMENTO DE ROTAS");
        console.log("========================================");
        console.log("1 - Motoristas");
        console.log("2 - GPS");
        console.log("3 - Caminhões");
        console.log("4 - Rotas");
        console.log("0 - Sair");
        console.log("========================================");

        const opcao = (await perguntar(rl, "Escolha: ")).trim();

        if (opcao === '1') {
            await menuMotoristas(rl);
        } else if (opcao === '2') {
            await menuGps(rl);
        } else if (opcao === '3') {
            await menuCaminhoes(rl);
        } else if (opcao === '4') {
            await menuRotas(rl);
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