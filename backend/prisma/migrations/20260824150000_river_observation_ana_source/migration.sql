-- Troca de fonte de dados de GET /api/rivers: USGS Water Data (só EUA) ->
-- ANA (Agência Nacional de Águas, cobre o Brasil). Ver
-- backend/src/services/riverService.ts para o histórico completo.
-- Só ajusta o valor padrão da coluna para novas linhas - linhas já
-- existentes com source = 'usgs-water' são histórico e não são alteradas.
ALTER TABLE "RiverObservation" ALTER COLUMN "source" SET DEFAULT 'ana-hidro';
