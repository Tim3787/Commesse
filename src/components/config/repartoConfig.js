const repartoConfig = {
  software: { 
    RepartoID: 1, 
    RepartoName: "software", 
    sharedReparti: ["service"], 
    defaultServiceResourceId: 51  // ID della risorsa di default per "software"
  },
  elettrico: { 
    RepartoID: 2, 
    RepartoName: "elettrico", 
    sharedReparti: ["service"], 
    defaultServiceResourceId: 49  // ID della risorsa di default per "elettrico"
  },
    meccanico: { 
    RepartoID: 3, 
    RepartoName: "meccanico", 
    sharedReparti: ["service"], 
    defaultServiceResourceId: 50  // ID della risorsa di default per "elettrico"
  },
  service: { 
    RepartoID: 18, 
    RepartoName: "service", 
    defaultServiceResourceId: null  // ID di default per il reparto "service"
  },
  
  quadristi: { 
    RepartoID: 15, 
    RepartoName: "quadristi", 
    defaultServiceResourceId: 94 // ID della risorsa di default per "quadristi"
  },
  tecnicoelettrico: { 
    RepartoID: 14, 
    RepartoName: "tecnico elettrico", 
    defaultServiceResourceId: 94 // ID della risorsa di default per "quadristi"
  },

};


export default repartoConfig;
