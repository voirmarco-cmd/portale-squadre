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
