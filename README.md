# ARGOS

**Sistema Inteligente de Monitoramento e Prevenção de Riscos Climáticos Urbanos**

Protótipo visual mobile-first para monitoramento climático urbano, prevenção de enchentes, alagamentos, deslizamentos e ventanias. Dados fictícios baseados na cidade de **Sento Sé - Bahia**.

## Tecnologias

- React 18 + TypeScript
- Vite
- TailwindCSS
- React Router
- Leaflet / React-Leaflet
- Recharts
- Lucide React

## Instalação

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Telas

| Tela         | Rota          | Descrição                                   |
| ------------ | ------------- | ------------------------------------------- |
| Início       | `/`           | Clima atual, risco geral, alertas resumidos |
| Mapa         | `/mapa`       | Mapa Leaflet com 8 camadas ativáveis        |
| Alertas      | `/alertas`    | Cartões de alerta com níveis de risco       |
| Relatos      | `/relatos`    | Relatos da comunidade com fotos simuladas   |
| Emergência   | `/emergencia` | Contatos de emergência                      |
| Histórico    | `/historico`  | Gráficos climáticos com filtros             |
| IA Preditiva | `/ia`         | Painel de análise de riscos por IA          |

## Dados

A maior parte dos dados ainda é simulada (mock). A partir desta versão, **a camada de clima do mapa (temperatura e vento) usa dados reais da Open-Meteo**, através de um backend próprio. Ver seção "Backend (Primeira Etapa)" abaixo para os detalhes completos.

---

# Backend (Primeira Etapa)

Esta seção documenta a primeira etapa de integração de backend do ARGOS, cujo único objetivo foi conectar a funcionalidade do **mapa** a dados reais, sem alterar o restante do frontend.

## 1. O que foi implementado

- Backend Node.js (TypeScript, servidor HTTP nativo, sem framework como Express) em `backend/`.
- Integração real com a **Open-Meteo** (`current_weather`/`current` endpoint) para temperatura, vento e condição do tempo no ponto de Sento Sé - BA (`SENTO_SE_COORDS`, reaproveitado de `src/data/mockData.ts`).
- Camada de normalização (`weatherService.ts`) que converte o formato da Open-Meteo em um modelo interno (`ArgosWeatherModel`), compatível com a interface `WeatherData` do frontend.
- Persistência real em **PostgreSQL** via **Prisma** (tabela `WeatherData`), usada também como cache de leitura (`WEATHER_CACHE_MINUTES`, padrão 15 min) para não bater na Open-Meteo a cada requisição do mapa.
- Endpoints `GET /api/health`, `GET /api/weather`, `GET /api/map`.
- Tratamento de erros para: Open-Meteo indisponível/timeout, resposta inválida, banco indisponível, coordenadas inválidas.
- CORS restrito à origem do Vite em desenvolvimento (`CORS_ORIGIN`).
- No frontend: `src/data/mapApi.ts` (novo) e alterações **pontuais** em `src/pages/MapPage.tsx` para que as camadas "Temperatura" e "Ventania" busquem dados reais, com estados de `loading`, `success` e `error` visíveis (banner no mapa + texto nos popups). Nenhum dado falso é exibido enquanto a API está indisponível ou carregando.
- Proxy `/api` no `vite.config.ts` apontando para `http://localhost:3001`.

## 2. O que NÃO foi implementado

Propositalmente fora do escopo desta etapa (estruturas reservadas, sem lógica real):

- **IA / ML** (`backend/src/services/riskService.ts`): lança `NotImplementedError`. Nenhum modelo, score "inteligente" ou previsão de risco foi criado.
- **Relatos comunitários** (`backend/src/services/reportService.ts`): `NewReportPage.tsx` e `ReportsPage.tsx` continuam 100% mock, sem nenhuma chamada ao backend.
- **Histórico agregado** (`backend/src/services/historyService.ts`): os gráficos de `HistoryPage.tsx` (`getChartData`) continuam mock. Apenas o registro bruto de cada consulta de clima é salvo no Postgres, sem agregação em série temporal.
- **Previsão de risco própria do ARGOS** (enchente, deslizamento): não implementada. Only dados meteorológicos brutos da Open-Meteo são usados.
- Autenticação, usuários, notificações, sistema Premium, rotas inteligentes, rastreamento compartilhado: nada disso foi tocado.
- Camadas do mapa **zonas de risco, chuva espacial (múltiplos pontos), alagamentos, deslizamentos, relatos, abrigos e rios** continuam vindo de `mockData.ts`, sem fonte real integrada. Isso é intencional: a Open-Meteo fornece dados pontuais de um único local, não uma distribuição espacial de risco pela cidade. O endpoint `GET /api/map` retorna explicitamente `mockLayers` listando essas camadas, para que nenhuma delas seja confundida com dado real.

## 3. Arquitetura

```
Open-Meteo (API externa)
        ↓ fetch real (HTTPS)
backend/src/services/weatherService.ts   (normalização)
        ↓
PostgreSQL (via Prisma)                  (persistência + cache de leitura)
        ↓
backend/src/routes/{weather,map}.ts      (API REST)
        ↓ fetch('/api/weather') via proxy do Vite
src/data/mapApi.ts
        ↓
src/pages/MapPage.tsx                    (camadas "Temperatura" e "Ventania")
```

## 4. Estrutura de pastas

O backend foi mantido **fora** de `src/data/`, em `backend/` na raiz do projeto. Motivo técnico: Prisma precisa do seu próprio `package.json`, `node_modules` e processo Node.js separado do bundle Vite do frontend; misturar os dois dentro de `src/` faria o Vite tentar incluir dependências de servidor (Prisma Client, drivers de banco) no bundle do navegador.

```
backend/
  prisma/
    schema.prisma        # modelo WeatherData
  src/
    config.ts            # env vars, SENTO_SE_COORDS reaproveitado do frontend
    db.ts                 # PrismaClient singleton + healthcheck
    types.ts              # ArgosWeatherModel e classes de erro
    lib/http.ts            # helpers de resposta JSON, CORS, mapeamento de erro -> status HTTP
    services/
      weatherService.ts    # ÚNICO serviço funcional (Open-Meteo real + Postgres)
      riskService.ts       # placeholder, lança NotImplementedError
      reportService.ts     # placeholder, lança NotImplementedError
      historyService.ts    # placeholder, lança NotImplementedError
    routes/
      health.ts
      weather.ts
      map.ts
    server.ts              # http.createServer nativo + roteamento manual
  .env.example
  package.json
  tsconfig.json

src/data/mapApi.ts         # (novo) cliente frontend do backend, usado só pelo MapPage
```

## 5. Banco de dados

- **Prisma** como ORM/migrations, **PostgreSQL** como banco.
- Única tabela: `WeatherData` (`backend/prisma/schema.prisma`) — `id`, `latitude`, `longitude`, `temperature`, `condition`, `humidity`, `windSpeed`, `city`, `state`, `source`, `fetchedAt`, com índice em `(latitude, longitude, fetchedAt)` para acelerar a consulta de cache.
- Cada chamada bem-sucedida à Open-Meteo grava uma nova linha (`prisma.weatherData.create`). Não há `UPDATE` — o histórico bruto fica preservado, mesmo que ainda não exista uma tela que o exiba (ver `historyService.ts`).
- Nenhuma outra tabela foi criada (nenhuma para risco, relatos ou usuários), conforme escopo desta etapa.

## 6. APIs externas

- **Open-Meteo** (`https://api.open-meteo.com/v1/forecast`) — única API externa conectada nesta etapa. Usada para obter `temperature_2m`, `relative_humidity_2m`, `wind_speed_10m` e `weather_code` no ponto de Sento Sé. Escolhida por já ser a fonte definida no escopo do projeto e não exigir chave de API.
- OpenStreetMap (tiles do Leaflet) já era usado pelo frontend antes desta etapa e não foi alterado.
- Nenhuma outra API (OSRM, USGS, CPRM) foi conectada nesta etapa — fazem parte de fases futuras do projeto.

## 7. Endpoints

### `GET /api/health`
Verifica se o backend e o PostgreSQL estão respondendo.
- **Parâmetros:** nenhum.
- **Resposta 200:** `{ status: 'ok', database: { ok: true }, timestamp }`
- **Resposta 503:** `{ status: 'degraded', database: { ok: false, error }, timestamp }` (banco indisponível).

### `GET /api/weather`
Retorna o clima atual normalizado para um ponto.
- **Parâmetros (query, opcionais):** `lat`, `lng` — se omitidos, usa `SENTO_SE_COORDS`.
- **Resposta 200:** `ArgosWeatherModel` — `{ temperature, condition, humidity, windSpeed, city, state, lastUpdate, source: 'open-meteo', cached }`.
- **Resposta 400:** coordenadas inválidas (`{ error }`).
- **Resposta 502:** Open-Meteo indisponível, timeout (8s) ou resposta em formato inesperado (`{ error }`).
- **Resposta 500:** erro interno (ex: Postgres fora do ar) (`{ error }`).

### `GET /api/map`
Dados reais do mapa (apenas o que tem fonte real integrada).
- **Parâmetros:** nenhum.
- **Resposta 200:** `{ coords, weather: ArgosWeatherModel, realLayers: ['temperatura','ventania'], mockLayers: [...] }`.
- **Erros:** iguais aos de `/api/weather`, pois internamente reusa o mesmo serviço.

## 8. Frontend

- **Mock substituído:** somente as camadas "Temperatura" e "Ventania" do `MapPage.tsx`, que antes exibiam `28°C` e `"até 45 km/h"` fixos no código. Agora vêm de `GET /api/weather`.
- **Mocks que continuam:** `riskZones`, `mapOccurrences`, `mapShelters`, `mapMarkers.chuva/alagamentos/deslizamentos/rios`, `mapLayers`, e absolutamente tudo fora do `MapPage.tsx` (Home, Alertas, Relatos, Emergência, Histórico, IA) — nenhum desses arquivos foi tocado.
- **Como o `MapPage` busca os dados:** `useEffect` no mount chama `fetchRealWeather()` (`src/data/mapApi.ts`), que faz `fetch('/api/weather')` (redirecionado pelo proxy do Vite para `http://localhost:3001`). O resultado alimenta um estado `MapApiState<RealWeatherData>` com três variantes: `loading`, `success`, `error` — usadas tanto num banner sobre o mapa quanto no texto dos popups das camadas de temperatura/vento.
- **Compatibilidade com `mockData.ts`:** `RealWeatherData` (frontend) espelha `ArgosWeatherModel` (backend), que por sua vez é um subconjunto de `WeatherData` (`src/types/index.ts`), sem o campo `riskLevel` (pertence a uma camada de risco ainda não implementada). Nenhuma outra interface do frontend foi alterada.

## 9. Instalação (do zero)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# edite .env se necessário (usuário/senha/porta do seu Postgres local)
```

### PostgreSQL local
```bash
# instale o PostgreSQL para o seu sistema operacional, depois:
sudo -u postgres psql -c "CREATE USER argos WITH PASSWORD 'argos';"
sudo -u postgres psql -c "CREATE DATABASE argos_db OWNER argos;"
```

### Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### Frontend
```bash
# na raiz do projeto
npm install
```

## 10. Execução

```bash
# terminal 1 - backend
cd backend
npm run dev        # http://localhost:3001

# terminal 2 - frontend
npm run dev         # http://localhost:5173
```

Acesse `http://localhost:5173/mapa` e observe as camadas "Temperatura" e "Ventania" no mapa.

## 11. Testes

Como verificar cada parte:

| O quê | Como |
|---|---|
| Backend sobe | `curl http://localhost:3001/api/health` deve retornar `status: "ok"` |
| Postgres conectado | mesmo `curl` acima → `database.ok: true` |
| Open-Meteo real | `curl http://localhost:3001/api/weather` → confira se `temperature`/`windSpeed` batem com a previsão atual de Sento Sé em [open-meteo.com](https://open-meteo.com) |
| Dado gravado no Postgres | `psql argos_db -c "SELECT * FROM \"WeatherData\" ORDER BY \"fetchedAt\" DESC LIMIT 5;"` |
| Endpoint do mapa | `curl http://localhost:3001/api/map` |
| Frontend → backend | com os dois servidores rodando, abra `/mapa`, ative "Temperatura"/"Ventania" e clique no círculo — o popup deve mostrar um valor real (não `28°C` fixo) |
| TypeScript do backend | `cd backend && npx tsc --noEmit` |
| Build do frontend | `npm run build` |

## 12. Limitações e o que **não pôde ser testado neste ambiente**

Esta implementação foi escrita e revisada, mas o ambiente onde ela foi gerada (sandbox de execução do Claude) **não tem acesso à internet nem PostgreSQL instalado**. Por isso, de forma honesta e conforme pedido no escopo original:

- **NÃO** foi possível rodar `npm install` (nem no backend, nem no frontend) — o registro npm não é alcançável.
- **NÃO** foi possível fazer uma chamada real à Open-Meteo a partir deste ambiente (uma tentativa de `curl` retornou bloqueio de rede).
- **NÃO** foi possível instalar/rodar PostgreSQL, gerar o Prisma Client ou rodar migrations aqui.
- **NÃO** foi possível, portanto, confirmar uma gravação ou leitura real no Postgres, nem um fluxo ponta-a-ponta (frontend → backend → banco/API → frontend) neste ambiente.
- **O que FOI verificado aqui:** todo o código TypeScript do backend foi checado com `tsc --noEmit`; os únicos erros reportados foram de tipos ausentes de dependências não instaladas (`@types/node`, `@prisma/client`) — nenhum erro de sintaxe ou de lógica de tipos. O frontend não pôde ser type-checado ou buildado por falta de `node_modules` (React, Leaflet etc. não estão instalados neste ambiente).

**Ação necessária da sua parte:** rode os passos das seções 9-11 na sua máquina (com internet e PostgreSQL) para validar de fato o fluxo completo. Se algo falhar nesse teste real, provavelmente é um ajuste pequeno (nome de variável de ambiente, versão do Prisma, etc.) — não uma reescrita da arquitetura.
