# Cor principal do MyCar

A cor principal do app (hoje o vermelho `#e22446`) é uma decisão de identidade
e fica num lugar só. Este guia diz onde ela está e o que mudar para trocá-la.

## Onde está

| Lugar | O que tem |
| --- | --- |
| `src/index.css`, bloco "Cor principal do MyCar (decisão de identidade)" | A escala `--marca-50..900`, único lugar com os valores. A escolha padrão de cor (`data-cor="blue"` ou nenhuma) aponta a escala `--color-blue-*` do Tailwind para ela; por isso o app inteiro usa `bg-blue-600`, `text-blue-700` etc. |
| `src/pages/Configuracoes/Configuracoes.tsx` (`CORES`) | A bolinha "MyCar" em Aparência lê `var(--marca-600)`; não precisa mudar. |
| `index.html` | `<meta name="theme-color">` com o valor fixo de `--marca-600` (HTML não lê variável CSS). |
| `public/favicon.svg` | O ícone tem cor própria (hoje `#2563eb`, o azul, diferente da cor principal atual). |
| `src/index.css`, `--font-display` e `font-family` do `:root`; `src/main.tsx` | A fonte (Figtree, via `@fontsource/figtree`). |

As outras cores que o usuário pode escolher (verde, roxo, laranja, vermelho) e a
chave salva (`mycar_cor` no navegador e `cor` na conta, com o valor `"blue"`
para a cor principal) não dependem da marca e não mudam numa troca.

## Para trocar para o azul da landing (`#2563eb`, Figtree)

1. Em `src/index.css`, troque os dez valores `--marca-50..900` por uma escala
   azul com `#2563eb` no 600. Observação: `#2563eb` é o `blue-600` da paleta
   do Tailwind v3; a do Tailwind v4 (a deste projeto) é definida em oklch e não
   é idêntica, então use a escala da landing, não a do Tailwind, se a intenção
   é bater com ela.
2. Em `index.html`, troque `theme-color` para o novo `--marca-600`.
3. Confira `public/favicon.svg` (já é `#2563eb`).
4. A fonte já é Figtree; nada a mudar se a landing também usar Figtree.

## Contrastes a revalidar

Calculados pela fórmula de luminância relativa da WCAG 2 (não é verificação
visual). O mínimo para texto normal é 4,5:1.

| Uso | Atual (vermelho) | Azul `#2563eb` (v3) |
| --- | --- | --- |
| Texto branco sobre a cor principal (600) | 4,59:1 (`#e22446`) | 5,17:1 |
| Cor principal como texto sobre o fundo `#fbfbff` | 4,45:1, abaixo de 4,5 | 5,01:1 |
| Hover (700) com texto branco | 6,17:1 (`#c30b2b`) | 6,70:1 (`#1d4ed8`, v3) |
| Texto 700 sobre fundo 50 (chips, itens ativos) | 5,10:1 | 6,16:1 (`#1d4ed8` sobre `#eff6ff`, v3) |

Revalide também, com a escala final escolhida:

- Anel de foco (`outline` em `--color-blue-600`, no `index.css`) contra o fundo
  claro e contra o fundo escuro do tema escuro (contraste mínimo de 3:1 para
  indicador de foco).
- Os textos `text-blue-*` no tema escuro, que não têm regra própria para a
  escala da marca.
- As telas e e-mails fora deste frontend (landing, Blade, `public/frota`), que
  não leem estas variáveis.
