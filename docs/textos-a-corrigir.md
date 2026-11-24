# Textos a corrigir

Auditoria dos textos que a pessoa lê no frontend, com foco na Frota. Cada linha
foi conferida no código no commit 8263236 (caminhos a partir de `src/`). As
regras e os termos preferidos estão em [`voz-e-tom.md`](voz-e-tom.md); a ordem
sugerida de PRs está na seção "Como aplicar" de lá.

- **Prioridade**: Alta = confunde, leva ao erro ou trava a tarefa; Média =
  inconsistência ou falta de próximo passo; Baixa = polimento.
- **Decisão**: "sim" quando o texto depende de uma escolha do dono do produto
  (o texto sugerido é a recomendação deste guia).
- `{x}` marca um valor que o código insere.

Total: **62 itens** (14 Alta, 24 Média, 24 Baixa).

## Alta

| # | Arquivo:linha | Texto atual | Texto sugerido | Por quê | Decisão |
| --- | --- | --- | --- | --- | --- |
| 1 | `components/frota/CapturaHodometro.tsx:156` | `title="Tirar a foto"` (botão que **apaga** a foto) | `title="Remover a foto do hodômetro"` | No Brasil "tirar a foto" é fotografar: o botão faz o oposto do que diz. O `aria-label` (linha 157) já está certo; o `title` tem de bater com ele. | não |
| 2 | `pages/Frota/Pessoas.tsx:132` | `cadastre-o em Cadastros > Motoristas e use "Enviar acesso".` | `cadastre-o em Motoristas e centros > Motoristas e use "Enviar convite".` | Não existe menu "Cadastros": no menu lateral é "Motoristas e centros" (`components/layout/Sidebar.tsx:192`). Caminho errado manda a pessoa procurar o que não acha. | não |
| 3 | `pages/Frota/Pessoas.tsx:618` | `Dá para completar depois em Cadastros &gt; Motoristas.` | `Dá para completar depois em Motoristas e centros > Motoristas.` | Mesmo caminho inexistente do item 2. | não |
| 4 | `pages/Frota/Pessoas.tsx:221` | `{nome} agora está ligado ao cadastro de motorista {cadastro} e já pode reservar.` (e `:222`; na `:129`, `{nome} não está ligado a nenhum cadastro`) | `O login de {nome} agora está ligado ao cadastro de motorista {cadastro}. Já dá para reservar.` / `O login de {nome} não está ligado a nenhum cadastro de motorista.` | "ligado" no masculino para qualquer nome. Sujeito "o login" é neutro e mais exato. | não |
| 5 | `pages/Frota/Cadastros.tsx:248` | `Enviar acesso` (e o `aria-label` da `:245`) | `Enviar convite` | A mesma ação se chama "Enviar convite" no botão do modal (`Cadastros.tsx:392`) e em Pessoas (`Pessoas.tsx:251`). Um verbo por ação. | sim (confirmar "convite") |
| 6 | `pages/Frota/Cadastros.tsx:361` | Título do modal `Enviar acesso` | `Enviar convite` | Título diz uma coisa, botão de dentro diz outra (`:392`). | sim (junto do 5) |
| 7 | `components/frota/UsoDetalheModal.tsx:506` | `Excluir` (e a confirmação da `:285`) | Manter `Excluir` e trocar `Remover` por `Excluir` nas confirmações de registro salvo da Frota (`Multas.tsx:59`, `Financeiro.tsx:111`, `Ocorrencias.tsx:82`, `Grupos.tsx:53`, `ModelosDeChecklist.tsx:172`, `Cadastros.tsx:138`, `:583`) | Na Frota, apagar uma reserva é "Excluir" e apagar uma multa é "Remover", com o mesmo efeito. A Oficina já usa "Excluir" (`Veiculos.tsx:121`). "Remover" fica para tirar algo de uma lista (ver Glossário). | sim |
| 8 | `pages/Frota/Financeiro.tsx:111` | `Remover a despesa de {data}?` | `Excluir a despesa de {data}? Ela sai do financeiro e dos relatórios. Não dá para desfazer.` | Confirmação destrutiva sem dizer o que se perde nem se dá para desfazer. | verbo: sim (item 7); resto: não |
| 9 | `pages/Frota/Multas.tsx:59` | `Remover a multa de {data e hora}?` | `Excluir a multa de {data e hora}? Ela sai do financeiro e dos relatórios. Não dá para desfazer.` | Mesmo problema do item 8. | verbo: sim (item 7); resto: não |
| 10 | `pages/Frota/Ocorrencias.tsx:82` | `Remover esta ocorrência e as fotos dela? A despesa ligada também sai.` | `Excluir esta ocorrência e as fotos dela? A despesa de reparo criada por ela também é excluída. Não dá para desfazer.` | "A despesa ligada também sai" é vago (qual despesa? sai para onde?). O vínculo é explicado em `OcorrenciaModal.tsx:278`. | verbo: sim (item 7); resto: não |
| 11 | `services/api.ts:81` | `Não foi possível concluir a operação.` | `Algo deu errado do nosso lado e nada foi salvo. Tente de novo em instantes.` | Mensagem que aparece em qualquer erro sem texto do servidor: não diz o que houve, se algo foi salvo nem o que fazer. "Operação" é jargão. Confirmar com o backend que "nada foi salvo" vale para todos os casos antes de usar essa parte. | não |
| 12 | `components/frota/UsoDetalheModal.tsx:486` | `Checklist de devolução` | `Checklist de chegada` | No mesmo modal o botão é "Registrar chegada" (`:333`) e o km é "Km de chegada" (`:448`). Dois nomes para o mesmo momento. O valor interno `devolucao` não precisa mudar. | sim |
| 13 | `components/frota/UsoDetalheModal.tsx:427` | Rótulo `Motivo` (campo `finalidade` na saída) | `Finalidade` | Na reserva o mesmo campo se chama "Finalidade" (`UsoFormModal.tsx:256`) e no detalhe também (`UsoDetalheModal.tsx:369`). "Motivo" já é usado para troca de centro e correção de km, que são outra coisa. | sim |
| 14 | `components/frota/UsoFormModal.tsx:105` | Título `Editar uso do veículo` (criação: `Reservar veículo`) | `Editar reserva` | A pessoa criou uma "reserva" e, ao editar, encontra um "uso". O botão de cancelar fala em "reserva" (`UsoDetalheModal.tsx:275`). | sim |

## Média

| # | Arquivo:linha | Texto atual | Texto sugerido | Por quê | Decisão |
| --- | --- | --- | --- | --- | --- |
| 15 | `pages/Frota/ModelosDeChecklist.tsx:13` | `Devolução` (e `:14` `Saída e devolução`) | `Chegada` / `Saída e chegada` | Mesmo termo do item 12. | sim (item 12) |
| 16 | `pages/Frota/QrVeiculoPagina.tsx:94` | `Fazer checklist de {saída/devolução}` (e `:85`) | `Fazer checklist de {saída/chegada}` | Mesmo termo do item 12. | sim (item 12) |
| 17 | `components/layout/Header.tsx:38` | `Os itens que o motorista confere na saída e na devolução.` | `Os itens que o motorista confere na saída e na chegada.` | Mesmo termo do item 12. | sim (item 12) |
| 18 | `components/frota/UsoDetalheModal.tsx:442` | `Motivo:` {finalidade} | `Finalidade:` {finalidade} | Mesmo campo do item 13. | sim (item 13) |
| 19 | `components/frota/UsoDetalheModal.tsx:382` | `Histórico do motivo` | `Mudanças na finalidade` | Mesmo campo do item 13; "histórico de" uma coisa só que muda soa técnico. | sim (item 13) |
| 20 | `pages/Frota/Agenda.tsx:444` | `Nenhum uso agendado neste período.` | `Nenhuma reserva neste mês.` (o botão "Reservar veículo" logo abaixo já é o próximo passo) | A tela mostra um mês, não um "período"; e "uso agendado" mistura dois termos para o que a pessoa chama de reserva. | sim (item 14) |
| 21 | `components/frota/ImportarPlanilhaModal.tsx:83` | `Importar planilha de utilização` | `Importar reservas já feitas` | "Utilização" é um terceiro nome para a mesma coisa. | sim (item 14) |
| 22 | `components/frota/ImportarPlanilhaModal.tsx:91` | `preencha uma linha por viagem (placa, datas, km de saída e de chegada).` | `preencha uma linha para cada vez que o veículo saiu (placa, datas, km de saída e de chegada).` | "Viagem" sugere deslocamento longo e só aparece aqui (e na `:84`). | sim (item 14) |
| 23 | `components/frota/ImportarPlanilhaModal.tsx:198` | `Importar {n} uso` / `Importar {n} usos` | `Importar {n} reserva` / `Importar {n} reservas` | Mesmo termo do item 14. O plural já está certo. | sim (item 14) |
| 24 | `pages/Conta/MeusVeiculos.tsx:264` | `Falha ao carregar.` (também em `pages/Veiculos/Veiculos.tsx:232`) | `Não deu para carregar a lista.` | "Falha" é técnico e frio. Na Frota esta é a tela "Veículos da frota". O botão de tentar de novo já fica na lista. | não |
| 25 | `pages/Frota/Cadastros.tsx:201` | `Nenhum motorista cadastrado ainda.` | `Nenhum motorista cadastrado ainda. Cadastre o primeiro em "Novo motorista" para poder escolher quem dirige nas reservas.` | Estado vazio sem próximo passo nem motivo para agir. | não |
| 26 | `pages/Frota/PainelFrota.tsx:137` | `Nenhum veículo na frota.` | `Nenhum veículo na frota ainda. Cadastre os veículos em Veículos da frota para ver o uso aqui.` (com link) | Vazio sem próximo passo. A Agenda já faz isso com link (`Agenda.tsx:223`). | não |
| 27 | `pages/Frota/Multas.tsx:106` | `Nenhuma multa registrada.` | `Nenhuma multa registrada. Quando chegar uma notificação, use "Nova multa": o MyCar sugere quem estava com o veículo.` | Vazio sem próximo passo; perde a chance de mostrar o diferencial da tela. | não |
| 28 | `pages/Frota/Cadastros.tsx:41` | `Esta área não está liberada para o seu acesso na frota.` | `Você não tem acesso a esta área. Peça a um administrador da frota.` | Frase longa e passiva, sem dizer quem libera. | não |
| 29 | `pages/Frota/MotivosTroca.tsx:96` | `Nenhum motivo cadastrado ainda.` | `Nenhum motivo cadastrado ainda. Eles aparecem quando alguém troca o centro de custo de uma reserva.` | Vazio sem dizer para que serve a lista. | não |
| 30 | `pages/Frota/QrVeiculoPagina.tsx:60` | `Km atual: {km_atual}` (número cru, ex.: 45200) | `Km atual: {formatarKm(km_atual)}` → "Km atual: 45.200 km" | Única tela da Frota que mostra km sem o formatador. Mudança de uma chamada, sem mudar o texto fixo. | não |
| 31 | `pages/Frota/Multas.tsx:149` | `Página {x} de {y} · {n} multas` | `Página {x} de {y} · 1 multa` quando houver uma; `{n} multas` nos demais casos | Com uma multa aparece "1 multas". | não |
| 32 | `pages/Conta/MeusVeiculos.tsx:265` | `{n} veículo(s) encontrado(s)` (também em `pages/Veiculos/Veiculos.tsx:233`) | `1 veículo encontrado` / `{n} veículos encontrados` | "(s)" é leitura difícil e o leitor de tela soletra os parênteses. | não |
| 33 | `components/frota/CapturaHodometro.tsx:58` | `Escolha uma imagem (foto do painel).` | `Escolha uma foto do hodômetro.` | "Foto do painel" e "foto do hodômetro" convivem no mesmo componente (`:143`). | não |
| 34 | `components/frota/UsoFormModal.tsx:170` | `Você ainda não está amarrado a um centro de custo. Peça ao gestor.` | `Você ainda não tem um centro de custo. Peça a um gestor da frota para definir o seu.` | "Amarrado" é informal e soa como restrição; quem define pode ser gestor ou administrador. | não |
| 35 | `pages/Frota/Relatorios.tsx:155` | `Baixar CSV` (o subtítulo em `components/layout/Header.tsx:37` promete "exportação para o Excel") | `Baixar planilha (CSV)` e subtítulo `... com download em planilha (abre no Excel).` | "CSV" sozinho é técnico; e o título promete "Excel" enquanto o botão fala outra coisa. | não |
| 36 | `pages/Frota/Pessoas.tsx:618` x `pages/Frota/Cadastros.tsx:517` | Em Pessoas: `Sem a validade da CNH, o motorista não consegue reservar.` No cadastro do motorista, "Validade da CNH" é opcional e não avisa nada. | Se a regra vale: avisar também no cadastro (`Sem a validade da CNH, o motorista não consegue reservar.`) ou tornar o campo obrigatório. Se não vale: tirar a frase de Pessoas. | As duas telas dizem coisas diferentes sobre a mesma regra. Conferir a regra no backend antes. | sim |
| 37 | `pages/Frota/Agenda.tsx:466` | Ao salvar a reserva o modal fecha sem nenhuma mensagem (`onSalvo` só recarrega). | Toast: `Reserva feita: {placa}, {janela}.` | Em campo, com sinal ruim, a pessoa não sabe se a reserva entrou. Texto novo, não troca. | sim |
| 38 | `components/frota/ImportarPlanilhaModal.tsx:84` | `Preencha uma planilha com as viagens já feitas e o km sobe sozinho.` | `Traga para o MyCar as saídas já feitas. O km atual de cada veículo é atualizado com a planilha.` | "O km sobe sozinho" é vago e promete mais do que diz; "viagens" (item 22). | sim (item 14) |

## Baixa

| # | Arquivo:linha | Texto atual | Texto sugerido | Por quê | Decisão |
| --- | --- | --- | --- | --- | --- |
| 39 | `components/frota/UsoDetalheModal.tsx:304` | Título `{placa} · {nome}` com a placa crua (também `pages/Frota/Agenda.tsx:70`) | `{formatarPlaca(placa)} · {nome}` | Placa antiga aparece "ABC1234" na Frota e "ABC-1234" nas telas que usam `components/veiculos/Placa.tsx`. | não |
| 40 | `components/frota/CapturaHodometro.tsx:88` | `Não consegui ler o km com segurança. Digite o número.` | `Não deu para ler o km com segurança. Digite o número.` | O app não fala em primeira pessoa do singular (ver Princípios). | não |
| 41 | `components/frota/CapturaHodometro.tsx:96` | `Não consegui ler o visor. Digite o km.` | `Não deu para ler o km na foto. Digite o número.` | Primeira pessoa e "visor" (termo fora do Glossário). | não |
| 42 | `components/frota/RecorteDoVisor.tsx:86` | `alt="Foto do painel para marcar o hodômetro"` | `alt="Foto do hodômetro: arraste para marcar o número do km"` | "Painel" x "hodômetro"; o alt pode dizer o que fazer com a imagem. | não |
| 43 | `components/frota/RecorteDoVisor.tsx:104` | `Ler o km do visor` | `Ler o km marcado` | "Visor" não aparece em outro lugar; o botão age sobre a área que a pessoa marcou. | não |
| 44 | `components/frota/UsoFormModal.tsx:166` | `(definido pelo gestor)` | `(definido pela gestão da frota)` | Um administrador também define; "gestor" pode parecer uma pessoa específica. | não |
| 45 | `components/frota/ImportarPlanilhaModal.tsx:93` | `Clique em Conferir: o sistema avisa as linhas com problema sem gravar nada.` | `Use Conferir para ver as linhas com problema. Nada é gravado nessa etapa.` | "Clique" no celular; "o sistema" é distante. | não |
| 46 | `pages/Frota/Pessoas.tsx:193` | `Aguarde um minuto e tente reenviar de novo.` | `Espere um minuto e tente de novo.` | "Reenviar de novo" é redundante. | não |
| 47 | `pages/Frota/Pessoas.tsx:281` x `pages/Frota/Cadastros.tsx:309` | `Convite enviado: ainda não entrou no sistema.` x `Convite enviado, ainda não entrou` | `Convite enviado. Ainda não entrou.` (nas duas) | O mesmo estado tem pontuação e texto diferentes em duas telas. | não |
| 48 | `pages/Frota/Pessoas.tsx:593` x `pages/Frota/Cadastros.tsx:513` | `Número da CNH` x `CNH (número)` | `Número da CNH` (nas duas) | Mesmo campo, dois rótulos. | não |
| 49 | `pages/Frota/Pessoas.tsx:253` | `Motoristas são cadastrados na aba Motoristas.` | `Para dar acesso a um motorista, use Motoristas e centros > Enviar convite.` | Voz passiva e destino vago: a aba Motoristas fica em outro menu. | não |
| 50 | `components/frota/OcorrenciaModal.tsx:291` | `aria-label="Ver foto de {antes/depois}"` (e `:294` `Remover foto de {antes/depois}`) | `Ver foto de antes do reparo` / `Remover foto de depois do reparo` | O leitor de tela lê o valor interno ("de antes"), que não faz sentido sozinho. O texto visível (`:290`) já diz "Antes do reparo". | não |
| 51 | `components/frota/OcorrenciaModal.tsx:306` | Botão `Foto antes` (e `:309` `Foto depois`) | `Anexar foto de antes` / `Anexar foto de depois` | Botão sem verbo. O `aria-label` do input (`:303`) já tem o verbo. | não |
| 52 | `components/frota/CorrigirKmModal.tsx:44` | `Explique o motivo da correção (mínimo 5 letras). Ele fica registrado no histórico.` | `Conte em poucas palavras por que o km mudou. Fica no histórico, com seu nome.` | "Mínimo 5 letras" soa como regra de sistema; a frase de apoio (`:127`) repete a informação. | não |
| 53 | `pages/Frota/Multas.tsx:315` | `Responsável (opcional, substitui a sugestão)` | Rótulo `Responsável` + dica embaixo: `Opcional. Escolha só se a sugestão estiver errada.` | Rótulo longo com instrução dentro. | não |
| 54 | `pages/Frota/Multas.tsx:266` | `Corrija o valor da multa.` (também `components/frota/DespesaAvulsaModal.tsx:61`) | `Confira o valor da multa (ex.: 195,23).` | "Corrija" soa como bronca e não diz o formato esperado. | não |
| 55 | `pages/Frota/Grupos.tsx:99` | `Exemplo: um grupo “Apoio” ...` (aspas curvas) | `Exemplo: um grupo "Apoio" ...` | O resto do app usa aspas retas (ex.: `Pessoas.tsx:131`). | não |
| 56 | `pages/Frota/ModelosDeChecklist.tsx:82` | Rótulo `Usado na` | `Quando usar` | Rótulo incompleto ("usado na" o quê?). | não |
| 57 | `pages/Frota/ModelosDeChecklist.tsx:185` | `Monte o checklist de cada tipo de carro.` | `Monte o checklist de cada tipo de veículo.` | A frota também tem motos, vans e caminhões. | não |
| 58 | `components/frota/UsoFormModal.tsx:151` | `Selecione o veículo` | `Escolha o veículo` | O resto da Frota usa "Escolha..." (ex.: `Multas.tsx:294`) e o erro do mesmo formulário diz "Escolha o veículo." (`UsoFormModal.tsx:69`). | não |
| 59 | `pages/Frota/Financeiro.tsx:145` | Botão `Categorias` | `Gerenciar categorias` | Botão sem verbo ao lado de "Nova despesa". | não |
| 60 | `components/layout/Header.tsx:14` | Título `Dashboard` (perfil oficina) | `Início` ou `Painel` | Termo em inglês; os outros perfis usam "Início" (`Header.tsx:28`). Fora da Frota. | sim |
| 61 | `pages/Conta/Servicos.tsx:232` | `Nenhum serviço registrado ainda. Clique em “Novo serviço” ...` | `Nenhum serviço registrado ainda. Use "Novo serviço" ...` | "Clique" no celular e aspas curvas. Perfil Pessoa. | não |
| 62 | `components/layout/DespesasModal.tsx:209` | `{n} abastecimento(s) · {litros} L` | `1 abastecimento` / `{n} abastecimentos` | Plural com "(s)" (ver item 32). | não |

## Decisões de produto pendentes

1. **Reserva x uso** (itens 14, 20, 21, 22, 23, 38): recomendação é "reserva"
   para o registro e "uso" só como medida no painel e relatórios.
2. **Chegada x devolução** (itens 12, 15, 16, 17): recomendação é "chegada",
   que já é o nome do botão e do km.
3. **Finalidade x motivo** (itens 13, 18, 19): recomendação é "Finalidade" no
   campo da reserva e "Motivo" só para troca de centro e correção de km.
4. **Excluir x remover** (itens 7 a 10): recomendação é "Excluir" para apagar
   de vez um registro salvo e "Remover" para tirar de uma lista ou formulário.
   É a mudança que mais mexe em testes.
5. **Convite x acesso** (itens 5, 6): recomendação é "Enviar convite" como
   ação e "acesso" só como estado.
6. **Validade da CNH** (item 36): a regra vale para reservar? Se vale, o
   cadastro do motorista precisa dizer.
7. **Aviso de sucesso ao reservar** (item 37): mostrar um toast ou não.
8. **"Dashboard" no perfil oficina** (item 60).
