const express = require('express');

const router = express.Router();

const {
    autenticarHash
} = require('../services/authService');

router.post('/auth', (req, res) => {

    // Verifica se o corpo é um objeto JSON válido
    if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
    ) {
        return res.status(400).json({
            auth: 'erro',
            erro: 'Formato inválido'
        });
    }

    const { hash } = req.body;

    // Verifica se o hash existe e é uma string
    if (
        typeof hash !== 'string' ||
        hash.trim() === ''
    ) {
        return res.status(400).json({
            auth: 'erro',
            erro: 'Formato inválido'
        });
    }

    const motorista = autenticarHash(hash.trim());

    // Hash não encontrado
    if (!motorista) {
        return res.status(401).json({
            auth: 'erro',
            erro: 'Hash inválido'
        });
    }

    // Autenticado
    return res.status(200).json({
        auth: 'ok'
    });
});

module.exports = router;