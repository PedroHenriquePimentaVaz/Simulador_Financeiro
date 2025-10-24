# Debug de Build - Guia para Identificar o Erro

## Passo 1: Teste Local (sem Docker)

Se você tem Node.js instalado localmente:

```bash
npm install
npm run build
```

Copie toda a mensagem de erro aqui.

## Passo 2: Teste com Docker (mostra mais detalhes)

```bash
docker build -t simulador-financeiro:latest . 2>&1 | tee build.log
```

Isso salva o log em `build.log`. Compartilhe o conteúdo.

## Passo 3: Se o build falhar com exit code 2

Verifique se há:

- [ ] Erros de TypeScript (type mismatch, undefined variable)
- [ ] Imports incorretos
- [ ] Referências circulares
- [ ] Módulos faltando

## Informações Necessárias

Para ajudá-lo melhor, me envie:

1. **Mensagem de erro completa** (copy-paste)
2. **Linha específica** mencionada no erro
3. **Arquivo** onde o erro está
4. **Resultado de:** `npm --version` e `node --version`

Exemplo:
```
ERROR in src/components/MyComponent.tsx:45:10
Type 'string' is not assignable to type 'number'.
```

## Possíveis Problemas Conhecidos

- ✅ Conflito de tipos `SimulationResult` - JÁ RESOLVIDO
- [ ] Variáveis não utilizadas (`noUnusedLocals: true`)
- [ ] Parâmetros não utilizados (`noUnusedParameters: true`)
- [ ] Importações não resolvidas
- [ ] JSON inválido

## Próximas Ações

Com o erro específico, vou:
1. Localizar a linha exata do problema
2. Corrigir o código
3. Validar sem erros
4. Testar o Docker

Aguardando sua resposta! 🚀
