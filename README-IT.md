# BEP Manager Pro — progetto dimostrativo

Applicazione web per analizzare il Break Even Point (punto di pareggio), il margine di contribuzione, il margine di sicurezza e gli effetti delle decisioni aziendali.

## Cosa include

- Dashboard con KPI, grafico ricavi/costi e stato rispetto al punto di pareggio.
- Analisi multi-prodotto con margine medio ponderato e ripartizione del BEP in base al mix di vendita.
- Laboratorio delle decisioni: simulazione percentuale di prezzi, costi variabili, costi fissi e volumi.
- Gestione dei prodotti e servizi.
- Obiettivo di utile e quantità necessaria per raggiungerlo.
- Storico delle analisi salvate.
- Esportazione CSV e stampa del report in PDF tramite la funzione di stampa del browser.
- Backend Java Spring Boot con endpoint REST e database H2 persistente.
- Salvataggio automatico della bozza nel browser; funzionamento in modalità locale anche quando il backend non è disponibile.
- Pagina Metodo e formule con ipotesi e limiti del modello, utile anche per la presentazione scolastica.

## Requisiti

- Windows 10/11
- Node.js 20.19+ (consigliato Node 24) e npm
- Java 25
- Maven, oppure il Maven Wrapper già disponibile nel precedente progetto `bep-manager`

## Avvio rapido su Windows

1. Estrai l'intera cartella `bep-manager-pro` in una posizione semplice, ad esempio sul Desktop.
2. Fai doppio clic su `start-bep-manager.cmd`.
3. Si apriranno due finestre del terminale: una per Spring Boot e una per React/Vite. Non chiuderle mentre usi il programma.
4. Quando Vite mostra l'indirizzo locale, apri `http://localhost:5173` (se indica `5174`, usa quello).
5. Il controllo backend è disponibile su `http://localhost:8080/api/health`.

È possibile avviare separatamente i due componenti:

- Frontend: apri `frontend`, esegui `npm.cmd install` e poi `npm.cmd run dev`.
- Backend: apri `backend` e avvia `start-backend.cmd`. Se Maven non è nel PATH, lo script prova a usare il wrapper del precedente progetto `bep-manager` presente sul Desktop. In alternativa copia `mvnw.cmd` e la cartella `.mvn` dal vecchio backend nella nuova cartella `backend`, quindi esegui `.\mvnw.cmd spring-boot:run` da PowerShell.

## Porte e API

| Funzione | Indirizzo |
|---|---|
| Frontend | `http://localhost:5173` |
| Stato backend | `http://localhost:8080/api/health` |
| Analisi BEP | `POST http://localhost:8080/api/analysis` |
| Elenco storico | `GET http://localhost:8080/api/scenarios` |
| Salva scenario | `POST http://localhost:8080/api/scenarios` |
| Elimina scenario | `DELETE http://localhost:8080/api/scenarios/{id}` |

## Modello di calcolo

Per il caso multi-prodotto, mantenendo costante il mix di vendita:

1. Margine unitario di ciascun prodotto = prezzo unitario − costo variabile unitario.
2. Margine medio ponderato = margine di contribuzione totale / unità totali previste.
3. BEP in unità equivalenti = costi fissi / margine medio ponderato.
4. Indice del margine di contribuzione = margine di contribuzione totale / ricavi totali.
5. BEP in fatturato = costi fissi / indice del margine di contribuzione.
6. Utile previsto = ricavi − costi variabili − costi fissi.
7. Margine di sicurezza % = (unità previste − BEP in unità) / unità previste × 100.
8. Quantità per l'utile obiettivo = (costi fissi + utile obiettivo) / margine medio ponderato.

Il numero di unità del BEP e quello per l'utile obiettivo vengono arrotondati per eccesso nella visualizzazione delle quantità intere. Il calcolo conserva anche il valore teorico decimale.

## Dati dimostrativi

Il progetto parte con tre voci di esempio e costi fissi mensili di 4.800 €. Sono dati inventati per la dimostrazione e vanno sostituiti con dati reali prima di usare i risultati per decisioni aziendali.

## Note importanti prima di un uso commerciale

Questa è una versione dimostrativa/MVP pensata per presentare il progetto e mostrare una base full-stack funzionante. Non è ancora un servizio SaaS pronto per clienti reali. Prima di distribuirlo ad aziende occorre aggiungere almeno autenticazione, ruoli e permessi, isolamento dei dati per azienda, gestione sicura dei segreti, backup, HTTPS, logging e monitoraggio, test più estesi, procedure GDPR e revisione professionale delle formule rispetto ai casi contabili specifici. Il database H2 è adatto alla dimostrazione; per un servizio multi-azienda si consiglia PostgreSQL.

Per eseguire i test automatici del backend, dalla cartella `backend` lancia `mvn test` oppure `.\mvnw.cmd test` se hai copiato il Maven Wrapper.

## Limiti del modello economico

Il modello assume prezzi e costi variabili unitari costanti, costi fissi invariati e mix di vendita stabile nel periodo. Non include automaticamente IVA, imposte, ammortamenti, costi semi-variabili, scorte, capacità produttiva, stagionalità, sconti o variazioni della domanda causate dai prezzi. Il BEP è una stima gestionale e non una previsione garantita.
