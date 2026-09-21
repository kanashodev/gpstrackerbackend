require('./database');
const menuPrincipal = require('./menus/menuPrincipal');

menuPrincipal().catch((erro) => {
    console.error('\nErro inesperado:', erro);
    process.exit(1);
});
