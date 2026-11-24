/* Dashboard voor AI-advies per leeftijd.
   Werkt op twee manieren:
   - met PHP op de server: opslaan.php schrijft de teksten direct weg;
   - zonder PHP (bijvoorbeeld GitHub Pages): je downloadt de gewijzigde bestanden. */
(function () {
  'use strict';

  var M = window.Model;
  var MAP = '../inhoud/';
  var CONCEPT = 'aila-concept:';
  var $ = function (id) { return document.getElementById(id); };

  var S = {
    modus: null,          // 'server' of 'statisch'
    wachtwoord: '',
    bestanden: {},        // naam -> { origineel, model, soort }
    leeftijden: [], domeinen: []
  };

  /* ---------- Hulpjes ---------- */

  function el(tag, attrs) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'tekst') e.textContent = attrs[k];
      else if (k === 'klasse') e.className = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) e.append(arguments[i]);
    return e;
  }

  var teller = 0;
  /* Een veld met label. soort: 'regel' of 'tekst' */
  function veld(label, waarde, bijWijziging, opties) {
    opties = opties || {};
    var id = 'v' + (++teller);
    var invoer = opties.soort === 'regel'
      ? el('input', { type: 'text', id: id })
      : el('textarea', { id: id, rows: opties.rijen || 4 });
    invoer.value = waarde || '';
    if (opties.leesAlleen) invoer.readOnly = true;
    invoer.addEventListener('input', function () { bijWijziging(invoer.value); });
    var lab = el('label', { for: id, tekst: label });
    if (opties.code) lab.append(' ', el('span', { klasse: 'veld__code', tekst: opties.code }));
    var doos = el('div', { klasse: 'veld' + (opties.breed ? ' breed' : '') }, lab);
    if (opties.uitleg) { var u = el('p', { klasse: 'veld__uitleg', id: id + 'u', tekst: opties.uitleg }); invoer.setAttribute('aria-describedby', u.id); doos.append(u); }
    doos.append(invoer);
    return doos;
  }

  function opslag(actie, sleutel, waarde) {
    try {
      if (actie === 'lees') return localStorage.getItem(sleutel);
      if (actie === 'zet') localStorage.setItem(sleutel, waarde); else localStorage.removeItem(sleutel);
    } catch (e) { /* opslag vol of geblokkeerd: het dashboard werkt dan zonder concepten */ }
    return null;
  }

  /* ---------- Bestanden ---------- */

  function huidig(b) { return b.soort === 'algemeen' ? M.schrijfAlgemeen(b.model) : M.schrijfLeeftijd(b.model); }
  function lees(soort, md) { return soort === 'algemeen' ? M.leesAlgemeen(md) : M.leesLeeftijd(md); }
  function gewijzigd() { return Object.keys(S.bestanden).filter(function (n) { return huidig(S.bestanden[n]) !== S.bestanden[n].origineel; }); }

  function laad(naam) {
    if (S.bestanden[naam]) return Promise.resolve(S.bestanden[naam]);
    return fetch(MAP + naam, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(naam);
      return r.text();
    }).then(function (tekst) {
      var soort = naam === 'algemeen.md' ? 'algemeen' : 'leeftijd';
      var origineel = M.schoon(tekst), concept = opslag('lees', CONCEPT + naam);
      if (concept === origineel) { opslag('wis', CONCEPT + naam); concept = null; }
      S.bestanden[naam] = { soort: soort, origineel: origineel, model: lees(soort, concept || origineel) };
      return S.bestanden[naam];
    });
  }

  /* Na elke wijziging: concept bijwerken en de balk verversen. */
  function gewijzigdBestand(naam) {
    var b = S.bestanden[naam], tekst = huidig(b);
    if (tekst === b.origineel) opslag('wis', CONCEPT + naam); else opslag('zet', CONCEPT + naam, tekst);
    werkBalkBij();
  }

  function werkBalkBij(bericht) {
    var n = gewijzigd();
    $('status').textContent = bericht || (n.length === 0 ? 'Geen wijzigingen.'
      : n.length === 1 ? '1 bestand gewijzigd, nog niet opgeslagen.' : n.length + ' bestanden gewijzigd, nog niet opgeslagen.');
    $('opslaan').disabled = n.length === 0;
    $('herstel').hidden = n.length === 0;
    document.querySelectorAll('.tab .stip').forEach(function (s) { s.remove(); });
    var metStip = {};
    n.forEach(function (naam) { if (naam === 'algemeen.md') { metStip.algemeen = true; metStip.indeling = true; } else metStip.adviezen = true; });
    Object.keys(metStip).forEach(function (t) {
      if (!metStip[t]) return;
      var tab = document.querySelector('.tab[data-tab="' + t + '"]');
      var stip = el('span', { klasse: 'stip' }); stip.append(el('span', { klasse: 'sr', tekst: ' (gewijzigd)' }));
      tab.append(stip);
    });
  }

  /* ---------- Tab: adviezen ---------- */

  function tekenAdvies() {
    var doel = $('advies'), lft = $('b-leeftijd').value, dom = $('b-domein').value;
    doel.replaceChildren(el('p', { klasse: 'hint', tekst: 'Laden…' }));
    var naam = lft + '-jaar.md';
    laad(naam).then(function (b) {
      var blok = b.model.blokken.filter(function (x) { return x.id === dom; })[0];
      if (!blok) { doel.replaceChildren(el('p', { klasse: 'melding', tekst: 'Voor deze combinatie staat nog geen tekst in ' + naam + '.' })); return; }
      var d = M.leesBlok(blok.raw);
      var bewaar = function () { blok.raw = M.maakBlok(d); gewijzigdBestand(naam); };
      var zet = function (sleutel) { return function (v) { d[sleutel] = v; bewaar(); }; };

      function lijst(kop, items, maakLeeg, maakRij, knopTekst) {
        var houder = el('div');
        var teken = function () {
          houder.replaceChildren.apply(houder, items.map(function (item, i) {
            return maakRij(item, i, function () { items.splice(i, 1); bewaar(); teken(); });
          }));
        };
        teken();
        return el('fieldset', {}, el('legend', { tekst: kop }), houder,
          el('button', { type: 'button', klasse: 'klein', tekst: knopTekst, onclick: function () {
            items.push(maakLeeg()); bewaar(); teken();
            var nieuw = houder.lastElementChild.querySelector('input, textarea'); if (nieuw) nieuw.focus();
          } }));
      }

      function stellingen(kop, items, soort) {
        return lijst(kop, items, function () { return { titel: '', tekst: '' }; }, function (item, i, verwijder) {
          return el('div', { klasse: 'kaart kaart--' + soort },
            veld('Stelling ' + (i + 1), item.titel, function (v) { item.titel = v; bewaar(); }, { rijen: 2 }),
            veld('Toelichting', item.tekst, function (v) { item.tekst = v; bewaar(); }, { rijen: 6 }),
            el('button', { type: 'button', klasse: 'klein', tekst: 'Stelling ' + (i + 1) + ' verwijderen', onclick: function () {
              if (confirm('Deze stelling verwijderen?')) verwijder();
            } }));
        }, 'Stelling toevoegen');
      }

      var bronnen = el('details', {}, el('summary', { tekst: 'Bronnen (Verder lezen)' }),
        veld('Bronnen', d.bronnen, zet('bronnen'), { rijen: 12, uitleg: 'Eén bron per alinea, gescheiden door een lege regel.' }));

      doel.replaceChildren(
        el('fieldset', {}, el('legend', { tekst: 'In het kort' }),
          veld('Wat speelt er in deze fase', d.kort, zet('kort'), { rijen: 5 }),
          veld('AI in deze fase', d.ai, zet('ai'), { rijen: 5 })),
        lijst('Aanbevelingen', d.aanbevelingen, function () { return ''; }, function (item, i, verwijder) {
          var v = veld('Aanbeveling ' + (i + 1), item, function (w) { d.aanbevelingen[i] = w; bewaar(); }, { rijen: 3 });
          v.append(el('button', { type: 'button', klasse: 'klein', tekst: 'Aanbeveling ' + (i + 1) + ' verwijderen', onclick: verwijder }));
          return v;
        }, 'Aanbeveling toevoegen'),
        el('fieldset', {}, el('legend', { tekst: 'Ontwikkelingsprocessen en mijlpalen' }),
          veld('Tekst', d.ontwikkeling, zet('ontwikkeling'), { rijen: 14 })),
        stellingen('AI kan hinderen', d.hinderen, 'hinder'),
        stellingen('AI kan helpen', d.helpen, 'help'),
        bronnen
      );
    }).catch(function () {
      doel.replaceChildren(el('p', { klasse: 'melding', tekst: 'Het bestand ' + naam + ' kon niet worden geladen.' }));
    });
  }

  /* ---------- Tab: algemene teksten ---------- */

  function tekenAlgemeen() {
    var a = S.bestanden['algemeen.md'].model;
    var bewaar = function () { gewijzigdBestand('algemeen.md'); };
    var vrij = function (label, woord, rijen, uitleg) {
      var s = M.sectie(a, woord);
      return s ? veld(label, M.tekstVan(s), function (v) { M.zetTekst(s, v); bewaar(); }, { rijen: rijen, uitleg: uitleg }) : null;
    };
    var paren = function (kop, woord, uitleg) {
      var s = M.sectie(a, woord); if (!s) return null;
      var lijst = M.paren(s);
      var set = el('fieldset', {}, el('legend', { tekst: kop }), uitleg ? el('p', { klasse: 'hint', tekst: uitleg }) : null);
      lijst.forEach(function (p) {
        set.append(veld(p.sleutel, p.waarde, function (v) { p.waarde = v; M.zetParen(s, lijst); bewaar(); },
          { soort: p.waarde.length > 70 ? 'tekst' : 'regel', rijen: 3 }));
      });
      return set;
    };
    $('algemeen').replaceChildren.apply($('algemeen'), [
      el('fieldset', {}, el('legend', { tekst: 'Bovenaan de pagina' }),
        vrij('Titel', 'titel', 1), vrij('Inleiding', 'inleiding', 4)),
      el('fieldset', {}, el('legend', { tekst: 'Uitklapteksten onder "Achtergrond"' }),
        vrij('Wat heb je aan deze tool?', 'wat heb je eraan', 10),
        vrij('Over het onderzoek', 'over het onderzoek', 18, 'Elke regel die begint met ### wordt een eigen uitklapje.'),
        vrij('De menselijke lus', 'menselijke lus', 5)),
      paren('Knoppen, koppen en meldingen', 'teksten in de tool', 'De naam boven elk veld is een vaste code voor een plek op de pagina.'),
      paren('Voettekst', 'voettekst')
    ].filter(Boolean));
  }

  function tekenIndeling() {
    var a = S.bestanden['algemeen.md'].model;
    var bewaar = function () { gewijzigdBestand('algemeen.md'); werkKiezerBij(); };
    function tabel(kop, woord, kolommen) {
      var s = M.sectie(a, woord); if (!s) return null;
      var rijen = M.rijen(s);
      var houder = el('div', { klasse: 'tabel' });
      rijen.forEach(function (r) {
        var velden = el('div', { klasse: 'tabel__velden' });
        kolommen.forEach(function (k, i) {
          velden.append(veld(k.label, r[i + 1] || '', function (v) { r[i + 1] = v; M.zetRijen(s, rijen); bewaar(); },
            { soort: k.lang ? 'tekst' : 'regel', rijen: 2, breed: k.lang }));
        });
        var h = el('h4', { tekst: 'Code ' }); h.append(el('span', { klasse: 'veld__code', tekst: r[0] }));
        houder.append(el('div', { klasse: 'tabel__rij' }, h, velden));
      });
      return el('fieldset', {}, el('legend', { tekst: kop }), houder);
    }
    $('indeling').replaceChildren.apply($('indeling'), [
      tabel('Leeftijdsgroepen', 'leeftijdsgroepen', [{ label: 'Leeftijd' }, { label: 'Naam van de fase' }, { label: 'Waar kom je deze groep tegen', lang: true }]),
      tabel('Ontwikkelingsdomeinen', 'ontwikkelingsdomeinen', [{ label: 'Naam' }, { label: 'Groep in de keuzelijst' }, { label: 'Omschrijving', lang: true }])
    ].filter(Boolean));
  }

  function werkKiezerBij() {
    var a = S.bestanden['algemeen.md'].model;
    [['b-leeftijd', 'leeftijdsgroepen'], ['b-domein', 'ontwikkelingsdomeinen']].forEach(function (k) {
      var sel = $(k[0]), oud = sel.value;
      sel.replaceChildren.apply(sel, M.rijen(M.sectie(a, k[1])).map(function (r) { return el('option', { value: r[0], tekst: r[1] || r[0] }); }));
      if (oud) sel.value = oud;
    });
  }

  /* ---------- Opslaan, voorbeeld, herstellen ---------- */

  function download(naam, bytes, type) {
    var url = URL.createObjectURL(new Blob([bytes], { type: type }));
    var a = el('a', { href: url, download: naam }); document.body.append(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function slaOp() {
    var namen = gewijzigd(); if (!namen.length) return;
    if (S.modus === 'statisch') {
      if (namen.length === 1) download(namen[0], huidig(S.bestanden[namen[0]]), 'text/markdown;charset=utf-8');
      else download('inhoud.zip', M.maakZip(namen.map(function (n) { return { naam: 'inhoud/' + n, tekst: huidig(S.bestanden[n]) }; })), 'application/zip');
      werkBalkBij('Gedownload. Zet ' + (namen.length === 1 ? 'het bestand' : 'de bestanden') + ' in de map inhoud van je website (zie Uitleg).');
      return;
    }
    $('opslaan').disabled = true; $('status').textContent = 'Bezig met opslaan…';
    var fouten = [];
    namen.reduce(function (keten, naam) {
      return keten.then(function () {
        var tekst = huidig(S.bestanden[naam]);
        return fetch('opslaan.php', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actie: 'opslaan', wachtwoord: S.wachtwoord, bestand: naam, inhoud: tekst }) })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!j.ok) throw new Error(j.fout || 'onbekende fout');
            S.bestanden[naam].origineel = tekst; opslag('wis', CONCEPT + naam);
          }).catch(function (e) { fouten.push(naam + ': ' + e.message); });
      });
    }, Promise.resolve()).then(function () {
      werkBalkBij(fouten.length ? 'Niet alles is opgeslagen. ' + fouten.join(' ') : 'Opgeslagen. De website toont de nieuwe teksten.');
    });
  }

  function maakOngedaan() {
    if (!confirm('Alle wijzigingen die nog niet zijn opgeslagen gaan verloren. Doorgaan?')) return;
    Object.keys(S.bestanden).forEach(function (naam) {
      var b = S.bestanden[naam]; b.model = lees(b.soort, b.origineel); opslag('wis', CONCEPT + naam);
    });
    werkKiezerBij(); tekenAlgemeen(); tekenIndeling(); tekenAdvies(); werkBalkBij('De wijzigingen zijn ongedaan gemaakt.');
  }

  function toonVoorbeeld() {
    var p = new URLSearchParams({ concept: '1', leeftijd: $('b-leeftijd').value, domein: $('b-domein').value });
    window.open('../?' + p.toString(), '_blank', 'noopener');
  }

  /* ---------- Inloggen en start ---------- */

  function vraagServer(wachtwoord) {
    return fetch('opslaan.php', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actie: 'inloggen', wachtwoord: wachtwoord }) })
      .then(function (r) { return r.text(); })
      .then(function (t) { try { var j = JSON.parse(t); return typeof j.ok === 'boolean' ? j : null; } catch (e) { return null; } })
      .catch(function () { return null; });
  }

  function logIn(wachtwoord) {
    return vraagServer(wachtwoord).then(function (antwoord) {
      if (antwoord) {           // website met PHP: de server controleert het wachtwoord
        if (!antwoord.ok) return false;
        S.modus = 'server'; S.server = antwoord; return true;
      }
      S.modus = 'statisch';     // website zonder PHP
      return wachtwoord === ((window.BEHEER || {}).wachtwoord || '');
    });
  }

  function start() {
    $('inlog').hidden = true; $('dashboard').hidden = false;
    var server = S.modus === 'server';
    $('opslaan').textContent = server ? 'Opslaan' : 'Download wijzigingen';
    $('modus').textContent = server
      ? 'Deze website slaat wijzigingen direct op. Na "Opslaan" ziet iedereen de nieuwe tekst.'
      : 'Deze website kan niet zelf opslaan. Je downloadt de gewijzigde bestanden en zet ze daarna in de map inhoud.';
    $('hulp-opslaan').textContent = server
      ? 'Klik onderaan op "Opslaan". De teksten staan daarna direct op de website. Van elke vorige versie blijft een kopie bewaard in de map beheer/kopieen.'
      : 'Klik onderaan op "Download wijzigingen". Je krijgt het gewijzigde bestand, of een zip als het er meer zijn. Zet de bestanden in de map inhoud van de website en vervang de oude. Op GitHub: open de map inhoud, kies "Add file", dan "Upload files" en bevestig met "Commit changes".';
    $('hulp-wachtwoord').textContent = server
      ? 'Open het bestand beheer/instellingen.php en vervang het wachtwoord tussen de aanhalingstekens.'
      : 'Open het bestand beheer/instellingen.js en vervang het wachtwoord tussen de aanhalingstekens. Let op: op een website zonder PHP is dit wachtwoord een drempel en geen slot. Er kan ook niets stuk, omdat het dashboard hier niets op de website opslaat.';
    $('hulp-herstel').textContent = server
      ? 'In de map beheer/kopieen staat van elk opgeslagen bestand de vorige versie, met datum en tijd in de naam. Zet zo\'n bestand terug in de map inhoud onder de oorspronkelijke naam.'
      : 'Zolang je de gedownloade bestanden niet op de website zet, verandert er niets. Met "Ongedaan maken" begin je opnieuw vanaf de teksten die nu online staan.';
    var w = [];
    if (server && S.server.standaard) w.push('Het standaardwachtwoord is nog in gebruik. Iedereen die het kent, kan de teksten van deze website aanpassen. Wijzig het in beheer/instellingen.php.');
    if (server && !S.server.schrijfbaar) w.push('De map inhoud is niet schrijfbaar, waardoor opslaan niet zal lukken. Vraag je beheerder om schrijfrechten op die map.');
    $('waarschuwing').textContent = w.join(' '); $('waarschuwing').hidden = !w.length;

    laad('algemeen.md').then(function () {
      werkKiezerBij(); tekenAlgemeen(); tekenIndeling();
      /* Concepten van een vorige keer weer inladen */
      var eerder = M.rijen(M.sectie(S.bestanden['algemeen.md'].model, 'leeftijdsgroepen'))
        .map(function (r) { return r[0] + '-jaar.md'; })
        .filter(function (n) { return opslag('lees', CONCEPT + n) !== null; });
      return Promise.all(eerder.map(function (n) { return laad(n).catch(function () {}); }));
    }).then(function () {
      tekenAdvies();
      var n = gewijzigd().length;
      werkBalkBij(n ? 'Je hebt nog wijzigingen van een vorige keer (' + n + (n === 1 ? ' bestand' : ' bestanden') + ').' : null);
    }).catch(function () {
      $('advies').replaceChildren(el('p', { klasse: 'melding', tekst: 'De teksten konden niet worden geladen. Staat de map inhoud naast de map beheer?' }));
    });
  }

  $('inlog-formulier').addEventListener('submit', function (e) {
    e.preventDefault();
    var ww = $('wachtwoord').value;
    $('inlog-melding').textContent = '';
    logIn(ww).then(function (goed) {
      if (!goed) { $('inlog-melding').textContent = 'Het wachtwoord klopt niet.'; $('wachtwoord').select(); return; }
      S.wachtwoord = ww;
      try { sessionStorage.setItem('aila-ww', ww); } catch (e2) { /* niets */ }
      start();
    });
  });

  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.setAttribute('aria-pressed', String(t === tab)); });
      document.querySelectorAll('.paneel').forEach(function (p) { p.hidden = p.id !== 'tab-' + tab.dataset.tab; });
    });
  });
  $('b-leeftijd').addEventListener('change', tekenAdvies);
  $('b-domein').addEventListener('change', tekenAdvies);
  $('opslaan').addEventListener('click', slaOp);
  $('herstel').addEventListener('click', maakOngedaan);
  $('voorbeeld').addEventListener('click', toonVoorbeeld);
  $('uitloggen').addEventListener('click', function () {
    try { sessionStorage.removeItem('aila-ww'); } catch (e) { /* niets */ }
    location.reload();
  });
  window.addEventListener('beforeunload', function (e) {
    if (S.modus === 'server' && gewijzigd().length) { e.preventDefault(); e.returnValue = ''; }
  });

  /* Binnen dezelfde browsersessie hoef je niet opnieuw in te loggen. */
  var bewaard = null;
  try { bewaard = sessionStorage.getItem('aila-ww'); } catch (e) { /* niets */ }
  if (bewaard !== null) logIn(bewaard).then(function (goed) { if (goed) { S.wachtwoord = bewaard; start(); } });
  else $('wachtwoord').focus();
})();
