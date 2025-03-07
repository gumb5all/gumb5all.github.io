const sanitizarNome = (nome) => nome.replace(/[<>]/g, (c) => ({ '<': '&lt;', '>': '&gt;' }[c]));

let nomes = JSON.parse(localStorage.getItem("nomes")) || [];

document.addEventListener("DOMContentLoaded", () => {
    atualizarLista();
    verificarBotaoAdicionar();
    
    document.getElementById("amigo").addEventListener("input", verificarBotaoAdicionar);
    document.getElementById("adicionarAmigo").addEventListener("click", adicionarAmigo);
    document.getElementById("sortearAmigo").addEventListener("click", sortearAmigo);
    document.getElementById("copiarResultado").addEventListener("click", copiarResultado);
    document.getElementById("resetarTudo").addEventListener("click", resetarTudo);
});

document.getElementById("amigo").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); 
        document.getElementById("adicionarAmigo").click(); 
    }})

function adicionarAmigo() {
    const input = document.getElementById("amigo");
    const nome = input.value.trim();

    const erro = validarNome(nome);
    if (erro) {
        mostrarMensagem(erro, "erro");
        return;
    }

    if (nomes.some(p => p.toLowerCase() === nome.toLowerCase())) {
        mostrarMensagem("Este nome já foi adicionado!", "erro");
        limparCampo();
        return;
    }

    nomes.push(nome);
    salvarLista();
    atualizarLista();
    limparCampo();
}

function validarNome(nome) {
    if (nome.length < 2) return "Nome muito curto (mínimo 2 letras)";
    if (!/^[\p{L}]+(?: [\p{L}]+)*$/u.test(nome)) return "Caracteres inválidos no nome";
    return null;
}

function removerAmigo(index) {
    nomes.splice(index, 1);
    salvarLista();
    atualizarLista();
}

function atualizarLista() {
    const lista = document.getElementById("listaAmigos");
    lista.innerHTML = nomes.length 
        ? nomes.map((nome, i) => `
            <li>
                <span>${sanitizarNome(nome)}</span>
                <button aria-label="Remover ${nome}" class="remover" data-index="${i}">❌</button>
            </li>
        `).join('')
        : '<li class="lista-vazia">Adicione participantes</li>';

    document.getElementById("contador").textContent = nomes.length;

    document.querySelectorAll(".remover").forEach(btn => {
        btn.addEventListener("click", () => removerAmigo(btn.dataset.index));
    });
}

function salvarLista() {
    try {
        if (JSON.stringify(nomes).length > 5000) {
            throw new Error("Espaço no armazenamento local esgotado!");
        }
        localStorage.setItem("nomes", JSON.stringify(nomes));
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        mostrarMensagem("Erro ao salvar! Limpe o histórico ou use modo privado.", "erro");
    }
}

function limparCampo() {
    const input = document.getElementById("amigo");
    input.value = "";
    verificarBotaoAdicionar();
}

function verificarBotaoAdicionar() {
    const input = document.getElementById("amigo");
    document.getElementById("adicionarAmigo").disabled = !input.value.trim();
}

function importarNomes() {
    const texto = prompt("Cole os nomes separados por vírgula ou quebra de linha:");
    if (!texto) return;

    const novosNomes = texto.split(/[\n,]/)
        .map(nome => nome.trim())
        .filter(nome => nome && !nomes.some(n => n.toLowerCase() === nome.toLowerCase()));

    if (novosNomes.length === 0) {
        mostrarMensagem("Nenhum nome novo adicionado.", "erro");
        return;
    }

    nomes.push(...novosNomes);
    salvarLista();
    atualizarLista();
    mostrarMensagem(`${novosNomes.length} nomes adicionados!`);
}

function copiarResultado() {
    const resultado = document.querySelectorAll('#resultado li');
    
    if (resultado.length === 0) {
        mostrarMensagem("Nada para copiar!", "erro");
        return;
    }

    const texto = [...resultado].map(li => li.textContent).join('\n');

    if (!navigator.clipboard) {
        mostrarMensagem("Seu navegador não suporta a cópia automática!", "erro");
        return;
    }

    navigator.clipboard.writeText(texto)
        .then(() => {
            mostrarMensagem("Resultado copiado!");
        })
        .catch((err) => {
            console.error("Erro ao copiar:", err);
            mostrarMensagem("Erro ao copiar!", "erro");
        });
}

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

const validarSorteio = (original, sorteado) => 
    original.every((_, i) => original[i] !== sorteado[i]);

function sortearAmigo() {
    const MINIMO = 2;
    const MAX_TENTATIVAS = 1000;
    
    if (nomes.length < MINIMO) {
        mostrarMensagem(`Adicione pelo menos ${MINIMO} participantes!`, "erro");
        return;
    }

    let tentativas = 0;
    let sorteio;
    
    do {
        sorteio = [...nomes];
        shuffleArray(sorteio);
        tentativas++;
    } while (tentativas < MAX_TENTATIVAS && !validarSorteio(nomes, sorteio));

    if (tentativas >= MAX_TENTATIVAS) {
        mostrarMensagem("Não foi possível gerar um sorteio válido", "erro");
        return;
    }

    exibirResultado(sorteio);
}

function exibirResultado(sorteio) {
    const resultado = document.getElementById("resultado");
    resultado.innerHTML = nomes.map((nome, i) => `
        <li>${sanitizarNome(nome)} → ${sanitizarNome(sorteio[i])}</li>
    `).join('');
}

function mostrarMensagem(texto, tipo = 'sucesso', tempo = 3000) {
    const div = document.createElement('div');
    div.className = `mensagem-flutuante ${tipo}`;
    div.textContent = texto;
    document.body.appendChild(div);
    
    setTimeout(() => div.remove(), tempo);
}

function resetarTudo() {
    if (confirm("Isso apagará todos os dados. Continuar?")) {
        nomes = [];
        localStorage.clear();
        atualizarLista();
        document.getElementById("resultado").innerHTML = "";
    }
}
