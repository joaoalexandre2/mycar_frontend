# Voz e tom do MyCar

Guia de escrita para tudo o que a pessoa lê no app: botões, rótulos, mensagens
de erro, avisos, estados vazios, confirmações e e-mails. Vale para os três
perfis (Frota, Pessoa e Estética), com atenção maior à Frota, onde gestores e
motoristas usam o app no celular, em campo, com pressa e muitas vezes com sinal
ruim.

A lista do que corrigir hoje no código está em
[`textos-a-corrigir.md`](textos-a-corrigir.md). Este guia não trata de cor nem
de identidade visual (ver [`marca.md`](marca.md)).

---

## 1. Princípios de voz

A voz do MyCar não muda. O que muda é o tom (seção 2).

| Princípio | O que quer dizer | Faça | Evite |
| --- | --- | --- | --- |
| **Direto** | A frase diz o que importa primeiro. Uma ideia por frase. | "Informe o km do hodômetro." | "Para prosseguir com o registro é necessário que o km seja informado." |
| **Cuidadoso** | Antes de uma ação séria, diz o que vai acontecer. Nunca deixa a pessoa no escuro. | "Excluir esta multa? Não dá para desfazer." | "Remover a multa?" (e só) |
| **Humano** | Fala com "você", como um colega que conhece a frota. Sem jargão de sistema. | "Sem conexão. O que você digitou continua aqui." | "ERR_NETWORK", "Falha na requisição." |
| **Honesto** | Não promete o que o app não garante. Quando não sabe, diz. | "Confira o km lido da foto antes de registrar." | "O km é lido automaticamente." |
| **Sem culpa** | O problema é do campo, da conexão ou do sistema, nunca da pessoa. | "O fim da reserva precisa ser depois do início." | "Você digitou uma data inválida." |

Regras gerais:

- **"Você"** para falar com a pessoa. Nada de "o usuário", "prezado".
- **O app não fala em primeira pessoa do singular** ("Não consegui ler"). Quando
  precisar de sujeito, use construção impessoal ("Não deu para ler o km") ou,
  em e-mails e mensagens mais longas, "nós" ("Enviamos um convite").
- **Frases curtas**: até umas 20 palavras. Mensagem com mais de duas frases
  merece ser repensada.
- **Voz ativa**: "O gestor define o centro de custo", não "O centro de custo é
  definido pelo gestor".
- **Palavras do dia a dia da frota**: placa, km, hodômetro, saída, chegada,
  reserva, multa. Evite "registro", "entidade", "operação", "requisição",
  "parâmetro", "payload", "CSV" sozinho, "status" quando "situação" serve.
- **Sem exagero**: nada de "incrível", "super", "!!!", emoji em mensagem do
  sistema. Um ponto de exclamação só em comemoração rara (ex.: primeiro acesso).
- **Gênero neutro quando o nome é variável**: "O login de Ana agora está ligado
  ao cadastro" em vez de "Ana agora está ligado".

---

## 2. Como o tom muda por contexto

| Contexto | Tom | Estrutura | Exemplo |
| --- | --- | --- | --- |
| **Sucesso** | Curto e neutro. Confirma o que aconteceu, com o dado principal. | O que foi feito + o objeto. | "Reserva feita: ABC1D23, 12/11, 08:00–17:00." |
| **Erro de validação** | Calmo, prático. Diz o que falta, não o que a pessoa errou. | O que precisa + exemplo, se ajudar. | "Informe o km do hodômetro (só números, ex.: 45200)." |
| **Erro do sistema / rede** | Tranquilizador. Diz o que foi preservado e o próximo passo. | O que houve + o que ficou salvo + o que fazer. | "Sem conexão. O que você digitou continua aqui. Tente de novo." |
| **Aviso** | Informativo, sem alarme. Explica a consequência. | O fato + por que importa. | "A CNH de Paulo vence em 10 dias." |
| **Espera** | Diz o que está acontecendo, no gerúndio, com o objeto. | Verbo no gerúndio + objeto + "...". | "Lendo o km da foto..." / "Enviando a foto..." |
| **Vazio** | Acolhedor, orienta. | O que aparece aqui + por que está vazio + próximo passo. | "Nenhuma reserva neste mês. Reserve um veículo para ele aparecer aqui." |
| **Confirmação destrutiva** | Sério e claro. Sem suspense, sem drama. | Pergunta com o objeto + o que se perde + se dá para desfazer. Botão repete o verbo. | "Excluir a despesa de 12/11/2026? Não dá para desfazer." [Excluir despesa] [Cancelar] |
| **Sem permissão** | Neutro, sem acusar. Aponta quem resolve. | O que não está liberado + quem libera. | "Você não tem acesso a esta área. Peça a um administrador da frota." |
| **E-mail** | Um pouco mais caloroso, ainda objetivo. Assunto diz a ação. | Assunto com verbo + 1 parágrafo do que é + 1 botão + o que fazer se não foi você. | Assunto: "Crie sua senha no MyCar". Corpo: "A frota da Empresa X convidou você para reservar veículos pelo MyCar. O link vale por 7 dias." [Criar senha] "Não esperava este e-mail? Pode ignorar." |

> O prazo do link no exemplo de e-mail é ilustrativo: use sempre o prazo real
> configurado no backend.

---

## 3. Botões e ações

1. **Verbo no infinitivo com valor de imperativo**, seguido do objeto quando a
   tela tiver mais de uma ação: "Registrar saída", "Enviar convite",
   "Reservar veículo". Evite rótulos sem verbo ("Categorias", "Foto antes")
   quando o botão faz algo; se o botão só abre uma lista, use "Ver categorias"
   ou "Gerenciar categorias".
2. **Um verbo por ação, no produto inteiro.** A mesma ação tem o mesmo nome em
   todas as telas (ver Glossário): se é "Enviar convite" no Cadastro, é
   "Enviar convite" em Pessoas, no título do modal e no `aria-label`.
3. **O botão de confirmação repete o verbo da pergunta**: "Cancelar esta
   reserva?" → [Cancelar reserva] [Manter reserva]. Nunca [Sim] [Não] nem
   [OK].
4. **"Cancelar" só fecha sem salvar.** Se a ação é cancelar algo (uma reserva),
   o outro botão não pode se chamar "Cancelar": use "Voltar" ou "Manter
   reserva".
5. **Estado de carregamento no próprio botão**, no gerúndio: "Salvando...",
   "Registrando...", "Enviando...". Sempre com reticências (três pontos).
6. **Botão principal à direita no desktop e em largura cheia no celular**
   (padrão atual dos modais da Frota); um único botão principal por tela.
7. **Ícone sozinho precisa de `aria-label` com ação e objeto** ("Excluir a
   multa de 12/11/2026 08:30") e de `title` com o mesmo verbo.

---

## 4. Glossário

Termos que a interface usa. "Onde aparece hoje" cita o lugar exato no código
(arquivo:linha, conferidos em 8263236) para facilitar a troca. Itens marcados
com **(decisão)** precisam do dono do produto antes de mudar.

| Termo preferido | Evitar | Quando usar | Onde aparece hoje |
| --- | --- | --- | --- |
| **reserva** (o registro na agenda, do agendamento à chegada) **(decisão)** | "uso" como nome do registro; "viagem"; "utilização" | Botões, títulos, listas e mensagens da agenda: "Reservar veículo", "Editar reserva", "Cancelar reserva", "Nenhuma reserva neste mês". | "reserva": `UsoFormModal.tsx:74`, `UsoDetalheModal.tsx:275`. "uso" como registro: `UsoFormModal.tsx:105` ("Editar uso do veículo"), `UsoDetalheModal.tsx:304` ("Uso do veículo"), `Agenda.tsx:444` ("Nenhum uso agendado"), `Agenda.tsx:478` ("Usos de..."), `ImportarPlanilhaModal.tsx:198` ("Importar N usos"). "viagem": `ImportarPlanilhaModal.tsx:84` e `:91`. "utilização": `ImportarPlanilhaModal.tsx:83`. |
| **uso** (só como medida) | — | Métricas do painel e relatórios: "Uso real", "Uso dos veículos". | `PainelFrota.tsx:117`, `PainelFrota.tsx:130`. |
| **saída** | "retirada" | O momento em que o motorista pega o veículo e informa o km. "Registrar saída", "Km de saída", "Checklist de saída". | `UsoDetalheModal.tsx:333`, `UsoDetalheModal.tsx:448`, `UsoDetalheModal.tsx:486`. |
| **chegada** **(decisão)** | "devolução", "volta", "retorno" | O momento em que o veículo volta e o km é informado. "Registrar chegada", "Km de chegada", "Checklist de chegada". O valor interno `devolucao` pode ficar; só o texto muda. | "chegada": `UsoDetalheModal.tsx:333`, `:401`. "devolução": `UsoDetalheModal.tsx:486`, `ModelosDeChecklist.tsx:13` e `:14`, `QrVeiculoPagina.tsx:85` e `:94`, `Header.tsx:38`, `ChecklistModal.tsx:12`. "volta": `UsoDetalheModal.tsx:28`. |
| **hodômetro** / **foto do hodômetro** | "foto do painel", "visor", "contador" | O mostrador de km e a foto dele. Quando for preciso distinguir do velocímetro, explique uma vez: "o número do km, não o da velocidade". | "foto do hodômetro": `CapturaHodometro.tsx:143`, `:157`. "foto do painel": `CapturaHodometro.tsx:58`, `RecorteDoVisor.tsx:86`. "visor": `CapturaHodometro.tsx:96`, `RecorteDoVisor.tsx:104`. |
| **finalidade** (para quê o veículo vai ser usado) **(decisão)** | "motivo" para esse campo | Campo da reserva e da saída. "Motivo" fica reservado para **troca de centro** e **correção de km**, que são outra coisa. | "Finalidade": `UsoFormModal.tsx:256`, `UsoDetalheModal.tsx:369`. "Motivo" para o mesmo campo: `UsoDetalheModal.tsx:427`, `:442`, `:382`. "Motivo" legítimo: `TrocarCentroModal.tsx:135`, `CorrigirKmModal.tsx:116`. |
| **centro de custo** | "centro" sozinho em texto corrido; "área"; "amarrado" | Sempre por extenso na primeira menção da tela. Em tabela estreita, "Centro" é aceitável. | `UsoFormModal.tsx:197`; "Centro:" em `Financeiro.tsx:259`; "amarrado" em `UsoFormModal.tsx:170`; título do menu "Motoristas e centros" em `Sidebar.tsx:192` e `Header.tsx:32`. |
| **motorista** | "condutor"; "responsável" quando é o motorista da reserva | Quem dirige. Em multa, "responsável" é aceitável porque pode ser outra pessoa (decisão de quem paga). | `UsoFormModal.tsx:178`, `Multas.tsx:123`, `Multas.tsx:315`. |
| **gestor** | "gerente", "responsável pela frota" | Papel que cuida da agenda e dos cadastros. Quando a ação pode vir de gestor **ou** administrador, diga "a gestão da frota" ou "um administrador ou gestor". | `Pessoas.tsx:242`; "definido pelo gestor" (pode ser admin) em `UsoFormModal.tsx:166`; `TrocarCentroModal.tsx:148`. |
| **administrador** | "admin", "dono" | Papel que pode tudo na frota, inclusive papéis. Não confundir com o operador do painel `/admin` (interno do MyCar, nunca aparece para o cliente). | `Pessoas.tsx:117`, `:119`, `:243`. |
| **convite** (a ação) | "Enviar acesso" | "Enviar convite", "Reenviar convite", "Convite enviado". É o e-mail com o link para criar a senha. | "Enviar acesso": `Cadastros.tsx:245`, `:248`, `:361`, `Pessoas.tsx:132`. "Enviar convite": `Cadastros.tsx:392`, `Pessoas.tsx:251`. |
| **acesso** (o estado) | usar como verbo de ação | O que a pessoa tem depois de aceitar o convite: "Sem acesso", "Convite enviado", "Acesso ativo". | `Cadastros.tsx:308`–`310`; `Pessoas.tsx:281`, `:284`. |
| **desativar** / **reativar** | "inativar", "bloquear", "arquivar" | O cadastro some das escolhas, o histórico fica, dá para reativar. Diga sempre isso na primeira vez. | `Cadastros.tsx:101`, `:256`, `:656`; `MotivosTroca.tsx:109`; `CategoriasDespesaModal.tsx:62`. |
| **excluir** (apagar de vez) **(decisão)** | "remover" para apagar registro salvo; "apagar"; "deletar" | Registro salvo que some para sempre: reserva, multa, despesa, ocorrência, grupo. A confirmação diz que não dá para desfazer. | "Excluir": `UsoDetalheModal.tsx:285`, `:506`; Oficina em `Veiculos.tsx:121`, `Clientes.tsx:121`. "Remover" com o mesmo efeito: `Multas.tsx:59`, `Financeiro.tsx:111`, `Ocorrencias.tsx:82`, `Grupos.tsx:53`, `ModelosDeChecklist.tsx:172`, `Cadastros.tsx:138`, `:583`. |
| **remover** (tirar de uma lista ou de um formulário) | — | Algo que ainda não foi salvo ou que sai de um conjunto sem apagar o resto: a foto antes de registrar, um item do checklist em edição, uma foto da ocorrência. | `CapturaHodometro.tsx:157`, `ModelosDeChecklist.tsx:111`, `OcorrenciaModal.tsx:155`. |
| **placa** | — | Sempre em maiúsculas. Na Frota, a placa vem antes do nome: "ABC1D23 · Strada da equipe". | Ordem diferente em `rotulos.ts:6` ("Marca Modelo - PLACA"), `rotulos.ts:18` ("Nome · PLACA"), `UsoFormModal.tsx:154` ("PLACA · nome"), `Multas.tsx:120` ("PLACA (nome)"). |

---

## 5. Padrões de mensagem (modelos prontos)

Troque o que está entre `{chaves}`. Mantenha a ordem das partes.

### 5.1 Erro (validação ou regra de negócio)

**Estrutura:** o que precisa (ou o que houve) + o que fazer. Sem culpa, sem
"inválido" sozinho.

| Situação | Modelo |
| --- | --- |
| Campo obrigatório | "Informe {o campo}." / "Escolha {o item}." |
| Formato | "Informe {o campo} só com números, ex.: {exemplo}." |
| Regra entre campos | "{Campo A} precisa ser {relação} {campo B}." → "O fim da reserva precisa ser depois do início." |
| Regra do negócio | "{O que impede}. {Como resolver}." → "Este veículo já está reservado nesse horário. Escolha outro horário ou outro veículo." |
| Vários campos | "Confira os campos destacados: {lista curta}." (o destaque precisa ter texto ao lado do campo, não só cor). |

Use "Informe" para digitar e "Escolha" para selecionar. Evite "Selecione" e
"Preencha" (uma palavra só para cada gesto).

### 5.2 Erro de rede e de sessão

| Situação | Modelo |
| --- | --- |
| Sem conexão ao salvar | "Sem conexão. O que você digitou continua aqui. Tente de novo." [Tentar de novo] (texto atual em `api.ts:77`: manter) |
| Sem conexão ao carregar | "Não deu para carregar {a lista}. Confira a conexão e tente de novo." [Tentar de novo] |
| Erro desconhecido do servidor | "Algo deu errado do nosso lado e nada foi salvo. Tente de novo em instantes." |
| Sessão expirada (no login) | "Sua sessão expirou. Entre de novo para continuar." (texto atual em `Login.tsx:185`: manter) |
| Muitas tentativas | "Espere {tempo} e tente de novo." |

Nunca mostre código de erro, nome de exceção ou texto em inglês do servidor.
Se o backend devolver uma mensagem técnica, troque no `mensagemErro`
(`src/services/api.ts`) ou corrija na origem.

### 5.3 Estado vazio

**Estrutura:** o que aparece aqui + por que está vazio + próximo passo (com
botão ou link, se a pessoa puder agir).

| Tela | Modelo |
| --- | --- |
| Lista que a pessoa pode preencher | "Nenhum {item} cadastrado ainda. {Por que vale a pena, em meia frase.}" [Novo {item}] |
| Lista que outra pessoa preenche | "Nenhum {item} por aqui. {Quem cadastra} cadastra em {nome exato do menu}." |
| Filtro sem resultado | "Nenhum {item} com esse filtro. Mude o período ou limpe os filtros." |
| Motorista vendo só o que é dele | "Nenhuma reserva sua neste mês." (não sugerir que a frota está livre) |
| Painel sem pendência (boa notícia) | "Nenhuma CNH vencida ou a vencer em 30 dias." (texto atual: manter; aqui o vazio é a boa notícia e não precisa de próximo passo) |

### 5.4 Confirmação de ação destrutiva

**Estrutura:** pergunta com verbo e objeto identificado + o que vai junto +
se dá para desfazer. Botão de confirmar repete o verbo; foco inicial no
"Cancelar" (já é o padrão em `DialogoConfirmacao.tsx`).

```
Título:   Excluir a multa de 12/11/2026 08:30?
Texto:    A multa sai do financeiro e dos relatórios. Não dá para desfazer.
Botões:   [Cancelar]  [Excluir multa]
```

```
Título:   Desativar o motorista Paulo?
Texto:    Ele some das escolhas da agenda. O histórico continua guardado e
          dá para reativar depois.
Botões:   [Cancelar]  [Desativar]
```

```
Título:   Descartar o que você digitou?
Texto:    O km, a foto e a finalidade ainda não foram registrados.
Botões:   [Continuar editando]  [Descartar]
```

Quando o sistema pode recusar a exclusão (cadastro com histórico), diga a
alternativa **depois** da recusa, não antes; a pergunta fica curta.

### 5.5 Sucesso

Curto, no particípio, com o objeto. Sem "com sucesso" (o tom verde e o ícone
já dizem isso).

| Ação | Modelo |
| --- | --- |
| Criar | "{Item} cadastrado." / "Reserva feita: {placa}, {dia}, {janela}." |
| Salvar | "Alterações salvas." |
| Excluir | "{Item} excluído." |
| Enviar convite | "Convite enviado para {e-mail}. {Nome} cria a senha pelo link." |
| Registrar saída/chegada | "Saída registrada: {km}." / "Chegada registrada: {km rodados} rodados." |

---

## 6. Formatação

| Dado | Formato | Exemplo | Como fazer |
| --- | --- | --- | --- |
| Data | dd/mm/aaaa | 12/11/2026 | `formatarData` (`src/utils/formatters.ts`). |
| Data e hora | dd/mm/aaaa, hh:mm (24 h) | 12/11/2026, 08:30 | `formatarDataHora`. |
| Janela na agenda | dd/mm hh:mm – hh:mm (mesmo dia) ou dd/mm hh:mm – dd/mm hh:mm | 12/11 08:00 – 17:00 | `descreverJanela` (`src/utils/agenda.ts`). Traço meia-risca (–) com espaços. |
| Hora sozinha | hh:mm | 08:00 | Nunca "8h" num lugar e "08:00" em outro. |
| Moeda | R$ 1.500,50 | R$ 1.500,50 | `formatarMoeda`. Rótulo de campo: "Valor (R$)". |
| Km | 45.200 km (ponto de milhar, espaço, "km" minúsculo) | 45.200 km | `formatarKm`. Nunca o número cru ("45200"). No campo de digitação, aceite com ou sem ponto e mostre o exemplo como "ex.: 45200". |
| Placa | maiúsculas; Mercosul sem traço, antiga com traço | ABC1D23, ABC-1234 | `formatarPlaca` (`src/utils/placa.ts`). |
| Percentual | número + %, sem espaço | 72% | — |
| Plural | concorde o substantivo com o número; nunca "(s)" | 1 reserva, 2 reservas; 0 multas | Ternário `n === 1 ? "item" : "itens"` (padrão já usado em `ChecklistModal.tsx:124`). |
| Vazio de dado | travessão "—" | — | Padrão atual de `formatarData` e `formatarKm`. |
| Caminho de menu | nome exato do menu + " > " + nome exato da aba | Gestão da frota > Motivos de troca | Confira no `Sidebar.tsx`: o texto tem que bater com o que a pessoa vê. |
| Aspas | aspas retas "assim" em todo o app | "Ligar a um motorista" | Hoje há aspas curvas em `Grupos.tsx:99`. |
| Maiúsculas | só a primeira letra da frase e nomes próprios | "Centro de custo" | Caixa alta só por CSS (`uppercase`) em rótulos curtos de seção; nunca escrita no texto. |

---

## 7. Escrita acessível

1. **Link com destino claro.** O texto do link diz para onde vai ou o que
   abre: "Ver foto do hodômetro na saída", "Ir para Motivos de troca". Nada de
   "clique aqui", "saiba mais" ou "ver" sozinho.
2. **Nada só por cor.** Status, problema e erro sempre com palavra ao lado: o
   chip diz "Em uso", o checklist diz "Problema", o campo inválido tem a frase
   do erro embaixo. A agenda já faz isso (`Agenda.tsx:353`): é o padrão.
3. **`aria-label` com ação + objeto identificável**: "Excluir a multa de
   12/11/2026 08:30", "Editar Paulo". Não use valor interno ("antes", "saida")
   no texto lido: "Ver foto de antes do reparo".
4. **`title` não substitui `aria-label`** e tem de dizer a mesma coisa. Um
   `title` diferente do `aria-label` confunde quem usa mouse e leitor de tela
   ao mesmo tempo.
5. **Texto alternativo de imagem diz o que a imagem mostra e para que serve**:
   "Foto do hodômetro: arraste para marcar o número do km".
6. **Erros anunciados**: mensagem de erro em `role="alert"`; avisos e
   progresso em `role="status"`. Já é o padrão do `Alert`.
7. **Instruções que valem no celular**: "toque" ou o nome do botão ("Use
   Conferir"), não "clique".
8. **Abreviações**: escreva por extenso na primeira vez ou use a forma que a
   pessoa conhece ("CNH", "IPVA", "km" sim; "OS", "CC", "Nº" evite em rótulo
   de campo).

---

## 8. Checklist de revisão de texto (para quem abre um PR)

Marque no PR quando mexer em texto visível:

- [ ] O termo está no Glossário? Usei o preferido (reserva, chegada, hodômetro,
      finalidade, excluir/remover, convite)?
- [ ] Botão começa com verbo e diz o objeto quando há mais de uma ação?
- [ ] A mesma ação tem o mesmo nome no botão, no título do modal, no
      `aria-label` e no toast?
- [ ] Mensagem de erro diz o que fazer, sem culpar e sem jargão técnico?
- [ ] Estado vazio tem próximo passo (ou é uma boa notícia)?
- [ ] Confirmação destrutiva diz o que se perde e se dá para desfazer? Botão
      repete o verbo?
- [ ] Frase com mais de 20 palavras? Dá para cortar?
- [ ] Datas, moeda, km e placa passam pelos formatadores (`formatarData`,
      `formatarMoeda`, `formatarKm`, `formatarPlaca`)?
- [ ] Plural concordado (nada de "(s)")?
- [ ] Nada depende só da cor? Ícone sozinho tem `aria-label`?
- [ ] Caminho de menu citado no texto bate com o nome no `Sidebar.tsx`?
- [ ] Rodei os testes: algum `getByText`, `getByRole({ name })`,
      `getByLabelText` ou `getByTitle` usava o texto antigo?

---

## 9. Como aplicar

Ordem sugerida de PRs pequenos (cada um revisável em minutos, com os testes
ajustados no mesmo PR). Os números entre parênteses são os itens de
[`textos-a-corrigir.md`](textos-a-corrigir.md).

| # | PR | Itens | Testes que podem quebrar |
| --- | --- | --- | --- |
| 1 | **Correções sem decisão de produto (Frota, Alta)**: "Tirar a foto", caminhos de menu que não existem, gênero em "ligado", confirmações que não dizem o que se perde (sem trocar o verbo ainda). | 1, 2, 3, 4, 8, 9, 10 | `componentesDaFrota.test.tsx:97` (`getByTitle("Tirar a foto")`); `Pessoas.test.tsx` (procura "ligado ao cadastro"). |
| 2 | **Mensagem genérica de erro e de carga** (`api.ts`, "Falha ao carregar."). | 11, 24 | `Login.test.tsx` (procura "Não foi possível concluir"). |
| 3 | **Convite x acesso** (depois de confirmar o termo). | 5, 6 | `motoristaAcesso.test.tsx:68`, `:78`, `:87` e `Pessoas.test.tsx` (`/Enviar acesso/`). |
| 4 | **Chegada x devolução** (decisão). Só texto: o valor interno `devolucao` fica. | 12, 15, 16, 17 | Nenhum `getByText` encontrado com "devolução" (só nomes de teste em `Modal.test.tsx:233` e `frota.test.ts:38`); conferir os de `QrVeiculoPagina` e `ChecklistModal` ao mudar. |
| 5 | **Finalidade x motivo** (decisão). | 13, 18, 19 | `componentesDaFrota.test.tsx:191` ("Histórico do motivo"); `UsoDetalheModal.descarte.test.tsx` (procura "Motivo"); `paginasDaFrota.test.tsx:318` (`getByLabelText("Finalidade")`, não muda se a decisão for "Finalidade"). |
| 6 | **Reserva x uso** (decisão), incluindo a planilha. | 14, 20, 21, 22, 23, 38 | `Agenda.test.tsx` e `paginasDaFrota.test.tsx` ("Nenhum uso agendado"). |
| 7 | **Excluir x remover** (decisão). Maior PR de texto: vale dividir por tela. | 7 e as confirmações listadas no Glossário | `componentesDaFrota.test.tsx:291`, `:292`, `:388`; `navegacaoERotulos.test.tsx:110`; `Financeiro.test.tsx:99` ("Remover despesa de..."); `Ocorrencias.test.tsx:277`, `:278`; `cadastrosGuiados.test.tsx`, `modelosSalvos.test.tsx`, `paginasDaFrota.test.tsx` (procuram "Remover"). |
| 8 | **Estados vazios com próximo passo** e sem permissão. | 25–29 | `cadastrosGuiados.test.tsx` e `paginasDaFrota.test.tsx` ("Nenhum motorista cadastrado"). |
| 9 | **Formatação** (km cru, plural com "(s)", placa sem `formatarPlaca`). | 30, 31, 32, 39, 62 | `Dashboard.test.tsx` ("veículo(s)"); `CartaoVeiculo.test.tsx`, `kmConhecida.test.tsx` ("Km atual", da tela Pessoa: conferir se o formato muda lá também). |
| 10 | **Baixas**: acessibilidade de `aria-label`, aspas, "Clique", rótulos. | restantes | `Ocorrencias.test.tsx:183`, `:275`, `:276`, `:277`, `:278` ("Ver foto de antes", "Remover foto de antes"); `Relatorios.test.tsx:86` (`/Baixar CSV/`); `Pessoas.test.tsx:437` ("reenviar de novo"); `componentesDaFrota.test.tsx:110` ("Escolha uma imagem"); `UsoFormModal.motorista.test.tsx:38` (procura "Peça ao gestor."). |

Dicas para não quebrar testes à toa:

- Antes de trocar um texto, rode `grep -rn "texto antigo" src e2e` e ajuste os
  testes no mesmo commit.
- Prefira nos testes `getByRole("button", { name: /Excluir/ })` com regex do
  verbo a frases inteiras: a frase pode melhorar sem quebrar o teste.
- Os testes e2e (`e2e/*.spec.ts`) também procuram textos (ex.: "Motivo" em
  `e2e/gestao-da-frota.spec.ts`); rode-os antes do merge de PRs de glossário.
- Textos que vêm do backend (mensagens de validação do Laravel, e-mails Blade)
  ficam em outro repositório: este guia vale para eles também, mas a troca é
  outro PR.
