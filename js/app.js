'use strict';

(() => {
  const WHATS = '5548996949325';
  const whatsLink = (texto) => `https://wa.me/${WHATS}?text=${encodeURIComponent(texto)}`;

  // Todo link com data-whats ganha a mensagem pronta (sem JS, o link abre a conversa sem texto)
  document.querySelectorAll('[data-whats]').forEach((a) => {
    a.href = whatsLink(a.dataset.whats);
  });

  // ─── Menu do celular ────────────────────────────────────────
  const menu = document.getElementById('menu');
  if (menu) {
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { menu.open = false; }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
  }

  // ─── Horário: aberto ou fechado agora (sempre no horário de Maracajá) ─
  // Minutos desde a meia-noite. 0 = domingo ... 6 = sábado
  const TURNOS = {
    0: [],
    1: [[450, 720], [810, 1140]],
    2: [[450, 720], [810, 1140]],
    3: [[450, 720], [810, 1140]],
    4: [[450, 720], [810, 1140]],
    5: [[450, 720], [810, 1140]],
    6: [[450, 720]],
  };
  const NOMES_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const DIAS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const relogio = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const agoraEmMaracaja = () => {
    const partes = relogio.formatToParts(new Date());
    const valor = (tipo) => (partes.find((p) => p.type === tipo) || {}).value;
    const dia = DIAS_EN.indexOf(valor('weekday'));
    const minutos = (Number(valor('hour')) % 24) * 60 + Number(valor('minute'));
    return { dia, minutos };
  };

  const hora = (m) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return min ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`;
  };

  const situacao = ({ dia, minutos }) => {
    const hoje = TURNOS[dia];
    const aberto = hoje.find(([ini, fim]) => minutos >= ini && minutos < fim);
    if (aberto) return { aberto: true, texto: `Aberto agora · fecha às ${hora(aberto[1])}` };

    const proximoHoje = hoje.find(([ini]) => minutos < ini);
    if (proximoHoje) {
      const jaAbriuHoje = hoje.some(([, fim]) => minutos >= fim);
      return {
        aberto: false,
        texto: jaAbriuHoje
          ? `Fechado para o almoço · volta às ${hora(proximoHoje[0])}`
          : `Fechado · abre hoje às ${hora(proximoHoje[0])}`,
      };
    }

    for (let k = 1; k <= 7; k++) {
      const d = (dia + k) % 7;
      if (TURNOS[d].length) {
        const quando = k === 1 ? 'amanhã' : NOMES_DIA[d];
        return { aberto: false, texto: `Fechado · abre ${quando} às ${hora(TURNOS[d][0][0])}` };
      }
    }
    return { aberto: false, texto: 'Fechado' };
  };

  const status = document.getElementById('status');
  const statusTexto = document.getElementById('status-texto');
  const tabela = document.getElementById('horario');

  const atualizarHorario = () => {
    const agora = agoraEmMaracaja();
    if (agora.dia < 0 || Number.isNaN(agora.minutos)) return; // navegador sem suporte: fica só a tabela

    const s = situacao(agora);
    if (status && statusTexto) {
      statusTexto.textContent = s.texto;
      status.dataset.aberto = String(s.aberto);
      status.hidden = false;
    }

    if (tabela) {
      tabela.querySelectorAll('tr[data-dia]').forEach((tr) => {
        const ehHoje = Number(tr.dataset.dia) === agora.dia;
        tr.classList.toggle('hoje', ehHoje);
        const marca = tr.querySelector('.tag-hoje');
        if (ehHoje && !marca) {
          const tag = document.createElement('span');
          tag.className = 'tag-hoje';
          tag.textContent = 'Hoje';
          tr.querySelector('th').append(' ', tag);
          tr.setAttribute('aria-current', 'date');
        } else if (!ehHoje && marca) {
          marca.remove();
          tr.removeAttribute('aria-current');
        }
      });
    }
  };
  atualizarHorario();
  setInterval(atualizarHorario, 60 * 1000);

  // ─── Botão flutuante some enquanto o formulário ou o rodapé estão na tela ─
  const flutuante = document.querySelector('.whats-float');
  if (flutuante && 'IntersectionObserver' in window) {
    const visiveis = new Set();
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => (en.isIntersecting ? visiveis.add(en.target) : visiveis.delete(en.target)));
      flutuante.classList.toggle('is-hidden', visiveis.size > 0);
    });
    document.querySelectorAll('#pedido-form, .footer').forEach((el) => obs.observe(el));
  }

  // ─── Monte seu pedido ───────────────────────────────────────
  const form = document.getElementById('pedido-form');
  if (!form) return;

  const MAX_ITENS = 20;
  const MAX_PRODUTO = 80;
  const QTD_MIN = 1;
  const QTD_MAX = 99;

  const lista = document.getElementById('itens');
  const modelo = document.getElementById('item-tpl');
  const botaoAdd = document.getElementById('add-item');
  const aviso = document.getElementById('items-limit');
  const erro = document.getElementById('form-erro');
  const previa = document.getElementById('previa');

  // Texto livre vira uma linha só, sem caracteres de controle e com tamanho máximo
  const limpar = (s, max) => String(s || '')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

  // Quantidade sempre inteira e dentro do limite, mesmo se digitarem algo estranho
  const lerQtd = (input) => {
    const n = Math.trunc(Number(input.value));
    return Number.isFinite(n) && n >= QTD_MIN ? Math.min(QTD_MAX, n) : QTD_MIN;
  };

  const itens = () => Array.from(lista.querySelectorAll('.item'));

  const renumerar = () => {
    const todos = itens();
    todos.forEach((li, i) => {
      const n = i + 1;
      li.querySelector('.item-label').textContent = `Produto ${n}`;
      li.querySelector('.stepper').setAttribute('aria-label', `Quantidade do item ${n}`);
      li.querySelector('.item-qtd').setAttribute('aria-label', `Quantidade do item ${n}`);
      li.querySelector('.step-menos').setAttribute('aria-label', `Diminuir quantidade do item ${n}`);
      li.querySelector('.step-mais').setAttribute('aria-label', `Aumentar quantidade do item ${n}`);
      li.querySelector('.item-remover').setAttribute('aria-label', `Remover item ${n}`);
    });
    const cheio = todos.length >= MAX_ITENS;
    botaoAdd.disabled = cheio;
    aviso.hidden = !cheio;
  };

  const lerPedido = () => {
    const dados = new FormData(form);
    const produtos = itens()
      .map((li) => ({
        nome: limpar(li.querySelector('.item-produto').value, MAX_PRODUTO),
        qtd: lerQtd(li.querySelector('.item-qtd')),
      }))
      .filter((p) => p.nome);
    return {
      produtos,
      receber: dados.get('receber') === 'quero entrega (combinar pelo WhatsApp)'
        ? 'quero entrega (combinar pelo WhatsApp)'
        : 'retirar na loja',
      nome: limpar(dados.get('nome'), 60),
      obs: limpar(dados.get('obs'), 200),
    };
  };

  const montarMensagem = (p) => {
    const linhas = ['Olá, Agro Farias! Vim pelo site e quero fazer um pedido:', ''];
    p.produtos.forEach((item) => linhas.push(`• ${item.qtd}x ${item.nome}`));
    linhas.push('', `📦 Recebimento: ${p.receber}`);
    if (p.nome) linhas.push(`👤 Nome: ${p.nome}`);
    if (p.obs) linhas.push(`📝 Obs.: ${p.obs}`);
    return linhas.join('\n');
  };

  const atualizarPrevia = () => {
    const p = lerPedido();
    previa.textContent = p.produtos.length
      ? montarMensagem(p)
      : 'Olá, Agro Farias! Vim pelo site e quero fazer um pedido:\n\n(escreva um produto acima para ver a lista aqui)';
  };

  const novoItem = (texto = '') => {
    if (itens().length >= MAX_ITENS) return null;
    const li = modelo.content.firstElementChild.cloneNode(true);
    li.querySelector('.item-produto').value = limpar(texto, MAX_PRODUTO);
    lista.append(li);
    renumerar();
    atualizarPrevia();
    return li;
  };

  botaoAdd.addEventListener('click', () => {
    const li = novoItem();
    if (li) li.querySelector('.item-produto').focus();
  });

  // Botões de cada item (delegação: vale para os itens criados depois)
  lista.addEventListener('click', (e) => {
    const botao = e.target.closest('button');
    if (!botao || !lista.contains(botao)) return;
    const li = botao.closest('.item');
    const qtd = li.querySelector('.item-qtd');

    if (botao.classList.contains('step-menos') || botao.classList.contains('step-mais')) {
      const delta = botao.classList.contains('step-mais') ? 1 : -1;
      qtd.value = Math.min(QTD_MAX, Math.max(QTD_MIN, lerQtd(qtd) + delta));
      atualizarPrevia();
      return;
    }

    if (botao.classList.contains('item-remover')) {
      const todos = itens();
      if (todos.length === 1) {
        li.querySelector('.item-produto').value = '';
        qtd.value = QTD_MIN;
        li.querySelector('.item-produto').focus();
      } else {
        const i = todos.indexOf(li);
        li.remove();
        const restante = itens();
        restante[Math.min(i, restante.length - 1)].querySelector('.item-produto').focus();
      }
      renumerar();
      atualizarPrevia();
    }
  });

  lista.addEventListener('change', (e) => {
    if (e.target.classList.contains('item-qtd')) e.target.value = lerQtd(e.target);
    atualizarPrevia();
  });

  // Enter num produto cria (ou vai para) o próximo item em vez de enviar
  lista.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !e.target.classList.contains('item-produto')) return;
    e.preventDefault();
    const todos = itens();
    const i = todos.indexOf(e.target.closest('.item'));
    const proximo = todos[i + 1] || (limpar(e.target.value, MAX_PRODUTO) ? novoItem() : null);
    if (proximo) proximo.querySelector('.item-produto').focus();
  });

  form.addEventListener('input', atualizarPrevia);
  form.addEventListener('change', atualizarPrevia);

  // Sugestões preenchem o primeiro item vazio ou criam um novo
  document.querySelectorAll('[data-sugestao]').forEach((b) => b.addEventListener('click', () => {
    const vazio = itens().find((li) => !limpar(li.querySelector('.item-produto').value, MAX_PRODUTO));
    if (vazio) {
      vazio.querySelector('.item-produto').value = b.dataset.sugestao;
    } else if (!novoItem(b.dataset.sugestao)) {
      erro.textContent = `O pedido pelo site vai até ${MAX_ITENS} itens.`;
      return;
    }
    erro.textContent = '';
    atualizarPrevia();
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = lerPedido();
    if (!p.produtos.length) {
      erro.textContent = 'Escreva pelo menos um produto para montar o pedido.';
      itens()[0].querySelector('.item-produto').focus();
      return;
    }
    erro.textContent = '';
    window.open(whatsLink(montarMensagem(p)), '_blank', 'noopener');
  });

  renumerar();
  atualizarPrevia();
})();
