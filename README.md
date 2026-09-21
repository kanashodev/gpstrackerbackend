# Gerenciamento de Rotas

Backend em Node.js com SQLite, executado pelo terminal.

## Funcionalidades

### Menu principal
- 1 - Motoristas
- 2 - GPS
- 3 - Caminhões
- 4 - Rotas
- 0 - Sair

### Rotas
- 1 - Lançar rota
- 2 - Mostrar rotas ativas
- 3 - Finalizar rota
- 0 - Voltar

Ao lançar uma rota, o sistema vincula motorista, caminhão, nome da rota e números das notas. Toda rota nova começa com status `ativa`.

A opção de mostrar rotas exibe somente rotas com status `ativa`.

A opção de finalizar rota altera o status da rota de `ativa` para `finalizada`. A rota não é apagada do banco.

A tabela `gps_pontos` já está preparada para receber os pontos de latitude e longitude posteriormente.

## Instalação

```bash
npm install
npm start
```

O banco `database.db` é criado automaticamente.


## 0.0.6
- Gera QR Code de cada número de nota no terminal ao criar uma rota.
- Exibe o QR Code de cada nota ao consultar rotas ativas e finalizadas.
- O QR Code contém o próprio número da nota, preparando a futura leitura pelo aplicativo e confirmação via endpoint.
- O endpoint de confirmação automática ainda não foi criado nesta versão.
# gpstrackerbackend
