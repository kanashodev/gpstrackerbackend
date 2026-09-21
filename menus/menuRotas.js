
const qrcode = require('qrcode-terminal');

const {
    criarRota,
    buscarMotoristasDisponiveis,
    buscarTodosCaminhoes,
    buscarRotasAtivas,
    buscarRotasFinalizadas,
    buscarNotasDaRota,
    finalizarRota
} = require('../services/rotaService');

function perguntar(rl, pergunta) {
    return new Promise(resolve => {
        rl.question(pergunta, resposta => {
            resolve(resposta);
        });
    });
}

function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function obterDataHoje() {
    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}

function converterDataInput(dataInput) {
    const valor = dataInput.trim();

    // ENTER = hoje
    if (!valor) {
        return obterDataHoje();
    }

    const partes = valor.split('/');

    if (partes.length !== 3) {
        return null;
    }

    const [dia, mes, ano] = partes;

    if (
        !/^\d{2}$/.test(dia) ||
        !/^\d{2}$/.test(mes) ||
        !/^\d{4}$/.test(ano)
    ) {
        return null;
    }

    const data = new Date(
        Number(ano),
        Number(mes) - 1,
        Number(dia)
    );

    // Verifica se a data realmente existe
    if (
        data.getFullYear() !== Number(ano) ||
        data.getMonth() !== Number(mes) - 1 ||
        data.getDate() !== Number(dia)
    ) {
        return null;
    }

    // Não permite consultar uma data futura
    const hoje = new Date();

    const hojeSemHora = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
    );

    if (data > hojeSemHora) {
        return null;
    }

    return `${ano}-${mes}-${dia}`;
}

async function menuRotas(rl) {
    while (true) {
        const enterwait = (
            await perguntar(rl, "Aperte Enter Para Cotinuar:")
        ).trim();

        console.clear();

        console.log("\n========================================");
        console.log("                 ROTAS");
        console.log("========================================");
        console.log("1 - Lançar rota");
        console.log("2 - Mostrar rotas ativas");
        console.log("3 - Finalizar rota");
        console.log("4 - Mostrar rotas finalizadas");
        console.log("0 - Voltar");
        console.log("========================================");

        const opcao = (
            await perguntar(rl, "Escolha: ")
        ).trim();

        if (opcao === '1') {

            await lancarRota(rl);

        } else if (opcao === '2') {

            await mostrarRotasAtivas(rl);

        } else if (opcao === '3') {

            await finalizarRotaMenu(rl);

        } else if (opcao === '4') {

            await mostrarRotasFinalizadas(rl);

        } else if (opcao === '0') {

            break;

        } else {

            console.log("\nOpção inválida.");
        }
    }
}

async function lancarRota(rl) {
    try {
        console.clear();

        console.log("\n========================================");
        console.log("             LANÇAR ROTA");
        console.log("========================================");

        const motoristas = buscarMotoristasDisponiveis();

        if (motoristas.length === 0) {
            console.log("\nNenhum motorista disponível.");
            return;
        }

        console.log("\nMotoristas disponíveis:");

        motoristas.forEach(motorista => {
            console.log(
                `ID: ${motorista.id} | Hash: ${motorista.hash} | Status: ${motorista.status}`
            );
        });

        const motoristaId = Number(
            (await perguntar(rl, "\nID do motorista: ")).trim()
        );

        if (!Number.isInteger(motoristaId)) {
            console.log("\nID do motorista inválido.");
            return;
        }

        const motoristaExiste = motoristas.some(
            motorista => motorista.id === motoristaId
        );

        if (!motoristaExiste) {
            console.log("\nMotorista não encontrado entre os disponíveis.");
            return;
        }

        const caminhoes = buscarTodosCaminhoes();

        if (caminhoes.length === 0) {
            console.log("\nNenhum caminhão cadastrado.");
            return;
        }

        console.log("\nCaminhões disponíveis:");

        caminhoes.forEach(caminhao => {
            console.log(
                `ID: ${caminhao.id} | Nome: ${caminhao.nome} | Placa: ${caminhao.placa}`
            );
        });

        const caminhaoId = Number(
            (await perguntar(rl, "\nID do caminhão: ")).trim()
        );

        if (!Number.isInteger(caminhaoId)) {
            console.log("\nID do caminhão inválido.");
            return;
        }

        const caminhaoExiste = caminhoes.some(
            caminhao => caminhao.id === caminhaoId
        );

        if (!caminhaoExiste) {
            console.log("\nCaminhão não encontrado.");
            return;
        }

        const nomeRota = (
            await perguntar(rl, "Nome da rota: ")
        ).trim();

        if (!nomeRota) {
            console.log("\nO nome da rota não pode ficar vazio.");
            return;
        }

        const quantidadeNotas = Number(
            (await perguntar(rl, "Quantidade de entrega ou notas: ")).trim()
        );

        if (!Number.isInteger(quantidadeNotas) || quantidadeNotas <= 0) {
            console.log("\nQuantidade de notas inválida.");
            return;
        }

        const notas = [];

        for (let i = 1; i <= quantidadeNotas; i++) {
            const numeroNota = (
                await perguntar(rl, `Nota ${i}: `)
            ).trim();

            if (!numeroNota) {
                console.log("\nO número da nota não pode ficar vazio.");
                return;
            }

            notas.push(numeroNota);
        }

        const rota = criarRota({
            motoristaId,
            caminhaoId,
            nomeRota,
            notas
        });

        console.log("\n========================================");
        console.log("          ROTA CRIADA COM SUCESSO");
        console.log("========================================");
        console.log(`ID da rota: ${rota.id}`);
        console.log(`Motorista ID: ${rota.motoristaId}`);
        console.log(`Caminhão ID: ${rota.caminhaoId}`);
        console.log(`Nome da rota: ${rota.nomeRota}`);
        console.log(`Quantidade de notas: ${rota.quantidadeNotas}`);
        console.log(`Status: ${rota.status}`);

        rota.notas.forEach((nota, index) => {
            console.log(`Nota ${index + 1}: ${nota}`);
            console.log(`QR CODE DA NOTA ${nota}:`);

            qrcode.generate(String(nota), { small: true });

            console.log(`Código codificado: ${nota}`);
            console.log('----------------------------------------');
        });

        console.log("========================================");

    } catch (erro) {
        console.log("\nErro ao lançar rota:", erro.message);
    }
}

async function mostrarRotasAtivas(rl) {
    try {
        const rotas = buscarRotasAtivas();

        console.clear();

        console.log("\n========================================");
        console.log("            ROTAS ATIVAS");
        console.log("========================================");

        if (rotas.length === 0) {
            console.log("Nenhuma rota ativa.");
            console.log("========================================");
            return;
        }

        rotas.forEach(rota => {
            console.log(`ID: ${rota.id}`);
            console.log(`Rota: ${rota.nome}`);
            console.log(`Motorista ID: ${rota.motorista_id}`);

            console.log(
                `Caminhão: ${rota.caminhao_nome} | Placa: ${rota.caminhao_placa}`
            );

            console.log(`Data: ${formatarData(rota.data_rota)}`);
            console.log(`Hora de início: ${rota.hora_inicio}`);
            console.log(`Quantidade de notas: ${rota.quantidade_notas}`);
            console.log(`Status: ${rota.status}`);

            const notas = buscarNotasDaRota(rota.id);

            notas.forEach((nota, index) => {
                console.log(`Nota ${index + 1}: ${nota.numero_nota}`);
            });

            console.log("----------------------------------------");
        });

        console.log("========================================");
        console.log("1 - Ver QR Codes das notas");
        console.log("ENTER - Voltar");

        const opcao = (
            await perguntar(rl, "Escolha: ")
        ).trim();

        if (opcao === '1') {

            console.log("\n========================================");
            console.log("          QR CODES DAS NOTAS");
            console.log("========================================");

            rotas.forEach(rota => {

                console.log(`\nRota ID: ${rota.id}`);
                console.log(`Rota: ${rota.nome}`);

                const notas = buscarNotasDaRota(rota.id);

                notas.forEach((nota, index) => {

                    console.log(`\nNota ${index + 1}: ${nota.numero_nota}`);
                    console.log(`QR CODE DA NOTA ${nota.numero_nota}:`);

                    qrcode.generate(
                        String(nota.numero_nota),
                        { small: true }
                    );
                });

                console.log("----------------------------------------");
            });

            console.log("========================================");

            await perguntar(
                rl,
                "\nPressione ENTER para voltar..."
            );
        }

    } catch (erro) {
        console.log(
            "\nErro ao mostrar rotas ativas:",
            erro.message
        );
    }
}

async function finalizarRotaMenu(rl) {
    try {
        const rotas = buscarRotasAtivas();

        if (rotas.length === 0) {
            console.log("\nNenhuma rota ativa para finalizar.");
            return;
        }

        console.clear();

        console.log("\n========================================");
        console.log("           FINALIZAR ROTA");
        console.log("========================================");

        rotas.forEach(rota => {
            console.log(
                `ID: ${rota.id} | Rota: ${rota.nome} | Motorista: ${rota.motorista_id} | Status: ${rota.status}`
            );
        });

        const rotaId = Number(
            (await perguntar(rl, "\nID da rota para finalizar: ")).trim()
        );

        if (!Number.isInteger(rotaId)) {
            console.log("\nID da rota inválido.");
            return;
        }

        const rotaExiste = rotas.some(
            rota => rota.id === rotaId
        );

        if (!rotaExiste) {
            console.log("\nRota ativa não encontrada.");
            return;
        }

        const confirmar = (
            await perguntar(rl, "Confirma a finalização? (s/n): ")
        ).trim().toLowerCase();

        if (confirmar !== 's') {
            console.log("\nOperação cancelada.");
            return;
        }

        const resultado = finalizarRota(rotaId);

        console.log("\nRota finalizada com sucesso.");
        console.log(`ID da rota: ${resultado.id}`);
        console.log(`Status: ${resultado.status}`);
        console.log(`Hora de finalização: ${resultado.horaFinalizacao}`);
        console.log("Motorista voltou para status: disponivel");

    } catch (erro) {
        console.log("\nErro ao finalizar rota:", erro.message);
    }
}

async function mostrarRotasFinalizadas(rl) {
    try {
        console.clear();

        console.log("\n========================================");
        console.log("        ROTAS FINALIZADAS");
        console.log("========================================");
        console.log("1 - Inserir uma data específica");
        console.log("ENTER - Ver rotas finalizadas de hoje");
        console.log("========================================");

        const opcao = (
            await perguntar(rl, "\nEscolha: ")
        ).trim();

        let dataInput = '';

        if (opcao === '1') {

            dataInput = await perguntar(
                rl,
                "\nDigite a data da rota (DD/MM/AAAA): "
            );

        } else if (opcao === '') {

            // ENTER = hoje
            dataInput = '';

        } else {

            console.log("\nOpção inválida.");
            return;
        }

        const data = converterDataInput(dataInput);

        if (!data) {
            console.log(
                "\nData inválida. Informe uma data válida no formato DD/MM/AAAA."
            );
            return;
        }

        const rotas = buscarRotasFinalizadas(data);

        console.log(
            `\nRotas finalizadas em ${formatarData(data)}:`
        );

        if (rotas.length === 0) {
            console.log("Nenhuma rota finalizada nessa data.");
            console.log("========================================");
            return;
        }

        rotas.forEach(rota => {

            console.log("\n----------------------------------------");
            console.log(`ID da rota: ${rota.id}`);
            console.log(`Nome da rota: ${rota.nome}`);
            console.log(`Motorista ID: ${rota.motorista_id}`);

            console.log(
                `Caminhão: ${rota.caminhao_nome} | Placa: ${rota.caminhao_placa}`
            );

            console.log(`Data: ${formatarData(rota.data_rota)}`);
            console.log(`Hora de início: ${rota.hora_inicio}`);
            console.log(`Hora de finalização: ${rota.hora_finalizacao}`);
            console.log(`Quantidade de notas: ${rota.quantidade_notas}`);
            console.log(`Status: ${rota.status}`);

            const notas = buscarNotasDaRota(rota.id);

            notas.forEach((nota, index) => {
                console.log(`Nota ${index + 1}: ${nota.numero_nota}`);
                console.log(`QR CODE DA NOTA ${nota.numero_nota}:`);

                qrcode.generate(
                    String(nota.numero_nota),
                    { small: true }
                );
            });
        });

        console.log("\n========================================");

    } catch (erro) {
        console.log(
            "\nErro ao mostrar rotas finalizadas:",
            erro.message
        );
    }
}

module.exports = menuRotas;
