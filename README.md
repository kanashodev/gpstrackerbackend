# Sistema de Gerenciamento de Rotas — Backend

**Versão:** 0.0.8

Backend para gerenciamento de motoristas, caminhões, rotas e pontos de GPS de um sistema de entregas.

O projeto utiliza **Node.js**, **Express** e **SQLite**, com uma interface de terminal para gerenciamento do sistema e uma API REST para comunicação com o aplicativo mobile.

---

## Tecnologias

* Node.js
* Express
* SQLite
* better-sqlite3
* QR Code
* REST API
* JSON
* JavaScript

---

## Estrutura do projeto

```text
0.0.8/
│
├── api/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── gps.js
│   │   └── rota.js
│   │
│   ├── teste/
│   │   └── testeapi.js
│   │
│   └── server.js
│
├── menus/
│   ├── menuPrincipal.js
│   ├── menuMotoristas.js
│   ├── menuGps.js
│   ├── menuCaminhoes.js
│   └── menuRotas.js
│
├── services/
│   ├── motoristaService.js
│   ├── gpsService.js
│   ├── caminhaoService.js
│   └── rotaService.js
│
├── database.js
├── database.db
├── index.js
├── package.json
└── package-lock.json
```

> A pasta `node_modules` não faz parte do código-fonte e não deve ser versionada no Git.

---

# Funcionamento

O sistema possui dois processos principais:

```text
                    SISTEMA
                       │
              ┌────────┴────────┐
              │                 │
        Terminal principal    API REST
              │                 │
        menus administrativos   │
              │                 │
              └────────┬────────┘
                       │
                  SQLite
                database.db
```

O `index.js` inicia o sistema administrativo e automaticamente abre a API em um novo terminal.

---

# Inicialização

Primeiro instale as dependências:

```bash
npm install
```

Depois execute:

```bash
node index.js
```

O sistema irá:

1. Carregar o banco de dados.
2. Abrir a API em um novo terminal.
3. Iniciar o menu principal no terminal atual.

---

# Compatibilidade

A abertura automática da API detecta o sistema operacional.

### macOS

O sistema utiliza o `Terminal.app` para abrir uma nova janela.

### Linux

O sistema utiliza o `gnome-terminal`.

Caso seja utilizado outro emulador de terminal, como `Konsole`, pode ser necessário adaptar a função responsável pela abertura do terminal.

---

# Menu principal

O menu administrativo possui:

```text
========================================
    SISTEMA DE GERENCIAMENTO DE ROTAS
========================================
1 - Motoristas
2 - GPS
3 - Caminhões
4 - Rotas
0 - Sair
========================================
```

Existe também um comando interno:

```text
teste
```

Esse comando não aparece no menu.

Quando utilizado, ele abre:

```text
api/teste/testeapi.js
```

em um novo terminal.

---

# Banco de dados

O projeto utiliza SQLite através do pacote `better-sqlite3`.

O arquivo do banco é:

```text
database.db
```

O caminho do banco é definido utilizando `__dirname`, evitando que o sistema crie bancos diferentes dependendo do diretório onde o Node.js foi executado.

Exemplo:

```text
projeto/
└── database.db
```

---

# Tabelas

## motoristas

Armazena os motoristas cadastrados.

```text
id
hash
data_cadastro
status
```

O campo `status` controla se o motorista está disponível ou trabalhando em uma rota.

Estados utilizados:

```text
disponivel
ocupado
```

---

## gps

Relaciona um GPS a um motorista.

```text
id
motorista_id
data_cadastro
```

Um motorista possui apenas um registro de GPS.

---

## caminhoes

Armazena os caminhões cadastrados.

```text
id
nome
placa
data_cadastro
```

A placa é única.

---

## rotas

Armazena as rotas de entrega.

```text
id
motorista_id
caminhao_id
nome
quantidade_notas
status
data_criacao
data_rota
hora_inicio
hora_finalizacao
```

Uma rota possui:

* motorista;
* caminhão;
* nome;
* quantidade de notas;
* data;
* horário de início;
* horário de finalização;
* status.

Os principais estados são:

```text
ativa
finalizada
```

---

## notas_rota

Armazena as notas pertencentes a uma rota.

```text
id
rota_id
numero_nota
```

Cada nota pertence a uma rota.

---

## gps_pontos

Armazena os pontos de GPS recebidos durante uma rota.

```text
id
rota_id
ponto
latitude
longitude
data_hora_gps
data_hora_recebimento
```

Exemplo:

```text
P0001
P0002
P0003
P0004
```

Existe uma restrição para evitar que o mesmo ponto seja cadastrado duas vezes na mesma rota.

---

# Serviços

A lógica do sistema é separada em serviços.

## motoristaService

Responsável pelas operações relacionadas aos motoristas.

Exemplos:

* cadastrar motorista;
* buscar motorista;
* listar motoristas;
* excluir motorista;
* alterar status.

---

## caminhaoService

Responsável pelas operações relacionadas aos caminhões.

Exemplos:

* cadastrar caminhão;
* listar caminhões;
* buscar caminhão;
* excluir caminhão.

---

## rotaService

Responsável pelo gerenciamento das rotas.

Exemplos:

* criar rota;
* buscar rotas ativas;
* buscar rotas finalizadas;
* buscar notas;
* finalizar rota;
* buscar motoristas disponíveis;
* buscar caminhões.

Quando uma rota é finalizada, o motorista volta para:

```text
disponivel
```

---

## gpsService

Responsável pelos dados de localização.

Principais funções:

```text
cadastrarGps()
buscarMotorista()
salvarPontoGps()
salvarPontosGps()
buscarPontosDaRota()
```

O serviço valida:

1. motorista;
2. hash;
3. rota;
4. vínculo entre motorista e rota;
5. status da rota;
6. duplicidade do ponto.

---

# API

A API utiliza Express.

Servidor:

```text
http://localhost:3000
```

---

# GPS

Endpoint:

```http
POST /gps
```

O endpoint aceita um único ponto ou vários pontos.

---

## Envio de um ponto

Exemplo:

```json
{
    "hash": "HASH_DO_MOTORISTA",
    "rotaId": 6,
    "ponto": "P0001",
    "latitude": -19.1538787,
    "longitude": -41.4829917,
    "dataHoraGps": "2026-09-21T04:20:48.755Z"
}
```

---

## Envio de vários pontos

O aplicativo pode armazenar pontos localmente quando estiver sem internet e posteriormente enviar vários pontos de uma vez.

Exemplo:

```json
{
    "hash": "HASH_DO_MOTORISTA",
    "rotaId": 6,
    "pontos": [
        {
            "ponto": "P0004",
            "latitude": -19.1538787,
            "longitude": -41.4829917,
            "dataHoraGps": "2026-09-21T04:20:48.755Z"
        },
        {
            "ponto": "P0005",
            "latitude": -19.1509879,
            "longitude": -41.4841739,
            "dataHoraGps": "2026-09-21T04:20:48.755Z"
        },
        {
            "ponto": "P0006",
            "latitude": -19.1443489,
            "longitude": -41.4822749,
            "dataHoraGps": "2026-09-21T04:20:48.755Z"
        }
    ]
}
```

A resposta informa:

```json
{
    "gps": "ok",
    "rotaId": 6,
    "quantidadeRecebida": 3,
    "quantidadeSalva": 3,
    "primeiroPonto": "P0004",
    "ultimoPonto": "P0006"
}
```

Pontos que já existem no banco podem ser ignorados durante a sincronização.

Isso permite que o aplicativo tente sincronizar novamente sem necessariamente duplicar os registros.

---

# Consulta dos pontos de uma rota

O serviço permite buscar os pontos registrados de uma rota.

Os dados incluem:

```text
latitude
longitude
data_hora_gps
data_hora_recebimento
ponto
```

Esses dados posteriormente poderão ser utilizados para renderizar a trajetória realizada pelo caminhão em um mapa.

---

# Rotas

A API possui endpoints relacionados ao gerenciamento de rotas.

Entre as operações existentes estão:

```text
Criar rota
Consultar rota do motorista
Finalizar rota
```

Uma rota está vinculada diretamente a:

```text
Motorista
      │
      └── Rota
            │
            ├── Caminhão
            ├── Notas
            └── Pontos GPS
```

---

# Autenticação por Hash

O aplicativo utiliza um hash associado ao motorista.

Exemplo:

```text
877dd08a29541b3ff6ef5355351bde73badd52c1eff3049033ec4252cb2259db
```

O hash é utilizado pela API para identificar o motorista.

Antes de salvar um ponto GPS, o backend verifica:

```text
Hash
 │
 ├── motorista existe?
 │
 ├── rota existe?
 │
 ├── rota pertence ao motorista?
 │
 └── rota está ativa?
```

Somente depois dessas verificações o ponto é salvo.

---

# Fluxo do GPS

O fluxo planejado para o aplicativo é:

```text
Motorista inicia jornada
        │
        ▼
Aplicativo obtém localização
        │
        ▼
Existe internet?
   │           │
  SIM         NÃO
   │           │
   ▼           ▼
Envia API    Salva localmente
   │           │
   │           ▼
   │       Aguarda conexão
   │           │
   └──────┬────┘
          ▼
      Sincronização
          │
          ▼
       Backend
          │
          ▼
      gps_pontos
```

O objetivo é permitir funcionamento mesmo em regiões sem conexão com a internet.

---

# Testes da API

Os testes ficam em:

```text
api/teste/testeapi.js
```

Para executar manualmente:

```bash
node api/teste/testeapi.js
```

Também é possível utilizar o comando oculto no menu:

```text
teste
```

O sistema abrirá o arquivo em um novo terminal.

---

# Teste de envio de GPS

Exemplo utilizando `curl`:

```bash
curl -X POST http://localhost:3000/gps \
-H "Content-Type: application/json" \
-d '{
    "hash": "HASH_DO_MOTORISTA",
    "rotaId": 6,
    "pontos": [
        {
            "ponto": "P0001",
            "latitude": -19.1538787,
            "longitude": -41.4829917,
            "dataHoraGps": "2026-09-21T04:20:48.755Z"
        }
    ]
}'
```

---

# Arquitetura

A organização atual separa as responsabilidades:

```text
API
 │
 ├── Routes
 │      │
 │      ▼
 │   Services
 │      │
 │      ▼
 │   Database
 │
 └── JSON
```

O terminal administrativo segue uma estrutura semelhante:

```text
Menu
 │
 ▼
Service
 │
 ▼
Database
```

Isso permite adicionar novas funcionalidades sem concentrar toda a lógica em um único arquivo.

---

# Próximas funcionalidades

Funcionalidades planejadas para as próximas versões:

* [ ] Aplicativo Flutter para motoristas
* [ ] Coleta automática de GPS
* [ ] Armazenamento offline dos pontos
* [ ] Sincronização automática dos pontos
* [ ] Aprovação da jornada pelo backend
* [ ] Associação motorista → caminhão → rota
* [ ] QR Code das notas
* [ ] Confirmação de entrega
* [ ] Finalização automática após confirmação de todas as notas
* [ ] Visualização da trajetória em mapa
* [ ] Página web local para visualizar uma rota
* [ ] Melhorias na autenticação
* [ ] Docker
* [ ] PostgreSQL em versões futuras

---

# Versão 0.0.8

Principais alterações desta versão:

* API REST integrada ao sistema principal.
* Endpoint de GPS.
* Salvamento de pontos GPS individuais.
* Salvamento de vários pontos GPS em uma única requisição.
* Validação de motorista e rota.
* Controle de rota ativa.
* Prevenção de pontos GPS duplicados.
* Estrutura de serviços separada.
* Banco SQLite utilizando caminho absoluto baseado em `__dirname`.
* Inicialização automática da API.
* Abertura da API em novo terminal no macOS/Linux.
* Terminal separado para execução dos testes.
* Comando oculto `teste`.
* Estrutura preparada para sincronização de GPS offline.

---

# Objetivo do projeto

O objetivo do backend é fornecer a infraestrutura para um sistema de gerenciamento e acompanhamento de rotas de entrega.

A arquitetura está sendo construída de forma incremental, começando pelo gerenciamento administrativo e armazenamento dos dados e avançando posteriormente para:

```text
Backend
   │
   ├── Motoristas
   ├── Caminhões
   ├── Rotas
   ├── Notas
   └── GPS
          │
          ▼
      Aplicativo
          │
          ▼
   Sincronização offline
          │
          ▼
       Backend
          │
          ▼
      Visualização
```

**Versão atual: 0.0.8**
