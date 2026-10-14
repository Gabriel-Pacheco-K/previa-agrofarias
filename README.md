# Comercial Agro Farias: prévia do site

Prévia de site para a Comercial Agro Farias (Vila Beatriz, Maracajá/SC), com os departamentos da loja, uma lista de pedido que chega pronta no WhatsApp, destaques das prateleiras, os eventos da loja e o horário com aviso de aberto ou fechado em tempo real.

Site estático em HTML, CSS e JavaScript puro, publicado no GitHub Pages por GitHub Actions.

## Segurança

- **Content Security Policy** restritiva: só roda o JavaScript do próprio site, sem scripts inline nem de terceiros.
- **Entrada tratada:** o pedido vai até 20 itens, a quantidade é limitada de 1 a 99 e os textos livres têm tamanho máximo e viram uma linha só antes de ir para a mensagem. Tudo que aparece na tela é escrito como texto, nunca como HTML.
- **Sem dados guardados pelo site:** sem cadastro, sem cookies próprios e sem rastreadores; o pedido vai direto para o WhatsApp. As fontes (Google Fonts) e o mapa (Google Maps) são carregados do Google.
- **Links externos isolados** (`noopener noreferrer`) e mapa em `iframe` com `sandbox`.
- **Fora dos buscadores** (`noindex`) enquanto for prévia.

---

Desenvolvido por [Gabriel Pacheco Kiesel](https://gabriel-pacheco-k.github.io).
