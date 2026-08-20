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

Todos os dados são simulados (mock). Nenhuma API real é utilizada.
