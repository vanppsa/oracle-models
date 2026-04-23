---
name: oracle-models
description: Classifies development task complexity (LIGHT/MEDIUM/HEAVY) at the end of plan responses and suggests the most cost-efficient AI model per company (Claude, Gemini, GLM, Grok). Silent during code execution — activates only when producing multi-step action plans. Models ranked by artificialanalysis.ai Intelligence Index. Updatable by any AI without manual reconfiguration.
---

# ORACLE MODELS
> Instrução de comportamento para IAs assistentes de desenvolvimento.
> Versão: 2.0 | Atualizado em: 20/04/2026

---

## ⚠️ REGRA DE ATIVAÇÃO — LEIA ANTES DE TUDO

**ESTA INSTRUÇÃO SÓ DEVE SER EXECUTADA NO MODO PLAN.**

Ative o bloco de classificação SOMENTE quando a IA estiver produzindo:
- Um plano de ação com múltiplos passos (ex.: "Passo 1... Passo 2... Passo 3...")
- Uma análise de como implementar uma feature, correção ou refatoração
- Uma resposta onde a IA descreve O QUE vai fazer ANTES de fazer

**NÃO ative em:**
- Respostas diretas de uma linha (a não ser que o usuario chame a SKILL nominamente)
- Durante execução de código (ACT mode)
- Em edições pontuais sem planejamento prévio
- Em perguntas conceituais ou explicativas sem tarefa associada

> Objetivo: evitar consumo desnecessário de tokens. O bloco é um sinal para
> o usuário decidir se vai manter ou trocar o modelo antes de executar.

---

## 🔍 FONTE DE REFERÊNCIA PARA MODELOS

**Site oficial de benchmarks usado como base:**
**https://artificialanalysis.ai/leaderboards/models**

- Metodologia independente (não auto-declarada pelos providers)
- Cobre: Intelligence Index, preço blended, velocidade (tokens/s), latência
- Atualização contínua com 100+ modelos rastreados
- Para atualizar os modelos desta skill: acesse o site acima, filtre por
  empresa (Anthropic, Google, Z AI, xAI) e substitua os modelos na tabela
  abaixo, mantendo a estrutura de 3 tiers.

---

## 🤖 TABELA DE MODELOS (Abril 2026)

> Scores baseados no "Artificial Analysis Intelligence Index" de 20/04/2026.
> 1 modelo por empresa por tier. Para trocar um modelo, edite apenas esta tabela.

| Tier          | Score AA | Claude (Anthropic) | Gemini (Google)        | GLM (Z.ai)  | Grok (xAI)       |
|---------------|----------|--------------------|------------------------|-------------|------------------|
| 🔴 HEAVY (H)  | 51–57    | Claude Opus 4.7    | Gemini 3.1 Pro         | GLM-5.1     | Grok 4.20        |
| 🟡 MEDIUM (M) | 44–50    | Claude Sonnet 4.6  | Gemini 3 Flash         | GLM-5       | Grok 4 Fast      |
| 🟢 LIGHT (L)  | ≤43      | Claude Haiku 4.5   | Gemini 3.1 Flash Lite  | GLM-4.7     | Grok 4.1         |

### Referência de custo (blended USD/1M tokens — fonte: artificialanalysis.ai)

| Tier | Claude         | Gemini               | GLM       | Grok    |
|------|----------------|----------------------|-----------|---------|
| 🔴 H | $10.00 (Opus)  | $4.50 (3.1 Pro)      | $2.15     | $3.00   |
| 🟡 M | $6.00 (Sonnet) | $1.13 (3 Flash)      | $1.55     | ~$0.80  |
| 🟢 L | ~$1.50 (Haiku) | ~$0.15 (Flash Lite)  | ~$0.20    | $0.20   |

---

## 📐 CRITÉRIOS TÉCNICOS DE CLASSIFICAÇÃO

A classificação é baseada em **complexidade computacional da tarefa**, não
na percepção subjetiva de dificuldade. Use os critérios abaixo:

---

### 🟢 LIGHT — Tier L

**Perfil:** Transformação determinística de baixa entropia. Sem ramificação lógica nova.

Classificar como LIGHT quando a tarefa atender ≥2 destes critérios:
- Alteração de valor literal: string, número, booleano, label, mensagem de UI
- Mudança de estilo sem alteração de lógica: CSS/Tailwind pontual, cor, espaçamento
- Rename de variável, função ou arquivo sem impacto em interface pública
- Adição ou remoção de campo em formulário já existente sem nova validação
- Ajuste de rota existente: path, parâmetro, redirect — sem nova lógica de negócio
- Tradução ou internacionalização de texto já estruturado
- Copiar/adaptar bloco de código com alteração mínima (< 5 linhas de diferença)
- Correção de typo em código funcional (variável errada, valor errado)

**Número esperado de arquivos modificados:** 1–2
**Número esperado de novos tokens gerados:** < 200

---

### 🟡 MEDIUM — Tier M

**Perfil:** Lógica nova dentro de escopo bem delimitado. Requer raciocínio sobre
estado, efeitos colaterais ou interface entre componentes.

Classificar como MEDIUM quando a tarefa atender ≥2 destes critérios:
- Criação de componente, função ou módulo novo com estado interno
- Refatoração de função existente com mudança de assinatura ou tipo de retorno
- Adição de validação com múltiplas condições ou regras de negócio
- Integração de endpoint novo em fluxo existente (sem auth nova)
- Criação de hook/composable simples com 1–2 dependências
- Implementação de feature flag, toggle de comportamento ou lógica condicional nova
- Migração de dados com transformação (mapeamento de campos, conversão de tipo)
- Adição de paginação, filtro ou ordenação em lista existente
- Correção de bug com causa identificada que exige mudança em ≤3 arquivos
- Configuração de pipeline, Docker, proxy ou ambiente de infraestrutura simples

**Número esperado de arquivos modificados:** 2–5
**Número esperado de novos tokens gerados:** 200–800

---

### 🔴 HEAVY — Tier H

**Perfil:** Alta entropia de decisão. Múltiplos consumidores afetados, lógica
distribuída, ou risco sistêmico se implementado incorretamente.

Classificar como HEAVY quando a tarefa atender ≥1 destes critérios:
- Extração de lógica compartilhada que afeta ≥3 consumidores (hooks, contexts, providers)
- Redesign de arquitetura de módulo ou camada (ex.: migrar de REST para tRPC, mudar ORM)
- Implementação de autenticação, autorização ou gerenciamento de sessão
- Integração de sistema externo com OAuth, webhooks ou contratos de API não triviais
- Debugging de bug não-determinístico (race condition, memory leak, comportamento intermitente)
- Migração de schema de banco com dados em produção
- Otimização de performance que requer profiling e múltiplas hipóteses
- Criação de sistema de billing, pagamento ou qualquer fluxo financeiro
- Implementação de pipeline de dados, ETL ou worker assíncrono com retry/fallback
- Qualquer tarefa que cruze domínios de segurança, criptografia ou compliance
- Refatoração que exige compreensão de todo o grafo de dependências do projeto

**Número esperado de arquivos modificados:** 5+
**Número esperado de novos tokens gerados:** 800+

---

## 📤 FORMATO DO BLOCO DE SAÍDA

Ao final de qualquer plano de ação que ative esta instrução, adicione
**exatamente** este bloco:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CLASSIFICAÇÃO DA TAREFA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Tier    : [LIGHT | MEDIUM | HEAVY]
  Motivo  : [1 frase técnica referenciando o critério determinante]
  Arquivos: ~[N] arquivos | ~[N] tokens gerados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 MODELOS SUGERIDOS PARA EXECUÇÃO
  Claude  : [modelo]
  Gemini  : [modelo]
  GLM     : [modelo]
  Grok    : [modelo]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔄 PROTOCOLO DE ATUALIZAÇÃO DE MODELOS (para a IA)

Se o usuário pedir para trocar, adicionar ou remover modelos desta skill,
execute autonomamente seguindo este protocolo:

### Trocar um modelo existente
1. Acesse https://artificialanalysis.ai/leaderboards/models
2. Filtre pelo provider desejado
3. Identifique o modelo equivalente no mesmo tier por Intelligence Index score
4. Substitua apenas a célula correspondente na tabela `🤖 TABELA DE MODELOS`
5. Atualize o custo na tabela de referência de preço

### Adicionar uma empresa nova (ex.: OpenAI/GPT)
1. Adicione uma coluna nova na tabela de modelos com 3 tiers (H/M/L)
2. Use artificialanalysis.ai para identificar os 3 modelos por score:
   - HEAVY  = Intelligence Index ≥ 51
   - MEDIUM = Intelligence Index 44–50
   - LIGHT  = Intelligence Index ≤ 43
3. Adicione os custos na tabela de referência de preço
4. Adicione a linha correspondente no bloco `📤 FORMATO DO BLOCO DE SAÍDA`
5. Registre a alteração na tabela `🗓️ HISTÓRICO`

### Remover uma empresa
1. Delete a coluna da empresa na tabela de modelos
2. Delete a linha de custo correspondente
3. Delete a linha no bloco `📤 FORMATO DO BLOCO DE SAÍDA`
4. Registre a alteração na tabela `🗓️ HISTÓRICO`

> A IA pode executar essas trocas de forma autônoma a pedido do usuário,
> sem necessidade de re-explicar a lógica ou o site de referência.

---

## 💡 EXEMPLOS DE CLASSIFICAÇÃO

| Tarefa                                                         | Tier   | Critério principal                           |
|----------------------------------------------------------------|--------|----------------------------------------------|
| Mudar texto de um botão                                        | LIGHT  | Alteração de valor literal                   |
| Corrigir cor de um componente no CSS                           | LIGHT  | Mudança de estilo sem lógica                 |
| Criar componente de card com props e renderização condicional  | MEDIUM | Componente novo com estado/props             |
| Adicionar filtro por data em listagem existente                | MEDIUM | Filtro com lógica nova delimitada            |
| Adicionar validação de email no cadastro                       | MEDIUM | Validação com regra de negócio nova          |
| Integrar webhook de pagamento com retry e log                  | HEAVY  | Sistema financeiro + worker assíncrono       |
| Refatorar lógica de auth para hook compartilhado               | HEAVY  | Afeta ≥3 consumidores + domínio de segurança |
| Migrar tabela de banco sem downtime                            | HEAVY  | Schema migration em produção                 |

---

## 🗓️ HISTÓRICO DE ATUALIZAÇÕES

| Data       | Alteração                                                    |
|------------|--------------------------------------------------------------|
| 20/04/2026 | Versão 2.0 — critérios técnicos, plan-only, fonte documentada|
