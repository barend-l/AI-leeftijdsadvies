/* AI-advies per leeftijd
   Alle teksten staan in de map 'inhoud' (Markdown). Dit script leest ze in en toont ze. */
(function () {
  'use strict';

  var MAP = 'inhoud/';
  var $ = function (id) { return document.getElementById(id); };
  var staat = { t: {}, leeftijden: [], domeinen: [], cache: {} };

  /* ---------- Markdown (klein en vergevingsgezind) ---------- */

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function inline(s) {
    var links = [];
    s = esc(s).replace(/\\\*/g, '\u0001');
    s = s.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, function (m, tekst, url) {
      if (!/^(https?:|mailto:|#)/i.test(url)) return tekst;
      links.push('<a href="' + url + '">' + tekst + '</a>');
      return '\u0002' + (links.length - 1) + '\u0003';
    });
    s = s.replace(/\*\*([^*]+(?:\*(?!\*)[^*]+)*)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\u0002(\d+)\u0003/g, function (m, i) { return links[+i]; });
    return s.replace(/\u0001/g, '*');
  }

  function blokken(md) {
    var uit = [], lijst = null, alinea = [];
    function sluitAlinea() { if (alinea.length) { uit.push('<p>' + inline(alinea.join(' ')) + '</p>'); alinea = []; } }
    function sluitLijst() { if (lijst) { uit.push('</' + lijst + '>'); lijst = null; } }
    md.split('\n').forEach(function (regel) {
      var r = regel.trim(), m;
      if (!r) { sluitAlinea(); sluitLijst(); return; }
      if ((m = r.match(/^#{3,4}\s+(.*)$/))) { sluitAlinea(); sluitLijst(); uit.push('<h3>' + inline(m[1]) + '</h3>'); return; }
      if ((m = r.match(/^[-*]\s+(.*)$/))) {
        sluitAlinea(); if (lijst !== 'ul') { sluitLijst(); uit.push('<ul>'); lijst = 'ul'; }
        uit.push('<li>' + inline(m[1]) + '</li>'); return;
      }
      if ((m = r.match(/^\d+[.)]\s+(.*)$/))) {
        sluitAlinea(); if (lijst !== 'ol') { sluitLijst(); uit.push('<ol>'); lijst = 'ol'; }
        uit.push('<li>' + inline(m[1]) + '</li>'); return;
      }
      sluitLijst(); alinea.push(r);
    });
    sluitAlinea(); sluitLijst();
    return uit.join('\n');
  }

  /* Splitst een tekst op koppen van een bepaald niveau: [{kop, tekst}] */
  function secties(md, niveau) {
    var re = new RegExp('^' + '#'.repeat(niveau) + '\\s+(.*)$');
    var uit = [], huidig = null;
    md.split('\n').forEach(function (regel) {
      var m = regel.match(re);
      if (m) { huidig = { kop: m[1].trim(), regels: [] }; uit.push(huidig); }
      else if (huidig) huidig.regels.push(regel);
    });
    uit.forEach(function (s) { s.tekst = s.regels.join('\n').trim(); });
    return uit;
  }

  function punten(md) {
    return md.split('\n').map(function (r) { var m = r.trim().match(/^[-*]\s+(.*)$/); return m ? m[1].trim() : null; })
      .filter(Boolean);
  }

  function zonderPunten(md) {
    return md.split('\n').filter(function (r) { return !/^\s*[-*]\s+/.test(r); }).join('\n').trim();
  }

  function vind(lijst, woord) {
    woord = woord.toLowerCase();
    for (var i = 0; i < lijst.length; i++) if (lijst[i].kop.toLowerCase().indexOf(woord) !== -1) return lijst[i].tekst;
    return '';
  }

  /* ---------- Inlezen ---------- */

  function haal(bestand) {
    return fetch(MAP + bestand, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(bestand + ': ' + r.status);
      return r.text();
    }).then(function (t) { return t.replace(/\r\n?/g, '\n'); });
  }

  function leesAlgemeen(md) {
    var s = secties(md, 2);
    var delen = function (p) { return p.split('|').map(function (x) { return x.trim(); }); };
    staat.titel = zonderPunten(vind(s, 'titel'));
    staat.inleiding = zonderPunten(vind(s, 'inleiding'));
    staat.waarom = vind(s, 'wat heb je eraan');
    staat.leeftijden = punten(vind(s, 'leeftijdsgroepen')).map(function (p) {
      var d = delen(p); return { id: d[0], leeftijd: d[1] || d[0], naam: d[2] || '', context: d[3] || '' };
    });
    staat.domeinen = punten(vind(s, 'ontwikkelingsdomeinen')).map(function (p) {
      var d = delen(p); return { id: d[0], naam: d[1] || d[0], groep: d[2] || '', uitleg: d.slice(3).join(' | ') };
    });
    var t = {};
    punten(vind(s, 'teksten in de tool')).concat(punten(vind(s, 'voettekst'))).forEach(function (p) {
      var i = p.indexOf(':'); if (i > 0) t[p.slice(0, i).trim()] = p.slice(i + 1).trim();
    });
    staat.t = t;
    staat.lus = vind(s, 'menselijke lus');
    staat.onderzoek = vind(s, 'over het onderzoek');
  }

  function leesLeeftijd(md) {
    var uit = {};
    md.split(/^<!--\s*domein:\s*/m).slice(1).forEach(function (stuk) {
      var eind = stuk.indexOf('-->');
      var id = stuk.slice(0, eind).trim().split(/\s/)[0];
      var s = secties(stuk.slice(eind + 3), 2);
      var factoren = [];
      [['hinder', 'hinder'], ['help', 'help']].forEach(function (k) {
        secties(vind(s, 'kan ' + k[0]), 3).forEach(function (f) { factoren.push({ soort: k[1], titel: f.kop, tekst: f.tekst }); });
      });
      uit[id] = {
        kort: vind(s, 'in het kort'),
        ai: vind(s, 'ai in deze fase'),
        aanbevelingen: punten(vind(s, 'aanbevelingen')),
        ontwikkeling: vind(s, 'ontwikkeling in deze fase'),
        factoren: factoren,
        bronnen: vind(s, 'bronnen')
      };
    });
    return uit;
  }

  function laadLeeftijd(id) {
    if (!staat.cache[id]) {
      staat.cache[id] = haal(id + '-jaar.md').then(leesLeeftijd);
      staat.cache[id].catch(function () { delete staat.cache[id]; });
    }
    return staat.cache[id];
  }

  /* ---------- Formulier ---------- */

  function t(sleutel, terugval) { return staat.t[sleutel] || terugval || ''; }

  function optie(waarde, tekst) { var o = document.createElement('option'); o.value = waarde; o.textContent = tekst; return o; }

  function leeftijdLabel(l) { return l.leeftijd + (l.context ? ' · ' + l.context : ''); }

  function vulFormulier() {
    var dom = $('domein'), lft = $('leeftijd');
    dom.replaceChildren(optie('', t('kies-domein', 'kies een ontwikkelingsdomein')));
    var groepen = {};
    staat.domeinen.forEach(function (d) {
      var doel = dom;
      if (d.groep) {
        if (!groepen[d.groep]) { groepen[d.groep] = document.createElement('optgroup'); groepen[d.groep].label = d.groep; dom.appendChild(groepen[d.groep]); }
        doel = groepen[d.groep];
      }
      doel.appendChild(optie(d.id, d.naam));
    });
    lft.replaceChildren(optie('', t('kies-leeftijd', 'kies een leeftijdsgroep')));
    staat.leeftijden.forEach(function (l) { lft.appendChild(optie(l.id, leeftijdLabel(l))); });
  }

  function werkUitlegBij() {
    var d = staat.domeinen.filter(function (x) { return x.id === $('domein').value; })[0];
    $('uitleg-domein').innerHTML = d ? '<strong>' + esc(d.naam) + '.</strong> ' + inline(d.uitleg) : '';
    $('wis').hidden = !($('domein').value || $('leeftijd').value);
  }

  /* ---------- Resultaat ---------- */

  var teller = 0;

  function maakFactor(f) {
    var id = 'factor-' + (++teller);
    var art = document.createElement('div'); art.className = 'factor factor--' + f.soort;
    var h = document.createElement('h4');
    var knop = document.createElement('button');
    knop.type = 'button'; knop.className = 'factor__kop';
    knop.setAttribute('aria-expanded', 'false'); knop.setAttribute('aria-controls', id);
    var etiket = document.createElement('span'); etiket.className = 'etiket etiket--' + f.soort;
    etiket.textContent = f.soort === 'hinder' ? t('etiket-hindert', 'Kan hinderen') : t('etiket-helpt', 'Kan helpen');
    var titel = document.createElement('span'); titel.className = 'factor__titel'; titel.innerHTML = inline(f.titel);
    var teken = document.createElement('span'); teken.className = 'factor__teken'; teken.setAttribute('aria-hidden', 'true');
    knop.append(etiket, titel, teken); h.appendChild(knop);
    var paneel = document.createElement('div'); paneel.className = 'factor__paneel tekst'; paneel.id = id; paneel.hidden = true;
    paneel.innerHTML = blokken(f.tekst);
    knop.addEventListener('click', function () { zetFactor(art, paneel.hidden); werkAllesKnopBij(); });
    art.append(h, paneel);
    return art;
  }

  function zetFactor(art, open) {
    art.querySelector('.factor__paneel').hidden = !open;
    art.querySelector('button').setAttribute('aria-expanded', String(open));
    art.classList.toggle('is-open', open);
  }

  function werkAllesKnopBij() {
    var alle = $('factoren').querySelectorAll('.factor');
    var open = $('factoren').querySelectorAll('.factor.is-open').length;
    var allesOpen = alle.length > 0 && open === alle.length;
    $('alles').textContent = allesOpen ? t('knop-alles-dicht', 'Alles inklappen') : t('knop-alles-open', 'Alles uitklappen');
    $('alles').setAttribute('aria-pressed', String(allesOpen));
  }

  function toon(blokId, zichtbaar) { $(blokId).hidden = !zichtbaar; }

  /* De uitleg staat er alleen zolang er geen advies wordt getoond. */
  function verbergResultaat() { $('resultaat').hidden = true; $('leeg').hidden = false; }

  function toonResultaat(focus) {
    var domId = $('domein').value, lftId = $('leeftijd').value, melding = $('melding');
    if (!domId || !lftId) {
      melding.textContent = t('melding-kies', 'Kies een ontwikkelingsdomein en een leeftijdsgroep.');
      verbergResultaat();
      (domId ? $("leeftijd") : $("domein")).focus();
      return;
    }
    var d = staat.domeinen.filter(function (x) { return x.id === domId; })[0];
    var l = staat.leeftijden.filter(function (x) { return x.id === lftId; })[0];
    melding.textContent = t('melding-laden', 'Het advies wordt geladen…');
    laadLeeftijd(lftId).then(function (cellen) {
      var c = cellen[domId];
      if (!c) { melding.textContent = t('melding-leeg', 'Nog geen advies beschikbaar.'); verbergResultaat(); return; }
      melding.textContent = '';
      $('resultaat-kop').textContent = d.naam + ' · ' + l.leeftijd;
      $('resultaat-sub').textContent = [l.naam, l.context].filter(Boolean).join(' · ');
      $('kort-lead').innerHTML = blokken(c.kort);
      $('kort-ai').innerHTML = blokken(c.ai);
      toon('blok-kort', !!(c.kort || c.ai));
      $('aanbevelingen').replaceChildren.apply($('aanbevelingen'), c.aanbevelingen.map(function (a) {
        var li = document.createElement('li'); li.innerHTML = inline(a); return li;
      }));
      toon('blok-aanbevelingen', c.aanbevelingen.length > 0);
      $('ontwikkeling').innerHTML = blokken(c.ontwikkeling);
      toon('blok-ontwikkeling', !!c.ontwikkeling);
      $('factoren').replaceChildren.apply($('factoren'), c.factoren.map(maakFactor));
      toon('blok-factoren', c.factoren.length > 0);
      werkAllesKnopBij();
      $('bronnen').innerHTML = blokken(c.bronnen);
      $('bronnen-details').open = false;
      var n = $('bronnen').querySelectorAll('p, li').length;
      $('bronnen-aantal').textContent = t('kop-bronnen', 'Verder lezen') + ' (' + n + ')';
      toon('blok-bronnen', !!c.bronnen);
      werkBurenBij(lftId);
      $('resultaat').hidden = false; $('leeg').hidden = true;
      document.title = d.naam + ' · ' + l.leeftijd + ' – ' + staat.titel;
      var p = new URLSearchParams(); p.set('leeftijd', lftId); p.set('domein', domId);
      try { history.replaceState(null, '', '?' + p.toString()); } catch (e) { /* bv. file:// */ }
      if (focus) {
        var rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        $('resultaat-kop').focus({ preventScroll: true });
        $('resultaat').scrollIntoView({ behavior: rustig ? 'auto' : 'smooth', block: 'start' });
      }
    }).catch(function () {
      melding.textContent = t('melding-fout', 'Het advies kon niet worden geladen.');
      verbergResultaat();
    });
  }

  function werkBurenBij(lftId) {
    var i = staat.leeftijden.map(function (x) { return x.id; }).indexOf(lftId);
    [['jonger', i - 1, '← ', ''], ['ouder', i + 1, '', ' →']].forEach(function (k) {
      var l = staat.leeftijden[k[1]], knop = $(k[0]);
      knop.hidden = !l;
      if (l) { knop.textContent = k[2] + t('knop-' + k[0]) + ': ' + l.leeftijd + k[3]; knop.dataset.leeftijd = l.id; }
    });
  }

  function maakUitklap(kop, md) {
    var d = document.createElement('details'); d.className = 'uitklap__item';
    var s = document.createElement('summary'); s.innerHTML = inline(kop);
    var inhoud = document.createElement('div'); inhoud.className = 'tekst'; inhoud.innerHTML = blokken(md);
    d.append(s, inhoud); return d;
  }

  /* ---------- Start ---------- */

  function vulTeksten() {
    document.querySelectorAll('[data-t]').forEach(function (el) {
      var v = staat.t[el.getAttribute('data-t')]; if (v) el.innerHTML = inline(v);
    });
    if (staat.titel) { document.querySelector('[data-tekst="titel"]').textContent = staat.titel; document.title = staat.titel; }
    if (staat.inleiding) document.querySelector('[data-tekst="inleiding"]').innerHTML = inline(staat.inleiding);
    $('waarom').innerHTML = blokken(staat.waarom);
    var uitklap = [];
    if (staat.waarom) uitklap.push(maakUitklap(t('kop-waarom', 'Wat heb je aan deze tool?'), staat.waarom));
    if (staat.onderzoek) secties(staat.onderzoek, 3).forEach(function (x) { uitklap.push(maakUitklap(x.kop, x.tekst)); });
    if (staat.lus) uitklap.push(maakUitklap('De menselijke lus', staat.lus));
    $('uitklap').replaceChildren.apply($('uitklap'), uitklap);
    var v = staat.t;
    if (v['credit-voor']) $('credit-voor').textContent = v['credit-voor'];
    if (v['credit-naam']) $('credit-link').textContent = v['credit-naam'];
    if (v['credit-link']) $('credit-link').href = v['credit-link'];
    if (v['credit-toelichting']) $('credit-toelichting').innerHTML = inline(v['credit-toelichting']);
    if (v['repo-tekst']) $('voet-repo').textContent = v['repo-tekst'];
    if (v['repo-link']) $('voet-repo').href = v['repo-link'];
    if (v['onderzoek-link-tekst']) $('voet-origineel').textContent = v['onderzoek-link-tekst'];
    if (v['onderzoek-link']) $('voet-origineel').href = v['onderzoek-link'];
    if (v['rechten']) $('voet-rechten').textContent = v['rechten'];
  }

  function start() {
    haal('algemeen.md').then(function (md) {
      leesAlgemeen(md); vulTeksten(); vulFormulier();
      var p = new URLSearchParams(location.search);
      if (p.get('domein')) $('domein').value = p.get('domein');
      if (p.get('leeftijd')) $('leeftijd').value = p.get('leeftijd');
      werkUitlegBij();
      if ($('domein').value && $('leeftijd').value) toonResultaat(false);
    }).catch(function () {
      $('melding').textContent = 'De teksten konden niet worden geladen. Open de pagina via een webadres (bijvoorbeeld GitHub Pages) en niet als los bestand.';
    });

    $('keuze').addEventListener('submit', function (e) { e.preventDefault(); toonResultaat(true); });
    ['domein', 'leeftijd'].forEach(function (id) {
      $(id).addEventListener('change', function () {
        $('melding').textContent = ''; werkUitlegBij();
        if ($('domein').value && $('leeftijd').value) toonResultaat(false); else verbergResultaat();
      });
    });
    $('wis').addEventListener('click', function () {
      $('keuze').reset(); werkUitlegBij();
      verbergResultaat(); $('melding').textContent = '';
      document.title = staat.titel || document.title;
      try { history.replaceState(null, '', location.pathname); } catch (e) { /* niets */ }
      $('domein').focus();
    });
    ['jonger', 'ouder'].forEach(function (id) {
      $(id).addEventListener('click', function () { $('leeftijd').value = this.dataset.leeftijd; werkUitlegBij(); toonResultaat(true); });
    });
    $('alles').addEventListener('click', function () {
      var open = this.getAttribute('aria-pressed') !== 'true';
      $('factoren').querySelectorAll('.factor').forEach(function (a) { zetFactor(a, open); });
      werkAllesKnopBij();
    });
    $('afdrukken').addEventListener('click', function () { window.print(); });
    $('kopieer').addEventListener('click', function () {
      var klaar = function () { $('kopieer-status').textContent = t('link-gekopieerd', 'De link staat op het klembord.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(klaar, function () { $('kopieer-status').textContent = location.href; });
      else $('kopieer-status').textContent = location.href;
    });

    /* Bij afdrukken alles uitklappen, daarna de oude toestand herstellen. */
    var voorPrint = [];
    window.addEventListener('beforeprint', function () {
      voorPrint = [];
      $('factoren').querySelectorAll('.factor').forEach(function (a) { voorPrint.push(a.classList.contains('is-open')); zetFactor(a, true); });
      voorPrint.bronnen = $('bronnen-details').open; $('bronnen-details').open = true;
    });
    window.addEventListener('afterprint', function () {
      $('factoren').querySelectorAll('.factor').forEach(function (a, i) { zetFactor(a, !!voorPrint[i]); });
      $('bronnen-details').open = !!voorPrint.bronnen;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
