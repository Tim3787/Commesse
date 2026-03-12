import iconOk from '../img/icons8-ok-48.png';
import iconDev from '../img/icons8-saturazione-48.png';
import iconWIP from '../img/icons8-servizi-48.png';
import iconWarn from '../img/icons8-attenzione-48.png';
import iconDone from '../img/icons8-bandiera-a-scacchi-48.png';

export const repartoConfig = {
  software: {
    RepartoID: 1,
    RepartoName: 'software',
    sharedReparti: ['service'],
    defaultServiceResourceId: 51, // ID della risorsa di default per "software"
    boardId: '606e8f6e25edb789343d0871',
    accoppiamentoStati: {
      //Colonna APP
      'in entrata':
        //Colonne Trello
        [
          'S: In entrata',
          'S-Ribo in entrata',
          'S: Modifiche su macchina old',
          'S: Commessa sospesa',
        ],
      analisi:
        //Colonne Trello
        ['S: Analisi', 'S: Modifiche su macchina old'],
      //Colonna APP
      'sviluppo programmato':
        //Colonne Trello
        ['S: In entrata', 'S: Analisi'],
      sviluppo:
        //Colonne Trello
        ['S: Sviluppo'],
      //Colonna APP
      'pronta per collaudo':
        //Colonne Trello
        [
          'S: pronto per messa in servizio',
          'S: Macchina quasi pronta per inizio collaudo (vedi data di massima inserita da Massimo)',
        ],
      collaudo:
        //Colonne Trello
        ['S: Collaudo'],
      //Colonna APP
      'avviamento terminato':
        //Colonne Trello
        ['S: Completate'],
      //Colonna APP
      'avviamento iniziato':
        //Colonne Trello
        ['S: Completate'],
      //Colonna APP
      'collaudo terminato':
        //Colonne Trello
        ['S: Completate'],
      //Colonna APP
      'no software':
        //Colonne Trello
        [
          'S: Nessun lavoro software',
          'S: Modifiche su macchina old',
          'S-Ribo in entrata',
          'S: Completate',
        ],
    },
  },

  elettrico: {
    RepartoID: 2,
    RepartoName: 'elettrico',
    sharedReparti: ['service'],
    defaultServiceResourceId: 49, // ID della risorsa di default per "elettrico"
    boardId: '606efd4d2898f5705163448f',
    accoppiamentoStati: {
      'in entrata': [
        'E: In entrata',
        'E: In entrata',
        'E: Schema destinato a Luca',
        'E: Schema destinato a Alan',
        'E: Schema destinato a Alessio',
        'E: Schema destinato a Simone',
        'E: Schema destinato a Matteo',
        'E: Commesse sospese',
      ],
      analisi: ['E: Analisi documentazione', 'E: Commesse sospese'],
      sviluppo: ['E: Sviluppo'],
      controllo: [
        'E: Controllo schema prima del lancio',
        'E: Schema ok per BM',
        'E: Materiale impegnato da gestionale da ufficio acquisti',
        'E: Priorità commesse da prelevare',
      ],

      'bm in preparazione': [
        'E: Materiale BM in preparazione',
        'E: Documentazione da aggiornare',
        'Materiale BM Completo',
      ],

      'bm pronto': [
        'Materiale BM Completo',
        'E: Materiale impegnato da gestionale da ufficio acquisti',
        'E: Documentazione da aggiornare',
      ],

      completate: [
        'E: Completate',
        'E: Documentazione da aggiornare',
        'E: Documentazione aggiornata, ok a mauro per invio schema definitivo',
      ],
      'materiale elettrico in preparazione': [
        'E: in lavorazione ordine materiale BM e QE',
        'E: Materiale BM Ordinato',
        'E: Materiale BM in preparazione',
        'E: Materiale da sollecitare',
        'E: Materiale già sollecitato',
        'E: Materiale BM quasi completo',
        'Materiale BM Completo',
      ],
      'macchina in cablaggio': ['E: Montaggio bordo macchina'],

      'macchina in collaudo': [
        'E: Montaggio bordo macchina',
        'E: Documentazione da aggiornare',
        'E: Documentazione aggiornata, ok a mauro per invio schema definitivo',
        'E: inizio smontaggio meccanico, vedi data inserita da Massimo per poter pianificare lo smontaggio elettrico',
      ],
      'macchina in smontaggio': [
        'E: Completate',
        'E: Documentazione da aggiornare',
        'E: Documentazione aggiornata, ok a mauro per invio schema definitivo',
      ],
    },
  },

  meccanico: {
    RepartoID: 3,
    RepartoName: 'meccanico',
    sharedReparti: ['service'],
    defaultServiceResourceId: 50, // ID della risorsa di default per "elettrico"
    boardId: '607528abaa92290566c9407c',
    accoppiamentoStati: {
      'in entrata': [
        'M: In entrata',
        'M: Progettazione e/o realizzazione ESTERNA',
        'M: Prog. destinata a Alessandro',
        'M: Prog. destinata a Gianni',
        'M: Prog. destinata a Claudio',
        'M: Prog. destinata a Denis',
        'M: Prog. destinata a Paolo',
        'M: Prog. destinata a Riccardo',
        'M: In attesa di conferma del lay-out / 3d da parte del cliente, per lancio commessa',
        'M: in attesa di info per procedere (solo se la commessa è totalmente bloccata)',
        'M: Proget. Meccanica',
        'M: Distinta Lanciata',
        'M: Inizio ordine materiale',
        'M: ord.matt. completo',
        'M: Priorità rispetto al calendario per priorità preparazione materiale',
        'M: pre. mat. quasi completo',
        'M: Materiale da sollecitare',
        'M: Materiale già sollecitato',
        'M: Materiale completo',
        'M: Commesse sospese',
      ],
      analisi: [
        'M: In entrata',
        'M: Progettazione e/o realizzazione ESTERNA',
        'M: Prog. destinata a Alessandro',
        'M: Prog. destinata a Gianni',
        'M: Prog. destinata a Claudio',
        'M: Prog. destinata a Denis',
        'M: Prog. destinata a Paolo',
        'M: Prog. destinata a Riccardo',
        'M: In attesa di conferma del lay-out / 3d da parte del cliente, per lancio commessa',
        'M: in attesa di info per procedere (solo se la commessa è totalmente bloccata)',
        'M: Proget. Meccanica',
        'M: Distinta Lanciata',
        'M: Inizio ordine materiale',
        'M: ord.matt. completo',
        'M: Priorità rispetto al calendario per priorità preparazione materiale',
        'M: Preparazione materiale in lavorazione',
        'M: pre. mat. quasi completo',
        'M: Materiale da sollecitare',
        'M: Materiale già sollecitato',
        'M: Materiale completo',
        'M: Commesse sospese',
      ],

      'montaggio programmato': [
        'M: In entrata',
        'M: Progettazione e/o realizzazione ESTERNA',
        'M: Prog. destinata a Alessandro',
        'M: Prog. destinata a Gianni',
        'M: Prog. destinata a Claudio',
        'M: Prog. destinata a Denis',
        'M: Prog. destinata a Paolo',
        'M: In attesa di conferma del lay-out / 3d da parte del cliente, per lancio commessa',
        'M: in attesa di info per procedere (solo se la commessa è totalmente bloccata)',
        'M: Proget. Meccanica',
        'M: Distinta Lanciata',
        'M: Inizio ordine materiale',
        'M: ord.matt. completo',
        'M: Priorità rispetto al calendario per priorità preparazione materiale',
        'M: Preparazione materiale in laovorazione',
        'M: pre. mat. quasi completo',
        'M: Materiale da sollecitare',
        'M: Materiale già sollecitato',
        'M: Materiale completo',
      ],
      'montaggio in corso': [
        'M: Mont. mec. In corso',
        'M - Inizio bordomacchina e montaggio in corso (inserire data di massima nella scheda relativa)',
        'M: Line pronte al 80/90% messe in ordine prioritario per inizio collaudo (inserire data di massima nella scheda relativa)',
        'M: Materiale da sollecitare',
      ],
      'montaggio completato': ['M: Montaggio completo', 'M: Bordo macchina in corso'],
      collaudo: [
        'M: Collaudo',
        'M: Collaudo completato in attesa del FAT/smontaggio',
        'M: Altre attività extra da fare prima dello smontaggio/spedizione',
      ],
      'smontaggio programmato': [
        'M: Montaggio completo',
        'M: Bordo macchina in corso',
        'M: Collaudo',
        'M: Collaudo completato in attesa del FAT/smontaggio',
        'M: Altre attività extra da fare prima dello smontaggio/spedizione',
      ],
      completate: [
        'M: Evasa in attesa di installazione o avviamento',
        'M: Macchina in magazzino pronto per la spedizione',
      ],
    },
  },

  service: {
    RepartoID: 18,
    RepartoName: 'service',
    defaultServiceResourceId: null, // ID di default per il reparto "service"
    boardId: '606efd4d2898f5705163448f',
    accoppiamentoStati: {
      analisi: ['E: Analisi documentazione'],
    },
  },

  quadristi: {
    RepartoID: 15,
    RepartoName: 'quadristi',
    defaultServiceResourceId: 94, // ID della risorsa di default per "quadristi"
    boardId: '606efd4d2898f5705163448f',
    accoppiamentoStati: {
      analisi: ['E: Analisi documentazione'],
    },
  },
  tecnicoelettrico: {
    RepartoID: 14,
    RepartoName: 'tecnico elettrico',
    defaultServiceResourceId: 94, // ID della risorsa di default per "quadristi"
    boardId: '606efd4d2898f5705163448f',
    accoppiamentoStati: {
      'in entrata': [
        'E: In entrata',
        'E: Schema destinato a Luca',
        'E: Schema destinato a Alan',
        'E: Schema destinato a Alessio',
        'E: Schema destinato a Simone',
      ],
      analisi: [
        'E: Analisi documentazione',
        'E: Schema destinato a Luca',
        'E: Schema destinato a Alan',
        'E: Schema destinato a Alessio',
        'E: Schema destinato a Simone',
      ],
      'sviluppo programmato': [
        'E: Analisi documentazione',
        'E: Schema destinato a Luca',
        'E: Schema destinato a Alan',
        'E: Schema destinato a Alessio',
        'E: Schema destinato a Simone',
      ],
      sviluppo: ['E: Sviluppo'],

      controllo: ['E:  Controllo schema prima del lancio'],

      controllate: [
        'E: in lavorazione ordine materiale BM e QE',
        'E: Materiale BM Ordinato',
        'E: Materiale BM in preparazione',
        'E: Materiale da sollecitare',
        'E: Materiale già sollecitato',
        'E: Materiale BM quasi completo',
        'Materiale BM Completo',
        'E: Schema ok per BM',
        'E: Materiale impegnato da gestionale da ufficio acquisti',
        'E: inizio smontaggio meccanico, vedi data inserita da Massimo per poter pianificare lo smontaggio elettrico',
        'E: Montaggio bordo macchina',
      ],
      'in attesa di revisione finale': [
        'E: in lavorazione ordine materiale BM e QE',
        'E: Materiale BM Ordinato',
        'E: Materiale BM in preparazione',
        'E: Materiale da sollecitare',
        'E: Materiale già sollecitato',
        'E: Materiale BM quasi completo',
        'Materiale BM Completo',
        'E: Schema ok per BM',
        'E: Materiale impegnato da gestionale da ufficio acquisti',
        'E: inizio smontaggio meccanico, vedi data inserita da Massimo per poter pianificare lo smontaggio elettrico',
        'E: Montaggio bordo macchina',
        'E: Documentazione da aggiornare',
      ],
      completate: ['E: Completate', 'E: Nessun lavoro elettrico da fare'],
    },
  },
};

// ===============================
// TRELLO - Custom Fields DATE (per board)
// ===============================
export const TRELLO_CF_BY_BOARD = {
  // SOFTWARE board
  '606e8f6e25edb789343d0871': {
    DATA_SMONTAGGIO: '65fafa683dff5f0d8e1d3691',
    DATA_SPEDIZIONE: '69330d3df034fb3e8e42daac',
    DATA_PRESUNTO_RITIRO: '691371775d69e792c9ee183a',
  },

  // MECCANICO board
  '607528abaa92290566c9407c': {
    DATA_SMONTAGGIO: '691442189b2013cffec7b495',
    DATA_SPEDIZIONE: '69330d2ed27219e35a9f32bd',
    DATA_PRESUNTO_RITIRO: '6913716a14a3e33d677f43da',
  },

  // ELETTRICO board
  '606efd4d2898f5705163448f': {
    DATA_SMONTAGGIO: '65fafa1124687993190db9ee',
    DATA_SPEDIZIONE: '69330d3ff35eb5a44e262278',
    DATA_PRESUNTO_RITIRO: '69137179e3fdae18947a12a1',
  },
};

export function getBoardCustomFieldId(boardId, key) {
  return TRELLO_CF_BY_BOARD?.[boardId]?.[key] || null;
}

// ===============================
// TRELLO - Custom Field CABL.QE
// ===============================
const CABL_QE_FIELD_ID = '6151ec04d4c4264d55da92fc';

const CABL_QE_OPTIONS = {
  '6151ec192eac9155feda469d': '2G',
  '6462772030551d5d614be8b1': 'LABEX x UL',
  '6151ec13facfff407c4fad7b': 'OYSTER',
  '6151f515b21e6f05e6306e40': 'PHOENIX',
  '642d2f77a3b8825979485a99': 'UNITECH',
  '6647791d074a39d04fd88711': 'Lux cablaggi',
};

export function getCablQeValueFromCard(card) {
  const item = (card?.customFieldItems || []).find((i) => i.idCustomField === CABL_QE_FIELD_ID);

  if (!item?.idValue) return null;

  return CABL_QE_OPTIONS[item.idValue] ?? null;
}

// ----------------------------------------------------------------
// Configurazione per i reparti (definita direttamente nel componente)
// ----------------------------------------------------------------

// 🔹 regole indicatori: quando sono nel reparto X, guardo lo stato del reparto Y
export const repartoIndicators = {
  software: [
    /* TECNICO ELETTRICO */
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['completate', 'controllate', 'In attesa di revisione finale'],
      icon: iconOk,
      title: 'Schema completato',
      text: 'Schema completato',
      showText: true,
    },
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['Controllo'],
      ifSelfNotIn: ['Sviluppo'],
      icon: iconDev,
      title: 'Schema in controllo',
      text: 'Schema in controllo',
      showText: true,
    },
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['Controllo'],
      ifSelfIn: ['Sviluppo'],
      icon: iconWarn,
      title: 'Schema in controllo',
      text: 'Schema in controllo',
      showText: true,
    },
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['Sviluppo'],
      ifSelfNotIn: ['Sviluppo'],
      icon: iconDev,
      title: 'Schema in sviluppo',
      text: 'Schema in sviluppo',
      showText: true,
    },
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['Sviluppo'],
      ifSelfIn: ['Sviluppo'],
      icon: iconWarn,
      title: 'Schema in sviluppo',
      text: 'Schema in sviluppo',
      showText: true,
    },

    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['In Entrata', 'analisi', 'sviluppo programmato'],
      ifSelfIn: ['Sviluppo', 'Pronta per collaudo'],
      icon: iconWarn,
      title: 'Schema non pronto!',
      text: 'Schema non pronto!',
      showText: true,
    },

    /* ELETTRICO */
    {
      otherReparto: 'elettrico',
      whenStates: ['Macchina in cablaggio', 'Cablaggio iniziato'],
      icon: iconDev,
      title: 'Macchina in cablaggio',
      text: 'Macchina in cablaggio',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: [' Prep. scheda lavoro'],
      icon: iconDev,
      title: 'Elettrico in preparazione',
      text: 'Elettrico in preparazione',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Bm in preparazione'],
      icon: iconDev,
      title: 'Bm in preparazione',
      text: 'Bm in preparazione',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: [
        'Completate',
        'Macchina in smontaggio',
        'Macchina in collaudo',
        'Cablaggio terminato',
      ],
      icon: iconDone,
      title: 'Elettrico completato',
      text: 'Elettrico completato',
      showText: true,
    },

    /* MECCANICO */
    {
      otherReparto: 'meccanico',
      whenStates: ['Montaggio programmato'],
      icon: iconDev,
      title: 'Montaggio programmato',
      text: 'Montaggio programmato',
      showText: true,
    },
    {
      otherReparto: 'meccanico',
      whenStates: ['Montaggio in corso'],
      icon: iconDev,
      title: 'Montaggio in corso',
      text: 'Montaggio in corso',
      showText: true,
    },
    {
      otherReparto: 'meccanico',
      whenStates: ['Montaggio completato', ' Smontaggio programmato', ' Smontaggio completato'],
      icon: iconOk,
      title: 'Montaggio completato',
      text: 'Montaggio completato',
      showText: true,
    },
  ],

  elettrico: [
    /* SOFTWARE */
    {
      otherReparto: 'software',
      whenStates: ['sviluppo'],
      icon: iconDev,
      title: 'Software in sviluppo',
      text: 'Sviluppo software',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['Pronta per collaudo'],
      icon: iconOk,
      title: 'Software completato',
      text: 'Software completato',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['No software'],
      icon: iconOk,
      title: 'No software',
      text: 'software',
      showText: true,
    },

    {
      otherReparto: 'software',
      whenStates: ['Collaudo'],
      icon: iconWIP,
      title: 'Collaudo in corso',
      text: 'Collaudo in corso',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['Collaudo terminato'],
      icon: iconDone,
      title: 'Collaudo terminato',
      text: 'Collaudo terminato',
      showText: true,
    },

    /* TECNICO ELETTRICO */
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['completate', 'controllate', 'In attesa di revisione finale'],
      icon: iconOk,
      title: 'Schema completato',
      text: 'Schema completato',
      showText: true,
    },
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['Controllo'],
      icon: iconDev,
      title: 'Schema in controllo',
      text: 'Schema in controllo',
      showText: true,
    },
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['Sviluppo'],
      icon: iconDev,
      title: 'Schema in sviluppo',
      text: 'Schema in sviluppo',
      showText: true,
    },

    /* MECCANICO */
    {
      otherReparto: 'meccanico',
      whenStates: ['Montaggio programmato'],
      icon: iconDev,
      title: 'Montaggio programmato',
      text: 'Montaggio programmato',
      showText: true,
    },
    {
      otherReparto: 'meccanico',
      whenStates: ['Montaggio in corso'],
      icon: iconDev,
      title: 'Montaggio in corso',
      text: 'Montaggio in corso',
      showText: true,
    },
    {
      otherReparto: 'meccanico',
      whenStates: ['Montaggio completato', ' Smontaggio programmato', ' Smontaggio completato'],
      icon: iconOk,
      title: 'Montaggio completato',
      text: 'Montaggio completato',
      showText: true,
    },
  ],

  meccanico: [
    {
      otherReparto: 'software',
      whenStates: ['sviluppo'],
      icon: iconDev,
      title: 'Software in sviluppo',
      text: 'Sviluppo software',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['Pronta per collaudo'],
      icon: iconOk,
      title: 'Software completato',
      text: 'Software completato',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['No software'],
      icon: iconOk,
      title: 'No software',
      text: 'software',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['Collaudo'],
      icon: iconDev,
      title: 'Collaudo in corso',
      text: 'Collaudo in corso',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['Collaudo terminato'],
      icon: iconDone,
      title: 'Collaudo terminato',
      text: 'Collaudo terminato',
      showText: true,
    },
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['completate', 'controllate', 'In attesa di revisione finale'],
      icon: iconOk,
      title: 'Schema completato',
      text: 'Schema completato',
      showText: true,
    },

    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['Controllo'],
      icon: iconDev,
      title: 'Schema in controllo',
      text: 'Schema in controllo',
      showText: true,
    },
    {
      otherReparto: 'tecnico elettrico',
      whenStates: ['Sviluppo'],
      icon: iconDev,
      title: 'Schema in sviluppo',
      text: 'Schema in sviluppo',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Macchina in cablaggio'],
      icon: iconDev,
      title: 'Macchina in cablaggio',
      text: 'Macchina in cablaggio',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Bm in preparazione', 'Bm pronto'],
      icon: iconDev,
      title: 'Preparazione materiale elettrico',
      text: 'Preparazione materiale elettrico',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Macchina in collaudo'],
      icon: iconDev,
      title: 'Collaudo elettrico',
      text: 'Collaudo elettrico',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Macchina in smontaggio'],
      icon: iconDev,
      title: 'Macchina in smontaggio',
      text: 'Macchina in smontaggio',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Completate'],
      icon: iconDone,
      title: 'Elettrico completato',
      text: 'Elettrico completato',
      showText: true,
    },
  ],
  'tecnico elettrico': [
    /* SOFTWARE */
    {
      otherReparto: 'software',
      whenStates: ['sviluppo'],
      icon: iconDev,
      title: 'Software in sviluppo',
      text: 'Sviluppo software',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['Pronta per collaudo'],
      icon: iconOk,
      title: 'Software completato',
      text: 'Software completato',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['No software'],
      icon: iconOk,
      title: 'No software',
      text: 'software',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['Collaudo'],
      icon: iconWIP,
      title: 'Collaudo in corso',
      text: 'Collaudo in corso',
      showText: true,
    },
    {
      otherReparto: 'software',
      whenStates: ['Collaudo terminato'],
      icon: iconDone,
      title: 'Collaudo terminato',
      text: 'Collaudo terminato',
      showText: true,
    },

    /* ELETTRICO */
    {
      otherReparto: 'elettrico',
      whenStates: ['Macchina in cablaggio'],
      icon: iconDev,
      title: 'Macchina in cablaggio',
      text: 'Macchina in cablaggio',
      showText: true,
    },
    {
      otherReparto: 'elettrico',
      whenStates: ['Bm in preparazione'],
      icon: iconDev,
      title: 'Bm in preparazione',
      text: 'Bm in preparazione',
      showText: true,
    },
    {
      otherReparto: 'elettrico',
      whenStates: ['Macchina in cablaggio'],
      icon: iconDev,
      title: 'Macchina in cablaggio',
      text: 'Macchina in cablaggio',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Bm pronto'],
      icon: iconDev,
      title: 'BM pronto',
      text: 'BM pronto',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Macchina in collaudo'],
      icon: iconDev,
      title: 'Collaudo elettrico',
      text: 'Collaudo elettrico',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Macchina in smontaggio'],
      icon: iconDev,
      title: 'Macchina in smontaggio',
      text: 'Macchina in smontaggio',
      showText: true,
    },

    {
      otherReparto: 'elettrico',
      whenStates: ['Completate'],
      icon: iconDone,
      title: 'Elettrico completato',
      text: 'Elettrico completato',
      showText: true,
    },

    /* MECCANICO */
    {
      otherReparto: 'meccanico',
      whenStates: ['Montaggio programmato'],
      icon: iconDev,
      title: 'Montaggio programmato',
      text: 'Montaggio programmato',
      showText: true,
    },
    {
      otherReparto: 'meccanico',
      whenStates: ['Montaggio in corso'],
      icon: iconDev,
      title: 'Montaggio in corso',
      text: 'Montaggio in corso',
      showText: true,
    },
    {
      otherReparto: 'meccanico',
      whenStates: [' Smontaggio completato'],
      icon: iconOk,
      title: 'Smontaggio completato',
      text: 'Smontaggio completato',
      showText: true,
    },
  ],
};
