const {
    cadastrarCaminhao,
    buscarTodosCaminhoes,
    deletarCaminhao
} = require('../services/caminhaoService');

async function menuCaminhoes(rl) {
    while (true) {
        console.clear();

        console.log('========================================');
        console.log('                CAMINHÕES');
        console.log('========================================');
        console.log('');
        console.log('1 - Cadastrar caminhão');
        console.log('2 - Mostrar caminhões');
        console.log('3 - Deletar caminhão');
        console.log('0 - Voltar');
        console.log('');

        const opcao = (await perguntar(rl, 'Escolha: ')).trim();

        if (opcao === '1') {
            await cadastrar(rl);
        } else if (opcao === '2') {
            await mostrarCaminhoes(rl);
        } else if (opcao === '3') {
            await deletar(rl);
        } else if (opcao === '0') {
            return;
        } else {
            console.log('\nOpção inválida.');
            await perguntar(rl, '\nPressione ENTER para continuar...');
        }
    }
}

async function cadastrar(rl) {
    console.clear();

    console.log('========================================');
    console.log('          CADASTRAR CAMINHÃO');
    console.log('========================================');
    console.log('');

    const nome = (await perguntar(
        rl,
        'Nome do caminhão: '
    )).trim();

    if (!nome) {
        console.log('\nO nome do caminhão não pode estar vazio.');
        await perguntar(rl, '\nPressione ENTER para continuar...');
        return;
    }

    const placa = (await perguntar(
        rl,
        'Placa do caminhão: '
    )).trim().toUpperCase();

    if (!placa) {
        console.log('\nA placa não pode estar vazia.');
        await perguntar(rl, '\nPressione ENTER para continuar...');
        return;
    }

    try {
        const resultado = cadastrarCaminhao(nome, placa);

        console.log('');
        console.log('Caminhão cadastrado com sucesso!');
        console.log('');
        console.log(`ID: ${resultado.id}`);
        console.log(`Nome: ${resultado.nome}`);
        console.log(`Placa: ${resultado.placa}`);
    } catch (erro) {
        console.log('');
        console.log('Erro ao cadastrar caminhão.');

        if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            console.log('A placa informada já está cadastrada.');
        } else {
            console.log(erro.message);
        }
    }

    await perguntar(rl, '\nPressione ENTER para continuar...');
}

async function mostrarCaminhoes(rl) {
    console.clear();

    console.log('========================================');
    console.log('           CAMINHÕES CADASTRADOS');
    console.log('========================================');
    console.log('');

    const caminhoes = buscarTodosCaminhoes();

    if (caminhoes.length === 0) {
        console.log('Nenhum caminhão cadastrado.');
        await perguntar(rl, '\nPressione ENTER para continuar...');
        return;
    }

    console.log(
        'ID'.padEnd(8) +
        'NOME'.padEnd(30) +
        'PLACA'
    );

    console.log('-'.repeat(55));

    for (const caminhao of caminhoes) {
        console.log(
            String(caminhao.id).padEnd(8) +
            caminhao.nome.padEnd(30) +
            caminhao.placa
        );
    }

    await perguntar(rl, '\nPressione ENTER para continuar...');
}

async function deletar(rl) {
    console.clear();

    console.log('========================================');
    console.log('            DELETAR CAMINHÃO');
    console.log('========================================');
    console.log('');

    const idTexto = await perguntar(
        rl,
        'Digite o ID do caminhão: '
    );

    const id = Number(idTexto.trim());

    if (!Number.isInteger(id) || id <= 0) {
        console.log('\nID inválido.');
        await perguntar(rl, '\nPressione ENTER para continuar...');
        return;
    }

    const confirmar = await perguntar(
        rl,
        `Tem certeza que deseja deletar o caminhão ${id}? (S/N): `
    );

    if (confirmar.trim().toUpperCase() !== 'S') {
        console.log('\nOperação cancelada.');
        await perguntar(rl, '\nPressione ENTER para continuar...');
        return;
    }

    try {
        const removido = deletarCaminhao(id);

        console.log('');

        if (removido) {
            console.log('Caminhão deletado com sucesso.');
        } else {
            console.log('Caminhão não encontrado.');
        }
    } catch (erro) {
        console.log('Erro ao deletar caminhão.');
        console.log(erro.message);
    }

    await perguntar(rl, '\nPressione ENTER para continuar...');
}

function perguntar(rl, texto) {
    return new Promise((resolve) => {
        rl.question(texto, resolve);
    });
}

module.exports = menuCaminhoes;