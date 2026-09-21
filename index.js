const { spawn } = require('child_process');
const path = require('path');

require('./database');

const menuPrincipal = require('./menus/menuPrincipal');

function abrirServidor() {
    const pastaProjeto = __dirname;
    const caminhoServidor = path.join(pastaProjeto, 'api', 'server.js');

    if (process.platform === 'darwin') {
        // macOS
        const comando = `cd "${pastaProjeto}" && node "${caminhoServidor}"`;

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
                `cd "${pastaProjeto}" && node "${caminhoServidor}"; exec bash`
            ],
            {
                detached: true,
                stdio: 'ignore'
            }
        ).unref();

    } else {
        console.log('Sistema operacional não suportado para abrir o servidor.');
    }
}

abrirServidor();

menuPrincipal().catch((erro) => {
    console.error('\nErro inesperado:', erro);
    process.exit(1);
});