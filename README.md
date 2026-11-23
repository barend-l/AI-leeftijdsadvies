# AI-advies per leeftijd

Nederlandse bewerking van [AI Guidance by Age](https://compass.gse.harvard.edu/explore/) van Compass Collaborative, Harvard Graduate School of Education. Omgezet en vertaald door Barend Last. Alle credits naar Harvard Graduate School of Education.

De pagina toont per leeftijdsgroep (0–2 tot en met 26–40 jaar) en per ontwikkelingsdomein hoe AI de ontwikkeling kan helpen of hinderen: 80 combinaties in totaal.

## Teksten aanpassen

Alle teksten staan in de map [`inhoud`](inhoud). Je kunt ze rechtstreeks in GitHub bewerken: open een bestand, klik op het potlood, pas de tekst aan en klik op *Commit changes*. De website toont de wijziging daarna vanzelf.

| Bestand | Wat staat erin |
| --- | --- |
| `inhoud/algemeen.md` | Titel, inleiding, rollen, leeftijdsgroepen, domeinen, knoppen en koppen, de uitleg over het onderzoek en de voettekst |
| `inhoud/0-2-jaar.md` t/m `inhoud/26-40-jaar.md` | De adviezen: per bestand tien domeinen voor die leeftijd |

Drie afspraken, dan gaat er niets stuk:

1. Laat regels als `<!-- domein: relaties -->` staan. Daarmee vindt de website het juiste domein.
2. Laat de koppen met `##` staan (`## In het kort`, `## AI in deze fase`, `## Aanbevelingen`, `## Ontwikkeling in deze fase`, `## AI kan hinderen`, `## AI kan helpen`, `## Bronnen`). De koppen die de bezoeker ziet, pas je aan in `algemeen.md`.
3. In lijsten met `|` of `:` blijft de code vooraan staan (bijvoorbeeld `6-8` of `knop-toon`). De tekst erachter is vrij.

Verder is alles vrij aan te passen. Opmaak werkt zoals gebruikelijk in Markdown: `**vet**`, `*cursief*`, `- opsomming`, `1. genummerd` en `[linktekst](https://voorbeeld.nl)`. Een stelling onder "AI kan hinderen" of "AI kan helpen" begint met `###`; je kunt stellingen toevoegen of weghalen.

De bronnenlijsten onder `## Bronnen` zijn onvertaald overgenomen uit het origineel.

## Online zetten

De site bestaat uit losse bestanden en heeft geen installatie nodig. Met GitHub Pages: *Settings → Pages → Deploy from a branch*, kies de branch en de map `/ (root)`.

Lokaal bekijken kan niet door `index.html` dubbel te klikken, omdat de browser dan de tekstbestanden niet mag inlezen. Start in deze map een eenvoudige webserver:

```bash
python3 -m http.server 8000
```

Open daarna `http://localhost:8000`.

## Rechten

De oorspronkelijke teksten zijn © 2026 President and Fellows of Harvard College. Vraag toestemming aan Compass Collaborative voordat je deze vertaling openbaar verspreidt.
