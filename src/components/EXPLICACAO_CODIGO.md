# Explicação do Projeto — Como tudo se conecta

Este arquivo explica, em detalhes, como o código que você já tinha (`ReportsPage.jsx`)
e o código novo (`NewReportPage.jsx`) funcionam, qual é a teoria React por trás de
cada parte, e como os arquivos "conversam" entre si.

---

## 1. Visão geral da estrutura

```
src/
├── components/
│   ├── PageHeader.jsx       <- cabeçalho reutilizável (título + subtítulo)
│   └── SimulatedPhoto.jsx    <- "foto" colorida usada como placeholder
├── data/
│   └── mockData.js          <- dados falsos (array `reports`)
└── pages/
    ├── ReportsPage.jsx       <- lista de relatos (já existia)
    └── NewReportPage.jsx     <- formulário de novo relato (criado agora)
```

A ideia geral do React é: **cada página é uma função que retorna JSX (HTML
"disfarçado" de JavaScript)**. Essas funções podem usar outras funções
(componentes) dentro de si, passando dados para elas através de **props**.

---

## 2. `PageHeader` (componente compartilhado)

Usado assim nas duas páginas:

```jsx
<PageHeader title="Relatos" subtitle={`${reports.length} relatos da comunidade`} />
<PageHeader title="Novo Relato" subtitle="Conte o que está acontecendo" />
```

**Teoria:** `title` e `subtitle` são *props* — valores que a página "de fora"
passa para o componente. O `PageHeader` provavelmente só renderiza algo como:

```jsx
export default function PageHeader({ title, subtitle }) {
  return (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}
```

Ou seja, ele não sabe nada sobre "relatos" — ele só recebe texto e exibe.
Isso é o princípio de **componentização**: um pedaço de UI que se repete em
várias telas vira um componente único, evitando repetir código.

---

## 3. `SimulatedPhoto` (componente compartilhado)

Usado assim:

```jsx
<SimulatedPhoto color={report.imageColor} label={report.type} />
<SimulatedPhoto color={submitted.color} label={submitted.type} />
```

**Teoria:** recebe uma cor (`color`) e um texto (`label`) e desenha um
quadrado colorido com esse texto dentro — uma "foto fake" enquanto o projeto
não tem upload real de imagens.

No `NewReportPage`, ele só é usado **como reserva**, caso o usuário ainda não
tenha enviado uma foto real na tela de confirmação. Quando o usuário envia
uma foto de verdade, usamos uma `<img>` com a pré-visualização real no lugar
do `SimulatedPhoto`.

---

## 4. `mockData.js`

```js
export const reports = [ ... ]
```

**Teoria:** é só um array de objetos JavaScript exportado. Cada objeto
representa um relato e tem campos como `id`, `type`, `status`, `location`,
`time`, `imageColor`.

`ReportsPage.jsx` importa esse array:

```jsx
import { reports } from '../data/mockData'
```

E depois usa `reports.map(...)` para transformar **cada objeto do array em
um elemento visual na tela**.

> Por enquanto, `NewReportPage.jsx` **não escreve** no `mockData.js`. Ele
> apenas guarda o relato enviado dentro do próprio componente (estado local)
> e mostra uma confirmação. Veja a seção "Próximos passos" para conectar os
> dois de verdade.

---

## 5. `ReportsPage.jsx` — como funciona

### 5.1 `statusConfig`

```jsx
const statusConfig = {
  pendente: { bg: 'bg-risk-yellow/10', text: 'text-risk-yellow', label: 'Pendente' },
  verificado: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Verificado' },
  resolvido: { bg: 'bg-risk-green/10', text: 'text-risk-green', label: 'Resolvido' },
}
```

**Teoria:** isso é um *objeto usado como "tabela de tradução"*. Em vez de
fazer um monte de `if/else` para decidir a cor da etiqueta de status, o
código simplesmente faz:

```jsx
const status = statusConfig[report.status]
// status.bg, status.text, status.label
```

Se `report.status` for `"pendente"`, `status` vira
`{ bg: 'bg-risk-yellow/10', text: 'text-risk-yellow', label: 'Pendente' }`.

### 5.2 O `.map()`

```jsx
{reports.map((report, index) => {
  const status = statusConfig[report.status]
  return (
    <div key={report.id} ... style={{ animationDelay: `${index * 80}ms` }}>
      ...
    </div>
  )
})}
```

**Teoria:** `.map()` é uma função de array do JavaScript que transforma cada
item em outra coisa — aqui, transforma cada `report` em um bloco `<div>`
visual. O React **precisa** de uma prop `key` única (`report.id`) em cada
item gerado por `.map()`, para saber identificar cada elemento na lista caso
ela mude.

O `index * 80ms` é só um efeito visual: cada card aparece com um pequeno
atraso em relação ao anterior, criando uma "cascata" de entrada (classe
`animate-slide-up`).

---

## 6. `NewReportPage.jsx` — como funciona

Esta página tem 3 ideias centrais: **estado (state)**, **formulário
controlado** e **validação antes de enviar**.

### 6.1 Estado (`useState`)

```jsx
const [type, setType] = useState('')
const [location, setLocation] = useState('')
const [description, setDescription] = useState('')
const [photo, setPhoto] = useState(null)
const [photoPreview, setPhotoPreview] = useState(null)
const [errors, setErrors] = useState({})
const [submitted, setSubmitted] = useState(null)
```

**Teoria:** `useState` é um *hook* do React. Ele cria uma "caixinha de
memória" que vive enquanto o componente está na tela. Cada `useState`
retorna dois valores:

1. o **valor atual** (ex: `type`)
2. uma **função para atualizar esse valor** (ex: `setType`)

Sempre que você chama `setType('buraco')`, o React:
- guarda o novo valor,
- e **re-renderiza** o componente (executa a função de novo), para que a
  tela mostre o valor atualizado.

| Estado | Para que serve |
|---|---|
| `type` | guarda o tipo de ocorrência escolhido no `<select>` |
| `location` | texto digitado no campo de localização (opcional) |
| `description` | texto digitado na descrição |
| `photo` | o arquivo de imagem (objeto `File`) selecionado |
| `photoPreview` | a imagem convertida em base64, para mostrar `<img>` |
| `errors` | objeto com as mensagens de erro de cada campo |
| `submitted` | quando não é `null`, mostra a tela de "relato enviado" |

### 6.2 Campos controlados

```jsx
<select value={type} onChange={(e) => setType(e.target.value)}>
```

```jsx
<textarea value={description} onChange={(e) => setDescription(e.target.value)} />
```

**Teoria:** isso é o padrão de **"componente controlado"**. O valor exibido
no campo (`value={type}`) vem **sempre** do estado React — não do navegador.
Quando o usuário digita/seleciona algo, o evento `onChange` dispara,
chamamos `setType(...)` ou `setDescription(...)`, o estado muda, e o React
redesenha o campo com o novo valor. Isso garante que **o estado é a única
fonte de verdade** sobre o que está no formulário.

### 6.3 Upload e pré-visualização da foto

```jsx
function handlePhotoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  setPhoto(file)

  const reader = new FileReader()
  reader.onload = () => setPhotoPreview(reader.result)
  reader.readAsDataURL(file)
}
```

**Teoria:**
- `e.target.files[0]` é o arquivo que o usuário escolheu no `<input
  type="file">`.
- `FileReader` é uma API do navegador (não é do React) que lê arquivos.
- `readAsDataURL(file)` converte a imagem para uma string base64
  (`data:image/png;base64,...`), que pode ser usada diretamente como `src`
  de uma `<img>`.
- Quando a leitura termina (`onload`), guardamos esse resultado em
  `photoPreview`, e o React mostra a imagem na tela.

O `<input type="file">` em si fica **escondido** (`className="hidden"`) e é
ativado clicando em um `<label htmlFor="photo">`, que é uma técnica comum
para customizar visualmente botões de upload — clicar na label "ativa" o
input.

### 6.4 Validação

```jsx
function validate() {
  const newErrors = {}

  if (!type) newErrors.type = 'Selecione o tipo de ocorrência.'
  if (!photo) newErrors.photo = 'Envie uma foto do local.'

  const descLength = description.trim().length
  if (descLength < MIN_DESCRIPTION_LENGTH) {
    newErrors.description = `A descrição precisa ter pelo menos ${MIN_DESCRIPTION_LENGTH} caracteres (${descLength}/${MIN_DESCRIPTION_LENGTH}).`
  }

  return newErrors
}
```

**Teoria:** essa função não muda nenhum estado — ela só **lê** os estados
atuais e devolve um objeto descrevendo os problemas encontrados. Se o objeto
voltar vazio (`{}`), significa que está tudo certo.

```jsx
function handleSubmit(e) {
  e.preventDefault()

  const newErrors = validate()
  setErrors(newErrors)

  if (Object.keys(newErrors).length > 0) return
  // ... segue para criar o "submitted"
}
```

- `e.preventDefault()` impede o comportamento padrão do `<form>` (que seria
  recarregar a página).
- `Object.keys(newErrors).length > 0` verifica se existe pelo menos uma
  chave (erro) no objeto. Se sim, **paramos aqui** e os erros aparecem na
  tela (porque `setErrors` foi chamado e o React redesenha os campos com a
  borda vermelha + mensagem).

### 6.5 Renderização condicional

```jsx
{submitted ? (
  // tela de confirmação
) : (
  // formulário
)}
```

**Teoria:** isso é um operador ternário (`condição ? A : B`) usado dentro do
JSX. Enquanto `submitted` for `null`, mostramos o formulário. Depois que o
usuário envia com sucesso, `submitted` recebe um objeto e a tela muda
inteiramente para a confirmação — sem precisar de rotas/navegação.

### 6.6 Contador de caracteres em tempo real

```jsx
const descLength = description.trim().length
const descOk = descLength >= MIN_DESCRIPTION_LENGTH
```

```jsx
<span className={descOk ? 'text-risk-green' : 'text-slate-400'}>
  {descLength}/{MIN_DESCRIPTION_LENGTH} caracteres mínimos
</span>
```

A cada tecla digitada, `description` muda → o componente re-renderiza →
`descLength` e `descOk` são recalculados → a cor do contador muda
automaticamente de cinza para verde quando o usuário atinge 100 caracteres.

---

## 7. Sobre as classes Tailwind usadas

A maioria das classes (`card`, `card-hover`, `btn-primary`, `page-container`,
`animate-fade-in`, `animate-slide-up`, `text-risk-green`, `bg-risk-yellow/10`,
`text-primary-700`...) **não são classes nativas do Tailwind** — elas vêm de
um **design system customizado**, provavelmente definido no
`tailwind.config.js` (cores `risk-yellow`, `risk-green`, `primary-*`) e em um
CSS global (`card`, `btn-primary`, `page-container`, animações).

⚠️ **Atenção:** o `NewReportPage.jsx` usa também `risk-red` (para erros de
validação: `border-risk-red`, `text-risk-red`). Se essa cor **ainda não
existir** no seu `tailwind.config.js`, adicione algo como:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'risk-red': '#ef4444', // ou a tonalidade que preferir
      // risk-yellow, risk-green, primary-* já devem existir
    }
  }
}
```

Se preferir não adicionar uma cor nova, posso trocar `risk-red` por uma cor
que já exista no seu projeto — só me avise qual.

---

## 8. Como os arquivos se comunicam (resumo do fluxo)

```
mockData.js ──(export reports)──▶ ReportsPage.jsx ──(usa)──▶ PageHeader, SimulatedPhoto

NewReportPage.jsx ──(usa)──▶ PageHeader, SimulatedPhoto
                    ──(estado interno)──▶ tela de confirmação
```

- `PageHeader` e `SimulatedPhoto` são **"burros"** (não sabem nada do
  domínio do app) — apenas recebem props e desenham algo. Por isso podem ser
  reutilizados em qualquer página.
- `ReportsPage` é **"esperto"**: importa dados prontos (`mockData`) e decide
  como exibi-los.
- `NewReportPage` também é **"esperto"**, mas em vez de importar dados, ele
  **cria** dados a partir da interação do usuário (estado local) e os exibe
  ao final.

---

## 9. Próximos passos sugeridos (não implementados ainda)

1. **Roteamento:** adicionar `NewReportPage` ao seu sistema de rotas (ex:
   `react-router-dom`), com um link/botão na `ReportsPage` (algo como o botão
   "Enviar Novo Relato" que já existe lá) navegando para `/novo-relato`.

2. **Conectar com `mockData`:** hoje, `reports` é um array estático
   importado. Para o relato novo aparecer na lista de `ReportsPage`, seria
   necessário "subir" esse array para um estado compartilhado (Context API,
   ou um estado no componente pai que englobe as duas páginas), e usar
   `setReports([...reports, novoRelato])` ao enviar o formulário.

3. **Persistência real:** atualmente nada é salvo de fato (recarregar a
   página perde os dados). Para persistir, seria necessário `localStorage`
   ou uma API/backend.

Se quiser, posso implementar qualquer um desses passos — é só avisar como o
seu projeto está organizado (se já usa rotas, Context, etc.) que eu adapto o
código.
