/* Beheer – lezen en schrijven van de tekstbestanden in de map 'inhoud'.
   Alleen wat in het dashboard wordt aangepast, wordt opnieuw opgebouwd.
   De rest van een bestand blijft letterlijk gelijk. */
(function (root) {
  'use strict';

  function schoon(md) { return String(md).replace(/\r\n?/g, '\n'); }
  function eenRegel(s) { return String(s || '').replace(/\s*\n\s*/g, ' ').trim(); }

  /* [{kop, tekst}] voor koppen van een bepaald niveau */
  function secties(md, niveau) {
    var re = new RegExp('^' + '#'.repeat(niveau) + '\\s+(.*)$');
    var uit = [], huidig = null;
    md.split('\n').forEach(function (regel) {
      var m = regel.match(re);
      if (m) { huidig = { kop: m[1].trim(), regels: [] }; uit.push(huidig); }
      else if (huidig) huidig.regels.push(regel);
    });
    uit.forEach(function (s) { s.tekst = s.regels.join('\n').trim(); delete s.regels; });
    return uit;
  }

  function vind(lijst, woord) {
    woord = woord.toLowerCase();
    for (var i = 0; i < lijst.length; i++) if (lijst[i].kop.toLowerCase().indexOf(woord) !== -1) return lijst[i];
    return null;
  }

  function punten(md) {
    return md.split('\n').map(function (r) { var m = r.trim().match(/^[-*]\s+(.*)$/); return m ? m[1].trim() : null; }).filter(Boolean);
  }

  /* ---------- Leeftijdsbestanden ---------- */

  function leesLeeftijd(md) {
    var delen = schoon(md).split(/^(?=<!--\s*domein:)/m);
    var pre = /^<!--\s*domein:/.test(delen[0]) ? '' : delen.shift();
    return {
      pre: pre,
      blokken: delen.map(function (raw) {
        return { id: (raw.match(/^<!--\s*domein:\s*([^\s]+)/) || [])[1] || '', raw: raw };
      })
    };
  }

  function schrijfLeeftijd(b) { return b.pre + b.blokken.map(function (x) { return x.raw; }).join(''); }

  function leesBlok(raw) {
    var regels = raw.split('\n');
    var s = secties(raw, 2);
    var tekst = function (w) { var x = vind(s, w); return x ? x.tekst : ''; };
    var stellingen = function (w) {
      return secties(tekst(w), 3).map(function (f) { return { titel: f.kop, tekst: f.tekst }; });
    };
    return {
      marker: regels[0],
      h1: regels.filter(function (r) { return /^#\s+/.test(r); })[0] || '',
      kort: tekst('in het kort'),
      ai: tekst('ai in deze fase'),
      aanbevelingen: punten(tekst('aanbevelingen')),
      eigen: tekst('eigen aanvulling'),
      ontwikkeling: tekst('ontwikkeling in deze fase'),
      hinderen: stellingen('kan hinder'),
      helpen: stellingen('kan help'),
      bronnen: tekst('bronnen')
    };
  }

  function maakBlok(b) {
    var uit = [b.marker];
    if (b.h1) uit.push(b.h1);
    var deel = function (kop, tekst) { uit.push('', '## ' + kop, ''); if (String(tekst).trim()) uit.push(String(tekst).trim()); };
    var stellingen = function (kop, lijst) {
      uit.push('', '## ' + kop);
      lijst.forEach(function (f) {
        if (!eenRegel(f.titel) && !String(f.tekst).trim()) return;
        uit.push('', '### ' + eenRegel(f.titel), '');
        if (String(f.tekst).trim()) uit.push(String(f.tekst).trim());
      });
    };
    deel('In het kort', b.kort);
    deel('AI in deze fase', b.ai);
    deel('Aanbevelingen', b.aanbevelingen.map(eenRegel).filter(Boolean).map(function (a) { return '- ' + a; }).join('\n'));
    if (String(b.eigen || '').trim()) deel('Eigen aanvulling', b.eigen);
    deel('Ontwikkeling in deze fase', b.ontwikkeling);
    stellingen('AI kan hinderen', b.hinderen);
    stellingen('AI kan helpen', b.helpen);
    deel('Bronnen', b.bronnen);
    return uit.join('\n') + '\n\n\n';
  }

  /* ---------- algemeen.md ---------- */

  function leesAlgemeen(md) {
    var delen = schoon(md).split(/^(?=## )/m);
    var pre = /^## /.test(delen[0]) ? '' : delen.shift();
    return {
      pre: pre,
      secties: delen.map(function (d) {
        var i = d.indexOf('\n'); if (i === -1) i = d.length;
        return { kop: d.slice(3, i).trim(), body: d.slice(i + 1) };
      })
    };
  }

  function schrijfAlgemeen(a) {
    return a.pre + a.secties.map(function (s) { return '## ' + s.kop + '\n' + s.body; }).join('');
  }

  function sectie(a, woord) { return vind(a.secties, woord); }

  function tekstVan(s) { return s ? s.body.trim() : ''; }
  function zetTekst(s, tekst) { s.body = '\n' + String(tekst).trim() + '\n\n'; }

  /* Lijstsecties: uitlegregels blijven staan, de opsomming wordt vervangen. */
  function lijstVan(s) { return s ? punten(s.body) : []; }
  function zetLijst(s, items) {
    var uitleg = s.body.split('\n').filter(function (r) { return !/^\s*[-*](\s+|$)/.test(r) && !/^\s*[-*]\s*[\w-]+:\s*$/.test(r); }).join('\n').trim();
    s.body = '\n' + (uitleg ? uitleg + '\n\n' : '') + items.map(function (i) { return '- ' + eenRegel(i); }).join('\n') + '\n\n';
  }

  function paren(s) {
    return lijstVan(s).map(function (p) {
      var i = p.indexOf(':');
      return i > 0 ? { sleutel: p.slice(0, i).trim(), waarde: p.slice(i + 1).trim() } : { sleutel: p, waarde: '' };
    }).filter(function (p) { return p.sleutel;
    });
  }
  function zetParen(s, lijst) { zetLijst(s, lijst.map(function (p) { return (p.sleutel + ': ' + eenRegel(p.waarde)).trim(); })); }

  /* Sectie ophalen of, als ze ontbreekt, achteraan toevoegen */
  function sectieOfNieuw(a, kop) {
    var s = vind(a.secties, kop.toLowerCase());
    if (!s) { s = { kop: kop, body: '\n\n' }; var laatste = a.secties[a.secties.length - 1]; if (laatste && !/\n\n$/.test(laatste.body)) laatste.body += '\n'; a.secties.push(s); }
    return s;
  }

  function rijen(s) { return lijstVan(s).map(function (p) { return p.split('|').map(function (x) { return x.trim(); }); }); }
  function zetRijen(s, lijst) { zetLijst(s, lijst.map(function (r) { return r.map(eenRegel).join(' | '); })); }

  /* ---------- Zip (zonder compressie), voor websites die niet zelf kunnen opslaan ---------- */

  var crcTabel = null;
  function crc32(bytes) {
    if (!crcTabel) {
      crcTabel = [];
      for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTabel[n] = c >>> 0; }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = crcTabel[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /* bestanden: [{naam, tekst}] → Uint8Array */
  function maakZip(bestanden, nu) {
    nu = nu || new Date();
    var enc = new TextEncoder();
    var tijd = (nu.getHours() << 11) | (nu.getMinutes() << 5) | (nu.getSeconds() >> 1);
    var datum = ((nu.getFullYear() - 1980) << 9) | ((nu.getMonth() + 1) << 5) | nu.getDate();
    var stukken = [], centraal = [], positie = 0;
    function kop(lengte, vul) { var b = new Uint8Array(lengte); vul(new DataView(b.buffer)); return b; }
    bestanden.forEach(function (f) {
      var naam = enc.encode(f.naam), data = enc.encode(f.tekst), crc = crc32(data);
      var lokaal = kop(30, function (v) {
        v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true);
        v.setUint16(10, tijd, true); v.setUint16(12, datum, true); v.setUint32(14, crc, true);
        v.setUint32(18, data.length, true); v.setUint32(22, data.length, true); v.setUint16(26, naam.length, true); v.setUint16(28, 0, true);
      });
      var cd = kop(46, function (v) {
        v.setUint32(0, 0x02014b50, true); v.setUint16(4, 20, true); v.setUint16(6, 20, true); v.setUint16(8, 0x0800, true); v.setUint16(10, 0, true);
        v.setUint16(12, tijd, true); v.setUint16(14, datum, true); v.setUint32(16, crc, true);
        v.setUint32(20, data.length, true); v.setUint32(24, data.length, true); v.setUint16(28, naam.length, true);
        v.setUint32(42, positie, true);
      });
      stukken.push(lokaal, naam, data); centraal.push(cd, naam);
      positie += lokaal.length + naam.length + data.length;
    });
    var cdLengte = centraal.reduce(function (n, b) { return n + b.length; }, 0);
    var eind = kop(22, function (v) {
      v.setUint32(0, 0x06054b50, true); v.setUint16(8, bestanden.length, true); v.setUint16(10, bestanden.length, true);
      v.setUint32(12, cdLengte, true); v.setUint32(16, positie, true);
    });
    var alles = stukken.concat(centraal, [eind]);
    var uit = new Uint8Array(alles.reduce(function (n, b) { return n + b.length; }, 0)), p = 0;
    alles.forEach(function (b) { uit.set(b, p); p += b.length; });
    return uit;
  }

  var Model = {
    schoon: schoon, eenRegel: eenRegel,
    leesLeeftijd: leesLeeftijd, schrijfLeeftijd: schrijfLeeftijd, leesBlok: leesBlok, maakBlok: maakBlok,
    leesAlgemeen: leesAlgemeen, schrijfAlgemeen: schrijfAlgemeen, sectie: sectie, sectieOfNieuw: sectieOfNieuw,
    tekstVan: tekstVan, zetTekst: zetTekst, lijstVan: lijstVan, zetLijst: zetLijst,
    paren: paren, zetParen: zetParen, rijen: rijen, zetRijen: zetRijen, maakZip: maakZip
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Model; else root.Model = Model;
})(typeof window !== 'undefined' ? window : this);
