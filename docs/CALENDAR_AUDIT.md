# Controllo calendari NCC — versione iniziale

Stato: **motore implementato su branch di sviluppo; non ancora collegato alla procedura di pubblicazione**.

## Regole
- PROGRAMMA GENERALE è la fonte per data, ora, campo, casa, ospite e girone.
- I comunicati vengono confrontati solo dopo aver configurato l'ambito della competizione (non dedurre la disciplina dal numero del campo).
- Per ogni partita attesa: una e una sola corrispondenza nel comunicato; segnalare mancanti, extra, duplicati e campi differenti.
- Un risultato `RINV` nel comunicato non implica che la partita scompaia dal programma. Il programma attuale non contiene necessariamente lo stato: la verifica del risultato/stato richiede una fonte aggiuntiva e **non è ancora implementata**.
- Un comunicato non configurato NON è un controllo superato.
- Il confronto riguarda i valori; il controllo della formattazione grafica non è ancora automatizzato.
- Non eseguire aggiornamenti automatici ai documenti in seguito a un errore.
- Il controllo è indipendente dalla pubblicazione del sito. Non attivarlo come blocco della pubblicazione prima di un collaudo integrale e dell'approvazione.

## Esecuzione
`node scripts/calendar-audit.test.mjs`
`node scripts/calendar-audit.mjs dati.json`

Formato `dati.json`:
```json
{
  "general": [["lun 5/10", "21:00", "1", "", "CASA", "", "", "", "", "", "A", "OSPITE"]],
  "competitions": [
    {
      "id": "coppa-bb-c5-2026",
      "sport": "C5",
      "document": "COPPA BARTOLI-BASSANO 2026 C5",
      "groupCodes": ["A"],
      "rows": [["lun 5/10", "21:00", "1", "", "CASA", "", "", "", "", "", "A", "OSPITE", "", "", "", "", "", "7-1"]]
    }
  ]
}
```
I dati devono essere esportati come matrici complete a partire dalla riga 1 dei fogli (celle vuote conservate). Il filtro `groupCodes` è soltanto un esempio: **non usare A come filtro reale della Coppa BB**, perché i gironi possono sovrapporsi ad altre competizioni. Per un controllo affidabile servirà una mappatura di competizione/periodo/righe o identificativi univoci di gara. Non impostare `matchFilter: "all"` quando il PROGRAMMA GENERALE contiene più competizioni.

## Prima dell'attivazione
1. Definire una mappatura non ambigua per C5, gabbione e C7.
2. Aggiungere un importatore Google Sheets che mantenga numeri di riga e identità di gara.
3. Validare un campione di partite reali per tutte le discipline, incluse le rinviate.
4. Implementare il controllo stato/risultato quando la fonte ufficiale è individuata.
5. Implementare separatamente la verifica grafica dei comunicati.
6. Solo dopo test e approvazione, integrare il controllo nel workflow pre-pubblicazione.

Non modificare mai il calendario o i comunicati senza autorizzazione esplicita. La pubblicazione del sito richiede il comando `PUBBLICA PORTALE SQUADRE`.
