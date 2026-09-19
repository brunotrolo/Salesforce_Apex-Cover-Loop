# Karpathy Guidelines — aplicadas a um loop autônomo de cobertura

Diretrizes comportamentais para reduzir erros comuns de LLM em código, derivadas das
[observações de Andrej Karpathy](https://x.com/karpathy/status/2015883857489522876) sobre
armadilhas de LLM em programação.

Origem: [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)
(MIT). As quatro seções abaixo estão **na íntegra**, em tradução fiel; cada uma traz depois
um bloco `Neste projeto` que contextualiza a diretriz para um loop que escreve testes Apex
contra uma org real. A contextualização acrescenta, nunca substitui nem relaxa a orientação
original.

`references/loop-rules.md` continua sendo a **fonte única** das regras de negócio do loop
(meta, portões, travas). Estas diretrizes são comportamentais e transversais: valem para
como o agente decide, não para qual é a régua.

**Tradeoff:** estas diretrizes privilegiam cautela sobre velocidade. Para tarefas triviais, use bom senso.

---

## 1. Pense Antes de Codar

**Não presuma. Não esconda confusão. Exponha tradeoffs.**

Antes de implementar:
- Declare suas premissas explicitamente. Se estiver incerto, pergunte.
- Se existem múltiplas interpretações, apresente-as — não escolha silenciosamente.
- Se existe uma abordagem mais simples, diga. Discorde quando for o caso.
- Se algo está obscuro, pare. Nomeie o que está confuso. Pergunte.

> **Neste projeto.** Um loop autônomo tem uma tentação específica: quando não entende o
> que a classe de produção faz, ele escreve um teste que **executa** as linhas sem provar
> comportamento nenhum. Isso não é um teste incerto — é um teste que finge certeza.
>
> Antes de escrever o primeiro método: se o comportamento esperado de um ramo não está
> claro no código (uma exceção engolida, um retorno que depende de config que não existe
> no ambiente, uma regra de negócio implícita num campo), isso é uma **pergunta**, não um
> palpite a codificar num `Assert`. E vale o inverso, que o `loop-rules.md` já fixa: se os
> 99% parecem inatingíveis por motivo legítimo, o loop **para e apresenta opções ao
> humano** — nunca abaixa o piso por conta própria, e nunca inventa um motivo para
> justificar o número que conseguiu.

---

## 2. Simplicidade Primeiro

**O mínimo de código que resolve o problema. Nada especulativo.**

- Nenhuma funcionalidade além do que foi pedido.
- Nenhuma abstração para código de uso único.
- Nenhuma "flexibilidade" ou "configurabilidade" que não foi solicitada.
- Nenhum tratamento de erro para cenários impossíveis.
- Se você escreveu 200 linhas e dava para fazer em 50, reescreva.

Pergunte a si mesmo: "Um engenheiro sênior diria que isto está complicado demais?" Se sim, simplifique.

> **Neste projeto.** Vale para o teste que você escreve. Um `TestDataFactory` elaborado
> para uma classe utilitária sem DML, um `StubProvider` onde um mock simples resolve, um
> `@TestSetup` que cria hierarquia inteira quando o método toca um registro — cada um
> desses é código que alguém vai manter para sempre em troca de cobertura que um teste
> menor daria igual.
>
> O corolário do `loop-rules.md`: no MVP padrão, guardas de portabilidade (`isEmpty()`,
> try/catch de config) são táticas aceitas — não pretexto para construir um framework.
> `--rigoroso` é opt-in do usuário, não um padrão de qualidade que você eleva sozinho
> porque acha melhor.

---

## 3. Mudanças Cirúrgicas

**Toque apenas no que precisa. Limpe apenas a sua própria bagunça.**

Ao editar código existente:
- Não "melhore" código adjacente, comentários ou formatação.
- Não refatore coisas que não estão quebradas.
- Siga o estilo existente, mesmo que você fizesse diferente.
- Se notar código morto não relacionado, mencione — não apague.

Quando suas mudanças criam órfãos:
- Remova imports/variáveis/funções que **as suas** mudanças tornaram inúteis.
- Não remova código morto pré-existente a menos que peçam.

O teste: toda linha alterada deve ser rastreável diretamente ao pedido do usuário.

> **Neste projeto.** Esta é a diretriz de maior risco aqui, porque o loop tem um atalho
> óbvio e destrutivo: **mexer na classe de produção para facilitar a cobertura.** Trocar um
> `private` por `@TestVisible`, extrair um método só para testá-lo, remover um ramo que não
> dá para cobrir — tudo isso sobe o número e altera o código que já está em produção, que
> ninguém pediu para mudar e que ninguém revisou para essa finalidade.
>
> A regra operacional que o projeto já aplica é esta diretriz em forma executável:
> **preservar produção, deployar apenas teste.** Classe de produção intocada; o que vai
> para a org é a classe de teste. Se a classe é genuinamente intestável sem mudança de
> produção, isso é um achado a reportar ao humano — com a mudança proposta — nunca uma
> edição silenciosa no meio do loop.

---

## 4. Execução Orientada a Objetivo

**Defina critérios de sucesso. Itere até verificar.**

Transforme tarefas em objetivos verificáveis:
- "Adicione validação" → "Escreva testes para entradas inválidas, depois faça-os passar"
- "Corrija o bug" → "Escreva um teste que o reproduz, depois faça-o passar"
- "Refatore X" → "Garanta que os testes passam antes e depois"

Para tarefas multi-etapa, declare um plano breve:
```
1. [Passo] → verificar: [checagem]
2. [Passo] → verificar: [checagem]
3. [Passo] → verificar: [checagem]
```

Critérios de sucesso fortes permitem iterar de forma independente. Critérios fracos
("faça funcionar") exigem esclarecimento constante.

> **Neste projeto.** O loop inteiro é esta diretriz, e os dois portões objetivos
> (cobertura real ≥99% com todos passando; `deployWouldSucceed=true`) são exatamente os
> "critérios fortes que permitem iterar de forma independente" — é por isso que o loop
> consegue rodar sozinho.
>
> Mas aqui mora a armadilha mais perigosa de todas, e ela é o avesso da diretriz:
> **cobertura é um critério forte de execução e um critério fraco de qualidade.** Um teste
> sem asserts executa as linhas, o número bate 99%, os dois portões passam — e nada foi
> provado. É um critério fraco vestido de forte, com um dashboard verde por cima.
>
> Por isso: o número satisfaz o portão, não o objetivo. Todo método de teste existe para
> provar um comportamento; se você não consegue nomear qual comportamento um método prova,
> ele é preenchimento de cobertura e precisa ser reescrito ou removido — mesmo que o
> removê-lo derrube a porcentagem. E `ABANDON: <motivo>` é uma saída legítima; declarar
> `concluido` sem a evidência dos dois portões não é.

---

*Diretrizes derivadas de observações de Andrej Karpathy, via
[multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills),
licença MIT. Os blocos `Neste projeto` são contextualização própria deste repositório.*
