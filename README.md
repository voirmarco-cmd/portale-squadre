# Portale Squadre

Portale ufficiale Nuovo Centro Coteto.

## Convenzione operativa

Quando Marco scrive in ChatGPT:

**PUBBLICA PORTALE SQUADRE**

il comando significa:

1. leggere i dati approvati dai Google Sheets interni dell'organizzazione;
2. generare uno snapshot ufficiale dei dati da pubblicare;
3. aggiornare questo repository GitHub con la nuova versione del portale;
4. lasciare che Vercel esegua il nuovo deployment sullo stesso indirizzo pubblico;
5. mantenere il portale pubblico separato dai fogli di lavoro interni, senza lettura live dei Google Sheets.

URL pubblico di riferimento:

https://portale-squadre.vercel.app/

Repository:

https://github.com/voirmarco-cmd/portale-squadre

## Principio di pubblicazione

Google Sheets è l'ambiente di lavoro interno. Il sito pubblico deve mostrare solo l'ultimo snapshot ufficialmente pubblicato, non le modifiche intermedie in corso sui fogli.

Deployment trigger: 2026-10-02 07:49 CEST.


## Architettura del portale

Il portale è **centrato sulla squadra**.

Flusso utente:

1. cerca e seleziona una squadra;
2. vede tutte le competizioni in cui la squadra è presente;
3. sceglie la competizione da consultare;
4. apre risultati, prossima gara, calendario, classifica e marcatori della competizione selezionata.

Ogni competizione può provenire da un Google Sheet diverso. In fase di pubblicazione, i vari fogli vengono letti separatamente e normalizzati in un unico snapshot pubblico aggregato per squadra.

Questo consente di aggiungere nel tempo, senza cambiare il flusso principale del portale:

- Coppe di calcio a 5;
- campionati di calcio a 5;
- calcio a 7;
- gabbione;
- ulteriori discipline e competizioni.

Il sito pubblico non legge mai i Google Sheets in diretta.


## Archivio storico e statistiche (interno, non visibile)

Il portale deve iniziare a conservare, durante ogni pubblicazione ufficiale, i dati elementari necessari a costruire in futuro statistiche e record storici. Questa funzione resta per ora completamente invisibile nell'interfaccia pubblica.

Principi:

- non salvare soltanto statistiche derivate (es. "miglior vittoria"), ma conservare i singoli eventi da cui potranno essere ricalcolate;
- identificare ogni gara in modo stabile almeno tramite competizione/edizione, data, turno, squadre e, quando disponibili, ora e campo;
- per ogni gara conclusa conservare risultato, gol casa e gol ospite;
- mantenere separate competizione, edizione/stagione e disciplina/formato, così da poter calcolare record per competizione oppure trasversali;
- conservare le marcature con data, squadra, giocatore e numero di reti anche quando il foglio sorgente non le associa esplicitamente a una partita;
- associare automaticamente le marcature a una gara soltanto quando data + squadra rendono l'abbinamento univoco;
- usare la somma delle marcature della squadra come controllo rispetto ai gol segnati nella gara;
- se il totale dei marcatori non coincide con il risultato, oppure esistono più gare compatibili nello stesso giorno, non inventare l'associazione: il risultato resta valido e il dettaglio marcatori resta incompleto/non associato;
- non cancellare lo storico quando una competizione smette di essere attiva nel portale.

Questa base dovrà permettere in futuro di ricavare automaticamente, senza modificare il modo di compilare i fogli, statistiche quali miglior vittoria, peggior sconfitta, partita con più gol, maggior scarto, capocannonieri per competizione e assoluti, doppiette/triplette, serie e altri record storici NCC.

### Schema logico interno previsto

Una gara storicizzata deve poter essere rappresentata almeno con:

`matchId, competitionId, edition, sport, date, round, time, field, home, away, homeGoals, awayGoals`

Una marcatura elementare deve poter essere rappresentata almeno con:

`date, team, player, goals, matchId|null, associationStatus`

`associationStatus` deve distinguere almeno i casi `matched`, `unmatched` e `ambiguous`.

In fase di **PUBBLICA PORTALE SQUADRE**, oltre allo snapshot pubblico, va quindi preservato/aggiornato l'archivio storico interno secondo queste regole. L'eventuale esposizione delle statistiche nel sito sarà una funzione separata da implementare solo quando richiesta.


## Etichetta MODIFICATO automatica

A ogni commit che aggiorna `index.html`, il workflow GitHub Actions `.github/workflows/mark-modified.yml` confronta le gare del nuovo calendario con la versione precedente. Per una gara **già programmata** (stessa competizione, turno, girone e coppia di squadre), se cambia **giorno o orario**, registra automaticamente `modifiedAt` al momento della pubblicazione. Il portale mostra `MODIFICATO` per 48 ore. Le nuove gare non ricevono l'etichetta; i timestamp preesistenti restano invariati per gare non spostate. `RECUPERO` rimane indipendente e permanente. In caso di cambiamenti nella struttura delle competizioni, il workflow si arresta per evitare modifiche errate. Richiede GitHub Actions attivo e permesso di scrittura `contents: write`.


## Continuità operativa tra chat (aggiornato 9 ottobre 2026)

**Questo README è il punto di partenza per ogni nuova conversazione ChatGPT sul Portale NCC.** Prima di cambiare dati o pubblicare, leggere anche il codice corrente del repository e verificare lo stato Vercel: questo documento descrive convenzioni e architettura, non sostituisce il controllo dello stato reale. Non presumere che una modifica GitHub sia già in produzione senza controllare il deployment READY.

### Riferimenti e fonti

- Portale pubblico: https://portale-squadre.vercel.app
- GitHub: `voirmarco-cmd/portale-squadre`; frontend e snapshot pubblico in `index.html`.
- Vercel: progetto `prj_31NH20PF8sMGHcE2wbcaRLIbK7pZ`, team `team_ALwMKgHfn6yro7OYi3FHAsrU`.
- Google Sheets PROGRAMMA GENERALE: `1TWJusS5IMNX3hROGlTZYY-rZs8TuwaEG3F_ZZ9TiIGw`, tab `PROGRAMMA GENERALE`.
- Comunicato C5: `1FNQnDEj0NRenPEv8bL_-fNzSleGZbtNte6xHQX5s3_s`, tab `MARCATORI`.
- Comunicato C7: `1pSaACm5lWIBm8F_M_UCXPdwy0F6Zs-5kEC-_8m6SyXw`, tab `COPPA BB C7`.
- Comunicato Gabbione: `1GVN_jwGaBSNjyxd0X1d46zMGplcDuAaDNcskL7LNGuM`, tab `COPPA BB C5`.
- Le fonti Google Sheets sono interne: non cambiare risultati, calendario o formule senza richiesta esplicita. Allineare Programma Generale e Comunicati quando si pubblicano aggiornamenti approvati.

### Competenze e UX

- Competizioni: C5, C7, Gabbione; il portale aggrega le competizioni attive nella vista squadra.
- Home con discipline/competizioni, ricerca squadre, risultati settimanali, classifiche e marcatori; vista squadra con prossima partita, calendario, risultati e preferito.
- Il preferito è conservato nel browser (localStorage `portal-favorite-team`); non esiste un registro server dei preferiti attivi.
- Le partite rinviate hanno stato `RINV`; i recuperi hanno segnalazione distinta; `MODIFICATO` dura 48 ore per variazioni di data/ora secondo il workflow documentato sopra.
- Non modificare la UX per introdurre analytics; non alterare mai involontariamente settimane già pubblicate, in particolare 5 e 12 ottobre 2026. Controllare anche ordine cronologico, grassetti, recuperi e formule.
- Pubblicare insieme tutte le competizioni attive quando l'utente ordina di pubblicare; non trattare ogni foglio come un portale indipendente.

### Analytics: architettura effettiva (9 ottobre 2026)

- Il frontend invia eventi con `analyticsEvent(...)` tramite POST `/api/analytics-event`; il server salva ogni evento come Blob **privato** in `analytics/events/` usando `@vercel/blob ^2.3.0`. Il vecchio `/api/share-click` registra solo nei log e **non è uno storico persistente**.
- `/api/analytics-stats` aggrega gli eventi per giornata italiana (`Europe/Rome`); `?days=90` aggrega una finestra mobile. Restituisce `events`, `byEvent`, `bySport`, `byCompetition`, `byView`, `byTeam`, `byDate`, `favoriteAddedByTeam`, `favoriteRemovedByTeam`, `sharedByTeam`, `favoriteTimeline`, `uniqueVisitors`, `uniqueVisitorsByDate`.
- **Significato dei dati:** `events` sono interazioni, non visitatori; `portal-open` sono aperture, non persone; `byTeam` include eventi diversi e NON indica i soli preferiti. Per preferiti usare esclusivamente `favoriteAddedByTeam`, `favoriteRemovedByTeam` e `favoriteTimeline`; le aggiunte meno rimozioni sono azioni nette, NON numero certificato di browser con quel preferito attivo.
- Nuovo conteggio visitatori unici stimati: `index.html` genera UUID casuale nel localStorage (`ncc-analytics-visitor`) e lo trasmette negli eventi. L'API genera un HMAC-SHA256 giornaliero usando segreto server (`ANALYTICS_HASH_SECRET` se configurato, altrimenti `BLOB_READ_WRITE_TOKEN`), senza archiviare UUID grezzo né IP. Il report deduplica i codici degli eventi `Portal Open` per data italiana. Si tratta di **browser distinti stimati**, non individui; conteggio disponibile solo dal rilascio del tracciamento, non retroattivo. Prima di considerare il sistema conforme, valutare informativa, base giuridica, conservazione ed eventuale consenso per identificatore persistente.
- La cronologia dei preferiti usa il timestamp `uploadedAt` dei Blob convertito in ora italiana. Verificare in produzione ogni nuova modifica, non dare per certo un deploy appena committato.
- Limiti: l'archivio persistente è stato reso funzionante soltanto il 9 ottobre 2026, quindi lo storico precedente è incompleto; non inventare eventi o visite mancanti. L'endpoint di riepilogo aggrega Blob con paginazione e non è progettato per analytics ad alto volume; monitorarne prestazioni e accessi. Il conteggio di visitatori unici su periodi multi-giorno non equivale a individui deduplicati nell'intero periodo.
- **Comando ChatGPT `Analytics`**: recuperare dati **reali del giorno corrente in ora italiana**, poi presentare in italiano un report leggibile con aperture, visitatori unici stimati, eventi, competizioni, navigazione, aggiunte/rimozioni preferiti **per squadra**, condivisioni e cronologia quando richiesta. Niente JSON grezzo, niente stime spacciate per misure. Per storico specificare sempre la copertura temporale e le lacune. Se un endpoint non risponde, dichiararlo.

### Verifica e pubblicazione

1. Leggere README e file pertinenti prima di intervenire; controllare SHA corrente e non sovrascrivere modifiche parallele.
2. Applicare patch minime; preservare snapshot e calendario se si interviene solo su Analytics.
3. Dopo commit controllare deployment Vercel **READY** sulla revisione giusta e interrogare l'endpoint pubblico per confermare che i nuovi campi compaiano.
4. Distinguere verifiche statiche, dati reali osservati e test end-to-end non ancora effettuati; non dichiarare tutto collaudato senza prove.
5. Aggiornare questo README quando cambiano architettura, operatività, tracciamento o convenzioni, affinché una nuova chat possa riprendere senza ricostruire il progetto.
