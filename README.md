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
