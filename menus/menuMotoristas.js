const motoristaService = require('../services/motoristaService');

function perguntar(rl, texto) {
    return new Promise((resolve) => {
        rl.question(texto, resolve);
    });
}

async function menuMotoristas(rl) {
        while (true) {
            console.clear();
            console.log('========================================');
            console.log('              MOTORISTAS');
            console.log('========================================');
            console.log('');
            console.log('1 - Cadastrar motorista');
            console.log('2 - Mostrar motoristas');
            console.log('3 - Deletar motorista');
            console.log('0 - Voltar');
            console.log('');

            const opcao = (await perguntar(rl, 'Escolha: ')).trim();

            if (opcao === '1') {
                try {
                    const motorista = motoristaService.cadastrarMotorista();

                    console.log('');
                    console.log('Motorista cadastrado com sucesso!');
                    console.log(`ID: ${motorista.id}`);
                    console.log(`HASH: ${motorista.hash}`);
            console.log(`Status: ${motorista.status || 'disponivel'}`);
                } catch (erro) {
                    console.log('');
                    console.log(`Erro ao cadastrar motorista: ${erro.message}`);
                }

                await perguntar(rl, '\nPressione ENTER para continuar...');
            } else if (opcao === '2') {
                const motoristas = motoristaService.listarMotoristas();

                console.log('');

                if (motoristas.length === 0) {
                    console.log('Nenhum motorista cadastrado.');
                } else {
                    console.log('ID   HASH                                                            DATA');
                    console.log('--------------------------------------------------------------------------');

                    for (const motorista of motoristas) {
                        console.log(
                            `${String(motorista.id).padEnd(4)} ${motorista.hash.padEnd(64)} ${motorista.data_cadastro}`
                        );
                    }
                }

                await perguntar(rl, '\nPressione ENTER para continuar...');
            } else if (opcao === '3') {
                const idTexto = (await perguntar(rl, 'ID do motorista: ')).trim();
                const id = Number(idTexto);

                if (!Number.isInteger(id) || id <= 0) {
                    console.log('\nID inválido.');
                    await perguntar(rl, '\nPressione ENTER para continuar...');
                    continue;
                }

                const motorista = motoristaService.buscarMotoristaPorId(id);

                if (!motorista) {
                    console.log('\nMotorista não encontrado.');
                    await perguntar(rl, '\nPressione ENTER para continuar...');
                    continue;
                }

                console.log(`\nMotorista encontrado: ID ${motorista.id}`);
                const confirmacao = (await perguntar(rl, 'Tem certeza que deseja deletar? (S/N): '))
                    .trim()
                    .toUpperCase();

                if (confirmacao === 'S') {
                    const deletado = motoristaService.deletarMotorista(id);
                    console.log(deletado ? '\nMotorista deletado com sucesso.' : '\nNão foi possível deletar o motorista.');
                } else {
                    console.log('\nOperação cancelada.');
                }

                await perguntar(rl, '\nPressione ENTER para continuar...');
            } else if (opcao === '0') {
                break;
            } else {
                console.log('\nOpção inválida.');
                await perguntar(rl, '\nPressione ENTER para continuar...');
            }
        }
    }

module.exports = menuMotoristas;
