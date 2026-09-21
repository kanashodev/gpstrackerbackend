
const http = require('http');
const Database = require('better-sqlite3');

const PORT = 3002;

const db = new Database('./database.db');

function buscarPontos(rotaId) {
    return db.prepare(`
        SELECT
            id,
            latitude,
            longitude,
            data_hora_gps
        FROM gps_pontos
        WHERE rota_id = ?
        ORDER BY id ASC
    `).all(rotaId);
}

function gerarHtml(pontos, rotaId) {

    const coordenadas = pontos.map((ponto) => {
        return [
            Number(ponto.latitude),
            Number(ponto.longitude)
        ];
    });

    return `
<!DOCTYPE html>
<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <title>Mapa da Rota ${rotaId}</title>

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

    </style>

</head>

<body>

    <div id="map"></div>

    <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
    </script>

    <script>

        const pontos = ${JSON.stringify(coordenadas)};

        console.log('Pontos recebidos:', pontos);

        if (pontos.length === 0) {

            document.getElementById('map').innerHTML =
                '<h2 style="padding: 20px;">' +
                'Nenhum ponto encontrado para essa rota.' +
                '</h2>';

        } else {

            const mapa = L.map('map');

            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap'
                }
            ).addTo(mapa);

            const linha = L.polyline(
                pontos,
                {
                    weight: 5
                }
            ).addTo(mapa);

            mapa.fitBounds(
                linha.getBounds()
            );

            L.marker(pontos[0])
                .addTo(mapa)
                .bindPopup('Início da rota');

            L.marker(pontos[pontos.length - 1])
                .addTo(mapa)
                .bindPopup('Fim da rota');
        }

    </script>

</body>

</html>
`;
}

const servidor = http.createServer((req, res) => {

    const resultado = req.url.match(
        /^\/rotas\/(\d+)\/mapa$/
    );

    if (!resultado) {

        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });

        res.end(`
            <h1>Mapa GPS</h1>

            <p>
                Exemplo:
            </p>

            <a href="/rotas/13/mapa">
                Abrir rota 13
            </a>
        `);

        return;
    }

    const rotaId = Number(resultado[1]);

    try {

        const pontos = buscarPontos(rotaId);

        console.log(
            `Rota ${rotaId}: ${pontos.length} pontos encontrados`
        );

        const html = gerarHtml(
            pontos,
            rotaId
        );

        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });

        res.end(html);

    } catch (erro) {

        console.error(erro);

        res.writeHead(500, {
            'Content-Type': 'text/plain; charset=utf-8'
        });

        res.end(
            'Erro ao gerar mapa: ' +
            erro.message
        );
    }
});

servidor.listen(
    PORT,
    () => {

        console.log('');
        console.log('==============================');
        console.log('      MAPA GPS');
        console.log('==============================');
        console.log('');

        console.log(
            `Servidor: http://localhost:${PORT}`
        );

        console.log('');

        console.log(
            'Exemplo:'
        );

        console.log(
            `http://localhost:${PORT}/rotas/13/mapa`
        );

        console.log('');
    }
);

