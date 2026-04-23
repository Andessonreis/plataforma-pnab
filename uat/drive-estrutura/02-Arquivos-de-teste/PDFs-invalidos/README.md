# PDFs inválidos para testar rejeição

Arquivos que o sistema **deve rejeitar** com mensagem clara. Cada bolsista que tem tarefa de teste de upload usa um.

## Precisa ter

- `pdf-muito-grande-15MB.pdf` — maior que o limite de 10 MB (T018 — Cauã Gomes)
- `arquivo-fake.pdf` — na verdade um `.exe` ou `.zip` renomeado pra `.pdf` (IDEIAS_ATAQUE item 14)
- `nome-com-caracteres-estranhos @#&%.pdf` — testar sanitização de filename
- `pdf-corrompido.pdf` — PDF com bytes malformados (abre header zerado)

## Como gerar cada um

### PDF grande (15MB)
```
1. Pegue qualquer livro em PDF (geralmente são 5–20MB)
2. OU: junte 30+ imagens em PDF via https://www.ilovepdf.com/pt/jpg_para_pdf
3. OU: no Ghostscript: gs -sDEVICE=pdfwrite -o grande.pdf -r1200 qualquer-input.pdf
```

### Fake .exe renomeado
```bash
# Windows (PowerShell):
Copy-Item C:\Windows\notepad.exe arquivo-fake.pdf

# Mac/Linux:
cp /bin/ls arquivo-fake.pdf
```

### Caracteres estranhos no nome
Só renomeie qualquer PDF válido incluindo `@ # & %` no nome.

### Corrompido
Abra um PDF válido num editor hex e apague os primeiros 100 bytes. Ou use:
```bash
head -c 100 /dev/urandom > pdf-corrompido.pdf
```

---

**Resultado esperado em todos:** sistema rejeita ANTES de fazer upload completo, com mensagem clara (não erro genérico 500).
