**ESTRUTURA DO PORTAL PNAB IRECÊ**

Base: [PNAB Bahia](https://www.bahiapnab.com.br/)

**1\) Seção “O que é a PNAB Irecê” (para a página institucional)**

**A Política Nacional Aldir Blanc de Fomento à Cultura (PNAB)** é uma política pública permanente de financiamento cultural que apoia agentes culturais, coletivos, espaços e iniciativas em todo o Brasil. Em Irecê, a PNAB é executada pela **Secretaria de Arte e Cultura**, com chamadas públicas (editais) e ações voltadas ao fortalecimento da produção cultural no município.

Por meio do **Portal PNAB Irecê**, você pode:

* Acessar **editais abertos e encerrados**  
* Baixar **editais e anexos oficiais**  
* Realizar **inscrições online**  
* Acompanhar **resultados, recursos e projetos apoiados**  
* Consultar **manuais, orientações e FAQ**  
* Entrar em contato com o **atendimento** por edital

**Transparência:** todas as publicações oficiais, cronogramas e listas de resultados ficam disponíveis neste portal.

**BLUEPRINT DO PORTAL PNAB IRECÊ**

**1\) Objetivo do produto**

Centralizar, em um único portal:

* **Editais PNAB Irecê** (abertura, regras, downloads, cronograma).  
* **Inscrição online** (proponente PF/PJ/coletivo) e **acompanhamento**.  
* **Transparência** (contemplados, suplentes, execução, prestação de contas quando houver).  
* **Comunicação** (notícias, avisos, perguntas frequentes, atendimento).  
* **Acessibilidade** (Libras, versões acessíveis, contraste).

**2\) Público-alvo e perfis de usuário**

**Externo**

1. **Proponente (Agente Cultural)**  
   * PF, MEI, PJ com/sem fins lucrativos, coletivo sem CNPJ (via representante).  
2. **Visitante/Cidadão**  
   * Quer acompanhar prazos, resultados e projetos apoiados.  
3. **Imprensa/Parceiros**  
   * Busca releases, números e dados públicos.

**Interno**  
4\. **Administrador PNAB (Secretaria)**

* Publica editais, gerencia fases, habilitação, resultados.

5. **Equipe Técnica (Pareceristas/Comissão)**

   * Avalia propostas e registra notas/pareceres.

6. **Atendimento**

   * Responde tickets, direciona dúvidas por edital.

**3\) Arquitetura de informação (mapa do site)**

**Menu principal (público)**

1. **Início**  
2. **O que é PNAB**  
3. **Editais**  
   1. Abertos  
   2. Encerrados  
   3. Em andamento (opcional, mas recomendado)  
4. **Inscrições / Área do Proponente**  
5. **Projetos Apoiados (Transparência)**  
6. **Notícias / Cultura em Movimento**  
7. **Manuais & Materiais**  
8. **FAQ**  
9. **Contato / Atendimento**

**Rodapé**

* Redes sociais da Secretaria  
* Newsletter  
* Acessibilidade (atalhos, VLibras, contraste)  
* Termos: Privacidade, Cookies, LGPD, Acessibilidade

**4\) Jornadas principais (user flows)**

**4.1 Proponente: “quero me inscrever”**

1. Acessa **Editais Abertos** → escolhe edital  
2. Lê resumo \+ **baixa PDF** \+ abre **versão acessível**  
3. Clica **Inscrever-se** → Login (CPF/CNPJ)  
4. Se não tiver conta → **Cadastro** (PF/PJ/Coletivo)  
5. Preenche **formulário** \+ **anexos** \+ orçamento  
6. Confirma envio → recebe **comprovante** (PDF/ID da inscrição)  
7. Acompanha status: rascunho → enviado → habilitação → avaliação → resultado → recursos (se houver)

**4.2 Visitante: “quero ver resultados”**

1. Acessa **Projetos Apoiados**

2. Filtra por: **Ano/Ciclo**, **Edital**, **Linguagem/Área**, **Bairro/Distrito (se aplicável)**  
3. Abre página do projeto → vê dados públicos \+ contrapartidas \+ mídia

**4.3 Atendimento: “quero falar com a secretaria”**

1. Acessa **Contato**  
2. Seleciona **Edital** (ou “Plataforma”)  
3. Descreve a dúvida → gera **protocolo** e notificação interna

**5\) Módulos do sistema (funcionalidades)**

**5.1 CMS / Conteúdo institucional**

* Páginas: Início, PNAB, FAQ, Notícias, Manuais  
* Banners de alerta: “Inscrições abertas até XX/XX”  
* Blocos reutilizáveis: links úteis, calendário, documentos, cards de edital

**5.2 Gestão de Editais**

Cada edital tem:

* **Resumo** (objetivo, público, valor total, cotas/ações afirmativas)  
* **Arquivos** (PDF, anexos, modelos, planilhas, declarações)  
* **Cronograma** (marcos com data/hora)  
* **Categorias/Linguagens** (ex.: música, teatro, audiovisual…)  
* **Regras de elegibilidade** (texto \+ checklist)  
* **FAQ específico** (opcional)  
* **Fases** configuráveis: Inscrição → Habilitação → Avaliação → Resultado preliminar → Recurso → Resultado final → Execução/PC

**5.3 Área do Proponente (conta)**

* Login por **CPF/CNPJ**  
* Recuperação de senha  
* Perfil e documentos do proponente  
* Histórico de inscrições (todas as propostas)  
* Mensagens/alertas (pendências, prazos, resultado)

**5.4 Formulário de inscrição (por edital)**

* Campos dinâmicos (cada edital define seus campos)  
* Upload de anexos com validação:  
  * tipo de arquivo, tamanho, obrigatoriedade  
* Orçamento (planilha interna e/ou upload)  
* Declarações (checkbox \+ PDF gerado, se desejável)  
* Rascunho, submissão, comprovante

**5.5 Painel da Secretaria (Backoffice)**

* Cadastro e publicação de editais  
* Gestão de inscrições (lista, filtros, exportação)  
* Habilitação (documental) com motivos padronizados  
* Avaliação:

  * distribuição para avaliadores

  * critérios \+ notas \+ parecer

* Geração de resultados:

  * preliminar/final

  * suplência

  * export para diário/DOE municipal (se aplicável)

* Recursos (workflow com prazos e decisões)

* Transparência: publicar “Projetos Apoiados”

**5.6 Transparência: Projetos Apoiados**

* Base pública com:

  * título, proponente, categoria, valor, status

  * territorialização municipal (bairro/distrito/comunidade) **se for política do edital**

  * contrapartidas e comprovações (quando público)

* Filtros: Edital, Ano/Ciclo, Área, Status, Localidade

**5.7 Atendimento / Protocolo**

* Formulário por edital

* Número de protocolo

* Painel interno: status (aberto/em atendimento/fechado)

* Respostas por e-mail \+ histórico

**5.8 Acessibilidade**

* Integração **VLibras**

* Alternância de **contraste** e tamanhos de fonte

* **Versão acessível** (HTML) dos editais e anexos essenciais

* Leitura por screen reader (semântica, ARIA, foco de teclado)

**6\) Modelo de dados (entidades principais)**

**Entidades públicas**

* **Edital**

  * id, título, ano, status, resumo, valor\_total, categorias\[\], ações\_afirmativas, territorialização, datas (cronograma)

* **ArquivoEdital**

  * edital\_id, tipo (PDF/anexo/modelo), título, data\_publicação, url, acessível?

* **Notícia**

  * título, corpo, data, tags, mídia

* **Manual/Material**

  * título, categoria, arquivo\_url, versão

**Entidades de inscrição**

* **Proponente**

  * tipo (PF/PJ/Coletivo), cpf/cnpj, nome/razão, contatos, endereço, representações, documentos

* **Inscrição/Proposta**

  * edital\_id, proponente\_id, status, timestamps, número, categoria, campos\_formulário (JSON), orçamento, anexos\[\]

* **AnexoProposta**

  * proposta\_id, tipo, arquivo\_url, válido?, observação

* **Avaliação**

  * proposta\_id, avaliador\_id, notas\_por\_critério, parecer, total, data

* **Recurso**

  * proposta\_id, fase, texto, anexos, decisão, justificativa, data

**Transparência / execução (opcional no MVP)**

* **ProjetoApoiado**

  * proposta\_id, valor\_aprovado, status\_execução, contrapartida, mídia, relatórios públicos

**7\) Permissões (RBAC)**

* **Visitante**: leitura pública

* **Proponente**: CRUD apenas das suas propostas; submissão; recursos

* **Atendimento**: ver tickets; responder; não altera avaliação

* **Habilitador**: marca habilitado/inabilitado; registra motivos

* **Avaliador**: vê propostas atribuídas; lança notas/parecer; sem acesso a dados sensíveis além do necessário

* **Admin**: tudo (editais, usuários, publicações, resultados)

**8\) Padrões de UI/UX (componentes)**

* **Card de Edital** (status, prazo final, CTA)

* **Página do Edital** (downloads \+ cronograma \+ CTA inscrição)

* **Stepper de Status da Proposta** (linha do tempo)

* **Painel do Proponente** (minhas propostas, pendências, mensagens)

* **Tabela de Transparência** (filtros \+ export CSV/PDF)

* **Central de Ajuda** (FAQ por tema \+ busca)

**9\) Conteúdo “municipal” (o que adaptar para Irecê)**

* Territorialização local (se houver): bairros, distritos, comunidades  
* Ações afirmativas municipalizadas (critérios e comprovações)  
* Calendário oficial de Irecê (publicações, prazos, resultados)  
* Materiais de comunicação com marca “PNAB Irecê \+ Secretaria”

**10\) Entregas por fase (roadmap de produto)**

**MVP (primeira entrega “operável”)**

1. Site público \+ CMS (Início, PNAB, FAQ, Notícias, Manuais)  
2. Editais (abertos/encerrados) \+ página do edital (downloads \+ cronograma)  
3. Área do proponente (cadastro/login)  
4. Inscrição com upload \+ comprovante  
5. Backoffice mínimo: listar inscrições \+ exportar CSV \+ marcar habilitação manual  
6. Transparência simples: publicar lista de contemplados (manual/import)

**V1 (processo completo)**

* Avaliação com critérios e distribuição para avaliadores  
* Resultado preliminar/final \+ recursos  
* Transparência com filtros e página do projeto

**V2 (maturidade)**

* Execução / acompanhamento \+ contrapartidas  
* Prestação de contas (se aplicável) com checklist e upload  
* Painel de indicadores (nº propostas, territórios, linguagens, valores)

**11\) Indicadores (KPIs) recomendados**

* Taxa de conclusão de inscrição (% rascunho → enviada)  
* Principais motivos de inabilitação  
* Tempo médio de resposta do atendimento  
* Distribuição territorial (bairros/distritos) e por linguagem  
* Acessos por edital e downloads por anexo

**12\) Artefatos do portfólio (o que documentar como “produto”)**

* Mapa do site \+ jornadas  
* Protótipo navegável (Figma)  
* Documento de requisitos (MVP → V2)  
* Manual de conteúdo (padrão de editais, anexos, cronograma)  
* Guia de acessibilidade (checklist WCAG \+ VLibras)

