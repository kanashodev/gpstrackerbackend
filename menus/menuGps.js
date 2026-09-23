const qrcode = require('qrcode-terminal');

const gpsService = require('../services/gpsService');

function perguntar(rl, texto) {

    return new Promise((resolve) => {

        rl.question(texto, resolve);

    });

}

// Calcula a distância entre dois pontos usando latitude e longitude.
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {

    const raioTerra = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return raioTerra * c;
}

// Calcula o tempo entre dois pontos em segundos.
function calcularTempoSegundos(dataInicial, dataFinal) {

    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);

    return (fim - inicio) / 1000;
}

// Calcula a velocidade média em km/h.
function calcularVelocidadeMedia(distanciaKm, tempoSegundos) {

    if (tempoSegundos <= 0) {

        return 0;

    }

    const tempoHoras = tempoSegundos / 3600;

    return distanciaKm / tempoHoras;
}

async function menuGps(rl) {

    while (true) {

        console.clear();

        console.log('========================================');

        console.log('                 GPS');

        console.log('========================================');

        console.log('');

        console.log('1 - Cadastrar GPS');

        console.log('2 - Mostrar QR');

        console.log('3 - Mostrar Rota no Mapa (GPS)');

        console.log('0 - Voltar');

        console.log('');

        const opcao = (await perguntar(rl, 'Escolha: ')).trim();

        if (opcao === '1') {

            const idTexto = (await perguntar(rl, 'ID do motorista: ')).trim();

            const motoristaId = Number(idTexto);

            if (!Number.isInteger(motoristaId) || motoristaId <= 0) {

                console.log('\nID inválido.');

                await perguntar(rl, '\nPressione ENTER para continuar...');

                continue;

            }

            const resultado = gpsService.cadastrarGps(motoristaId);

            if (!resultado.sucesso) {

                console.log(`\nErro: ${resultado.erro}`);

                await perguntar(rl, '\nPressione ENTER para continuar...');

                continue;

            }

            console.log('');

            console.log('GPS cadastrado com sucesso!');

            console.log(`GPS ID: ${resultado.gpsId}`);

            console.log(`Motorista ID: ${resultado.motoristaId}`);

            console.log('');

            console.log('QR CODE DO MOTORISTA:');

            console.log('');

            // O QR Code é gerado no próprio terminal.

            qrcode.generate(resultado.hash, { small: true });

            console.log(`Hash codificado: ${resultado.hash}`);

            await perguntar(rl, '\nPressione ENTER para continuar...');

        } else if (opcao === '2') {

            const idTexto = (await perguntar(rl, 'ID do motorista: ')).trim();

            const motoristaId = Number(idTexto);

            if (!Number.isInteger(motoristaId) || motoristaId <= 0) {

                console.log('\nID inválido.');

                await perguntar(rl, '\nPressione ENTER para continuar...');

                continue;

            }

            const motorista = gpsService.buscarMotorista(motoristaId);

            if (!motorista) {

                console.log('\nMotorista não encontrado.');

                await perguntar(rl, '\nPressione ENTER para continuar...');

                continue;

            }

            console.log('');

            console.log(`QR CODE DO MOTORISTA ${motorista.id}:`);

            console.log('');

            qrcode.generate(motorista.hash, { small: true });

            console.log(`Hash codificado: ${motorista.hash}`);

            await perguntar(rl, '\nPressione ENTER para continuar...');

        } else if (opcao === '3') {

            const idTexto = (

                await perguntar(rl, 'ID da rota: ')

            ).trim();

            const rotaId = Number(idTexto);

            if (!Number.isInteger(rotaId) || rotaId <= 0) {

                console.log('\nID da rota inválido.');

                await perguntar(rl, '\nPressione ENTER para continuar...');

                continue;

            }

            const resultado = gpsService.buscarPontosDaRota(rotaId);

            if (!resultado) {

                console.log('\nRota não encontrada.');

                await perguntar(rl, '\nPressione ENTER para continuar...');

                continue;

            }

            console.clear();

            console.log('========================================');

            console.log('          ROTA - GPS');

            console.log('========================================');

            console.log('');

            console.log(`Rota id: ${resultado.rotaId}`);

            console.log(`Nome da Rota: ${resultado.nomeRota}`);

            console.log(`Data da rota: ${resultado.dataRota}`);

            console.log(`Hora de início: ${resultado.horaInicio}`);

            console.log(

                `Hora de término: ${

                    resultado.horaFinalizacao || 'Ainda não finalizada'

                }`

            );

            console.log('');

            console.log('Pontos:');

            console.log('');

            let distanciaTotal = 0;

            let tempoTotalSegundos = 0;

            if (resultado.pontos.length === 0) {

                console.log('Nenhum ponto GPS registrado.');

            } else {

                resultado.pontos.forEach((ponto, index) => {

                    console.log(

                        `${ponto.ponto} : Lat: ${ponto.latitude} | Long: ${ponto.longitude}`

                    );

                    if (index > 0) {

                        const pontoAnterior = resultado.pontos[index - 1];

                        const distanciaKm = calcularDistanciaKm(

                            pontoAnterior.latitude,

                            pontoAnterior.longitude,

                            ponto.latitude,

                            ponto.longitude

                        );

                        const tempoSegundos = calcularTempoSegundos(

                            pontoAnterior.data_hora_gps,

                            ponto.data_hora_gps

                        );

                        if (tempoSegundos > 0) {

                            const velocidadeMedia = calcularVelocidadeMedia(

                                distanciaKm,

                                tempoSegundos

                            );

                            distanciaTotal += distanciaKm;

                            tempoTotalSegundos += tempoSegundos;

                            console.log('');

                            console.log(

                                `   ${pontoAnterior.ponto} → ${ponto.ponto}`

                            );

                            console.log(

                                `   Distância: ${distanciaKm.toFixed(3)} km`

                            );

                            console.log(

                                `   Tempo: ${(tempoSegundos / 60).toFixed(2)} minutos`

                            );

                            console.log(

                                `   Velocidade média: ${velocidadeMedia.toFixed(2)} km/h`

                            );

                        } else {

                            console.log('');

                            console.log(

                                `   ${pontoAnterior.ponto} → ${ponto.ponto}`

                            );

                            console.log(

                                '   Não foi possível calcular o tempo entre os pontos.'

                            );

                        }

                    }

                });

            }

            console.log('');

            console.log('========================================');

            console.log('        ESTATÍSTICAS DA ROTA');

            console.log('========================================');

            console.log('');

            console.log(

                `Distância total: ${distanciaTotal.toFixed(3)} km`

            );

            if (tempoTotalSegundos > 0) {

                const tempoTotalHoras = tempoTotalSegundos / 3600;

                const velocidadeMediaRota =

                    distanciaTotal / tempoTotalHoras;

                console.log(

                    `Tempo total: ${(tempoTotalSegundos / 60).toFixed(2)} minutos`

                );

                console.log(

                    `Velocidade média da rota: ${velocidadeMediaRota.toFixed(2)} km/h`

                );

            } else {

                console.log(

                    'Tempo total: Não disponível'

                );

                console.log(

                    'Velocidade média da rota: Não disponível'

                );

            }

            console.log('');

            console.log(`Total de pontos: ${resultado.pontos.length}`);

            // Link com todos os pontos da rota.

            console.log('');

            console.log('Rota no Google Maps:');

            if (resultado.linkGoogleMaps) {

                console.log(resultado.linkGoogleMaps);

            } else {

                console.log('Nenhum link disponível.');

            }

            console.log('');

            console.log('========================================');

            await perguntar(rl, '\nPressione ENTER para continuar...');

        } else if (opcao === '0') {

            break;

        } else {

            console.log('\nOpção inválida.');

            await perguntar(rl, '\nPressione ENTER para continuar...');

        }

    }

}

module.exports = menuGps;