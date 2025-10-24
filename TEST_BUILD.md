# Guia de Teste - Docker Build

## 🧪 Teste 1: Verificar Sintaxe TypeScript

Se você tem Node.js instalado:

```bash
npm install
npm run build
```

**Resultado esperado:** ✅ Build concluído sem erros

## 🐳 Teste 2: Build Docker

```bash
docker build -t simulador-financeiro:latest .
```

**Resultado esperado:** 
```
Successfully tagged simulador-financeiro:latest
```

## 🚀 Teste 3: Rodar Container

```bash
docker run -p 3000:3000 simulador-financeiro:latest
```

**Resultado esperado:**
```
   ┌───────────────────────────────────────┐
   │                                       │
   │   Accepting connections at:           │
   │   http://localhost:3000               │
   │                                       │
   └───────────────────────────────────────┘
```

Acesse: http://localhost:3000

## 🔄 Teste 4: Docker Compose

```bash
docker-compose up -d
docker-compose logs -f app
```

**Resultado esperado:**
```
app  | 
app  |    Accepting connections at:
app  |    http://localhost:3000
```

## ✅ Checklist de Validação

- [ ] Sem erros de TypeScript (`npm run build`)
- [ ] Docker build completo com sucesso
- [ ] Container iniciado sem erros
- [ ] Acesso http://localhost:3000 funcionando
- [ ] Formulário de simulação respondendo
- [ ] Gráficos carregando

## 🐛 Se ainda houver erro

1. Copie a mensagem de erro completa
2. Verifique em qual etapa falha
3. Execute: `docker build --no-cache -t simulador-financeiro:latest .`
4. Compartilhe o erro específico

## 📦 Arquivo Gerado

Após `docker build`:
- Imagem: `simulador-financeiro:latest`
- Tamanho: ~50-80MB
- Container size: ~100-150MB em runtime

## 🎯 Próximas Ações

✅ Se tudo passar:
1. Push para registry (Docker Hub, ECR, GCR)
2. Deploy em cluster Kubernetes
3. Configurar CI/CD Pipeline

---

**Tempo esperado:** 2-3 minutos para primeiro build
**Tempo esperado:** 30 segundos para rebuilds (com cache)
