# Guia de Setup Docker

## Erro Resolvido: Build Falho

O erro `npm run build` com exit code 2 foi causado por conflitos de tipos TypeScript.

### Problema Identificado

Havia dois tipos chamados `SimulationResult`:
1. Em `src/types/simulation.ts` - para dados de entrada
2. Em `src/utils/advancedCalculations.ts` - para resultados da simulação

### Solução Aplicada

Renomeamos o tipo em `advancedCalculations.ts` para `AdvancedSimulationResult` e atualizamos todas as importações:
- `src/App.tsx`
- `src/pages/ResultsPage.tsx`
- `src/components/AdvancedResultsDisplay.tsx`
- `src/components/InvestmentComparisonChart.tsx`

## Como Usar Docker Agora

### 1. Build Local

```bash
docker build -t simulador-financeiro:latest .
```

### 2. Executar Localmente

```bash
docker run -p 3000:3000 simulador-financeiro:latest
```

### 3. Com Docker Compose

```bash
docker-compose up -d
docker-compose logs -f app
```

## Arquivos Criados

- `Dockerfile` - Multi-stage build otimizado
- `docker-compose.yml` - Configuração de container
- `.dockerignore` - Arquivos excluídos do build
- `.gitignore` - Padrões Git ignorados

## Tamanho da Imagem

- Build stage: ~500MB (descartado)
- Imagem final: ~50-80MB (apenas node_modules + dist)

## Deploy para Produção

A imagem está pronta para ser deployada em:

1. **AWS**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   docker tag simulador-financeiro:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/simulador-financeiro:latest
   docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/simulador-financeiro:latest
   ```

2. **Google Cloud**
   ```bash
   gcloud auth configure-docker
   docker tag simulador-financeiro:latest gcr.io/PROJECT_ID/simulador-financeiro:latest
   docker push gcr.io/PROJECT_ID/simulador-financeiro:latest
   ```

3. **Docker Hub**
   ```bash
   docker tag simulador-financeiro:latest seu-usuario/simulador-financeiro:latest
   docker push seu-usuario/simulador-financeiro:latest
   ```

## Variáveis de Ambiente

Por enquanto, a aplicação não requer variáveis de ambiente específicas. 
Adicione no `docker-compose.yml` conforme necessário:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

## Verificar Container Rodando

```bash
docker ps
docker logs simulador-financeiro
docker exec -it simulador-financeiro sh
```

## Performance

- **Tempo de build**: ~2-3 minutos (primeira vez)
- **Tempo de inicialização**: ~10-15 segundos
- **Memória**: ~100-150MB de runtime

## Troubleshooting

### Porta já em uso
```bash
docker run -p 8080:3000 simulador-financeiro:latest
```

### Limpar imagens e containers
```bash
docker system prune -a
```

### Rebuild sem cache
```bash
docker build --no-cache -t simulador-financeiro:latest .
```
