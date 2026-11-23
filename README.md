# AI-advies per leeftijd

Een Nederlandse bewerking van [AI Guidance by Age](https://compass.gse.harvard.edu/explore/) van Compass Collaborative, Harvard Graduate School of Education. Gemaakt door [Barend Last](https://www.barendlast.com). Alle credits naar Harvard.

## Wat is dit?

Een eenvoudige webpagina waarop je een **ontwikkelingsdomein** en een **leeftijdsgroep** kiest. Je krijgt dan te zien:

- wat zich in die fase ontwikkelt;
- concrete aanbevelingen voor het gebruik van AI;
- de belangrijkste ontwikkelingsprocessen en mijlpalen;
- hypotheses over waar AI de ontwikkeling kan hinderen en waar AI kan helpen;
- de wetenschappelijke bronnen.

Er zijn 8 leeftijdsgroepen (van 0–2 tot en met 26–40 jaar) en 10 domeinen, samen 80 adviezen.

| Leeftijdsgroepen | Domeinen |
| --- | --- |
| 0–2 jaar · thuis en kinderopvang | Cognitieve basis |
| 3–5 jaar · peuteropvang en groep 1–2 | Kennis en begrip |
| 6–8 jaar · groep 3–5 | Redeneren en metacognitie |
| 9–11 jaar · groep 6–8 | Taal en geletterdheid |
| 12–14 jaar · onderbouw vo | Gecijferdheid |
| 15–17 jaar · bovenbouw vo en start mbo | Creativiteit |
| 18–25 jaar · mbo, hbo, wo en eerste baan | Eigen regie en motivatie |
| 26–40 jaar · werk en een leven lang ontwikkelen | Emotie |
| | Sociaal begrip en interactie |
| | Relaties |

De adviezen zijn hypotheses van onderzoekers en geen voorschriften. Ze bouwen voort op tientallen jaren ontwikkelingsonderzoek, aangevuld met het eerste onderzoek naar AI.

## Wat kun je ermee?

- **Gebruiken zoals het is**: als gespreksstof in een team, als onderbouwing voor AI-beleid op school of als houvast bij de vraag of een AI-toepassing past bij jouw leerlingen, studenten of kind.
- **Een eigen versie maken**: bijvoorbeeld met de huisstijl van je school, in eenvoudiger taal, met eigen voorbeelden of alleen voor de leeftijden waarmee jij werkt.
- **De vertaling verbeteren**: zie je een zin die beter kan, pas hem aan. Alle teksten staan in gewone tekstbestanden.

## Hoe zit het in elkaar?

Je hoeft niet te kunnen programmeren. De teksten staan los van de techniek.

| Bestand | Wat staat erin | Aanpassen? |
| --- | --- | --- |
| `inhoud/algemeen.md` | Titel, inleiding, keuzelijsten, knoppen, koppen, de uitklapteksten onder "Achtergrond" en de voettekst | Ja, vrij |
| `inhoud/0-2-jaar.md` t/m `inhoud/26-40-jaar.md` | De adviezen: per bestand tien domeinen voor die leeftijd | Ja, vrij |
| `stijl.css` | Kleuren, lettertypen en indeling | Voor een eigen huisstijl |
| `index.html` en `app.js` | De pagina en de werking | Meestal niet nodig |

## Een eigen kopie maken

1. Maak een gratis account op GitHub als je dat nog niet hebt.
2. Klik rechtsboven op deze pagina op **Fork**. Je hebt nu een eigen kopie waarin je alles mag veranderen.
3. Zet je kopie online: ga in jouw kopie naar **Settings → Pages**, kies bij *Source* voor **Deploy from a branch**, kies de branch `main` en de map `/ (root)` en klik op **Save**. Na een paar minuten staat je versie op een eigen webadres.

Liever geen GitHub? Klik op de groene knop **Code → Download ZIP** en zet de bestanden op een eigen webruimte.

## Teksten zelf aanpassen

Open een bestand in de map `inhoud`, klik op het potlood, pas de tekst aan en klik op **Commit changes**. De website toont de wijziging daarna vanzelf.

Drie afspraken, dan gaat er niets stuk:

1. Laat regels als `<!-- domein: relaties -->` staan. Daarmee vindt de website het juiste domein.
2. Laat de koppen met `##` staan, zoals `## In het kort` en `## AI kan helpen`. De koppen die de bezoeker ziet, pas je aan in `algemeen.md`.
3. In lijsten met `|` of `:` blijft de code vooraan staan, bijvoorbeeld `6-8` of `knop-toon`. De tekst erachter is vrij.

Opmaak werkt zoals gebruikelijk in Markdown: `**vet**`, `*cursief*`, `- opsomming`, `1. genummerd` en `[linktekst](https://voorbeeld.nl)`. Een stelling onder "AI kan hinderen" of "AI kan helpen" begint met `###`. Je kunt stellingen toevoegen of weghalen.

## Aanpassen met hulp van AI

De bestanden zijn gewone tekst en dus goed te bewerken met een AI-assistent. Er zijn twee manieren.

### Manier 1: een tekstbestand in een chatbot plakken

Geschikt voor aanpassingen aan de inhoud. Open een bestand uit de map `inhoud`, kopieer de tekst, plak hem in een chatbot (zoals Claude, ChatGPT of Copilot) en geef een opdracht. Plak het resultaat daarna terug in GitHub.

Voorbeelden van opdrachten:

```text
Hieronder staat een tekstbestand van een website. Herschrijf alle lopende
tekst naar taalniveau B1. Verander niets aan de inhoud of aan de
voorzichtige formuleringen ("kan", "mogelijk"). Laat alle regels die
beginnen met <!-- en alle koppen met ## precies zo staan. Geef het hele
bestand terug.
```

```text
Hieronder staat het advies voor 12–14 jaar. Vervang de voorbeelden door
voorbeelden uit het vmbo, zonder de strekking te veranderen. Laat de
opbouw van het bestand intact en geef het hele bestand terug.
```

```text
Vertaal dit bestand naar het Engels / Fries / Papiaments. Laat de regels
met <!-- en de koppen met ## onvertaald, en laat het onderdeel ## Bronnen
ongewijzigd.
```

Lees het resultaat altijd na. Een chatbot kan nuances weglaten of stelliger formuleren dan de onderzoekers bedoelen. Het Engelse origineel is bij twijfel leidend.

### Manier 2: een AI-assistent die in de bestanden zelf werkt

Geschikt voor grotere aanpassingen, ook aan het uiterlijk. Assistenten als Claude Code en GitHub Copilot kunnen je kopie op GitHub openen, de bestanden lezen en de wijzigingen zelf doorvoeren. Je beschrijft in gewone taal wat je wilt.

Voorbeelden van opdrachten:

```text
Pas de kleuren en het lettertype in stijl.css aan naar de huisstijl van
onze school: donkerblauw #1b3a6b als hoofdkleur en oranje #f28c28 als
accent. Controleer of het contrast voldoende blijft.
```

```text
Verwijder de leeftijdsgroepen 0–2 en 26–40 uit de keuzelijst. Wij werken
alleen met kinderen en jongeren.
```

```text
Voeg onder elk advies een blok toe met drie gespreksvragen voor een
teamoverleg, en zet de teksten daarvoor in de map inhoud zodat ik ze zelf
kan aanpassen.
```

Vraag de assistent om de pagina daarna te testen op een telefoon en een computer.

## Lokaal bekijken

Dubbelklikken op `index.html` werkt niet, omdat de browser dan de tekstbestanden niet mag inlezen. Start in de map een eenvoudige webserver:

```bash
python3 -m http.server 8000
```

Open daarna `http://localhost:8000`.

## Goed om te weten

- De bronnenlijsten onder `## Bronnen` zijn onvertaald overgenomen uit het origineel.
- Harvard beschrijft in deze versie vooral een neurotypische ontwikkeling tot 40 jaar, op basis van onderzoek uit vooral westerse landen.
- Voorbeelden uit het Amerikaanse onderwijs zijn omgezet naar de Nederlandse situatie (kinderopvang, basisschool, voortgezet onderwijs, mbo, hbo en universiteit). De inhoud en de voorzichtige formuleringen zijn gelijk gebleven.

## Rechten

De oorspronkelijke teksten zijn © 2026 President and Fellows of Harvard College. Deze bewerking is gemaakt uit waardering voor dat werk. Vraag toestemming aan [Compass Collaborative](https://compass.gse.harvard.edu/) voordat je een eigen versie openbaar verspreidt, en vermeld altijd Harvard als bron.
