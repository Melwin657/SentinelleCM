(function(){
  const SAMPLES = {
    fraud: "MTN MoMo : Vous avez remporté 350.000 FCFA à la loterie MTN ! Composez *126*1234# immédiatement pour valider votre gain avant expiration. Offre valable 24h seulement.",
    legit: "Orange Money : Vous avez reçu 5000 FCFA de la part de KAMGA Paul. Nouveau solde : 12 500 FCFA. Merci d'utiliser Orange Money.",
    phishing: "Cher client, votre compte Orange Money sera suspendu dans 24h pour vérification de sécurité. Cliquez ici : bit.ly/om-verif pour éviter le blocage définitif."
  };

  const RULES = [
    { id:'urgence', label:"Urgence artificielle", weight:16,
      patterns:[/imm[ée]diatement/i,/\burgent/i,/24\s?h(eures)?/i,/sans d[ée]lai/i,/avant expiration/i,/valable \d+h/i,/dans les? \d+\s?(heures|minutes)/i],
      explain:"Les fraudeurs créent une pression temporelle pour empêcher toute vérification." },
    { id:'ussd', label:"Demande de composer un code USSD", weight:26,
      patterns:[/composez/i,/\*\d+[\d*]*#/],
      explain:"Aucun service officiel ne demande de composer un code pour « valider » un gain." },
    { id:'gain', label:"Gain ou cadeau non sollicité", weight:20,
      patterns:[/gagn[ée]/i,/remport[ée]/i,/f[ée]licitations?/i,/\bcadeau\b/i,/\bloterie\b/i,/bonus exceptionnel/i,/prime except/i],
      explain:"Une annonce de gain que vous n'avez jamais sollicité est un classique de l'arnaque." },
    { id:'lien', label:"Lien suspect ou raccourci", weight:22,
      patterns:[/bit\.ly/i,/tinyurl/i,/cliquez ici/i,/cliquer ici/i,/lien suivant/i,/lien ci-dessous/i],
      explain:"Les liens raccourcis masquent la véritable destination et sont utilisés pour le phishing." },
    { id:'menace', label:"Menace de suspension ou blocage", weight:19,
      patterns:[/suspendu/i,/bloqu[ée]e?\b/i,/d[ée]sactiv[ée]/i,/fermeture (de|du) compte/i,/compte sera bloqu/i],
      explain:"La menace de blocage pousse à agir dans la panique, sans réfléchir." },
    { id:'code', label:"Demande de code confidentiel", weight:28,
      patterns:[/code secret/i,/code confidentiel/i,/code de confirmation/i,/\bOTP\b/i,/mot de passe/i,/code pin/i],
      explain:"Un code confidentiel ne doit jamais être communiqué, même à un « agent » officiel." },
    { id:'generique', label:"Formule générique impersonnelle", weight:8,
      patterns:[/cher\s?\(?e?\)?\s?client/i],
      explain:"Les opérateurs officiels utilisent en général votre nom, pas une formule générique." },
  ];

  const REASSURING = [
    { patterns:[/nouveau solde/i, /re[çc]u de la part de/i, /merci d.?utiliser/i, /transaction r[ée]ussie/i], weight:18 }
  ];

  function analyze(text){
    let score = 0;
    const triggered = [];
    RULES.forEach(rule=>{
      const hit = rule.patterns.some(p=>p.test(text));
      if(hit){ score += rule.weight; triggered.push(rule); }
    });

    const brandMentioned = /\b(mtn|orange|momo|mobile money|money)\b/i.test(text);
    const strongHit = triggered.some(r=>['ussd','code','lien'].includes(r.id));
    if(brandMentioned && strongHit){
      score += 14;
      triggered.push({ id:'usurpation', label:"Usurpation probable d'un service officiel", weight:14,
        explain:"La marque citée combinée à une demande suspecte est un signe fort d'usurpation d'identité.", patterns:[] });
    }

    let reassure = 0;
    REASSURING.forEach(r=>{ if(r.patterns.some(p=>p.test(text))) reassure += r.weight; });
    score = Math.max(0, score - reassure);
    score = Math.min(100, score);

    return { score, triggered };
  }

  function verdict(score){
    if(score <= 30) return {
      label:"Risque faible", color:"var(--green)",
      sub:"Ce message ne présente pas de signes évidents d'arnaque connue.",
      reco:"<strong>Conseil :</strong> Restez tout de même prudent avec toute demande d'information personnelle, même dans un message qui semble légitime."
    };
    if(score <= 60) return {
      label:"Risque modéré", color:"var(--yellow-deep)",
      sub:"Ce message contient des éléments qui méritent une vérification avant toute action.",
      reco:"<strong>Conseil :</strong> Ne composez aucun code et ne cliquez sur aucun lien. Contactez directement le service officiel via son numéro connu pour vérifier."
    };
    return {
      label:"Risque élevé", color:"var(--red)",
      sub:"Ce message présente plusieurs signes caractéristiques d'une arnaque connue.",
      reco:"<strong>Conseil :</strong> Ne cliquez sur aucun lien, ne composez aucun code, ne partagez aucune information confidentielle. Supprimez ce message et signalez-le."
    };
  }

  const input = document.getElementById('sms-input');
  if(!input) return; // analyzer not present on this page

  const result = document.getElementById('result');
  const gaugeFill = document.getElementById('gauge-fill');
  const gaugeScore = document.getElementById('gauge-score');
  const verdictTitle = document.getElementById('verdict-title');
  const verdictSub = document.getElementById('verdict-sub');
  const flagsList = document.getElementById('flags-list');
  const recommendation = document.getElementById('recommendation');
  const CIRC = 276;

  document.querySelectorAll('.example-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      input.value = SAMPLES[btn.dataset.sample];
      input.focus();
    });
  });

  document.getElementById('clear-btn').addEventListener('click', ()=>{
    input.value = '';
    result.classList.remove('show');
  });

  document.getElementById('analyze-btn').addEventListener('click', ()=>{
    const text = input.value.trim();
    if(!text){ input.focus(); return; }
    const { score, triggered } = analyze(text);
    const v = verdict(score);

    gaugeScore.textContent = score + '%';
    gaugeScore.style.color = v.color;
    const offset = CIRC - (CIRC * score/100);
    gaugeFill.style.stroke = v.color;
    gaugeFill.style.strokeDashoffset = offset;

    verdictTitle.textContent = v.label;
    verdictTitle.style.color = v.color;
    verdictSub.textContent = v.sub;

    flagsList.innerHTML = '';
    if(triggered.length === 0){
      const li = document.createElement('li');
      li.innerHTML = '<span>Aucun signal caractéristique d\'arnaque détecté dans ce texte.</span>';
      flagsList.appendChild(li);
    } else {
      triggered.forEach(rule=>{
        const li = document.createElement('li');
        li.innerHTML = `<svg viewBox="0 0 24 24" fill="none" style="color:${rule.weight>=20?'var(--red)':'var(--yellow-deep)'}"><path d="M12 9v4M12 17h.01M10.3 3.9L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="currentColor" stroke-width="2"/></svg>
          <span><strong>${rule.label}</strong> — ${rule.explain}</span>`;
        flagsList.appendChild(li);
      });
    }

    recommendation.innerHTML = v.reco;
    result.classList.add('show');
    result.scrollIntoView({ behavior:'smooth', block:'nearest' });
  });

  document.getElementById('report-btn').addEventListener('click', ()=>{
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), 3200);
  });
})();
