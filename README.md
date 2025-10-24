# Simulador Financeiro BeHonest

Um simulador financeiro completo para calcular o potencial de retorno de investimento em franquias BeHonest.

## 🚀 Funcionalidades

- **Simulação Financeira Completa**: Calcule faturamento, despesas e lucro líquido
- **Análise de Payback**: Determine em quantos meses o investimento se paga
- **Cálculo de ROI**: Retorno sobre investimento em porcentagem
- **Projeção Mensal**: Gráficos interativos mostrando evolução mês a mês
- **Simulação Interativa**: Adicione lojas em meses específicos e veja o impacto
- **Planilha Completa**: Visualize todos os 60 meses de dados em uma tabela integrada
- **Exportação PDF**: Baixe relatório completo da simulação
- **Interface Moderna**: Design baseado no tema BeHonest (azul da marca #001c54 e laranja)
- **Tipografia Poppins**: Fonte moderna e consistente em toda a plataforma
- **Footer Completo**: Rodapé com logos das redes sociais (locais), menu de navegação e download do app

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
