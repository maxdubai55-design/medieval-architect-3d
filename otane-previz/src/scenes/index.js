// Ordre de la bobine de démonstration.
export const SCENES = [
  { id: '00', title: 'Ouverture', chapter: 'Générique', load: () => import('./s00-ouverture.js') },
  { id: '01', title: 'Le cimetière de Sol', chapter: 'Chapitre 1', load: () => import('./s01-cimetiere.js') },
  { id: '02', title: 'La balise morte', chapter: 'Chapitre 2', load: () => import('./s02-balise.js') },
  { id: '03', title: 'Le Sillage', chapter: 'Chapitre 3', load: () => import('./s03-sillage.js') },
  { id: '04', title: "L'Indocile", chapter: 'Chapitres 5 et 6', load: () => import('./s04-indocile.js') },
  { id: '05', title: 'Ardent-Six', chapter: 'Chapitre 7', load: () => import('./s05-ardent.js') },
  { id: '06', title: 'La chambre du Cœur', chapter: 'Chapitre 11', load: () => import('./s06-coeur.js') },
  { id: '07', title: 'Korren', chapter: 'Chapitre 14', load: () => import('./s07-korren.js') },
  { id: '08', title: 'Quatre-vingt-dix-sept pour cent', chapter: 'Chapitres 20 et 21', load: () => import('./s08-97.js') },
  { id: '09', title: 'Le Miroir se brise', chapter: 'Chapitre 22', load: () => import('./s09-miroir.js') },
  { id: '10', title: 'Le point aveugle', chapter: 'Chapitre 23', load: () => import('./s10-point-aveugle.js') },
  { id: '11', title: 'Douze', chapter: 'Chapitre 24', load: () => import('./s11-douze.js') },
];
