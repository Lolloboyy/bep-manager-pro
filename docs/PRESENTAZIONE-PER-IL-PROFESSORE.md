# BEP Manager Pro — traccia per la presentazione

## 1. Obiettivo

BEP Manager Pro è un'applicazione web per supportare le decisioni economiche di una piccola o media impresa. Il suo nucleo è l'analisi del Break Even Point, ma il progetto aggiunge gestione del mix di vendita, analisi dei margini, simulazione di scenari e archiviazione delle analisi.

## 2. Problema che risolve

Un semplice calcolatore restituisce un numero. Un responsabile aziendale, invece, ha bisogno di capire:

- quanto deve vendere per coprire i costi;
- quanto margine genera ciascun prodotto;
- quanto è distante dal punto di pareggio;
- come cambierebbe il risultato modificando prezzi, costi o volumi;
- quante unità servono per raggiungere un utile desiderato;
- come conservare e confrontare diverse ipotesi.

Il software riunisce queste informazioni in un'unica interfaccia.

## 3. Funzioni principali da mostrare

1. **Panoramica:** indicatori principali, grafico ricavi/costi, stato rispetto al BEP e margine di sicurezza.
2. **Prodotti e servizi:** inserimento di più voci con prezzo, costo variabile e quantità previste.
3. **Laboratorio delle decisioni:** variazione percentuale simultanea di prezzi, costi variabili, costi fissi e volumi; confronto tra scenario base e simulato.
4. **Storico:** salvataggio nel database e riapertura delle analisi.
5. **Metodo e formule:** spiegazione delle formule, ipotesi e limiti del modello.
6. **Report:** esportazione dei dati in CSV e stampa in PDF dal browser.

## 4. Architettura tecnica

- **Frontend:** React + TypeScript + Vite. Gestisce l'interfaccia, gli input, i grafici e le simulazioni interattive.
- **Backend:** Java + Spring Boot. Espone API REST per il calcolo e la gestione dello storico.
- **Database:** H2 in modalità file. Memorizza le analisi salvate e mantiene i dati tra riavvii.
- **Comunicazione:** richieste HTTP JSON tra frontend e backend.

Il frontend calcola una stima locale immediata e invia i dati al backend. Quando il backend è disponibile, il risultato restituito dal server diventa il risultato visualizzato. Se il server non è disponibile, l'applicazione resta utilizzabile in modalità locale.

## 5. Esempio numerico per la dimostrazione

Usare il test semplice:

- Costi fissi: 3.000 €
- Prezzo unitario: 20 €
- Costo variabile unitario: 8 €
- Vendite previste: 300 unità
- Utile obiettivo: 1.000 €

Passaggi:

1. Margine di contribuzione unitario = 20 − 8 = 12 €.
2. BEP = 3.000 / 12 = 250 unità.
3. Fatturato di pareggio = 250 × 20 = 5.000 €.
4. Utile previsto = 300 × 12 − 3.000 = 600 €.
5. Quantità per l'utile obiettivo = (3.000 + 1.000) / 12 = 333,34, quindi 334 unità intere.

Questi risultati possono essere usati per verificare il software e dimostrare che non restituisce soltanto indicatori, ma espone anche il percorso logico del calcolo.

## 6. Esempio multi-prodotto

Il caso iniziale dell'app usa tre prodotti dimostrativi:

| Voce | Prezzo | Costo variabile | Unità previste |
|---|---:|---:|---:|
| Prodotto A | 25 € | 10 € | 150 |
| Prodotto B | 40 € | 18 € | 80 |
| Servizio C | 80 € | 30 € | 30 |

Il contributo totale è 5.510 €, le unità previste sono 260 e il margine medio ponderato è circa 21,19 € per unità equivalente. Con costi fissi di 4.800 €, il BEP è circa 226,50 unità equivalenti, da arrotondare a 227 per una soglia operativa intera. Il fatturato di pareggio è circa 8.145,19 €.

## 7. Limiti dichiarati e sviluppi futuri

Il modello ipotizza prezzi e costi variabili unitari costanti, costi fissi invariati e mix di vendita costante. Non comprende ancora imposte, ammortamenti, scorte, capacità produttiva, costi semi-variabili o stagionalità. Per un prodotto commerciale servono autenticazione, ruoli, separazione sicura dei dati tra aziende, backup, HTTPS, controlli di sicurezza, PostgreSQL e test più estesi.

## 8. Dimostrazione consigliata in classe

1. Aprire la Panoramica e spiegare i quattro indicatori.
2. Aprire Prodotti e servizi e modificare il prezzo di un prodotto.
3. Mostrare l'aggiornamento automatico di margine, utile e BEP.
4. Aprire il Laboratorio e aumentare i costi variabili del 10%; poi ridurre i volumi del 15%.
5. Confrontare il risultato con lo scenario iniziale.
6. Salvare lo scenario e mostrarlo nello Storico.
7. Aprire Metodo e formule per spiegare il calcolo multi-prodotto.
8. Esportare un CSV o stampare il report PDF.

Messaggio conclusivo: **BEP Manager Pro trasforma il punto di pareggio da calcolo statico a strumento di simulazione delle decisioni aziendali.**
