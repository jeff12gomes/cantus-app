# cantus-app
Aplicativo digital de hinário para celular (Android e iPhone) com 516 hinos e cânticos, letras, busca por assunto, cifras e repertório de culto.

## Executar

Sirva a pasta do projeto por HTTP para que o navegador possa carregar `data/hinario.json`. Por exemplo, com Python:

```sh
python3 -m http.server 8000
```

Depois, abra `http://localhost:8000`. A tela inicial permite buscar por número, título ou letra, filtrar por tipo e assunto e salvar favoritos no navegador. Ao selecionar uma música, a rota `#/musica/<numero>` abre sua letra, metadados e controles de tamanho de fonte. Favoritos, preferência de fonte e tema (Claro, Escuro ou Alto contraste) são salvos no navegador.

## Instalação e uso offline

O app inclui um manifesto e service worker que armazenam a interface, os ícones e `data/hinario.json` no primeiro acesso. Para produção, publique o conteúdo do repositório no caminho `/cantus-app/` de um site HTTPS (o manifesto usa esse caminho como `start_url` e `scope`). Em desenvolvimento, `localhost` também permite testar a instalação. No Android/Chrome, use **Instalar App** quando o navegador oferecer a instalação. No iPhone/iPad, abra no Safari e use **Compartilhar → Adicionar à Tela de Início**. Depois que o primeiro carregamento e o cache do service worker terminarem, o hinário pode ser aberto sem conexão.
