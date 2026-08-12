// Données locales des communes du Douaisis couvertes par ATRIUM.
// Source de vérité du moteur de pages commune et du hub /gestion-locative.
// Chaque commune porte un contenu local réel et différencié (anti page satellite).

const COMMUNES = [
  {
    slug: "douai", nom: "Douai", cp: "59500", pilier: true,
    href: "/gestion-locative-douai",
    angle: "Le cœur du Douaisis, siège de notre cabinet.",
    local: "Douai, préfecture historique du Douaisis, réunit un centre ancien recherché, des résidences de standing et un large parc de maisons de ville. C'est ici, 10 rue Saint-Jacques, que notre cabinet gère votre bien depuis vingt ans.",
    reperes: ["Centre historique", "Quartier de la Gare", "Frais-Marais", "Le Raquet"],
    voisins: ["sin-le-noble", "cuincy", "waziers"]
  },
  {
    slug: "sin-le-noble", nom: "Sin-le-Noble", cp: "59450",
    angle: "La demande locative de proximité, aux portes de Douai.",
    local: "Deuxième ville du Douaisis, limitrophe de Douai au sud-est, Sin-le-Noble offre un parc dense et varié : habitat de ville, résidences collectives et pavillonnaire familial. La proximité des services, des écoles et des transports entretient une demande locative soutenue et régulière.",
    reperes: ["Centre", "Écoquartier du Raquet", "Les Épis"],
    voisins: ["douai", "dechy", "guesnain"]
  },
  {
    slug: "waziers", nom: "Waziers", cp: "59119",
    angle: "L'ancrage minier, à cinq minutes du centre de Douai.",
    local: "Commune limitrophe au nord de Douai, Waziers porte l'héritage du bassin minier. Ses corons et cités rénovés forment un habitat populaire très recherché en location pour sa proximité immédiate du centre de Douai et de la gare.",
    reperes: ["Centre", "Notre-Dame", "Cités minières"],
    voisins: ["douai", "lallaing", "sin-le-noble"]
  },
  {
    slug: "auby", nom: "Auby", cp: "59950",
    angle: "Une demande familiale stable au nord du Douaisis.",
    local: "Au nord du Douaisis, Auby conjugue un passé industriel marqué et un habitat mêlant cités minières et pavillonnaire. La commune attire une demande locative familiale stable, à la recherche de maisons et de grands appartements.",
    reperes: ["Centre", "Cité des Asturies", "Secteur de l'Église"],
    voisins: ["flers-en-escrebieux", "roost-warendin", "douai"]
  },
  {
    slug: "flers-en-escrebieux", nom: "Flers-en-Escrebieux", cp: "59128",
    angle: "Le résidentiel pavillonnaire au nord-ouest de Douai.",
    local: "Aux portes nord-ouest de Douai, Flers-en-Escrebieux est une commune résidentielle et pavillonnaire, bien reliée aux grands axes. La demande y porte surtout sur les maisons et les logements familiaux de type T3 et T4.",
    reperes: ["Centre", "Secteur de la Gare", "Quartier des Étangs"],
    voisins: ["douai", "cuincy", "auby"]
  },
  {
    slug: "cuincy", nom: "Cuincy", cp: "59553",
    angle: "Le résidentiel prisé, à deux pas du centre de Douai.",
    local: "À l'ouest immédiat de Douai, Cuincy est une commune résidentielle prisée pour sa proximité du centre et de la gare. Son parc pavillonnaire et son petit collectif y entretiennent une demande locative qualitative et régulière.",
    reperes: ["Centre", "Le Bas-Terroir", "Secteur des écoles"],
    voisins: ["douai", "flers-en-escrebieux", "lambres-lez-douai"]
  },
  {
    slug: "lambres-lez-douai", nom: "Lambres-lez-Douai", cp: "59552",
    angle: "Un cadre verdoyant le long de la Scarpe.",
    local: "Au sud de Douai, le long de la Scarpe, Lambres-lez-Douai séduit par son cadre verdoyant et son habitat résidentiel de qualité. La demande locative y est exigeante, portée par des maisons et des logements de bon standing.",
    reperes: ["Centre", "Bords de Scarpe", "Quartier résidentiel"],
    voisins: ["douai", "cuincy", "dechy"]
  },
  {
    slug: "dechy", nom: "Dechy", cp: "59187",
    angle: "Un habitat mixte, entre corons et pavillonnaire.",
    local: "Au sud-est de Douai, Dechy est une ancienne commune minière au tissu résidentiel mixte, entre corons rénovés et pavillonnaire. Sa position et ses prix accessibles soutiennent une demande locative de proximité continue.",
    reperes: ["Centre", "Cités", "Secteur pavillonnaire"],
    voisins: ["sin-le-noble", "lambres-lez-douai", "guesnain"]
  },
  {
    slug: "guesnain", nom: "Guesnain", cp: "59287",
    angle: "Le parc locatif accessible de l'héritage minier.",
    local: "Au sud-est du Douaisis, Guesnain porte l'empreinte du bassin minier avec ses corons et ses cités. La commune offre un parc locatif accessible, adapté aux primo-locataires et aux familles, dans un secteur bien desservi vers Douai.",
    reperes: ["Centre", "Cités minières", "Secteur des écoles"],
    voisins: ["dechy", "sin-le-noble", "lallaing"]
  },
  {
    slug: "roost-warendin", nom: "Roost-Warendin", cp: "59286",
    angle: "Le pavillonnaire familial, au contact de la nature.",
    local: "Au nord du Douaisis, Roost-Warendin est une commune résidentielle appréciée pour son cadre pavillonnaire et sa proximité des espaces naturels. La demande y porte sur des maisons familiales, dans un environnement calme et verdoyant.",
    reperes: ["Centre", "Château de Bernicourt", "Secteur pavillonnaire"],
    voisins: ["auby", "lallaing", "flers-en-escrebieux"]
  },
  {
    slug: "lallaing", nom: "Lallaing", cp: "59167",
    angle: "Le résidentiel de la vallée de la Scarpe.",
    local: "Au nord-est de Douai, le long de la Scarpe, Lallaing est une commune résidentielle qui fait le lien entre le Douaisis et l'Ostrevent. Son habitat pavillonnaire et ses maisons de caractère nourrissent une demande locative fidèle.",
    reperes: ["Centre", "Bords de Scarpe", "Le Marais"],
    voisins: ["waziers", "roost-warendin", "raches"]
  },
  {
    slug: "raches", nom: "Râches", cp: "59194",
    angle: "La commune verte et paisible du nord-est.",
    local: "Petite commune résidentielle et verte du nord-est du Douaisis, Râches attire une demande de maisons familiales, dans un cadre paisible à proximité de Douai et des grands axes. Un secteur calme, prisé des locataires en recherche de tranquillité.",
    reperes: ["Centre", "Secteur pavillonnaire", "Abords de la Scarpe"],
    voisins: ["lallaing", "roost-warendin", "waziers"]
  }
];

export const bySlug = (s) => COMMUNES.find((c) => c.slug === s);
export const generables = COMMUNES.filter((c) => !c.pilier);
export const hrefOf = (c) => c.pilier ? c.href : ("/gestion-locative/" + c.slug);
export default COMMUNES;
