# Pagine squadra multisport — specifica di sviluppo

Stato: preparazione tecnica; **non pubblicare** senza revisione e test. La produzione resta sulla versione ripristinata C5.

## Principi
- Una squadra è un'entità unica, indipendente dalle iscrizioni alle competizioni. Un'iscrizione collega teamId e competitionId.
- Nome pubblico e alias (abbreviazioni, sponsor) si mappano a un teamId stabile; non fondere squadre sulla sola somiglianza del nome.
- Ogni competizione conserva i dati del proprio comunicato. Una pubblicazione deve preservare tutte le competizioni attive e i relativi snapshot; aggiornare soltanto quelle modificate.
- I giocatori richiedono playerId stabile per sommare gol senza confondere omonimi. Fino alla verifica di identità, **non sommare** righe omonime tra competizioni.
- Il Gabbione è una disciplina a sé; non dedurre la sua struttura prima dei dati ufficiali.

## Vista squadra
Filtro unico: «Tutte le competizioni» (predefinito quando la squadra ne ha più di una) + una scheda per ciascuna iscrizione attiva.

Calendario:
- Singola: mostra soltanto le partite della competizione selezionata.
- Tutte: unisci le partite di tutte le competizioni, ordina per data e ora effettive, mostra badge disciplina + nome competizione su ogni riga.
- Le gare senza data/ora restano in una sezione «Da programmare», senza inventare ordinamenti cronologici.
- Mantieni RINV, risultati, campo, giornata e marcatori di partita riferiti alla competizione originaria.

Marcatori:
- Singola: dati del foglio MARCATORI/comunicato di quella competizione.
- Tutte: somma reti per playerId verificato; mostra dettaglio per competizione e totale; non sommare omonimi incerti.
- Evita duplicazioni se lo stesso evento compare anche nei dettagli di una partita: la fonte primaria resta l'elenco marcatori ufficiale.

Classifiche:
- Singola: classifica pertinente al girone della squadra nella competizione.
- Tutte: visualizza **in sequenza** classifiche indipendenti, ognuna con intestazione evidente (competizione, disciplina, girone); mai sommare punti, reti o posizioni di tornei diversi.

## Compatibilità
- L'URL ?squadra= continua ad aprire una sola pagina per squadra.
- Preferiti e ricerca devono usare teamId canonico, pur accettando alias storici.
- Non alterare lo snapshot C5 quando si aggiungono C7 e Gabbione.
- Nessuna dipendenza da Sheets in tempo reale: import/snapshot per comunicato.

## Casi di test prima della pubblicazione
1. Squadra iscritta a una sola competizione: nessuna regressione.
2. FC JAMAICA in C7 e Gabbione: vista globale, filtri, badge, classifiche separate.
3. FABIO & FRIENDS e LEGHORN 1915: identità unica, alias verificati.
4. Omonimi in discipline diverse: nessuna somma indebita.
5. Date mancanti, rinvii RINV e doppi turni.
6. Sintassi JS, rendering home, ricerca, scheda squadra, modali e versione mobile.
7. Pubblicazione integrale delle competizioni attive con rollback verificato.
