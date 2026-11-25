# cantus-app
Aplicativo digital de hinário para celular (Android e iPhone) com 516 hinos e cânticos, letras, busca por assunto, cifras e repertório de culto.

## Executar

Sirva a pasta do projeto por HTTP para que o navegador possa carregar `data/hinario.json`. Por exemplo, com Python:

```sh
python3 -m http.server 8000
```

Depois, abra `http://localhost:8000`. A tela inicial permite buscar por número, título ou letra, filtrar por tipo e assunto e salvar favoritos no navegador. Ao selecionar uma música, a rota `#/musica/<numero>` abre sua letra, metadados e controles de tamanho de fonte. A preferência de fonte e os favoritos são salvos no navegador.
