# ARGOS — Especificação Técnica das Camadas do Mapa

**Data:** 22/08/2026
**Escopo:** somente as 9 camadas de `mapLayers` + a camada base de vias.
**Este documento é só diagnóstico — nenhum código foi alterado nesta etapa.**

---

## 1. Vias (mapa-base)

- **Fonte de dados:** OpenStreetMap (tile server público)
- **Real ou mock:** Real
- **Endpoint:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (chamado direto pelo navegador, sem passar pelo backend ARGOS)
- **Tabela PostgreSQL:** nenhuma — tiles não são persistidos
- **Arquivo do frontend:** `src/pages/MapPage.tsx` (componente `<TileLayer>`)
- **Formato dos dados:** imagem PNG por tile, protocolo padrão XYZ
- **O que falta para ser real:** nada — já é real e funcional

---

## 2. Temperatura

- **Fonte de dados:** Open-Meteo (`current=temperature_2m`)
- **Real ou mock:** **Real**
- **Endpoint:** `GET /api/weather?lat&lng` (backend ARGOS)
- **Tabela PostgreSQL:** `WeatherData`, coluna `temperature`
- **Arquivo do frontend:** `src/data/mapApi.ts` (`fetchRealWeather`) + `src/pages/MapPage.tsx` (popup da camada `temperatura`)
- **Formato dos dados:**
  ```ts
  { temperature: number, condition: string, humidity: number, ... , cached: boolean }
  ```
  (formato completo em `RealWeatherData`, `src/data/mapApi.ts`)
- **O que falta para ser real:** nada — pipeline completo Open-Meteo → `weatherService.ts` → Postgres → `/api/weather` → frontend, testado nas Partes 1–3.

---

## 3. Ventania

- **Fonte de dados:** Open-Meteo (`current=wind_speed_10m`)
- **Real ou mock:** **Real**
- **Endpoint:** `GET /api/weather?lat&lng`
- **Tabela PostgreSQL:** `WeatherData`, coluna `windSpeed`
- **Arquivo do frontend:** `src/data/mapApi.ts` + `src/pages/MapPage.tsx` (popup da camada `ventania`)
- **Formato dos dados:** mesmo objeto `RealWeatherData` da Temperatura (é a mesma chamada de API, campo `windSpeed`)
- **O que falta para ser real:** nada — mesmo pipeline testado da Temperatura.

---

## 4. Chuva

- **Fonte de dados:** nenhuma conectada nesta camada
- **Real ou mock:** **Mock**
- **Endpoint:** nenhum
- **Tabela PostgreSQL:** nenhuma
- **Arquivo do frontend:** `src/data/mockData.ts` → `mapMarkers.chuva` (3 pontos fixos: `{ lat, lng, intensity: 'alta'|'média'|'baixa' }`)
- **Formato dos dados:** array estático de objetos com `intensity` textual, sem relação com nenhum dado meteorológico real
- **O que falta para ser real:** a precipitação **real** já existe no backend (campo `precipitation` em `ArgosWeatherModel`/`RealWeatherData`, vindo de `current=precipitation` da Open-Meteo) e já é exibida no popup da Temperatura — mas só para o ponto único de Sento Sé. Para esta camada espacial com múltiplos marcadores, faltaria decidir uma malha de coordenadas (quais pontos consultar) e chamar `/api/weather` para cada um, ou usar a API de dados em grade da Open-Meteo. Isso é implementação de camada nova — não será feito nesta etapa.

---

## 5. Áreas de Risco (zonas)

- **Fonte de dados:** nenhuma — seria resultado de cálculo/modelo de risco, não dado bruto de API externa
- **Real ou mock:** **Mock**
- **Endpoint:** nenhum
- **Tabela PostgreSQL:** nenhuma
- **Arquivo do frontend:** `src/data/mockData.ts` → `riskZones` (`RiskZone[]`: `id, name, level, center, radiusMeters, description`)
- **Formato dos dados:** círculos com nível de risco em escala fixa (`normal|atencao|moderado|alto|critico`)
- **O que falta para ser real:** um motor de cálculo de risco (IA/regras) — explicitamente fora de escopo agora. Continuará mock.

---

## 6. Alagamentos

- **Fonte de dados:** nenhuma fonte pública simples identificada
- **Real ou mock:** **Mock**
- **Endpoint:** nenhum
- **Tabela PostgreSQL:** nenhuma
- **Arquivo do frontend:** `src/data/mockData.ts` → `mapMarkers.alagamentos` (`{ lat, lng, name }`)
- **Formato dos dados:** array estático de pontos nomeados
- **O que falta para ser real:** uma fonte de dado de alagamento em tempo real (sensor, defesa civil ou relato comunitário) — nenhuma está disponível/no escopo agora.

---

## 7. Deslizamentos

- **Fonte de dados:** nenhuma fonte pública simples identificada (CEMADEN existe, mas exige convênio/acesso não trivial)
- **Real ou mock:** **Mock**
- **Endpoint:** nenhum
- **Tabela PostgreSQL:** nenhuma
- **Arquivo do frontend:** `src/data/mockData.ts` → `mapMarkers.deslizamentos` (`{ lat, lng, name }`)
- **Formato dos dados:** array estático de pontos nomeados
- **O que falta para ser real:** fonte pública viável ainda não identificada.

---

## 8. Relatos

- **Fonte de dados:** seriam os próprios usuários (sistema de relatos comunitários)
- **Real ou mock:** **Mock**
- **Endpoint:** nenhum
- **Tabela PostgreSQL:** nenhuma
- **Arquivo do frontend:** `src/data/mockData.ts` → `mapOccurrences` (`MapOccurrence[]`: `id, type, location, time, description, lat, lng`)
- **Formato dos dados:** array estático de ocorrências
- **O que falta para ser real:** o sistema de relatos comunitários em si — explicitamente fora de escopo agora.

---

## 9. Abrigos

- **Fonte de dados:** nenhuma API pública — seria uma lista curada pela Defesa Civil local
- **Real ou mock:** **Mock**
- **Endpoint:** nenhum
- **Tabela PostgreSQL:** nenhuma
- **Arquivo do frontend:** `src/data/mockData.ts` → `mapShelters` (`MapShelter[]`: `id, name, address, capacity, lat, lng`)
- **Formato dos dados:** array estático de abrigos
- **O que falta para ser real:** não depende de integração com API — depende de você fornecer a lista real (nome/endereço/capacidade/coordenadas) para eu persistir numa tabela simples. Candidata de menor esforço para virar real, mas **não foi implementada nesta etapa** por instrução explícita sua.

---

## 10. Nível dos Rios

- **Fonte de dados:** candidata identificada é ANA/SNIRH (telemetria hidrológica oficial), não configurada
- **Real ou mock:** **Mock**
- **Endpoint:** nenhum
- **Tabela PostgreSQL:** nenhuma
- **Arquivo do frontend:** `src/data/mockData.ts` → `mapMarkers.rios` (`{ lat, lng, name, level }`)
- **Formato dos dados:** array estático de pontos com nível numérico fixo
- **O que falta para ser real:** viabilidade e acesso a uma API oficial de nível de rio ainda precisa ser pesquisada e validada.

---

## Confirmações explícitas pedidas

1. **Temperatura recebe dados reais da Open-Meteo.** ✅ Confirmado — pipeline testado nas Partes 1–3 (`weatherService.ts` → `/api/weather` → `WeatherData` → frontend).
2. **Ventania recebe dados reais da Open-Meteo.** ✅ Confirmado — mesmo pipeline e mesma chamada de API que a Temperatura, campo `windSpeed`.
3. **Precipitação real já disponível no backend, mas a camada espacial "Chuva" ainda usa mock.** ✅ Confirmado — `precipitation` existe em `ArgosWeatherModel`/`RealWeatherData` e aparece no popup de Temperatura; a camada `mapMarkers.chuva` (3 pontos espalhados) continua 100% mock e não foi tocada.
4. **Risco, Abrigos, Alagamentos, Deslizamentos e Relatos continuam mock.** ✅ Confirmado — nenhuma dessas 5 camadas foi alterada; todas seguem lendo de `mockData.ts`.
5. **Nenhuma IA/ML/previsão de risco foi implementada.** ✅ Confirmado — `riskService.ts` no backend continua só lançando `NotImplementedError`; nada foi conectado ao frontend.
6. **Nenhuma camada já funcionando foi alterada.** ✅ Confirmado — Temperatura, Ventania e o mapa-base (OpenStreetMap) permanecem exatamente como estavam ao final da Parte 3; este documento não gerou nenhum diff de código.
7. **Nenhum dado fictício foi criado para substituir fonte real.** ✅ Confirmado — onde não há fonte real disponível/configurada, o mock foi mantido explicitamente, em vez de simulado como se fosse real.

---

## Estado geral

| # | Camada | Real/Mock |
|---|---|---|
| — | Vias (base) | Real |
| 1 | Temperatura | **Real** |
| 2 | Ventania | **Real** |
| 3 | Chuva | Mock |
| 4 | Áreas de Risco | Mock |
| 5 | Alagamentos | Mock |
| 6 | Deslizamentos | Mock |
| 7 | Relatos | Mock |
| 8 | Abrigos | Mock |
| 9 | Nível dos Rios | Mock |

**2 de 9 camadas toggle + a base já são 100% reais e testadas. As outras 7 permanecem mock, sem nenhuma alteração.**

Aguardando sua autorização para implementar a próxima camada.
