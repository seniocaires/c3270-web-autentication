# c3270 Web Authentication

Este projeto permite acessar o terminal c3270 por uma interface web com autenticação por Cookie.

Baseado no projeto c3270 Web https://github.com/seniocaires/c3270-web

Adicionado Middleware de autenticação no Express.

## FAQ
### Como posso testar?

Use o Docker para baixar a imagem e executar um container para testes.

- Baixe a imagem executando o docker pull:
```shell
docker pull seniocaires/c3270-web-authentication
```
- Para iniciar um container da imagem recém baixada:
```shell
docker run --rm -e [Ver variáveis de ambiente abaixo] seniocaires/c3270-web-authentication
```

### Quais parâmetros são necessários (variáveis de ambiente)?
 - USUARIO : Nome do usuário que será criado para executar o c3270.
 - SENHA : Senha do usuário.
 - HOST : Host que o c3270 irá acessar.
 - PORTA : Porta do Host que o c3270 irá acessar.
 - AUTORIZACAO_URL_PERMISSAO : URL do sistema para checar permissão.
 - AUTORIZACAO_URL_PERMISSAO_NEGADA : URL para ser redirecionado em caso de permissão negada.
 - AUTORIZACAO_NOME_TOKEN : Nome Cookie com o Token de acesso.
 - AUTORIZACAO_NOME_HEADER : Nome do Header do Token (ex: Authorization)