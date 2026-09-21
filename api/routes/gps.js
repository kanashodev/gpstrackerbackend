const express = require('express');

const {
    salvarPontoGps,
    salvarPontosGps
} = require('../../services/gpsService');

const router = express.Router();

router.post('/', (req, res) => {

    const {
        hash,
        rotaId,
        ponto,
        latitude,
        longitude,
        dataHoraGps,
        pontos
    } = req.body;

    // ======================================================
    // VALIDAÇÕES GERAIS
    // ======================================================

    if (
        typeof hash !== 'string' ||
        !Number.isInteger(rotaId) ||
        rotaId <= 0
    ) {
        return res.status(400).json({
            gps: 'erro',
            erro: 'Formato inválido'
        });
    }

    if (hash.trim() === '') {
        return res.status(400).json({
            gps: 'erro',
            erro: 'Hash inválido'
        });
    }

    // ======================================================
    // VÁRIOS PONTOS
    // ======================================================

    if (Array.isArray(pontos)) {

        if (pontos.length === 0) {
            return res.status(400).json({
                gps: 'erro',
                erro: 'Lista de pontos vazia'
            });
        }

        for (const item of pontos) {

            if (
                typeof item.ponto !== 'string' ||
                typeof item.latitude !== 'number' ||
                typeof item.longitude !== 'number' ||
                typeof item.dataHoraGps !== 'string'
            ) {
                return res.status(400).json({
                    gps: 'erro',
                    erro: 'Formato inválido em um dos pontos'
                });
            }

            if (item.ponto.trim() === '') {
                return res.status(400).json({
                    gps: 'erro',
                    erro: 'Ponto inválido'
                });
            }
        }

        const resultado = salvarPontosGps({
            hash,
            rotaId,
            pontos
        });

        if (!resultado.sucesso) {
            return res.status(resultado.status).json({
                gps: 'erro',
                erro: resultado.erro,
                ...(resultado.ponto && {
                    ponto: resultado.ponto
                })
            });
        }

        res.locals.gpsRecebido = true;

        return res.status(200).json({
            gps: 'ok',
            rotaId: resultado.rotaId,
            quantidadeRecebida: resultado.quantidadeRecebida,
            quantidadeSalva: resultado.quantidadeSalva,
            primeiroPonto: resultado.primeiroPonto,
            ultimoPonto: resultado.ultimoPonto
        });
    }

    // ======================================================
    // UM ÚNICO PONTO
    // ======================================================

    if (
        typeof ponto !== 'string' ||
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        typeof dataHoraGps !== 'string'
    ) {
        return res.status(400).json({
            gps: 'erro',
            erro: 'Formato inválido'
        });
    }

    if (ponto.trim() === '') {
        return res.status(400).json({
            gps: 'erro',
            erro: 'Ponto inválido'
        });
    }

    const resultado = salvarPontoGps({
        hash,
        rotaId,
        ponto,
        latitude,
        longitude,
        dataHoraGps
    });

    if (!resultado.sucesso) {
        return res.status(resultado.status).json({
            gps: 'erro',
            erro: resultado.erro,
            ...(resultado.ponto && {
                ponto: resultado.ponto
            })
        });
    }

    res.locals.gpsRecebido = true;

    return res.status(200).json({
        gps: 'ok',
        id: resultado.id,
        rotaId: resultado.rotaId,
        ponto: resultado.ponto,
        latitude: resultado.latitude,
        longitude: resultado.longitude,
        dataHoraGps: resultado.dataHoraGps,
        dataHoraRecebimento: resultado.dataHoraRecebimento
    });
});

module.exports = router;