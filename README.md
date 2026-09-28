# CORRO POR AMOR — APP DE DESAFIOS VIRTUAIS DE CORRIDA

> **"O atleta corre. O aplicativo registra. O sistema soma. O ranking atualiza. O atleta conquista."**

Plataforma completa para substituição do processo manual de conferência de prints por WhatsApp em desafios virtuais de corrida.

---

## 🚀 Arquitetura do Monorepo

O projeto está organizado com **npm workspaces**:

- **`shared/`**: Biblioteca compartilhada com tipos TypeScript, paleta de cores oficial (`#012A4A` a `#89C2D9`), constantes, cálculos geodésicos (fórmula de Haversine), ritmo médio (`min/km`), regras de XP e motor anti-fraude.
- **`mobile/`**: Aplicativo mobile nativo em **Expo / React Native** com rastreamento GPS real (`expo-location`), pausa automática quando parado por > 1 minuto, retomada automática com detecção de movimento consistente, 5 abas de navegação (Início, Desafios, Atividade, Ranking, Perfil) com ícones estritamente outline.
- **`admin/`**: Painel Web administrativo do Organizador em **React + Vite** com dashboard de KPIs, criação e edição de desafios com regras de pontuação de XP, fila de moderação de atividades suspeitas e controle de medalhas físicas e certificados digitais.
- **`supabase/`**: Projeto Supabase dedicado conectado (`corro-por-amor`) com tabelas, RLS e triggers PostgreSQL para soma automática de quilometragem e cálculo de ranking/XP.

---

## 🛠️ Como Executar

### 1. Painel Web do Organizador (Admin)

Para iniciar o painel web em modo desenvolvimento:

```bash
npm run dev:admin
```

O painel estará disponível em `http://localhost:5173`.

Para gerar o build de produção:
```bash
npm run build:admin
```

### 2. Aplicativo Mobile (Expo)

Para iniciar o servidor Metro do Expo:

```bash
npm run start:mobile
```

Pressione `a` para abrir no emulador Android, `i` para simulador iOS ou leia o QR Code com o aplicativo **Expo Go** no seu celular físico para testar o GPS real na rua!

---

## 🎨 Identidade Visual e Princípios de Design

- **Cores Principais**:
  - `primaryDark`: `#012A4A` (Títulos e elementos nobres)
  - `brandBlue`: `#014F86` (Ações principais e progresso)
  - `primary`: `#2A6F97` (Destaques e botões de apoio)
  - `lightBlue`: `#89C2D9` (Fundos suaves de badges)
  - `background`: `#FFFFFF` (Fundo predominantemente limpo)
- **Ícones**:
  - Estritamente **OUTLINE / VAZADOS** em todas as telas de navegação e botões esportivos.
  - **Exceção de Recompensa**: Badges preenchidos em tom dourado/azul exclusivamente na vitrine de **Conquistas Desbloqueadas**.
- **Acessibilidade**:
  - Métricas gigantes durante a corrida (distância, tempo e ritmo) para visualização rápida em movimento.
  - Botões com área de toque mínima confortável (>= 48px).

---

## 📱 Funcionalidades do Atleta (Mobile)

1. **Início**: Saudação, Desafio atual, Barra de progresso clara, Botão gigante `[ ▶ INICIAR CORRIDA ]`, Resumo da última atividade e Posição no ranking.
2. **Desafios**: Filtros por *Meus Desafios*, *Disponíveis* e *Concluídos*, com detalhamento de regras, medalhas e certificados.
3. **Corrida com GPS Nativo**:
   - Medição contínua de distância acumulada via GPS;
   - **Pausa Automática**: Se o atleta ficar parado por mais de 1 minuto, a corrida é pausada sem exigir toque na tela;
   - **Retomada Automática**: Quando o atleta volta a se movimentar de forma consistente, a corrida é retomada automaticamente com aviso na tela;
   - Confirmação de finalização para evitar toques acidentais.
4. **Resultado da Corrida**: Tempo em movimento, tempo pausado, ritmo médio, km somados ao desafio e ganho de XP.
5. **Histórico de Atividades**: Lista cronológica de corridas e fluxo preparado para integração com o Strava.
6. **Ranking Dinâmico**: Filtros por Distância, Conclusão e XP, destaque para o *🏆 Primeiro a Concluir* e barra fixa com a posição do próprio atleta.
7. **Perfil & Gamificação**: Nível, barra para o próximo nível, total de km, vitrine de conquistas e histórico de desafios.

---

## 🖥️ Funcionalidades do Organizador (Painel Web)

1. **Dashboard KPI**: Desafios Ativos, Participantes Inscritos, Quilômetros Totais Somados e Concluintes.
2. **Gestão de Desafios**: Criação e edição de desafios com metas de km, datas, regras de XP e opções de premiação.
3. **Gestão de Participantes**: Busca por nome, visualização de progresso e concluintes.
4. **Validação & Anti-Fraude**: Fila de análise humana para atividades com velocidade anormal (> 25 km/h) com ações de aprovar ou recusar.
5. **Logística de Medalhas & Certificados**: Controle de envio de medalhas físicas (pendente/enviado/entregue) com código de rastreio e visualizador de certificados digitais.
