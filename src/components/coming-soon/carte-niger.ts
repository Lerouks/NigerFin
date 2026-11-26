/**
 * Le Niger en points, né pour l'ancienne page d'attente ; sert à la page Niger et aux images de partage des fiches entreprises.
 *
 * Fichier produit le 23/11/2026, ne pas modifier à la main. Contour du pays :
 * Natural Earth 1:50 m (domaine public), 255 sommets ; la frontière
 * sud-est suit la Komadougou Yobé jusqu'au lac Tchad. Projection
 * équirectangulaire corrigée à la latitude moyenne, ramenée à une toile de
 * 1000 × 785. Points sur une grille de 13 : chaque ligne donne des plages
 * [première colonne, dernière colonne, …] de points dans le pays (2496
 * points en tout). Villes : les huit chefs-lieux de région et Arlit, à leurs
 * coordonnées publiques. Diffa est collée à la frontière (la Komadougou Yobé) :
 * à sa vraie place (787,8 ; 677,5), elle tombait sous la dernière rangée de
 * points, hors du pays. Elle est posée sur le point du pays le plus proche,
 * 8 px au nord (un point couvre environ 20 km). Corrigé le 24/11/2026.
 */
export const CARTE_NIGER = {
  largeur: 1000,
  hauteur: 785,
  pas: 13,
  lignes: [
    [57, 59],
    [55, 63],
    [53, 65],
    [52, 66, 71, 71],
    [50, 67, 69, 71],
    [49, 72],
    [47, 72],
    [45, 72],
    [44, 72],
    [42, 72],
    [40, 72],
    [39, 73],
    [37, 74],
    [36, 74],
    [34, 74],
    [33, 75],
    [32, 76],
    [31, 75],
    [30, 75],
    [29, 75],
    [28, 75],
    [24, 75],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 74],
    [20, 73],
    [20, 72],
    [19, 71],
    [19, 70],
    [18, 69],
    [18, 68],
    [17, 68],
    [14, 14, 16, 67],
    [5, 66],
    [4, 66],
    [0, 65],
    [0, 65],
    [0, 64],
    [1, 64],
    [1, 64],
    [2, 24, 27, 64],
    [3, 20, 30, 63],
    [4, 18, 31, 61],
    [4, 18, 32, 35, 39, 47, 57, 59],
    [4, 18, 33, 33, 41, 46],
    [5, 18, 43, 45],
    [7, 7, 10, 17],
    [10, 16],
    [9, 10, 14, 16],
    [10, 10, 15, 16],
    [16, 16],
  ] as number[][],
  villes: [
    { nom: 'Niamey', x: 124.2, y: 664.5 },
    { nom: 'Tillabéri', x: 81.6, y: 618.0 },
    { nom: 'Dosso', x: 191.8, y: 695.2 },
    { nom: 'Tahoua', x: 323.0, y: 573.0 },
    { nom: 'Maradi', x: 439.1, y: 665.2 },
    { nom: 'Zinder', x: 558.5, y: 645.0 },
    { nom: 'Agadez', x: 495.4, y: 434.6 },
    { nom: 'Diffa', x: 786.5, y: 669.5 },
    { nom: 'Arlit', x: 457.1, y: 317.5 },
  ],
};
