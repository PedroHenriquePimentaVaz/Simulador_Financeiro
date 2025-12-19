import React, { useState, useEffect } from 'react';
import { SimulationData } from '../types/simulation';
import { analyzeInvestmentViability, ViabilityAnalysis } from '../utils/advancedCalculations';
import { brazilianStates, citiesByState } from '../data/brazilianStates';
import { recordUtmEvent, saveSimulationHistory } from '../utils/utmLogger';

const UTM_STORAGE_KEY = 'utm_params';
const UTM_STORAGE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface StoredUtmWrapper {
  __data: Record<string, string>;
  __storedAt: number;
}

const persistUtmParams = (params: Record<string, string>) => {
  const payload: StoredUtmWrapper = {
    __data: params,
    __storedAt: Date.now(),
  };
  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload));
  return payload.__storedAt;
};

const readStoredUtmParams = () => {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredUtmWrapper | Record<string, string>;

    if ('__data' in parsed && '__storedAt' in parsed) {
      const wrapper = parsed as StoredUtmWrapper;
      const isExpired = Date.now() - wrapper.__storedAt > UTM_STORAGE_MAX_AGE;
      if (isExpired) {
        console.log('UTM armazenado expirado - descartando');
        return null;
      }
      return {
        params: wrapper.__data,
        storedAt: wrapper.__storedAt,
      };
    }

    return {
      params: parsed as Record<string, string>,
      storedAt: undefined,
    };
  } catch (error) {
    console.warn('Falha ao ler UTMs armazenados', error);
    return null;
  }
};

interface SimulationFormProps {
  initialData: SimulationData;
  onSimulate: (data: SimulationData) => void;
}

const SimulationForm: React.FC<SimulationFormProps> = ({ initialData, onSimulate }) => {
  const [formData, setFormData] = useState<SimulationData>({
    ...initialData,
    cenario: initialData.cenario || 'medio'
  });
  const [viabilityAnalysis, setViabilityAnalysis] = useState<ViabilityAnalysis | null>(null);
  const [showOtherCity, setShowOtherCity] = useState(false);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});

  const normalizeUtm = (value: string | null): string | undefined => {
    if (!value) return undefined;
    const lower = value.toLowerCase();
    const sourceMap: Record<string, string> = {
      fb: 'facebook',
      'facebook.com': 'facebook',
      ig: 'instagram',
      insta: 'instagram',
      ggl: 'google',
      'google.com': 'google',
      yt: 'youtube',
      tiktokads: 'tiktok',
      chatgpt: 'gpt',
    };

    if (sourceMap[lower]) {
      return sourceMap[lower];
    }

    return lower;
  };

  const normalizeUtmKeyValue = (key: string, value: string | null): string | undefined => {
    if (!value) return undefined;
    return key === 'utm_source' ? normalizeUtm(value) : value;
  };

  // Capturar parâmetros UTM da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    
    // Mapear parâmetros UTM para os nomes esperados pelo webhook
    const utmMapping: Record<string, string> = {
      'utm_source': 'Source',
      'utm_medium': 'Medium',
      'utm_campaign': 'Campaign',
      'utm_term': 'Term',
      'utm_content': 'Content',
      'page': 'Page',
      'utm_page': 'Page'
    };
    
    console.log('=== CAPTURA UTM NO CARREGAMENTO ===');
    console.log('URL completa:', window.location.href);
    console.log('URL search params:', window.location.search);
    
    Object.keys(utmMapping).forEach(key => {
      const value = normalizeUtmKeyValue(key, urlParams.get(key));
      console.log(`Verificando ${key}:`, value);
      if (value) {
        utm[utmMapping[key]] = value;
      }
    });

    utm.Page = 'simuladorfinanceiro';
    
    console.log('Parâmetros UTM capturados:', utm);
    
    // Validação dos parâmetros UTM capturados
    const expectedUtmFields = ['Source', 'Medium', 'Campaign', 'Content', 'Term', 'Page'];
    const utmValidation: Record<string, { found: boolean; value: string | undefined }> = {};
    
    expectedUtmFields.forEach(field => {
      utmValidation[field] = {
        found: field in utm,
        value: utm[field]
      };
    });
    
    console.log('=== VALIDAÇÃO UTM NO CARREGAMENTO ===');
    console.table(utmValidation);
    
    const capturedUtmCount = Object.keys(utm).length;
    if (capturedUtmCount > 0) {
      const storedAt = persistUtmParams(utm);
      recordUtmEvent('utmCaptured', {
        context: 'initialLoad',
        url: window.location.href,
        params: utm,
      });
      recordUtmEvent('utmStored', {
        context: 'initialLoad',
        params: utm,
        data: { storedAt: new Date(storedAt).toISOString() },
      });
      console.log('✅ Parâmetros UTM salvos no localStorage');
    } else {
      recordUtmEvent('utmMissing', {
        context: 'initialLoad',
        url: window.location.href,
      });
      console.log('⚠️ Nenhum parâmetro UTM encontrado na URL');
    }
    
    setUtmParams(utm);
    console.log('===================================');
  }, []);

  // Analisar viabilidade sempre que os dados mudarem
  useEffect(() => {
    if (formData.investimentoInicial && formData.lucroDesejado) {
      const analysis = analyzeInvestmentViability(
        formData.investimentoInicial,
        formData.lucroDesejado,
        formData.perfilOperacao || 'gestao',
        (formData.cenario || 'medio') as 'pessimista' | 'medio' | 'otimista'
      );
      setViabilityAnalysis(analysis);
    }
  }, [formData.investimentoInicial, formData.lucroDesejado, formData.perfilOperacao, formData.cenario]);

  const handleInputChange = (field: keyof SimulationData, value: number | string) => {
    setFormData(prev => {
      const newData = {
      ...prev,
      [field]: value
      };
      
      if (field === 'estado') {
        newData.cidade = '';
        setShowOtherCity(false);
      }
      
      return newData;
    });
  };

  // Função para formatar números brasileiros
  const formatBrazilianNumber = (value: string): number => {
    // Remove tudo exceto números
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue ? Number(cleanValue) : 0;
  };

  // Função para exibir números formatados
  const formatDisplayNumber = (value: number | string): string => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? formatBrazilianNumber(value) : value;
    return numValue.toLocaleString('pt-BR');
  };

  // Função para formatar telefone brasileiro
  const formatPhone = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.nome || !formData.nome.trim()) {
      alert('Por favor, preencha o campo Nome.');
      return;
    }
    
    if (!formData.email || !formData.email.trim()) {
      alert('Por favor, preencha o campo E-mail.');
      return;
    }
    
    const phoneDigits = formData.telefone ? formData.telefone.replace(/\D/g, '') : '';
    if (!formData.telefone || (phoneDigits.length !== 10 && phoneDigits.length !== 11)) {
      alert('Por favor, preencha o campo WhatsApp com DDD + número (10 ou 11 dígitos).');
      return;
    }
    
    if (!formData.estado) {
      alert('Por favor, selecione o Estado.');
      return;
    }
    
    if (!formData.cidade || !formData.cidade.trim()) {
      alert('Por favor, preencha o campo Cidade.');
      return;
    }
    
    // Não calculamos mais o faturamento aqui, apenas passamos os dados
    const margemLiquida = 13; // Média entre 12-15%
    const faturamentoMensal = 0; // Será calculado pela simulação
    
    // Ajustar despesas baseado no perfil de operação
    let despesasFixas = 2000;
    let despesasVariaveis = 1000;
    
    switch(formData.perfilOperacao) {
      case 'integral':
        despesasFixas = 1500;
        despesasVariaveis = 800;
        break;
      case 'gestao':
        despesasFixas = 2000;
        despesasVariaveis = 1200;
        break;
      case 'terceirizar':
        despesasFixas = 3000;
        despesasVariaveis = 1500;
        break;
    }
    
    const simulatedData = {
      investimentoInicial: typeof formData.investimentoInicial === 'string' 
        ? formatBrazilianNumber(formData.investimentoInicial) 
        : formData.investimentoInicial,
      faturamentoMensal: faturamentoMensal,
      margemLiquida: margemLiquida,
      despesasFixas: despesasFixas,
      despesasVariaveis: despesasVariaveis,
      periodoSimulacao: 60,
      lucroDesejado: typeof formData.lucroDesejado === 'string' 
        ? formatBrazilianNumber(formData.lucroDesejado) 
        : formData.lucroDesejado,
      perfilOperacao: formData.perfilOperacao,
      cenario: formData.cenario || 'medio',
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email,
      estado: formData.estado,
      cidade: formData.cidade
    };
    
    const webhookUrl = 'https://hive-n8n.trnw0e.easypanel.host/webhook-test/335f6f4d-e471-4089-9bac-3b43771a71ba';
    let responseStatus: number | undefined;
    let responseOk = false;
    let combinedUtmParams: Record<string, string> = {};
    const timestamp = new Date().toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language;
    const pageTitle = document.title;
    
    // Enviar dados para o webhook (incluindo UTM)
    try {
      // Capturar parâmetros UTM diretamente da URL no momento do submit
      const urlParams = new URLSearchParams(window.location.search);
      const utmMapping: Record<string, string> = {
        'utm_source': 'Source',
        'utm_medium': 'Medium',
        'utm_campaign': 'Campaign',
        'utm_term': 'Term',
        'utm_content': 'Content',
        'page': 'Page',
        'utm_page': 'Page'
      };
      
      const currentUtmParams: Record<string, string> = {};
      Object.keys(utmMapping).forEach(key => {
        const value = normalizeUtmKeyValue(key, urlParams.get(key));
        if (value) {
          currentUtmParams[utmMapping[key]] = value;
        }
      });
      
      // Recuperar parâmetros UTM salvos no localStorage
      const storedUtmEntry = readStoredUtmParams();
      const savedUtmParams = storedUtmEntry?.params ?? {};

      // Combinar parâmetros UTM: localStorage (prioridade) > URL atual > estado
      const baseUtmParams = {
        ...utmParams,
        ...currentUtmParams,
      };

      const hasFreshMarketingUtm = Object.keys(currentUtmParams).some((key) => key !== 'Page');
      const marketingKeysFromBase = Object.keys(baseUtmParams).filter((key) => key !== 'Page');
      const shouldFallbackToSaved = !hasFreshMarketingUtm && marketingKeysFromBase.length === 0;

      const sanitizedSavedUtmParams = { ...savedUtmParams };
      delete sanitizedSavedUtmParams.Page;

      const allUtmParams = shouldFallbackToSaved
        ? {
            ...sanitizedSavedUtmParams,
            ...baseUtmParams,
          }
        : {
            ...baseUtmParams,
          };

      allUtmParams.Page = 'simuladorfinanceiro';

      combinedUtmParams = allUtmParams;
      
      // Logs detalhados para debug
      console.log('=== DEBUG UTM ===');
      console.log('URL completa:', window.location.href);
      console.log('URL search params:', window.location.search);
      console.log('Parâmetros UTM do estado:', utmParams);
      console.log('Parâmetros UTM da URL atual:', currentUtmParams);
      console.log('Parâmetros UTM do localStorage:', savedUtmParams);
      console.log('Parâmetros UTM combinados:', allUtmParams);
      console.log('Keys em allUtmParams:', Object.keys(allUtmParams));
      console.log('Quantidade de parâmetros UTM:', Object.keys(allUtmParams).length);
      
      // Validação detalhada dos parâmetros UTM
      const expectedUtmFields = ['Source', 'Medium', 'Campaign', 'Content', 'Term', 'Page'];
      const utmValidation: Record<string, { found: boolean; value: string | undefined }> = {};
      
      expectedUtmFields.forEach(field => {
        utmValidation[field] = {
          found: field in allUtmParams,
          value: allUtmParams[field]
        };
      });
      
      console.log('=== VALIDAÇÃO UTM ===');
      console.table(utmValidation);
      
      const foundUtmCount = Object.values(utmValidation).filter(v => v.found).length;
      console.log(`Parâmetros UTM encontrados: ${foundUtmCount} de ${expectedUtmFields.length}`);
      
      // Verificar se há parâmetros UTM
      const marketingKeys = Object.keys(allUtmParams).filter((key) => key !== 'Page');
      const hasUtmParams = marketingKeys.length > 0;
      if (!hasUtmParams) {
        console.warn('⚠️ ATENÇÃO: Nenhum parâmetro UTM encontrado!');
        console.warn('Para testar, acesse a URL com parâmetros UTM, por exemplo:');
        console.warn('http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=teste&utm_term=keyword&utm_content=ad1&page=home');
        recordUtmEvent('utmMissing', {
          context: 'submit',
          url: window.location.href,
          data: simulatedData,
        });
      } else {
        console.log('✅ Parâmetros UTM encontrados e serão enviados ao webhook');
        console.log('Parâmetros que serão enviados:', allUtmParams);
        recordUtmEvent('utmCaptured', {
          context: 'submit',
          url: window.location.href,
          params: allUtmParams,
        });
      }
      
      // Garantir que os parâmetros UTM sejam sempre incluídos no webhook
      const webhookData = {
        ...simulatedData,
        ...allUtmParams,
        timestamp,
        timestamp_local: timestamp,
        timezone,
        locale,
        page_title: pageTitle,
      };
      
      // Verificação final antes de enviar
      const utmInWebhookData: Record<string, string> = {};
      expectedUtmFields.forEach(field => {
        if (field in webhookData) {
          utmInWebhookData[field] = (webhookData as any)[field];
        }
      });
      
      console.log('=== VERIFICAÇÃO FINAL ===');
      console.log('Parâmetros UTM no webhookData:', utmInWebhookData);
      console.log('Dados completos enviados para webhook:', webhookData);
      console.log('JSON stringificado:', JSON.stringify(webhookData));
      console.log('================');
      
      recordUtmEvent('webhookPayload', {
        context: 'submit',
        url: window.location.href,
        params: allUtmParams,
        data: webhookData,
      });

      const executeWebhook = async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        try {
          const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          return response;
        } catch (err) {
          clearTimeout(timeout);
          throw err;
        }
      };

      const maxAttempts = 3;
      let attempt = 0;
      let response: Response | null = null;
      let lastError: unknown = null;

      while (attempt < maxAttempts && !response) {
        try {
          response = await executeWebhook();
        } catch (err) {
          attempt += 1;
          lastError = err;
          if (attempt >= maxAttempts) {
            throw err;
          }
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }

      if (!response) {
        throw lastError || new Error('Webhook sem resposta');
      }

      responseStatus = response.status;
      responseOk = response.ok;
      console.log('Resposta do webhook:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`Webhook retornou status ${response.status}`);
      }

      recordUtmEvent('webhookSuccess', {
        context: 'submit',
        url: webhookUrl,
        status: response.status,
        params: allUtmParams,
      });
    } catch (error) {
      console.error('Erro ao enviar dados para o webhook:', error);
      recordUtmEvent('webhookError', {
        context: 'submit',
        url: window.location.href,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      if (navigator.sendBeacon) {
        try {
          const beaconPayload = JSON.stringify({
            ...simulatedData,
            ...combinedUtmParams,
            fallback: true,
            timestamp,
            timestamp_local: timestamp,
            timezone,
            locale,
            page_title: pageTitle,
          });
          const beaconSent = navigator.sendBeacon(
            webhookUrl,
            new Blob([beaconPayload], { type: 'application/json' })
          );

          if (beaconSent) {
            responseOk = true;
            recordUtmEvent('webhookFallback', {
              context: 'sendBeacon',
              url: webhookUrl,
              params: combinedUtmParams,
            });
          }
        } catch (beaconError) {
          console.warn('Falha ao enviar via sendBeacon:', beaconError);
        }
      }
    }
    
    saveSimulationHistory({
      id: `simulation-${Date.now()}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      simulation: simulatedData,
      utmParams: combinedUtmParams,
      webhookStatus: responseStatus,
      webhookOk: responseOk,
    });
    
    onSimulate(simulatedData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Nome *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Digite seu nome completo"
            value={formData.nome || ''}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">E-mail *</label>
          <input
            type="email"
            className="form-input"
            placeholder="seu@email.com"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">WhatsApp com DDD *</label>
          <input
            type="text"
            className="form-input"
            placeholder="(00) 00000-0000"
            value={formData.telefone ? formatPhone(formData.telefone) : ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              if (digits.length <= 11) {
                handleInputChange('telefone', digits);
              }
            }}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Estado *</label>
          <select 
            className="form-select"
            value={formData.estado || ''}
            onChange={(e) => handleInputChange('estado', e.target.value)}
            required
          >
            <option value="">Selecione o estado</option>
            {Object.entries(brazilianStates).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label className="form-label">Cidade *</label>
        {showOtherCity ? (
          <input
            type="text"
            className="form-input"
            placeholder="Digite o nome da cidade"
            value={formData.cidade || ''}
            onChange={(e) => handleInputChange('cidade', e.target.value)}
            required
          />
        ) : (
          <select 
            className="form-select"
            value={formData.cidade || ''}
            onChange={(e) => {
              if (e.target.value === 'OUTRA') {
                setShowOtherCity(true);
                handleInputChange('cidade', '');
              } else {
                handleInputChange('cidade', e.target.value);
              }
            }}
            disabled={!formData.estado}
            required
          >
            <option value="">{formData.estado ? 'Selecione a cidade' : 'Selecione primeiro o estado'}</option>
            {formData.estado && citiesByState[formData.estado]?.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
            <option value="OUTRA">Outra cidade</option>
          </select>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Quanto você deseja lucrar mensalmente com o negócio? *</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            fontSize: '16px',
            fontWeight: '500',
            zIndex: 1
          }}>
            R$
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: 5.000"
            value={formatDisplayNumber(formData.lucroDesejado || '')}
            onChange={(e) => {
              const numericValue = formatBrazilianNumber(e.target.value);
              handleInputChange('lucroDesejado', numericValue);
            }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <p style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '5px', 
          marginBottom: '0',
          fontStyle: 'italic'
        }}>
          Em média são R$ 2.000 lucro por loja
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Qual a sua disponibilidade de investimento? *</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            fontSize: '16px',
            fontWeight: '500',
            zIndex: 1
          }}>
            R$
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: 80.000"
            value={formatDisplayNumber(formData.investimentoInicial || '')}
            onChange={(e) => {
              const numericValue = formatBrazilianNumber(e.target.value);
              handleInputChange('investimentoInicial', numericValue);
            }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <p style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '5px', 
          marginBottom: '0',
          fontStyle: 'italic'
        }}>
          Deve ser condizente com quanto você gostaria de receber mensalmente
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Quanto tempo você estaria disposto a investir no negócio? *</label>
        <select 
          className="form-select" 
          value={formData.perfilOperacao || 'gestao'}
          onChange={(e) => handleInputChange('perfilOperacao', e.target.value)}
        >
          <option value="integral">0 até 2 horas diárias</option>
          <option value="gestao">2 a 4 horas diárias</option>
          <option value="terceirizar">Mais de 4 horas diárias</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Escolha o cenário da simulação *</label>
        <select 
          className="form-select" 
          value={formData.cenario || 'medio'}
          onChange={(e) => handleInputChange('cenario', e.target.value)}
        >
          <option value="pessimista">🔻 Pessimista - Resultados 15% abaixo da média</option>
          <option value="medio">📊 Médio - Resultados na média</option>
          <option value="otimista">🔺 Otimista - Resultados 15% acima da média</option>
        </select>
        <p style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '5px', 
          marginBottom: '0',
          fontStyle: 'italic'
        }}>
          Os cenários representam diferentes projeções de desempenho
        </p>
      </div>

      {/* Análise de Viabilidade */}
      {viabilityAnalysis && (
        <div style={{
          backgroundColor: viabilityAnalysis.isViable ? '#e8f5e8' : '#ffeaea',
          border: `2px solid ${viabilityAnalysis.isViable ? '#28a745' : '#dc3545'}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h4 style={{
              color: viabilityAnalysis.isViable ? '#155724' : '#721c24',
              margin: 0,
              fontSize: '18px'
            }}>
              {viabilityAnalysis.message}
            </h4>
            <div style={{
              backgroundColor: viabilityAnalysis.score >= 80 ? '#28a745' : 
                              viabilityAnalysis.score >= 60 ? '#ffc107' : 
                              viabilityAnalysis.score >= 40 ? '#fd7e14' : '#dc3545',
              color: 'white',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {viabilityAnalysis.score}/100
            </div>
          </div>

          <div style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '15px' }}>
            <strong style={{ color: '#1a252f' }}>Lucro mensal realista:</strong> R$ {viabilityAnalysis.maxRealisticMonthlyIncome.toLocaleString('pt-BR')}
          </div>

          {viabilityAnalysis.recommendations.length > 0 && (
            <div style={{ color: '#2c3e50' }}>
              <strong style={{ color: '#1a252f', fontSize: '15px' }}>Recomendações:</strong>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                {viabilityAnalysis.recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: '5px', fontSize: '14px', color: '#2c3e50' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button type="submit" className="submit-button">
        Simular Investimento
      </button>
    </form>
  );
};

export default SimulationForm;
