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

## Timestamp dell'ultima pubblicazione ufficiale

A ogni comando **PUBBLICA PORTALE SQUADRE** che aggiorna ufficialmente i dati pubblici (risultati, marcatori, calendari, classifiche, disciplinare), impostare nello snapshot il timestamp reale della pubblicazione, con **data, ora e minuto nel fuso Europe/Rome**. Il frontend deve mostrare sempre l'orario, nel formato `Aggiornato: 4 novembre 2026 · 21:45` (esempio di formato, non un valore da usare). Non lasciare `meta.publishedTime` vuoto nelle nuove pubblicazioni; verificare che il timestamp corrisponda al rilascio ufficiale effettivo. Per commit minori (grafica, configurazione PWA, correzioni tecniche) **non aggiornare** il timestamp: deve continuare a rappresentare l'ultima pubblicazione ufficiale dei dati, non l'ultimo deployment Vercel. Non inventare orari per snapshot storici che ne sono privi.

## Regola marcatori, per tutte le coppe e i campionati (6 novembre 2026)

**A ogni PUBBLICA PORTALE SQUADRE** leggere sempre le marcature individuali e i risultati delle fonti Google Sheets correnti di ciascuna competizione, non soltanto i risultati. Il controllo GitHub Actions `check-match-scorers.yml` esamina inoltre tutti gli snapshot pubblicati, inclusi quelli dei campionati, dopo ogni modifica al portale e ogni giorno. Questo audit **non importa autonomamente i dati Google**: la lettura autorizzata delle fonti resta parte del workflow di pubblicazione.

Procedura obbligatoria di generazione dello snapshot:
1. Leggere il calendario delle gare e le righe dei marcatori elementari con squadra, data e reti (non dedurre i marcatori dalla sola classifica cannonieri cumulativa).
2. Normalizzare gli alias delle squadre (es. UTD / UNITED), il formato data e l'identità della competizione; associare una riga marcatore alla partita solo se competizione + data + squadra individuano una **unica** partita. Se non è univoca, lasciare in attesa e segnalare.
3. Scrivere `fixture.matchScorers = {home:[{name,goals}],away:[{name,goals}]}` quando le liste sono effettivamente disponibili. Per una squadra con 0 gol usare `[]`; quando il dettaglio manca o non è verificato usare `null` per il lato relativo. Mai usare un elenco vuoto come sostituto di dati non ancora inseriti.
4. Verificare la somma dei gol per ogni lato. Se supera il risultato, fermare la pubblicazione e segnalare l'errore. Se è inferiore, **non inventare autogol**: mantenere le marcature note e indicare la parte mancante come in verifica, a meno che l'autogol sia documentato esplicitamente.
5. Pubblicare i risultati anche quando i fogli non riportano ancora i marcatori, ma mostrare l'assenza nel pop-up del risultato. Alle pubblicazioni successive recuperare automaticamente i nuovi marcatori anche per gare precedenti; non cancellare dettagli già verificati soltanto perché la nuova fonte risulta temporaneamente vuota.
6. Dopo ogni pubblicazione controllare il report automatico per **tutte** le competizioni, con priorità per nuovi risultati con marcatori mancanti. Una segnalazione di mancata compilazione non è motivo per inventare dati; una contraddizione dei dati è un errore.

**Limite attuale:** il controllo GitHub Actions implementa la verifica degli snapshot, non un sincronizzatore non presidiato Google Sheets → GitHub → Vercel. Quest'ultimo richiederebbe credenziali sicure di lettura per i Google Sheets e un workflow esplicitamente autorizzato per il rilascio dei dati ufficiali. Non presentare il controllo come una sincronizzazione completata.

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

### Analytics semplificate (10 ottobre 2026)

Per evitare di esaurire le 2.000 Advanced Requests gratuite di Vercel Blob, il portale usa nuovamente **Vercel Web Analytics** tramite `/_vercel/insights/script.js` e gli eventi `window.va`. La funzione frontend `analyticsEvent` NON invia più POST a `/api/analytics-event`; l'endpoint legacy restituisce 204 senza scrivere su Blob, anche per PWA in cache. L'archivio Blob precedente rimane conservato ma non deve essere interrogato abitualmente: `/api/analytics-stats` legge l'archivio e può consumare ulteriori richieste Blob. Per richieste future di «Analytics» consultare preferibilmente le statistiche native Vercel, distinguendo pageviews, visitatori ed eventi. Non riattivare la scrittura Blob senza richiesta esplicita e valutazione dei limiti.

### Verifica e pubblicazione

1. Leggere README e file pertinenti prima di intervenire; controllare SHA corrente e non sovrascrivere modifiche parallele.
2. Applicare patch minime; preservare snapshot e calendario se si interviene solo su Analytics.
3. Dopo commit controllare deployment Vercel **READY** sulla revisione giusta e interrogare l'endpoint pubblico per confermare che i nuovi campi compaiano.
4. Distinguere verifiche statiche, dati reali osservati e test end-to-end non ancora effettuati; non dichiarare tutto collaudato senza prove.
5. Aggiornare questo README quando cambiano architettura, operatività, tracciamento o convenzioni, affinché una nuova chat possa riprendere senza ricostruire il progetto.

### Regola obbligatoria: disciplinare a ogni pubblicazione (10 ottobre 2026)

A **ogni** comando `PUBBLICA PORTALE SQUADRE`, ricostruire da zero gli elenchi `disciplinary.diffidati` e `disciplinary.squalificati` dello snapshot pubblico, leggendo i comunicati Google Sheets correnti **di tutte le competizioni attive** (C5, C7, Gabbione). Non riutilizzare un elenco statico della precedente pubblicazione e non limitarsi alle prime righe già popolate. Leggere l'intera sezione pertinente fino al titolo della sezione successiva, includendo tutte le righe non vuote; estrarre nome, cognome, società, sanzione e gara saltata ove disponibili. Per i diffidati usare la sezione **TESSERATI DIFFIDATI**, non soltanto AMMONITI (anche quando coincidono); per gli squalificati leggere **TESSERATI ESPULSI DAL CAMPO**, **TESSERATI NON ESPULSI DAL CAMPO** e **TESSERATI SQUALIFICATI A TEMPO**. Normalizzare nomi delle società contro lo snapshot delle squadre, evitando di perdere nominativi per alias. Verificare numero e identità delle righe sorgenti contro lo snapshot prodotto, per ogni competizione, **prima del commit**. Se la lettura di una fonte fallisce, non pubblicare un elenco parziale o vuoto spacciandolo per completo: fermare la pubblicazione e segnalare l'errore. Pubblicazione sempre esplicita: il sito non legge gli Sheets live. Conservare calendari, risultati e classifiche non interessati.


### Classifica Generale C5 — compensazione girone N (14 ottobre 2026)

Il girone N è l'unico con **5 squadre**; gli altri gironi C5 ne hanno 4. **Soltanto quando tutte le partite della fase a gironi sono concluse**, calcolare la Classifica Generale C5 rendendo confrontabili le squadre su **3 incontri validi**. Determinare prima la quinta classificata del girone N dalla **classifica di girone reale e completa**, applicando i normali criteri di ordinamento/spareggio. Per ciascuna delle prime quattro del girone N, escludere **esclusivamente dalla Classifica Generale** il risultato dello scontro diretto contro la quinta: sottrarre una partita giocata, il relativo esito (V/N/P), i punti conseguiti, reti fatte e subite e differenza reti; ricalcolare gli indicatori derivati e gli eventuali criteri di ordinamento. Per gli altri gironi A–M usare le statistiche complete. **Non alterare** classifica ufficiale del girone N, risultati, marcatori, calendario o dati storici. La quinta classificata del girone N non va confusa con le prime quattro e non deve essere conteggiata nella graduatoria delle squadre confrontate su tre gare senza una regola specifica. Non applicare prematuramente questa compensazione mentre i gironi sono ancora in corso.



**Trasferimento al comunicato ufficiale:** dopo la compilazione del Programma Generale, ordinare le gare **di ciascuna giornata in ordine cronologico crescente** (lunedì 20:00, lunedì 21:00, lunedì 22:00, martedì 20:00, ecc.; a parità di orario, campo crescente). Nei comunicati l'orario deve essere visualizzato **HH:mm con i due punti** (`20:00`, non `20.00`), mantenendo per quanto possibile il valore numerico con formato TIME `hh:mm`. Non cambiare risultati, giornate successive o formule. La denominazione della squadra di Serie A C5 è **JAMBOREE C5**, distinta da **JAMBOREE LIVORNO** del gabbione; non unificare le due squadre sul portale.

## Procedura Programma Generale — calendario C5 2026/27

Quando si inseriscono le giornate dei campionati nel Google Sheet **PROGRAMMA GENERALE**, usare i calendari ufficiali dei rispettivi comunicati come fonte e collocare ogni giornata nella settimana corretta (blocchi settimanali di 117 righe; prime settimane del campionato dal 9, 16, 23 e 30 novembre 2026). Non modificare la griglia operativa esistente a sinistra né le giornate delle altre categorie.

**Formato obbligatorio per ogni partita, replicando la riga modello CLUB AMERICA – RED DEVILS (riga 589):**

- Squadra di casa: testo nella cella X della riga, **unire X:AC**, font **Lexend 16 pt**, centrato orizzontalmente, allineato in basso.
- Separatore: sigla della categoria (**A, B, C, D, ECC, PRO**) nella cella AD, font **Lexend 12 pt**, centrata orizzontalmente, allineata in basso; AD non va unita.
- Squadra ospite: testo nella cella AE, **unire AE:AJ**, font **Lexend 16 pt**, centrato orizzontalmente, allineato in basso.
- Intestazione categoria/giornata: in AE, per esempio `PROMOZIONE · 1ª GIORNATA`, font **Lexend 16 pt grassetto**, centrata orizzontalmente e allineata in basso.
- Lasciare due righe vuote tra l'ultima partita di una categoria e l'intestazione successiva, come nelle sezioni già presenti.
- **Non basta copiare testo e font: le celle delle squadre vanno realmente unite su ogni riga**, altrimenti i nomi risultano troncati.
- Verificare dopo ogni aggiornamento il numero di gare, i nomi, le settimane e la geometria delle celle; preservare le altre categorie e la griglia principale.

Per le prime quattro giornate 2026/27, nel blocco di ogni settimana con riga iniziale `w` (586, 703, 820, 937), le nuove sezioni sono: **Promozione** intestazione `w+38`, sette partite `w+39…w+45`; **Eccellenza** intestazione `w+48`, sei partite `w+49…w+54`. La Promozione ha 14 squadre (inclusa ZUTALORS FC); l'Eccellenza ne ha 13 (con una squadra che riposa a turno). I riposi non sono partite e non vanno inseriti come incontri.

## Campionati C5 2026/27 pubblicati (6 novembre 2026)

Sono sei competizioni **Campionato** autonome aggiunte a `PORTAL.competitions` in `index.html` tramite `CHAMPIONSHIP_SNAPSHOT`: Serie A (10 squadre), Serie B (10), Serie C (14), Serie D (12), Eccellenza (13) e Promozione (14), per 73 squadre e **144 partite** delle prime quattro giornate (settimane 9, 16, 23 novembre e 30 novembre 2026). I nomi e gli abbinamenti provengono dal Programma Generale, già verificato contro i sei comunicati ufficiali. Un `round` identifica la giornata; giorno/orario/campo provengono dalla griglia operativa; il gruppo tecnico `CLASSIFICA` rappresenta una classifica unica per categoria e **non un girone**.

Ogni campionato espone la propria scheda sulla home, l'intero calendario programmato, una classifica iniziale a zero e la vista per squadra; **non inventare risultati, marcatori, qualificazioni o tabelloni**. Le coppe restano separate e inalterate. Nel frontend nascondere il tabellone per `type: "Campionato"` e indicare **Classifica** anziché **Girone**. Per la squadra PLESSO FC, la normalizzazione interna può accorpare il preesistente alias PLESSO, senza duplicare il profilo. JAMBOREE C5 (Serie A) resta distinto da JAMBOREE LIVORNO (Gabbione).

**Pubblicazioni successive:** leggere le fonti Google Sheets live e aggiornare soltanto la competizione corretta, senza sovrascrivere i risultati storici delle coppe. Aggiornare `CHAMPIONSHIP_SNAPSHOT` quando vengono approvate nuove giornate o risultati; rigenerare le classifiche dai risultati validati. Gli incontri di calcio a 5 devono rispettare le preferenze e le incompatibilità ("mai con") prima della pubblicazione. Il portale non deve mai consultare i fogli in diretta.

### Archivio competizioni e fasce classifiche (6 novembre 2026)

- La Coppa Bartoli-Bassano C5 2026 è conclusa: la relativa competizione in PORTAL ha archived: true. Home e schede squadra separano competizioni attive e archiviate; con una sola competizione attiva non appare il selettore. L'archivio rimane consultabile.
- I tabelloni mostrano i punteggi delle finali disputate attraverso gameCard anziché pendingCard, preservando semifinali e gare precedenti.
- I titoli dei campionati sono SERIE A · 2026/27, ecc., senza il prefisso Calcio a 5 già implicito nel filtro.
- Le fasce colorate delle classifiche seguono LEAGUE_ZONE_RULES, derivate dalle soglie delle sei categorie nei comunicati. Colori attribuiti alla posizione, non alla squadra. Prima del primo risultato le posizioni sono puramente indicative.
- Le modifiche di interfaccia non alterano meta.publishedAt / meta.publishedTime, che rimangono il timestamp dell'ultima pubblicazione ufficiale dei dati.
