# Simulador Financeiro BeHonest

Um simulador financeiro completo para calcular o potencial de retorno de investimento em franquias BeHonest.

## 🚀 Quick Start com Docker

```bash
docker-compose up -d
```
Acesse: http://localhost:3000

Para mais detalhes, veja [DOCKER_SETUP.md](DOCKER_SETUP.md)

## ✅ Status do Projeto

- ✅ Build TypeScript sem erros (9 correções aplicadas)
- ✅ Docker pronto para produção
- ✅ Linting validado (strict mode)
- ✅ Tipos TypeScript organizados
- ✅ Deploy ready

Ver detalhes em [BUILD_SUCCESS.md](BUILD_SUCCESS.md)

## 🚀 Funcionalidades

- **Simulação Financeira Completa**: Calcule faturamento, despesas e lucro líquido
- **Rentabilidade Mensal**: Cálculo baseado na média de lucro líquido dos últimos 12 meses / investimento total
- **Análise de Payback**: Determine em quantos meses o investimento se paga
- **Fluxo de Caixa Acumulado**: Gráfico interativo mostrando evolução do saldo acumulado
- **Simulação Interativa**: Adicione lojas em meses específicos (a cada 3 meses) e veja o impacto
- **Cenários de Simulação**: Pessimista (85% da receita), Médio (100%), Otimista (115%)
- **Primeira Loja no Mês 3**: Sistema implementa período de 2 meses para setup (taxa franquia mês 1, implementação mês 2)
- **Adição de Lojas Escalonada**: Novas lojas podem ser adicionadas a cada 3 meses após a primeira
- **Exportação PDF**: Gere relatórios completos em PDF com todas as informações financeiras
- **Planilha Completa**: Visualize todos os 60 meses de dados em uma tabela integrada
- **Interface Moderna**: Design baseado no tema BeHonest (azul da marca #001c54 e laranja)
- **Tipografia Poppins**: Fonte moderna e consistente em toda a plataforma
- **Footer Completo**: Rodapé com logos das redes sociais (locais), menu de navegação e download do app

## 🔧 Resolução de Problemas

### Tela Branca no Navegador
Se a tela estiver completamente branca, isso geralmente é causado por cache do navegador. Solução:
1. Abra o DevTools (F12)
2. Vá em **Application** > **Storage** > **Clear site data**
3. Ou pressione **Ctrl+Shift+Delete** e limpe os dados do site
4. Recarregue a página (F5 ou Ctrl+R)

## 📊 Métricas Calculadas

- Faturamento Total
- Lucro Bruto e Líquido
- Margem Líquida
- Período de Payback
- ROI (Retorno sobre Investimento)
- Projeção mensal com gráficos

## 🛠️ Tecnologias Utilizadas

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Recharts** para gráficos interativos
- **jsPDF** para exportação de relatórios
- **Poppins** para tipografia consistente
- **CSS Modules** para estilização

## 📋 Pré-requisitos

- Docker instalado (https://docs.docker.com/get-docker/)
- Docker Compose instalado (geralmente vem com Docker Desktop)
- Git para clonar o repositório

## 📦 Instalação

1. Clone o repositório:
```bash
git clone git@github.com:PedroHenriquePimentaVaz/Simulador_Financeiro.git
cd simulador-financeiro-behonest
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto:
```bash
npm run dev
```

## 🐳 Docker

### Build e Execute Localmente

1. Build da imagem:
```bash
docker build -t simulador-financeiro:latest .
```

2. Execute o container:
```bash
docker run -p 3000:3000 simulador-financeiro:latest
```

Acesse: http://localhost:3000

### Com Docker Compose

1. Inicie os serviços:
```bash
docker-compose up -d
```

2. Pare os serviços:
```bash
docker-compose down
```

### Verificar logs do container:
```bash
docker-compose logs -f app
```

### Para Produção

O Dockerfile usa **multi-stage build** para otimizar o tamanho da imagem final. Apenas o build de produção é incluído no container, reduzindo o tamanho em ~90%.

**Tamanhos esperados:**
- Imagem builder: ~500MB (descartada)
- Imagem final: ~50-80MB

**Deploy recomendado:**
- AWS ECS
- AWS AppRunner
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Heroku (com setup adicional)

## 🎯 Como Usar

1. **Preencha os Dados**:
   - Quanto deseja tirar mensalmente do negócio (campo livre)
   - Quanto tem de disponibilidade de investimento (campo livre)
   - Perfil de operação (seleção: integral, gestão ou terceirizar)

2. **Visualize os Resultados**:
   - Cards com métricas principais
   - Gráfico de projeção mensal
   - Análise detalhada de receitas e retorno

3. **Navegue pelo Footer**:
   - Seção de branding: Logo BeHonest, ícones de redes sociais e logo ABF (empilhados verticalmente)
   - Menu de navegação (Home, Condomínio, Franqueado)
   - Download do app com logos locais (Google Play e App Store)
   - Rodapé inferior: Copyright e Política de Privacidade

## 📈 Exemplo de Uso

```typescript
const simulationData = {
  investimentoInicial: 60000,
  faturamentoMensal: 15000,
  margemLiquida: 12,
  despesasFixas: 2000,
  despesasVariaveis: 1000,
  periodoSimulacao: 24
};

const results = calculateSimulation(simulationData);
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── AdvancedResultsDisplay.tsx  # Exibição avançada dos resultados
│   ├── InvestmentComparisonChart.tsx # Gráfico de comparação de investimentos
│   ├── SimulationForm.tsx         # Formulário de entrada de dados
│   └── Footer.tsx                  # Rodapé com links sociais e navegação
├── pages/
│   └── ResultsPage.tsx             # Página de resultados
├── types/
│   └── simulation.ts               # Tipos TypeScript
├── utils/
│   └── advancedCalculations.ts     # Lógica avançada de cálculos financeiros
├── App.tsx                         # Componente principal
├── main.tsx                        # Ponto de entrada
└── index.css                       # Estilos globais
```

## 🎨 Design System

- **Cores Primárias**: Azul da marca (#001c54) e Laranja (#ff9800)
- **Tipografia**: Poppins (Google Fonts) com pesos 300-800
- **Layout**: Responsivo com grid system
- **Componentes**: Cards com glassmorphism effect

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção

## 🔧 Configuração

O projeto utiliza Vite como bundler e está configurado para desenvolvimento rápido com hot reload.

## 📄 Licença

Este projeto é privado e destinado ao uso interno da BeHonest.
