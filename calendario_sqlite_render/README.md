# Calendário de Status — PHP + SQLite + Render

Aplicação mensal de calendário em HTML, CSS e JavaScript, com API PHP e armazenamento SQLite. Não precisa de servidor MySQL.

## Arquivos
- `index.html`: interface.
- `style.css`: aparência responsiva.
- `app.js`: navegação, cores e chamadas para a API.
- `api.php`: API PHP; cria a tabela SQLite automaticamente.
- `Dockerfile`: imagem PHP/Apache com extensão PDO SQLite.
- `.dockerignore` e `.gitignore`: excluem arquivos locais e o banco do Git.

## Publicar no Render
1. Envie todos estes arquivos para a raiz do repositório GitHub.
2. No Render, crie `New` → `Web Service` e conecte o repositório.
3. Selecione runtime **Docker** e mantenha `Dockerfile` como caminho.
4. Crie o serviço e faça o deploy.
5. Para manter os dados entre deploys/reinicializações, adicione um **Persistent Disk** ao Web Service:
   - Mount Path: `/var/data`
   - escolha um tamanho disponível no seu plano.
6. Em `Environment`, crie a variável:
   - Key: `SQLITE_PATH`
   - Value: `/var/data/calendario.sqlite`
7. Salve e faça um novo deploy.

**Importante:** sem o Persistent Disk, o banco fica no sistema de arquivos efêmero do contêiner e pode ser perdido em um novo deploy, reinicialização ou substituição da instância. O disco persistente do Render pode exigir um plano pago e normalmente limita o serviço a uma instância.

## Testar localmente
Requer Docker instalado. Na pasta do projeto:

```bash
docker build -t calendario-sqlite .
docker run --rm -p 10000:10000 -e SQLITE_PATH=/var/www/html/data/calendario.sqlite -v "%cd%\\data:/var/www/html/data" calendario-sqlite
```

No PowerShell, a sintaxe de volume pode variar conforme o terminal; se necessário crie a pasta `data` antes de executar.

Abra `http://localhost:10000`.

## Uso
Clique em um dia para alternar vazio → laranja → vermelho → verde → vazio. As marcações coloridas são gravadas no SQLite; o estado vazio remove o registro.
