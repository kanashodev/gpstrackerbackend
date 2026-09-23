
const http = require('http');
const Database = require('better-sqlite3');

const PORT = 3002;

// ======================================================
// BANCO DE DADOS
// ======================================================

const db = new Database('./database.db');


// ======================================================
// BUSCAR TODOS OS PONTOS DA ROTA
// ======================================================

// O statement é criado uma única vez.
// Evita criar/destruir um Statement do SQLite a cada requisição.

const buscarPontosStmt = db.prepare(`
    SELECT
        id,
        latitude,
        longitude,
        data_hora_gps
    FROM gps_pontos
    WHERE rota_id = ?
    ORDER BY id ASC
`);

function buscarPontos(rotaId) {
    return buscarPontosStmt.all(rotaId);
}


// ======================================================
// FORMATAR DATA E HORA
// ======================================================

function formatarDataHora(dataHora) {

    if (!dataHora) {
        return {
            data: 'Não informado',
            hora: 'Não informado'
        };
    }

    const data = new Date(dataHora);

    if (isNaN(data.getTime())) {
        return {
            data: dataHora,
            hora: dataHora
        };
    }

    const dia =
        String(data.getDate())
            .padStart(2, '0');

    const mes =
        String(data.getMonth() + 1)
            .padStart(2, '0');

    const ano =
        data.getFullYear();

    const hora =
        String(data.getHours())
            .padStart(2, '0');

    const minuto =
        String(data.getMinutes())
            .padStart(2, '0');

    const segundo =
        String(data.getSeconds())
            .padStart(2, '0');

    return {
        data: `${dia}/${mes}/${ano}`,
        hora: `${hora}:${minuto}:${segundo}`
    };
}


// ======================================================
// GERAR HTML
// ======================================================

function gerarHtml(pontos, rotaId) {

    const pontosMapa = pontos.map(
        (ponto, indice) => {

            const dataHora =
                formatarDataHora(
                    ponto.data_hora_gps
                );

            return {
                numero: indice + 1,

                id: ponto.id,

                latitude:
                    Number(ponto.latitude),

                longitude:
                    Number(ponto.longitude),

                data:
                    dataHora.data,

                hora:
                    dataHora.hora
            };
        }
    );


    return `
<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <title>
        Mapa da Rota ${rotaId}
    </title>

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    >

    <style>

        html,
        body {

            margin: 0;
            padding: 0;

            height: 100%;
        }


        #map {

            width: 100%;
            height: 100%;
        }


        .info {

            position: absolute;

            z-index: 10000;

            top: 10px;
            left: 10px;

            background: white;

            padding: 10px 14px;

            border-radius: 8px;

            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.25);

            font-family: Arial;

            font-size: 14px;
        }


        .numero-ponto {

            background: white;

            border: 2px solid black;

            border-radius: 5px;

            padding: 2px 5px;

            font-family: Arial;

            font-size: 11px;

            font-weight: bold;

            white-space: nowrap;

            box-shadow:
                0 1px 4px rgba(0, 0, 0, 0.4);
        }


        .popup-ponto {

            font-family: Arial;

            font-size: 14px;

            line-height: 1.5;
        }


        .popup-ponto strong {

            font-size: 16px;
        }

    </style>

</head>


<body>


    <!-- ==================================================
         INFORMAÇÕES
         ================================================== -->

    <div class="info">

        <strong>
            Rota ${rotaId}
        </strong>

        <br>

        Total de pontos:
        ${pontosMapa.length}

    </div>


    <!-- ==================================================
         MAPA
         ================================================== -->

    <div id="map"></div>


    <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
    </script>


    <script>

        // ==================================================
        // TODOS OS PONTOS
        // ==================================================

        const pontos =
            ${JSON.stringify(pontosMapa)};


        console.log(
            'TOTAL DE PONTOS:',
            pontos.length
        );


        // ==================================================
        // VERIFICAR SE EXISTEM PONTOS
        // ==================================================

        if (pontos.length === 0) {

            document
                .getElementById('map')
                .innerHTML =
                '<h2 style="padding:20px;">' +
                'Nenhum ponto encontrado.' +
                '</h2>';

        }

        else {

            // ==================================================
            // CRIAR MAPA
            // ==================================================

            const mapa =
                L.map('map');


            // ==================================================
            // MAPA BASE
            // ==================================================

            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    maxZoom: 19,

                    attribution:
                        '&copy; OpenStreetMap contributors'
                }
            ).addTo(mapa);


            // ==================================================
            // COORDENADAS REAIS
            // ==================================================

            const coordenadas =
                pontos.map(
                    ponto => [
                        ponto.latitude,
                        ponto.longitude
                    ]
                );


            // ==================================================
            // LINHA PRINCIPAL DA ROTA
            // ==================================================

            L.polyline(
                coordenadas,
                {
                    weight: 4,
                    opacity: 0.7
                }
            ).addTo(mapa);


            // ==================================================
            // AGRUPAR PONTOS COM MESMA COORDENADA
            // ==================================================

            const grupos =
                new Map();


            pontos.forEach(
                (ponto) => {

                    const chave =
                        ponto.latitude +
                        ',' +
                        ponto.longitude;


                    if (!grupos.has(chave)) {

                        grupos.set(
                            chave,
                            []
                        );
                    }


                    grupos
                        .get(chave)
                        .push(ponto);
                }
            );


            console.log(
                'Grupos de pontos:',
                grupos
            );


            // ==================================================
            // CRIAR MARCADORES
            // ==================================================

            grupos.forEach(
                (grupo) => {

                    const quantidade =
                        grupo.length;


                    grupo.forEach(
                        (ponto, indice) => {

                            // ==================================
                            // COORDENADA REAL
                            // ==================================

                            const latitudeReal =
                                ponto.latitude;

                            const longitudeReal =
                                ponto.longitude;


                            // ==================================
                            // COORDENADA VISUAL
                            // ==================================

                            let latitudeVisual =
                                latitudeReal;

                            let longitudeVisual =
                                longitudeReal;


                            /*
                             * Se existir somente um ponto
                             * nessa coordenada, não deslocamos.
                             */

                            if (quantidade > 1) {

                                /*
                                 * Raio visual do deslocamento.
                                 *
                                 * IMPORTANTE:
                                 * Isso NÃO altera o GPS.
                                 *
                                 * É somente para separar
                                 * visualmente os marcadores.
                                 */

                                const raio =
                                    0.00018;


                                /*
                                 * Distribui os pontos
                                 * em círculo.
                                 */

                                const angulo =
                                    (
                                        2 *
                                        Math.PI *
                                        indice
                                    ) /
                                    quantidade;


                                latitudeVisual =
                                    latitudeReal +
                                    (
                                        Math.cos(angulo) *
                                        raio
                                    );


                                longitudeVisual =
                                    longitudeReal +
                                    (
                                        Math.sin(angulo) *
                                        raio
                                    );
                            }


                            // ==================================
                            // NÚMERO DO PONTO
                            // ==================================

                            const numeroPonto =
                                'P' +
                                String(
                                    ponto.numero
                                )
                                .padStart(
                                    4,
                                    '0'
                                );


                            // ==================================
                            // POPUP
                            // ==================================

                            const popup =
                                '<div class="popup-ponto">' +

                                    '<strong>' +
                                        numeroPonto +
                                    '</strong>' +

                                    '<br>' +

                                    'ID banco: ' +
                                    ponto.id +

                                    '<br>' +

                                    'Hora: ' +
                                    ponto.hora +

                                    '<br>' +

                                    'Data: ' +
                                    ponto.data +

                                    '<br>' +

                                    'Latitude: ' +
                                    ponto.latitude +

                                    '<br>' +

                                    'Longitude: ' +
                                    ponto.longitude +

                                '</div>';


                            // ==================================
                            // MARCADOR
                            // ==================================

                            L.marker(
                                [
                                    latitudeVisual,
                                    longitudeVisual
                                ],
                                {

                                    icon:
                                        L.divIcon({

                                            className:
                                                '',

                                            html:
                                                '<div class="numero-ponto">' +
                                                numeroPonto +
                                                '</div>',

                                            iconSize:
                                                null,

                                            iconAnchor:
                                                [-5, 12]
                                        })
                                }
                            )
                            .addTo(mapa)
                            .bindPopup(popup);


                            // ==================================
                            // LINHA ENTRE O MARCADOR VISUAL
                            // E A COORDENADA REAL
                            // ==================================

                            if (quantidade > 1) {

                                L.polyline(
                                    [

                                        [
                                            latitudeReal,
                                            longitudeReal
                                        ],

                                        [
                                            latitudeVisual,
                                            longitudeVisual
                                        ]

                                    ],
                                    {

                                        weight: 1,

                                        opacity: 0.6,

                                        dashArray:
                                            '3, 3'
                                    }

                                ).addTo(mapa);
                            }

                        }
                    );

                }
            );


            // ==================================================
            // MARCADOR DE INÍCIO
            // ==================================================

            L.marker(
                coordenadas[0]
            )
            .addTo(mapa)
            .bindPopup(
                '<strong>Início da rota</strong><br>' +
                'P0001'
            );


            // ==================================================
            // MARCADOR DE FINAL
            // ==================================================

            if (coordenadas.length > 1) {

                L.marker(
                    coordenadas[
                        coordenadas.length - 1
                    ]
                )
                .addTo(mapa)
                .bindPopup(
                    '<strong>Final da rota</strong><br>' +

                    'P' +

                    String(
                        pontos.length
                    )
                    .padStart(
                        4,
                        '0'
                    )
                );
            }


            // ==================================================
            // ENQUADRAR TODA A ROTA
            // ==================================================

            mapa.fitBounds(
                L.latLngBounds(coordenadas),
                {
                    padding: [
                        50,
                        50
                    ]
                }
            );

        }

    </script>

</body>

</html>
    `;
}


// ======================================================
// SERVIDOR
// ======================================================

const servidor =
    http.createServer(
        (req, res) => {

            // ==================================================
            // IDENTIFICAR ROTA
            // ==================================================

            const resultado =
                req.url.match(
                    /^\/rotas\/(\d+)\/mapa$/
                );


            // ==================================================
            // PÁGINA INICIAL
            // ==================================================

            if (!resultado) {

                res.writeHead(
                    200,
                    {
                        'Content-Type':
                            'text/html; charset=utf-8'
                    }
                );


                res.end(`

                    <h1>
                        Mapa GPS
                    </h1>

                    <p>
                        Exemplo:
                    </p>

                    <a href="/rotas/12/mapa">
                        Abrir rota 12
                    </a>

                `);

                return;
            }


            // ==================================================
            // ID DA ROTA
            // ==================================================

            const rotaId =
                Number(
                    resultado[1]
                );


            try {

                // ==================================================
                // BUSCAR TODOS OS PONTOS
                // ==================================================

                const pontos =
                    buscarPontos(
                        rotaId
                    );


                // ==================================================
                // MOSTRAR NO TERMINAL
                // ==================================================

                console.log('');

                console.log(
                    '================================'
                );

                console.log(
                    `ROTA ${rotaId}`
                );

                console.log(
                    `TOTAL DE PONTOS: ${pontos.length}`
                );

                console.log(
                    '================================'
                );

                console.log('');


                pontos.forEach(
                    (ponto, indice) => {

                        console.log(

                            `P${String(
                                indice + 1
                            ).padStart(
                                4,
                                '0'
                            )}`,

                            '| ID:',
                            ponto.id,

                            '| Lat:',
                            ponto.latitude,

                            '| Long:',
                            ponto.longitude
                        );
                    }
                );


                // ==================================================
                // GERAR HTML
                // ==================================================

                const html =
                    gerarHtml(
                        pontos,
                        rotaId
                    );


                // ==================================================
                // ENVIAR HTML
                // ==================================================

                res.writeHead(
                    200,
                    {
                        'Content-Type':
                            'text/html; charset=utf-8'
                    }
                );


                res.end(html);

            }

            catch (erro) {

                console.error(
                    'Erro ao gerar mapa:',
                    erro
                );


                res.writeHead(
                    500,
                    {
                        'Content-Type':
                            'text/plain; charset=utf-8'
                    }
                );


                res.end(
                    'Erro ao gerar mapa: ' +
                    erro.message
                );
            }

        }
    );


// ======================================================
// INICIAR SERVIDOR
// ======================================================

servidor.listen(
    PORT,
    () => {

        console.log('');

        console.log(
            '=============================='
        );

        console.log(
            '          MAPA GPS'
        );

        console.log(
            '=============================='
        );

        console.log('');

        console.log(
            `Servidor: http://localhost:${PORT}`
        );

        console.log('');

        console.log(
            'Exemplo:'
        );

        console.log(
            `http://localhost:${PORT}/rotas/12/mapa`
        );

        console.log('');
    }
);


// ======================================================
// ENCERRAMENTO CORRETO
// ======================================================

process.on('SIGINT', () => {

    console.log('');
    console.log('Encerrando servidor...');


    servidor.close(() => {

        try {

            db.close();

            console.log(
                'Banco de dados fechado.'
            );

        }
        catch (erro) {

            console.error(
                'Erro ao fechar banco:',
                erro.message
            );
        }


        process.exit(0);
    });

});

