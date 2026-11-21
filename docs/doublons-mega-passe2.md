# Doublons sur MEGA — passe 2 (contenu + métadonnées, en local)

Produit par `npm run duplicates -w server -- <dossier books>` sur la copie locale de `mega:Library` (2026-11-21). Rien n'a été modifié sur MEGA.

- **fichiers identiques** : même SHA-256, donc strictement le même fichier.
- **même titre et auteurs** : métadonnées EPUB identiques (insensible casse/accents), fichiers différents. Dans 282 groupes sur 301, l'écart de taille est < 10 % : même EPUB re-sauvegardé.
- Fichier proposé à garder : sans marqueur de copie (`(2)`, `copie`), puis le plus gros, puis le chemin le plus court.
- Liste des 329 fichiers à déplacer : `data/doublons-a-deplacer.txt` (ignoré par git).

## À regarder à la main — 19 groupes où les fichiers diffèrent de plus de 10 % (édition différente, images incluses ou non)

- Ceci n'est pas un fait divers — Philippe BESSON, Philippe Besson : `ceci-n-est-pas-un-fait-divers_bookys.epub` (5443 Ko), `Books/B/Philippe Besson/PHILIPPE_BESSON__CECI_N_EST_PAS_UN_FAIT_DIVERS.epub` (346 Ko)
- Comme un empire dans un empire — Alice Zeniter : `Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE_2020.epub` (6008 Ko), `Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE_1.epub` (5935 Ko), `Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE.epub` (903 Ko), `Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE (2).epub` (831 Ko)
- De Marquette à Veracruz — Harrison, Jim : `Books/H/Jim Harrison/JIM_HARRISON__MARQUETTE_A_VERACRUZ_DE.epub` (514 Ko), `Books/H/Jim Harrison/JIM_HARRISON__DE_MARQUETTE_A_VERACRUZ.epub` (455 Ko)
- DRACULA — Bram Stoker : `Books/S/Bram Stoker/BRAM_STOKER__1897_DRACULA.epub` (459 Ko), `Books/S/Bram Stoker/BRAM_STOKER__DRACULA.epub` (302 Ko), `Books/S/Bram Stoker/STOKER_BRAM__DRACULA.epub` (301 Ko)
- Fils de personne — Jean-François Pasques : `Books/P/Jean-Francois Pasques/JEAN_FRANCOIS_PASQUES__FILS_DE_PERSONNE.epub` (305 Ko), `Books/P/Jean-Francois Pasques/JEAN_FRANCOIS_PASQUES__FILS_DE_PERSONNE (2).epub` (355 Ko)
- James E.L. - Cinquante nuances de Grey - Fifty Shades Of Grey T1 — Athame : `Books/A/Athame/ATHAME__JAMES_E_L_CINQUANTE_NUANCES_DE_GREY_FIFTY_SHADES_OF_GREY_T1.epub` (470 Ko), `Books/A/Athame/ATHAME__JAMES_E_L_CINQUANTE_NUANCES_DE_GREY_FIFTY_SHADES_OF_GREY_T1 (2).epub` (658 Ko)
- L'insoutenable légéreté de l'être — Milan Kundera : `Books/K/Milan Kundera/MILAN_KUNDERA__L_INSOUTENABLE_LEGERETE_DE_L_ETRE.epub` (5292 Ko), `Legerete.epub` (321 Ko)
- La criminologie pour les nuls — Alain Bauer, Christophe Soullez : `Books/S/Alain Bauer Christophe Soullez/ALAIN_BAUER_CHRISTOPHE_SOULLEZ__CRIMINOLOGIE_POUR_LES_NULS_LA_1.epub` (6224 Ko), `Books/B/Alain Bauer/ALAIN_BAUER__LA_CRIMINOLOGIE_POUR_LES_NULS.epub` (6224 Ko), `Books/S/Alain Bauer Christophe Soullez/Alain Bauer & Christophe Soullez_criminologie pour les nuls, La.epub` (833 Ko), `Books/S/Alain Bauer Christophe Soullez/Alain Bauer & Christophe Soullez_La Criminologie Pour les Nuls.epub` (833 Ko), `Books/L/Pour les Nuls/POUR_LES_NULS__LA_CRIMINOLOGIE.epub` (833 Ko), `Books/S/Alain Bauer Christophe Soullez/ALAIN_BAUER_CHRISTOPHE_SOULLEZ__LA_CRIMINOLOGIE_POUR_LES_NULS.epub` (833 Ko)
- La Faille — Franck Thilliez : `La.Faille.2023.Franck.Thilliez.epub` (5293 Ko), `Books/T/Franck Thilliez/FRANCK_THILLIEZ__FAILLE_LA_1.epub` (482 Ko), `Books/T/Franck Thilliez/FRANCK_THILLIEZ__LA_FAILLE.epub` (481 Ko), `Books/T/Franck Thilliez/FRANCK_THILLIEZ__LA_FAILLE (2).epub` (5294 Ko)
- La Ferme des animaux — George Orwell : `Books/O/George Orwell/GEORGE_ORWELL__LA_FERME_DES_ANIMAUX.epub` (109 Ko), `Books/O/George Orwell/GEORGE_ORWELL__LA_FERME_DES_ANIMAUX (2).epub` (141 Ko)
- La grande épreuve — Etienne de Montety : `Books/D/Etienne de Montety/ETIENNE_DE_MONTETY__LA_GRANDE_EPREUVE.epub` (323 Ko), `Books/D/Etienne de Montety/ETIENNE_DE_MONTETY__LA_GRANDE_EPREUVE (2).epub` (534 Ko)
- La guerre des pauvres — Eric Vuillard : `Books/V/Eric Vuillard/ERIC_VUILLARD__LA_GUERRE_DES_PAUVRES.epub` (58 Ko), `Books/V/Eric Vuillard/ERIC_VUILLARD__LA_GUERRE_DES_PAUVRES (2).epub` (78 Ko)
- La guerre du pavot — R. f. Kuang : `Books/K/R. F. Kuang/R_F_KUANG__LA_GUERRE_DU_PAVOT.epub` (832 Ko), `Books/K/R. F. Kuang/R_F_KUANG__LA_GUERRE_DU_PAVOT (2).epub` (991 Ko)
- La justice des hommes — Santiago H. Amigorena : `Books/A/Santiago H. Amigorena/SANTIAGO_H_AMIGORENA__LA_JUSTICE_DES_HOMMES.epub` (253 Ko), `Books/A/Santiago H. Amigorena/SANTIAGO_H_AMIGORENA__LA_JUSTICE_DES_HOMMES (2).epub` (357 Ko)
- Le Manuscrit inachevé — Franck THILLIEZ : `Books/T/Franck Thilliez/FRANCK_THILLIEZ__LE_MANUSCRIT_INACHEVE.epub` (502 Ko), `Books/T/Franck Thilliez/FRANCK_THILLIEZ__LE_MANUSCRIT_INACHEVE (2).epub` (594 Ko)
- Le ministère du futur — Kim Stanley Robinson : `Books/R/Kim Stanley Robinson/Kim Stanley Robinson_Ministère du futur, Le.epub` (905 Ko), `Books/R/Kim Stanley Robinson/Le ministère du futur (Kim Stanley Robinson) (Z-Library).epub` (904 Ko), `Books/R/Kim Stanley Robinson/KIM_STANLEY_ROBINSON__LE_MINISTERE_DU_FUTUR.epub` (733 Ko), `Books/R/Kim Stanley Robinson/KIM_STANLEY_ROBINSON__LE_MINISTERE_DU_FUTUR (2).epub` (733 Ko)
- Le passeur — Stéphanie Coste : `Books/C/Stephanie Coste/STEPHANIE_COSTE__LE_PASSEUR.epub` (5317 Ko), `Books/C/Stephanie Coste/STEPHANIE_COSTE__LE_PASSEUR (3).epub` (213 Ko), `Books/C/Stephanie Coste/STEPHANIE_COSTE__LE_PASSEUR (2).epub` (213 Ko)
- Little America — Bromell, Henry : `Books/B/Henry Bromell/HENRY_BROMELL__LITTLE_AMERICA.epub` (703 Ko), `Books/B/Henry Bromell/HENRY_BROMELL__LITTLE_AMERICA (2).epub` (795 Ko)
- Traité sur l’intolérance — Richard Malka : `Traite sur l intolerance.epub` (5485 Ko), `Traite sur l intolerance 2.epub` (137 Ko), `Books/M/Richard Malka/RICHARD_MALKA__TRAITE_SUR_L_INTOLERANCE (3).epub` (137 Ko)

## Liste complète

```
914 EPUB analysés, 315 groupes, 329 doublons proposés

## « Vous êtes l'amour malheureux du Führer » — Jean-Noël Orengo, Orengo Jean-Noël (même titre et auteurs)
  garder   Books/J/Jean-Noël Orengo & Orengo Jean-Noël/JEAN_NOEL_ORENGO_ORENGO_JEAN_NOEL__VOUS_ETES_L_AMOUR_MALHEUREUX_DU_FUHRER.epub (356 Ko)
  doublon  Books/O/Jean-Noël Orengo/JEAN_NOEL_ORENGO__VOUS_ETES_LAMOUR_MALHEUREUX_DU_FUHRER.epub (355 Ko)

## 1 - Binding 13: Boys of Tommen — Chloe Walsh (même titre et auteurs)
  garder   Books/W/Chloe Walsh 1/CHLOE_WALSH_1__BINDING_13_BOYS_OF_TOMMEN.epub (739 Ko)
  doublon  Books/W/Chloe Walsh/CHLOE_WALSH__BINDING_13.epub (739 Ko)

## 1 kilo de culture générale — Florence Braunstein (même titre et auteurs)
  garder   Books/B/Florence Braunstein/FLORENCE_BRAUNSTEIN__1_KILO_DE_CULTURE_GENERALE.epub (5.6 Mo)
  doublon  Books/B/Jean-François Pepin Florence Braunstein/FLORENCE_BRAUNSTEIN_JEAN_FRANCOIS_PEPIN__1_UN_KILO_DE_CULTURE_GENERALE.epub (5.6 Mo)

## 1. L'école du bien et du mal (French Edition) — CHAINANI, Soman (même titre et auteurs)
  garder   Books/C/Soman Chainani/SOMAN_CHAINANI__1_L_ECOLE_DU_BIEN_ET_DU_MAL_FRENCH_EDITION.epub (2.3 Mo)
  doublon  Books/C/Soman Chainani/SOMAN_CHAINANI__LECOLE_DU_BIEN_ET_DU_MAL_T1.epub (2.3 Mo)

## 19 h 59 — David Dufresne (même titre et auteurs)
  garder   Books/D/David Dufresne/DAVID_DUFRESNE__19_H_59.epub (149 Ko)
  doublon  Books/D/David Dufresne/DAVID_DUFRESNE__19H59.epub (149 Ko)

## 1984 — George Orwell (même titre et auteurs)
  garder   Books/O/George Orwell/GEORGE_ORWELL__1984.epub (344 Ko)
  doublon  EBOOK George Orwell 1984.epub (344 Ko)

## 1991 — Franck Thilliez (même titre et auteurs)
  garder   1991.epub (5.4 Mo)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__1991.epub (5.4 Mo)

## 2023 - Tsunami — Dugain, Marc (même titre et auteurs)
  garder   Books/D/Marc Dugain/MARC_DUGAIN__2023_TSUNAMI.epub (5.2 Mo)
  doublon  Books/T/Tsunami/TSUNAMI__MARC_DUGAIN.epub (5.2 Mo)

## 2025 - Survivantes — Sire, Cédric (même titre et auteurs)
  garder   Books/S/Cédric Sire/CEDRIC_SIRE__2025_SURVIVANTES.epub (545 Ko)
  doublon  Books/S/Cédric Sire/CEDRIC_SIRE__SURVIVANTES.epub (545 Ko)

## 2084 — Sansal, Boualem (même titre et auteurs)
  garder   Books/S/Boualem Sansal/BOUALEM_SANSAL__2084.epub (647 Ko)
  doublon  Books/S/Boualem Sansal/BOUALEM_SANSAL__2084 (2).epub (647 Ko)

## 365 jours - Tome 1 — Lipinska, Blanka (même titre et auteurs)
  garder   Books/L/Blanka Lipinska/BLANKA_LIPINSKA__365_JOURS_TOME_1.epub (432 Ko)
  doublon  Books/L/Blanka Lipinska/BLANKA_LIPINSKA__365_JOURS_TOME_1 (2).epub (432 Ko)

## 50 notions clés sur l'Europe pour les Nuls — Thibaut CAULIER, Sylvie GOULARD (même titre et auteurs)
  garder   Books/C/Sylvie Goulard Thibaut Caulier/SYLVIE_GOULARD_THIBAUT_CAULIER__50_NOTIONS_CLES_SUR_L_EUROPE_POUR_LES_NULS.epub (490 Ko)
  doublon  Books/C/Sylvie Goulard Thibaut Caulier/THIBAUT_CAULIER_SYLVIE_GOULARD__50_NOTIONS_CLES_SUR_L_EUROPE_POUR_LES_NULS.epub (490 Ko)

## A Heartbeat Away — Michael Palmer (même titre et auteurs)
  garder   Books/P/Michael Palmer/MICHAEL_PALMER__A_HEARTBEAT_AWAY.epub (894 Ko)
  doublon  Books/P/Michael Palmer/MICHAEL_PALMER__A_HEARTBEAT_AWAY (2).epub (894 Ko)

## Aatea — Anouck Faure (même titre et auteurs)
  garder   Books/F/Anouck Faure/ANOUCK_FAURE__AATEA.epub (7.4 Mo)
  doublon  Books/F/Anouck Faure/ANOUCK_FAURE__AATEA (2).epub (7.4 Mo)

## Aliène (Rentrée littéraire hiver 2024) — Phœbe Hadjimarkos Clarke (même titre et auteurs)
  garder   Books/C/Phoebe Hadjimarkos Clarke/PH_BE_HADJIMARKOS_CLARKE__ALIENE_RENTREE_LITTERAIRE_HIVER_2024.epub (313 Ko)
  doublon  Books/C/Phoebe Hadjimarkos Clarke/PHOEBE_HADJIMARKOS_CLARKE__ALIENE.epub (312 Ko)

## American Dirt — Jeanine Cummins (même titre et auteurs)
  garder   Books/C/Jeanine Cummins/JEANINE_CUMMINS__AMERICAN_DIRT.epub (568 Ko)
  doublon  Books/C/Jeanine Cummins/JEANINE_CUMMINS__AMERICAN_DIRT (2).epub (568 Ko)

## Analyser un film — Jullier, Laurent (même titre et auteurs)
  garder   Books/J/Laurent Jullier/LAURENT_JULLIER__ANALYSER_UN_FILM.epub (2.3 Mo)
  doublon  Books/J/Laurent Jullier/LAURENT_JULLIER__ANALYSER_UN_FILM (2).epub (2.3 Mo)

## Annales Du Disque-Monde 01 - La Huitième Couleur — Terry Pratchett (même titre et auteurs)
  garder   Books/P/Terry Pratchett/TERRY_PRATCHETT__ANNALES_DU_DISQUE_MONDE_01_LA_HUITIEME_COULEUR.epub (380 Ko)
  doublon  Books/P/Terry Pratchett/TERRY_PRATCHETT__DISQUE_MONDE_T01_LA_HUITIEME_COULEUR.epub (380 Ko)

## Après le jour — Christophe Molmy (même titre et auteurs)
  garder   Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__APRES_LE_JOUR.epub (360 Ko)
  doublon  Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__APRES_LE_JOUR (2).epub (360 Ko)

## Arène — Negar Djavadi (même titre et auteurs)
  garder   Books/D/Negar Djavadi/NEGAR_DJAVADI__ARENE.epub (656 Ko)
  doublon  Books/D/Negar Djavadi/NEGAR_DJAVADI__ARENE (2).epub (656 Ko)

## Article 353 du code pénal — Tanguy Viel (même titre et auteurs)
  garder   Books/T/Viel Tanguy/TANGUY_VIEL__ARTICLE_353_DU_CODE_PENAL.epub (179 Ko)
  doublon  Books/T/Viel Tanguy/VIEL_TANGUY__ARTICLE_353_DU_CODE_PENAL.epub (179 Ko)

## Atlas géopolitique du monde contemporain — Romain Bertolino, Alexandre Negrus, Nato Tardieu (fichiers identiques)
  garder   Books/C/Atlas Geopolitique du Monde Con/ATLAS_GEOPOLITIQUE_DU_MONDE_CON__ROMAIN_BERTOLINO.epub (26.8 Mo)
  doublon  Books/C/Atlas Geopolitique du Monde Con/ATLAS_GEOPOLITIQUE_DU_MONDE_CON__ROMAIN_BERTOLINO_2.epub (26.8 Mo)

## Atlas géopolitique du monde contemporain — Romain Bertolino, Alexandre Negrus, Nato Tardieu (même titre et auteurs)
  garder   Books/T/Romain Bertolino & Alexandre Negrus & Nato Tardieu/ROMAIN_BERTOLINO_ALEXANDRE_NEGRUS_NATO_TARDIEU__ATLAS_GEOPOLITIQUE_DU_MONDE_CONTEMPORAIN.epub (26.8 Mo)
  doublon  Books/C/Atlas Geopolitique du Monde Con/ATLAS_GEOPOLITIQUE_DU_MONDE_CON__ROMAIN_BERTOLINO.epub (26.8 Mo)

## Aucun respect — Emmanuelle Lambert (même titre et auteurs)
  garder   Books/L/Emmanuelle Lambert/EMMANUELLE_LAMBERT__AUCUN_RESPECT.epub (384 Ko)
  doublon  Books/L/Emmanuelle Lambert/EMMANUELLE_LAMBERT__AUCUN_RESPECT (2).epub (384 Ko)

## Autobiographie d'un poulpe — Vinciane Despret (même titre et auteurs)
  garder   Books/D/Vinciane Despret/VINCIANE_DESPRET__AUTOBIOGRAPHIE_D_UN_POULPE.epub (208 Ko)
  doublon  Books/D/Vinciane Despret/VINCIANE_DESPRET__AUTOBIOGRAPHIE_DUN_POULPE_ET_AUTRES_RECITS_DANTICIPATION.epub (207 Ko)

## Aventures d’un gourmand vagabond — Harrison, Jim (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__AVENTURES_D_UN_GOURMAND_VAGABOND.epub (467 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__AVENTURES_D_UN_GOURMAND_VAGABOND (2).epub (467 Ko)

## BABEL: OR THE NECESSITY OF VIOLENCE: AN ARCANE HISTORY OF THE OXFORD TRANSLATORS' REVOLUTION — R. F. Kuang (même titre et auteurs)
  garder   Books/K/R. F. Kuang/R_F_KUANG__BABEL_OR_THE_NECESSITY_OF_VIOLENCE_AN_ARCANE_HISTORY_OF_THE_OXFORD_TRANSLATORS_REVOLUTION.epub (1.1 Mo)
  doublon  Books/K/R. F. Kuang/R_F_KUANG__BABEL_OR_THE_NECESSITY_OF_VIOLENCE_AN_ARCANE_HISTORY_OF_THE_OXFORD_TRANSLATORS_REVOLUTION (2).epub (1.1 Mo)

## Beautiful Bastard - Version Française - (French Edition) — Lauren, Christina (même titre et auteurs)
  garder   Books/L/Christina Lauren/CHRISTINA_LAUREN__BEAUTIFUL_BASTARD_VERSION_FRANCAISE_FRENCH_EDITION.epub (2.0 Mo)
  doublon  Books/L/Christina Lauren/LAUREN_CHRISTINA__BEAUTIFUL_BASTARD_VERSION_FRANCAISE_FRENCH_EDITION.epub (2.0 Mo)

## Betty — Tiffany McDaniel (même titre et auteurs)
  garder   Books/M/Tiffany McDaniel/TIFFANY_MCDANIEL__BETTY.epub (591 Ko)
  doublon  Books/M/Tiffany McDaniel/TIFFANY_MCDANIEL__BETTY (2).epub (591 Ko)

## Bien-être — Nathan Hill (même titre et auteurs)
  garder   Books/H/Nathan Hill/NATHAN_HILL__BIEN_ETRE.epub (910 Ko)
  doublon  Books/H/Nathan Hill/NATHAN_HILL__BIEN_ETRE (2).epub (910 Ko)

## Bleus, Blancs, Rouges — Dierstein, Benjamin (même titre et auteurs)
  garder   Books/D/Benjamin Dierstein/BENJAMIN_DIERSTEIN__BLEUS_BLANCS_ROUGES.epub (868 Ko)
  doublon  Books/D/Benjamin Dierstein/BENJAMIN_DIERSTEIN__BLEUS_BLANCS_ROUGES (2).epub (869 Ko)

## Blizzard — Marie Vingtras (même titre et auteurs)
  garder   Books/V/Marie Vingtras/MARIE_VINGTRAS__BLIZZARD.epub (5.1 Mo)
  doublon  Books/V/Marie Vingtras/MARIE_VINGTRAS__BLIZZARD (2).epub (5.1 Mo)

## Body of Secrets: Anatomy of the Ultra-Secret National Security Agency — James Bamford (même titre et auteurs)
  garder   Books/B/James Bamford/JAMES_BAMFORD__BODY_OF_SECRETS_ANATOMY_OF_THE_ULTRA_SECRET_NATIONAL_SECURITY_AGENCY.epub (798 Ko)
  doublon  Books/B/James Bamford/JAMES_BAMFORD__BODY_OF_SECRETS_ANATOMY_OF_THE_ULTRA_SECRET_NATIONAL_SECURITY_AGENCY (2).epub (798 Ko)

## Bond 01 - Casino Royale — Ian Fleming (même titre et auteurs)
  garder   Books/F/Ian Fleming/IAN_FLEMING__BOND_01_CASINO_ROYALE.epub (1.6 Mo)
  doublon  Books/F/Ian Fleming/IAN_FLEMING__CASINO_ROYALE.epub (1.6 Mo)

## Boys of Tommen 1 - Binding 13 — Chloe Walsh (même titre et auteurs)
  garder   Books/W/Chloe Walsh/CHLOE_WALSH__BOYS_OF_TOMMEN_1_BINDING_13.epub (777 Ko)
  doublon  Books/W/Chloe Walsh/CHLOE_WALSH__BOYS_OF_TOMMEN_1_BINDING_13 (2).epub (777 Ko)

## Bristol — Echenoz, Jean, Jean Echenoz (même titre et auteurs)
  garder   Books/J/Echenoz Jean/ECHENOZ_JEAN__BRISTOL.epub (5.1 Mo)
  doublon  Books/E/Echenoz, Jean & Jean Echenoz/ECHENOZ_JEAN_JEAN_ECHENOZ__BRISTOL.epub (5.1 Mo)

## Bunny — Mona Awad (même titre et auteurs)
  garder   Books/A/Mona Awad/MONA_AWAD__BUNNY.epub (977 Ko)
  doublon  Books/A/Mona Awad/MONA_AWAD__BUNNY (2).epub (977 Ko)

## Call Me by Your Name — André Aciman (même titre et auteurs)
  garder   Books/A/André Aciman/ANDRE_ACIMAN__CALL_ME_BY_YOUR_NAME.epub (695 Ko)
  doublon  Books/A/André Aciman/ANDRE_ACIMAN__CALL_ME_BY_YOUR_NAME (2).epub (695 Ko)

## Ceci n'est pas un fait divers — Philippe BESSON, Philippe Besson (fichiers identiques)
  garder   ceci-n-est-pas-un-fait-divers_bookys.epub (5.3 Mo)
  doublon  Books/B/Philippe Besson/PHILIPPE_BESSON__CECI_N_EST_PAS_UN_FAIT_DIVERS (2).epub (5.3 Mo)

## Ceci n'est pas un fait divers — Philippe BESSON, Philippe Besson (même titre et auteurs)
  garder   ceci-n-est-pas-un-fait-divers_bookys.epub (5.3 Mo)
  doublon  Books/B/Philippe Besson/PHILIPPE_BESSON__CECI_N_EST_PAS_UN_FAIT_DIVERS.epub (347 Ko)

## Ceux qu’on sauve — Peter Swanson (même titre et auteurs)
  garder   Books/S/Peter Swanson/PETER_SWANSON__CEUX_QU_ON_SAUVE.epub (396 Ko)
  doublon  Books/S/Peter Swanson/PETER_SWANSON__CEUX_QU_ON_SAUVE (2).epub (396 Ko)

## Chats noirs — Véronique Rivat (même titre et auteurs)
  garder   Books/R/Véronique Rivat/VERONIQUE_RIVAT__CHATS_NOIRS.epub (1.6 Mo)
  doublon  Books/R/Véronique Rivat/VERONIQUE_RIVAT__CHATS_NOIRS (2).epub (1.6 Mo)

## Coeur — de Montaigu, Thibault, Thibault de Montaigu (même titre et auteurs)
  garder   Books/D/De Montaigu, Thibault & Thibault de Montaigu/DE_MONTAIGU_THIBAULT_THIBAULT_DE_MONTAIGU__COEUR.epub (476 Ko)
  doublon  Books/D/Thibault de Montaigu/THIBAULT_DE_MONTAIGU__COEUR.epub (476 Ko)

## Comme des dieux — Gérald Bronner (même titre et auteurs)
  garder   Books/B/Gerald Bronner/GERALD_BRONNER__COMME_DES_DIEUX.epub (337 Ko)
  doublon  Books/B/Gerald Bronner/GERALD_BRONNER__COMME_DES_DIEUX (2).epub (338 Ko)

## Comme un empire dans un empire — Alice Zeniter (même titre et auteurs)
  garder   Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE_2020.epub (5.9 Mo)
  doublon  Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE_1.epub (5.8 Mo)
  doublon  Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE.epub (904 Ko)
  doublon  Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE (2).epub (832 Ko)

## Conscience Contre Violence — Stefan Zweig (même titre et auteurs)
  garder   Books/Z/Stefan Zweig/STEFAN_ZWEIG__CONSCIENCE_CONTRE_VIOLENCE.epub (1.7 Mo)
  doublon  Books/Z/Stefan Zweig/STEFAN_ZWEIG__CONSCIENCE_CONTRE_VIOLENCE (2).epub (1.7 Mo)

## Dalva — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__DALVA.epub (444 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__DALVA (2).epub (445 Ko)

## Dans la forêt — Jean Hegland (même titre et auteurs)
  garder   Books/H/Jean Hegland/JEAN_HEGLAND__DANS_LA_FORET.epub (476 Ko)
  doublon  Books/H/Jean Hegland/JEAN_HEGLAND__DANS_LA_FORET (2).epub (476 Ko)

## Dans les yeux du procureur - Chronique de la justice ordinaire (French Edition) — Jeanne Quilfen (même titre et auteurs)
  garder   Books/Q/Jeanne Quilfen/JEANNE_QUILFEN__DANS_LES_YEUX_DU_PROCUREUR_CHRONIQUE_DE_LA_JUSTICE_ORDINAIRE_FRENCH_EDITION.epub (283 Ko)
  doublon  Books/Q/Jeanne Quilfen/JEANNE_QUILFEN__DANS_LES_YEUX_DU_PROCUREUR_CHRONIQUE_DE_LA_JUSTICE_ORDINAIRE_FRENCH_EDITION (2).epub (283 Ko)

## De Marquette à Veracruz — Harrison, Jim (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__MARQUETTE_A_VERACRUZ_DE.epub (514 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__DE_MARQUETTE_A_VERACRUZ.epub (455 Ko)

## De purs hommes — Mohamed Mbougar Sarr (même titre et auteurs)
  garder   Books/S/Mohamed Mbougar Sarr/MOHAMED_MBOUGAR_SARR__PURS_HOMMES_DE.epub (1.8 Mo)
  doublon  Books/S/Mohamed Mbougar Sarr/MOHAMED_MBOUGAR_SARR__DE_PURS_HOMMES.epub (1.8 Mo)

## Des milliards de tapis de cheveux — Andreas Eschbach (même titre et auteurs)
  garder   Books/E/Andreas Eschbach/ANDREAS_ESCHBACH__DES_MILLIARDS_DE_TAPIS_DE_CHEVEUX.epub (1.2 Mo)
  doublon  Books/E/Andreas Eschbach/ANDREAS_ESCHBACH__DES_MILLIARDS_DE_TAPIS_DE_CHEVEUX (2).epub (1.2 Mo)

## Deux vérités, un mensonge — Claire Mcgowan (même titre et auteurs)
  garder   Books/M/Claire Mcgowan/CLAIRE_MCGOWAN__DEUX_VERITES_UN_MENSONGE.epub (845 Ko)
  doublon  Books/M/Claire Mcgowan/CLAIRE_MCGOWAN__DEUX_VERITES_UN_MENSONGE (2).epub (845 Ko)

## Dominique Barbéris — Une façon d'aimer (même titre et auteurs)
  garder   Books/D/Une Façon D'Aimer/UNE_FACON_D_AIMER__DOMINIQUE_BARBERIS.epub (203 Ko)
  doublon  Books/B/Dominique Barberis/DOMINIQUE_BARBERIS__UNE_FACON_D_AIMER.epub (203 Ko)

## DRACULA — Bram Stoker (même titre et auteurs)
  garder   Books/S/Bram Stoker/BRAM_STOKER__1897_DRACULA.epub (459 Ko)
  doublon  Books/S/Bram Stoker/BRAM_STOKER__DRACULA.epub (302 Ko)
  doublon  Books/S/Bram Stoker/STOKER_BRAM__DRACULA.epub (302 Ko)

## Dracula — Stoker, Bram (même titre et auteurs)
  garder   Books/S/Bram Stoker/Stoker, Bram_Dracula.epub (551 Ko)
  doublon  Books/S/Bram Stoker/STOKER_BRAM_STOKER_BRAM__DRACULA.epub (551 Ko)

## Dune — Herbert,Frank (même titre et auteurs)
  garder   Books/H/Frank Herbert/HERBERT_FRANK__DUNE.epub (782 Ko)
  doublon  Books/H/Frank Herbert/FRANK_HERBERT__DUNE_1_DUNE.epub (782 Ko)

## Edgar Allan Poe - Oeuvres — Edgar Allan Poe (même titre et auteurs)
  garder   Books/P/Edgar Allan Poe/EDGAR_ALLAN_POE__OEUVRES.epub (3.1 Mo)
  doublon  Books/P/Edgar Allan Poe/EDGAR_ALLAN_POE__EDGAR_ALLAN_POE_OEUVRES.epub (3.1 Mo)

## En marge — Harrison, Jim (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__EN_MARGE.epub (477 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__EN_MARGE (2).epub (477 Ko)

## En marge ; La route du retour ; De Marquette à VeraCruz — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__EN_MARGE_LA_ROUTE_DU_RETOUR_DE_MARQUETTE_A_VERACRUZ.epub (2.1 Mo)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__LA_ROUTE_DU_RETOUR.epub (2.1 Mo)

## En Route Vers l’Ouest — Harrison, Jim (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__EN_ROUTE_VERS_L_OUEST.epub (1.1 Mo)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__EN_ROUTE_VERS_L_OUEST (2).epub (1.3 Mo)

## En votre intime conviction — Clémentine Thiebault (même titre et auteurs)
  garder   Books/T/Clementine Thiebault/CLEMENTINE_THIEBAULT__EN_VOTRE_INTIME_CONVICTION.epub (283 Ko)
  doublon  Books/T/Clementine Thiebault/CLEMENTINE_THIEBAULT__EN_VOTRE_INTIME_CONVICTION (2).epub (284 Ko)

## Encyclopédie des répliques de films Tome 1 — Philippe Durant (même titre et auteurs)
  garder   Books/D/Philippe Durant/PHILIPPE_DURANT__ENCYCLOPEDIE_DES_REPLIQUES_DE_FILMS_TOME_1.epub (423 Ko)
  doublon  Books/D/Philippe Durant/PHILIPPE_DURANT__ENCYCLOPEDIE_DES_REPLIQUES_DE_FILMS.epub (423 Ko)

## Encyclopédie des Répliques de Films Tome 2 — Durant Philippe (même titre et auteurs)
  garder   Books/D/Philippe Durant/DURANT_PHILIPPE__ENCYCLOPEDIE_DES_REPLIQUES_DE_FILMS_TOME_2.epub (405 Ko)
  doublon  Books/D/Philippe Durant/PHILIPPE_DURANT__ENCYCLOPEDIE_DES_REPLIQUES_DE_FILMS_T2.epub (405 Ko)

## Entretien avec un cadavre — Philippe Boxho Dr (même titre et auteurs)
  garder   Books/D/Philippe Boxho Dr/PHILIPPE_BOXHO_DR__ENTRETIEN_AVEC_UN_CADAVRE.epub (5.0 Mo)
  doublon  Books/D/Philippe Boxho Dr/PHILIPPE_BOXHO_DR__ENTRETIEN_AVEC_UN_CADAVRE (2).epub (5.0 Mo)

## Ethnographie du Quai d'Orsay — Christian Lequesne (même titre et auteurs)
  garder   Books/L/Christian Lequesne/CHRISTIAN_LEQUESNE__ETHNOGRAPHIE_DU_QUAI_D_ORSAY.epub (547 Ko)
  doublon  Books/L/Christian Lequesne/CHRISTIAN_LEQUESNE__ETHNOGRAPHIE_DU_QUAI_DORSAY.epub (546 Ko)

## Eugène et moi — Katherine Pancol, Anne Boudart (même titre et auteurs)
  garder   Books/B/Katherine Pancol & Anne Boudart/KATHERINE_PANCOL_ANNE_BOUDART__EUGENE_ET_MOI.epub (5.4 Mo)
  doublon  Books/P/Katherine Pancol/KATHERINE_PANCOL__EUGENE_ET_MOI.epub (5.4 Mo)

## Fils de personne — Jean-François Pasques (même titre et auteurs)
  garder   Books/P/Jean-Francois Pasques/JEAN_FRANCOIS_PASQUES__FILS_DE_PERSONNE.epub (305 Ko)
  doublon  Books/P/Jean-Francois Pasques/JEAN_FRANCOIS_PASQUES__FILS_DE_PERSONNE (2).epub (355 Ko)

## Fort comme un hypersensible — Maurice Barthelemy, Charlotte Wils (même titre et auteurs)
  garder   Books/W/Maurice Barthelemy Charlotte Wils/MAURICE_BARTHELEMY_CHARLOTTE_WILS__FORT_COMME_UN_HYPERSENSIBLE.epub (209 Ko)
  doublon  Books/W/Maurice Barthelemy Charlotte Wils/MAURICE_BARTHELEMY_CHARLOTTE_WILS__FORT_COMME_UN_HYPERSENSIBLE (2).epub (209 Ko)

## Gagner la guerre: Récit du Vieux royaume (La bibliothèque voltaïque) (French Edition) — Jean-Philippe JAWORSKI (même titre et auteurs)
  garder   Books/J/Jean-Philippe Jaworski/JEAN_PHILIPPE_JAWORSKI__GAGNER_LA_GUERRE_RECIT_DU_VIEUX_ROYAUME_LA_BIBLIOTHEQUE_VOLTAIQUE_FRENCH_EDITION.epub (828 Ko)
  doublon  Books/J/Jean-Philippe Jaworski/JEAN_PHILIPPE_JAWORSKI__GAGNER_LA_GUERRE_RECIT_DU_VIEUX_ROYAUME.epub (828 Ko)

## GastronoGEEK — Villanova,Thibaud, Léonard,Maxime (même titre et auteurs)
  garder   Books/L/Villanova,Thibaud & Léonard,Maxime/VILLANOVA_THIBAUD_LEONARD_MAXIME__GASTRONOGEEK.epub (31.7 Mo)
  doublon  Books/G/Gastronogeek/GASTRONOGEEK__THIBAUD_VILLANOVA.epub (31.7 Mo)

## Gatsby le magnifique — Francis Scott Fitzgerald (même titre et auteurs)
  garder   Books/S/Fitzgerald Francis Scott/FRANCIS_SCOTT_FITZGERALD__GATSBY_LE_MAGNIFIQUE.epub (173 Ko)
  doublon  Books/S/Fitzgerald Francis Scott/FITZGERALD_FRANCIS_SCOTT__GATSBY_LE_MAGNIFIQUE.epub (173 Ko)

## Grand Maître — Harrison, Jim (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__GRAND_MAITRE.epub (318 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__INSPECTEUR_SUNDERSON_1_GRAND_MAITRE.epub (317 Ko)

## H — Minier, Bernard (même titre et auteurs)
  garder   Books/B/Minier Bernard/BERNARD_MINIER__H.epub (576 Ko)
  doublon  Books/B/Minier Bernard/BERNARD_MINIER__H_COMMANDANT_MARTIN_SERVAZ_9.epub (576 Ko)

## Hamlet (édition enrichie) (Folio Classique) (French Edition) — Shakespeare, William (même titre et auteurs)
  garder   Books/S/William Shakespeare/WILLIAM_SHAKESPEARE__HAMLET_EDITION_ENRICHIE_FOLIO_CLASSIQUE_FRENCH_EDITION.epub (395 Ko)
  doublon  Books/S/William Shakespeare/WILLIAM_SHAKESPEARE__HAMLET_EDITION_ENRICHIE_FOLIO_CLASSIQUE_FRENCH_EDITION (2).epub (395 Ko)

## Hansel et Gretel — Yvan Godbout (même titre et auteurs)
  garder   Books/G/Yvan Godbout/YVAN_GODBOUT__LES_CONTES_INTERDITS_HANSEL_ET_GRETEL.epub (1.1 Mo)
  doublon  Books/G/Yvan Godbout/YVAN_GODBOUT__LES_CONTES_INTERDITS_HANSEL_ET_GRETEL (2).epub (1.1 Mo)

## Haute-folie — Antoine Wauters (même titre et auteurs)
  garder   Books/W/Antoine Wauters/ANTOINE_WAUTERS__HAUTE_FOLIE.epub (5.2 Mo)
  doublon  Books/W/Antoine Wauters/ANTOINE_WAUTERS__HAUTE_FOLIE (2).epub (5.2 Mo)

## HHhH — Binet, Laurent (même titre et auteurs)
  garder   Books/B/Laurent Binet/LAURENT_BINET__HHHH.epub (629 Ko)
  doublon  Books/B/Laurent Binet/LAURENT_BINET__HHHH (2).epub (628 Ko)

## Histoire d'un allemand — Haffner, Sebastian (même titre et auteurs)
  garder   Books/H/Sebastian Haffner/SEBASTIAN_HAFFNER__HISTOIRE_D_UN_ALLEMAND.epub (318 Ko)
  doublon  Books/H/Sebastian Haffner/SEBASTIAN_HAFFNER__HISTOIRE_D_UN_ALLEMAND (2).epub (318 Ko)

## Histoire de l'Art Pour les Nuls — Jean-Jacques Breton, Philippe Cachau (même titre et auteurs)
  garder   Books/B/Philippe Cachau Jean-Jacques Breton/PHILIPPE_CACHAU_JEAN_JACQUES_BRETON__HISTOIRE_DE_L_ART_POUR_LES_NULS.epub (4.7 Mo)
  doublon  Books/B/Philippe Cachau Jean-Jacques Breton/JEAN_JACQUES_BRETON_PHILIPPE_CACHAU__HISTOIRE_DE_L_ART_POUR_LES_NULS.epub (4.7 Mo)

## Histoire intime de la Ve République (Tome 1) - Le sursaut (French Edition) — Franz-Olivier Giesbert (même titre et auteurs)
  garder   Books/G/Franz-Olivier Giesbert/FRANZ_OLIVIER_GIESBERT__HISTOIRE_INTIME_DE_LA_VE_REPUBLIQUE_TOME_1_LE_SURSAUT_FRENCH_EDITION.epub (786 Ko)
  doublon  Books/G/Franz-Olivier Giesbert/FRANZ_OLIVIER_GIESBERT__HISTOIRE_INTIME_DE_LA_VE_REPUBLIQUE_LE_SURSAUT_1.epub (785 Ko)

## Histoire intime de la Ve République T2 : La belle époque — Franz-Olivier Giesbert (même titre et auteurs)
  garder   Books/G/Franz-Olivier Giesbert/FRANZ_OLIVIER_GIESBERT__HISTOIRE_INTIME_DE_LA_VE_REPUBLIQUE_TOME_2_LA_BELLE_EPOQUE_FRENCH_EDITION.epub (444 Ko)
  doublon  Books/G/Franz-Olivier Giesbert/FRANZ_OLIVIER_GIESBERT__HISTOIRE_INTIME_DE_LA_VEME_REPUBLIQUE_TOME_2_LA_BELLE_EPOQUE.epub (443 Ko)

## Houris — Kamel Daoud (même titre et auteurs)
  garder   Books/D/Kamel Daoud/KAMEL_DAOUD__HOURIS.epub (503 Ko)
  doublon  Books/D/Kamel Daoud/KAMEL_DAOUD__HOURIS (2).epub (503 Ko)

## Hurlements — Alexis Laipsker (même titre et auteurs)
  garder   Books/L/Alexis Laipsker/ALEXIS_LAIPSKER__HURLEMENTS.epub (313 Ko)
  doublon  Books/L/Alexis Laipsker/ALEXIS_LAIPSKER__HURLEMENTS (2).epub (313 Ko)

## Il était deux fois — Franck Thilliez (même titre et auteurs)
  garder   Books/T/Franck Thilliez/FRANCK_THILLIEZ__IL_ETAIT_DEUX_FOIS.epub (2.2 Mo)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__IL_ETAIT_DEUX_FOIS (2).epub (2.2 Mo)

## Il neige sur le pianiste — Claudie Hunzinger (même titre et auteurs)
  garder   Books/H/Claudie Hunzinger/CLAUDIE_HUNZINGER_CLAUDIE_HUNZINGER__IL_NEIGE_SUR_LE_PIANISTE.epub (632 Ko)
  doublon  Books/H/Claudie Hunzinger/CLAUDIE_HUNZINGER__IL_NEIGE_SUR_LE_PIANISTE.epub (631 Ko)

## Impact — Olivier Norek (même titre et auteurs)
  garder   Books/N/Olivier Norek/OLIVIER_NOREK__IMPACT.epub (372 Ko)
  doublon  Books/N/Olivier Norek/OLIVIER_NOREK__IMPACT (2).epub (372 Ko)

## Impossible — Erri de Luca (même titre et auteurs)
  garder   Books/D/Erri De Luca/ERRI_DE_LUCA__IMPOSSIBLE.epub (518 Ko)
  doublon  Books/D/Erri De Luca/ERRI_DE_LUCA__IMPOSSIBLE (2).epub (519 Ko)

## Intuitio — Gounelle, Laurent (même titre et auteurs)
  garder   Books/G/Laurent Gounelle/LAURENT_GOUNELLE__INTUITIO.epub (5.2 Mo)
  doublon  Books/G/Laurent Gounelle/LAURENT_GOUNELLE__INTUITIO (2).epub (5.2 Mo)

## Jacaranda — Faye, Gaël (même titre et auteurs)
  garder   Books/F/Gaël Faye/GAEL_FAYE__JACARANDA.epub (368 Ko)
  doublon  Books/F/Gaël Faye/GAEL_FAYE__JACARANDA (2).epub (368 Ko)

## James E.L. - Cinquante nuances de Grey - Fifty Shades Of Grey T1 — Athame (même titre et auteurs)
  garder   Books/A/Athame/ATHAME__JAMES_E_L_CINQUANTE_NUANCES_DE_GREY_FIFTY_SHADES_OF_GREY_T1.epub (470 Ko)
  doublon  Books/A/Athame/ATHAME__JAMES_E_L_CINQUANTE_NUANCES_DE_GREY_FIFTY_SHADES_OF_GREY_T1 (2).epub (659 Ko)

## Je te retrouverai — John Irving (même titre et auteurs)
  garder   Books/I/John Irving/JOHN_IRVING__JE_TE_RETROUVERAI.epub (847 Ko)
  doublon  Books/I/John Irving/JOHN_IRVING__JE_TE_RETROUVERAI (2).epub (847 Ko)

## Jean-Philippe Toussaint — L'échiquier (même titre et auteurs)
  garder   Books/L/L'échiquier/L_ECHIQUIER__JEAN_PHILIPPE_TOUSSAINT.epub (229 Ko)
  doublon  Books/T/Jean-Philippe Toussaint/JEAN_PHILIPPE_TOUSSAINT__L_ECHIQUIER.epub (229 Ko)

## Jeu de dames — Druart, Nicolas (même titre et auteurs)
  garder   Books/D/Nicolas Druart/NICOLAS_DRUART__JEU_DE_DAMES.epub (419 Ko)
  doublon  Books/D/Nicolas Druart/DRUART_NICOLAS__JEU_DE_DAMES.epub (419 Ko)

## Jouer le jeu — Daas, Fatima (même titre et auteurs)
  garder   Books/D/Fatima Daas/FATIMA_DAAS__JOUER_LE_JEU.epub (249 Ko)
  doublon  Books/D/Fatima Daas/FATIMA_DAAS__JOUER_LE_JEU (2).epub (249 Ko)

## Julip — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__JULIP.epub (837 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__JULIP (2).epub (837 Ko)

## Kerozene — Dieudonné, Adeline (même titre et auteurs)
  garder   Books/D/Adeline Dieudonne/ADELINE_DIEUDONNE__KEROZENE.epub (655 Ko)
  doublon  Books/D/Adeline Dieudonne/ADELINE_DIEUDONNE__KEROZENE (2).epub (655 Ko)

## Kilomètre zéro — Maud Ankaoua (même titre et auteurs)
  garder   Books/A/Maud Ankaoua/MAUD_ANKAOUA__KILOMETRE_ZERO.epub (311 Ko)
  doublon  Books/A/Maud Ankaoua/MAUD_ANKAOUA__KILOMETRE_ZERO (2).epub (311 Ko)

## L' Illusion — Chattam Maxime (même titre et auteurs)
  garder   Books/C/Maxime Chattam/CHATTAM_MAXIME__L_ILLUSION.epub (663 Ko)
  doublon  Books/C/Maxime Chattam/CHATTAM_MAXIME__L_ILLUSION (2).epub (663 Ko)

## l'Affolement du monde: 10 enjeux géopolitiques — Thomas Gomart (même titre et auteurs)
  garder   Books/G/Thomas Gomart/THOMAS_GOMART__L_AFFOLEMENT_DU_MONDE_10_ENJEUX_GEOPOLITIQUES.epub (1.1 Mo)
  doublon  Books/G/Thomas Gomart/THOMAS_GOMART__L_AFFOLEMENT_DU_MONDE_10_ENJEUX_GEOPOLITIQUES (2).epub (1.1 Mo)

## L'Animal Est-Il un Homme Comme les Autres ? — Aurelien Barrau et Louis Schweitzer (même titre et auteurs)
  garder   Books/S/Aurelien Barrau Et Louis Schweitzer/AURELIEN_BARRAU_ET_LOUIS_SCHWEITZER__L_ANIMAL_EST_IL_UN_HOMME_COMME_LES_AUTRES.epub (385 Ko)
  doublon  Books/B/Aurelien Barrau/AURELIEN_BARRAU__L_ANIMAL_EST_IL_UN_HOMME_COMME_LES_AUTRES.epub (385 Ko)

## L'anomalie — Hervé Le Tellier (même titre et auteurs)
  garder   Books/L/Herve Le Tellier/HERVE_LE_TELLIER__LANOMALIE.epub (584 Ko)
  doublon  Books/L/Herve Le Tellier/HERVE_LE_TELLIER__L_ANOMALIE.epub (584 Ko)

## L'appel de Cthulhu — Howard Phillips Lovecraft (même titre et auteurs)
  garder   Books/L/Howard Phillips Lovecraft/HOWARD_PHILLIPS_LOVECRAFT__L_APPEL_DE_CTHULHU_LOVECRAFT_NOUVELLE_TRADUCTION_FRENCH_EDITION.epub (131 Ko)
  doublon  Books/L/Howard Phillips Lovecraft/HOWARD_PHILLIPS_LOVECRAFT__LAPPEL_DE_CTHULHU.epub (131 Ko)

## L'appel de la forêt — London, Jack (même titre et auteurs)
  garder   Books/L/Jack London/JACK_LONDON__L_APPEL_DE_LA_FORET.epub (133 Ko)
  doublon  Books/L/Jack London/JACK_LONDON__LAPPEL_DE_LA_FORET.epub (133 Ko)

## L'Attentat — Yasmina Khadra (même titre et auteurs)
  garder   Books/K/Yasmina Khadra/YASMINA_KHADRA__L_ATTENTAT.epub (709 Ko)
  doublon  Books/K/Yasmina Khadra/YASMINA_KHADRA__L_ATTENTAT (2).epub (709 Ko)

## L'échiquier du mal - Tome 1 — Dan Simmons (même titre et auteurs)
  garder   Books/S/Dan Simmons/DAN_SIMMONS__L_ECHIQUIER_DU_MAL_TOME_1.epub (653 Ko)
  doublon  Books/S/Dan Simmons/DAN_SIMMONS__LECHIQUIER_DU_MAL_T1.epub (653 Ko)

## L'école du bien et du mal T2 Un monde sans princes — Chainani,Soman (même titre et auteurs)
  garder   Books/C/Soman Chainani/SOMAN_CHAINANI__L_ECOLE_DU_BIEN_ET_DU_MAL_T2.epub (3.4 Mo)
  doublon  Books/C/Soman Chainani/SOMAN_CHAINANI__L_ECOLE_DU_BIEN_ET_DU_MAL_T2_UN_MONDE_SANS_PRINCES.epub (3.4 Mo)

## L'Eté où il faillit mourir — Harrison, Jim (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__L_ETE_OU_IL_FAILLIT_MOURIR.epub (673 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__L_ETE_OU_IL_FAILLIT_MOURIR (2).epub (726 Ko)

## L’Étranger — Albert Camus (même titre et auteurs)
  garder   Books/C/Albert Camus/ALBERT_CAMUS__L_ETRANGER.epub (101 Ko)
  doublon  Books/C/Albert Camus/ALBERT_CAMUS__L_ETRANGER (2).epub (102 Ko)

## L’héritage du clan — Marc Lainé (même titre et auteurs)
  garder   Books/L/Marc Laine/MARC_LAINE__L_HERITAGE_DU_CLAN.epub (385 Ko)
  doublon  Books/L/Marc Laine/MARC_LAINE__LHERITAGE_DU_CLAN.epub (385 Ko)

## L'heure des fous — Nicolas Lebel (même titre et auteurs)
  garder   Books/L/Nicolas Lebel/NICOLAS_LEBEL__CAPITAINE_MEHRLICHT_1_L_HEURE_DES_FOUS.epub (345 Ko)
  doublon  Books/L/Nicolas Lebel/NICOLAS_LEBEL__L_HEURE_DES_FOUS.epub (345 Ko)

## L'heure des prédateurs — Giuliano da Empoli (même titre et auteurs)
  garder   Books/D/Giuliano Da Empoli/GIULIANO_DA_EMPOLI__L_HEURE_DES_PREDATEURS.epub (540 Ko)
  doublon  Books/D/Giuliano Da Empoli/GIULIANO_DA_EMPOLI__LHEURE_DES_PREDATEURS.epub (540 Ko)

## L'Histoire du monde pour les Nuls, grand format, 3e éd. — Philippe Moreau Defarges (même titre et auteurs)
  garder   Books/D/Philippe Moreau Defarges/PHILIPPE_MOREAU_DEFARGES__L_HISTOIRE_DU_MONDE_POUR_LES_NULS_GRAND_FORMAT_3E_ED.epub (5.2 Mo)
  doublon  Books/D/Philippe Moreau Defarges/PHILIPPE_MOREAU_DEFARGES__L_HISTOIRE_DU_MONDE_POUR_LES_NULS_GRAND_FORMAT_3E_ED (2).epub (5.2 Mo)

## L'impossible retour — Amélie Nothomb (même titre et auteurs)
  garder   Books/N/Amelie Nothomb/AMELIE_NOTHOMB__L_IMPOSSIBLE_RETOUR_FRENCH_EDITION.epub (200 Ko)
  doublon  Books/N/Amelie Nothomb/AMELIE_NOTHOMB__LIMPOSSIBLE_RETOUR.epub (200 Ko)

## L'Insigne rouge du courage — Stephen Crane (fichiers identiques)
  garder   Books/C/Stephen Crane/STEPHEN_CRANE__L_INSIGNE_ROUGE_DU_COURAGE.epub (456 Ko)
  doublon  Books/D/L Insigne Rouge du Courage/L_INSIGNE_ROUGE_DU_COURAGE__STEPHEN_CRANE.epub (456 Ko)

## L'Insigne rouge du courage — Stephen Crane (même titre et auteurs)
  garder   Books/C/Stephen Crane/STEPHEN_CRANE__L_INSIGNE_ROUGE_DU_COURAGE.epub (456 Ko)
  doublon  Books/C/Stephen Crane/STEPHEN_CRANE__L_INSIGNE_ROUGE_DU_COURAGE (2).epub (456 Ko)

## L'insoutenable légéreté de l'être — Milan Kundera (fichiers identiques)
  garder   Books/K/Milan Kundera/MILAN_KUNDERA__L_INSOUTENABLE_LEGERETE_DE_L_ETRE.epub (5.2 Mo)
  doublon  Books/K/Milan Kundera/insoutenable légéreté de l'être, L' - Milan Kundera.epub (5.2 Mo)

## L'insoutenable légéreté de l'être — Milan Kundera (même titre et auteurs)
  garder   Books/K/Milan Kundera/MILAN_KUNDERA__L_INSOUTENABLE_LEGERETE_DE_L_ETRE.epub (5.2 Mo)
  doublon  Legerete.epub (321 Ko)

## L'Insoutenable Légèreté De L'être — Milan Kundera (fichiers identiques)
  garder   Legerete.epub (321 Ko)
  doublon  Books/K/Milan Kundera/MILAN_KUNDERA__L_INSOUTENABLE_LEGERETE_DE_L_ETRE_2.epub (321 Ko)
  doublon  Books/K/Milan Kundera/MILAN_KUNDERA__L_INSOUTENABLE_LEGERETE_DE_L_ETRE (2).epub (321 Ko)

## L’usure d’un monde — François-Henri Désérable (même titre et auteurs)
  garder   Books/D/Francois-Henri Deserable/FRANCOIS_HENRI_DESERABLE__L_USURE_D_UN_MONDE.epub (3.1 Mo)
  doublon  Books/D/Francois-Henri Deserable/FRANCOIS_HENRI_DESERABLE__L_USURE_D_UN_MONDE (2).epub (3.1 Mo)

## La Bibliothèque de Minuit — Haig, Matt (même titre et auteurs)
  garder   Books/H/Matt Haig/MATT_HAIG__LA_BIBLIOTHEQUE_DE_MINUIT.epub (316 Ko)
  doublon  Books/H/Matt Haig/MATT_HAIG__LA_BIBLIOTHEQUE_DE_MINUIT (2).epub (316 Ko)

## La collision — Paul Gasnier (même titre et auteurs)
  garder   Books/G/Paul Gasnier/PAUL_GASNIER__LA_COLLISION.epub (200 Ko)
  doublon  Books/G/Paul Gasnier/PAUL_GASNIER__LA_COLLISION (2).epub (200 Ko)

## La compagnie des voyants — Mathieu Laine (même titre et auteurs)
  garder   Books/L/Mathieu Laine/MATHIEU_LAINE__LA_COMPAGNIE_DES_VOYANTS.epub (252 Ko)
  doublon  Books/L/Mathieu Laine/MATHIEU_LAINE__LA_COMPAGNIE_DES_VOYANTS_CES_GRANDS_ROMANS_QUI_NOUS_ECLAIRENT.epub (249 Ko)

## La criminologie pour les nuls — Alain Bauer, Christophe Soullez (fichiers identiques)
  garder   Books/S/Alain Bauer Christophe Soullez/Alain Bauer & Christophe Soullez_criminologie pour les nuls, La.epub (833 Ko)
  doublon  Books/S/Alain Bauer Christophe Soullez/ALAIN_BAUER_CHRISTOPHE_SOULLEZ__LA_CRIMINOLOGIE_POUR_LES_NULS (3).epub (833 Ko)

## La criminologie pour les nuls — Alain Bauer, Christophe Soullez (même titre et auteurs)
  garder   Books/S/Alain Bauer Christophe Soullez/ALAIN_BAUER_CHRISTOPHE_SOULLEZ__CRIMINOLOGIE_POUR_LES_NULS_LA_1.epub (6.1 Mo)
  doublon  Books/B/Alain Bauer/ALAIN_BAUER__LA_CRIMINOLOGIE_POUR_LES_NULS.epub (6.1 Mo)
  doublon  Books/S/Alain Bauer Christophe Soullez/Alain Bauer & Christophe Soullez_criminologie pour les nuls, La.epub (833 Ko)
  doublon  Books/S/Alain Bauer Christophe Soullez/Alain Bauer & Christophe Soullez_La Criminologie Pour les Nuls.epub (833 Ko)
  doublon  Books/L/Pour les Nuls/POUR_LES_NULS__LA_CRIMINOLOGIE.epub (833 Ko)
  doublon  Books/S/Alain Bauer Christophe Soullez/ALAIN_BAUER_CHRISTOPHE_SOULLEZ__LA_CRIMINOLOGIE_POUR_LES_NULS.epub (833 Ko)

## La Criminologie Pour les Nuls — Alain Bauer, Christophe Soullez (fichiers identiques)
  garder   Books/S/Alain Bauer Christophe Soullez/Alain Bauer & Christophe Soullez_La Criminologie Pour les Nuls.epub (833 Ko)
  doublon  Books/S/Alain Bauer Christophe Soullez/ALAIN_BAUER_CHRISTOPHE_SOULLEZ__LA_CRIMINOLOGIE_POUR_LES_NULS (2).epub (833 Ko)

## La Culture générale Pour les Nuls, 3e édition — Florence BRAUNSTEIN, Jean-François PEPIN (même titre et auteurs)
  garder   Books/B/Jean-François Pepin Florence Braunstein/JEAN_FRANCOIS_PEPIN_FLORENCE_BRAUNSTEIN__LA_CULTURE_GENERALE_POUR_LES_NULS_3E_EDITION.epub (3.0 Mo)
  doublon  Books/G/Culture Generale/CULTURE_GENERALE__BRAUNSTEIN_PEPIN.epub (3.0 Mo)

## La Cybersécurité pour les Nuls, grand format — Joseph STEINBERG (même titre et auteurs)
  garder   Books/S/Joseph Steinberg/JOSEPH_STEINBERG__LA_CYBERSECURITE_POUR_LES_NULS_GRAND_FORMAT.epub (5.3 Mo)
  doublon  Books/F/Grand Format/GRAND_FORMAT__LA_CYBERSECURITE_POUR_LES_NULS.epub (5.3 Mo)

## La danseuse — Patrick Modiano (même titre et auteurs)
  garder   Books/M/Patrick Modiano/PATRICK_MODIANO__LA_DANSEUSE.epub (492 Ko)
  doublon  Books/M/Patrick Modiano/PATRICK_MODIANO__LA_DANSEUSE (2).epub (492 Ko)

## La Datcha — Agnès Martin-Lugand (même titre et auteurs)
  garder   Books/M/Agnes Martin-lugand/AGNES_MARTIN_LUGAND__LA_DATCHA.epub (674 Ko)
  doublon  Books/M/Agnes Martin-lugand/AGNES_MARTIN_LUGAND__LA_DATCHA (2).epub (687 Ko)

## La désinvolture est une bien belle chose — Jaenada, Philippe (même titre et auteurs)
  garder   Books/J/Philippe Jaenada/PHILIPPE_JAENADA__LA_DESINVOLTURE_EST_UNE_BIEN_BELLE_CHOSE.epub (647 Ko)
  doublon  Books/J/Philippe Jaenada/PHILIPPE_JAENADA__LA_DESINVOLTURE_EST_UNE_BIEN_BELLE_CHOSE (2).epub (647 Ko)

## La dignité des psychopathes — Frédéric Paulin (même titre et auteurs)
  garder   Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_DIGNITE_DES_PSYCHOPATHES.epub (319 Ko)
  doublon  Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_DIGNITE_DES_PSYCHOPATHES (2).epub (319 Ko)

## La Disparition. Les Revenentes et autres lipogrammes — Georges Perec (même titre et auteurs)
  garder   Books/P/Georges Perec/GEORGES_PEREC__LA_DISPARITION_LES_REVENENTES_ET_AUTRES_LIPOGRAMMES.epub (483 Ko)
  doublon  Books/P/Georges Perec/GEORGES_PEREC__LA_DISPARITION_LES_REVENENTES_ET_AUTRES_LIPOGRAMMES_SUIVI_DE_HISTOIRE_DU_LIPOGRAMME.epub (483 Ko)

## La Fabrique de la terreur — Frédéric Paulin (même titre et auteurs)
  garder   Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_FABRIQUE_DE_LA_TERREUR.epub (353 Ko)
  doublon  Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_FABRIQUE_DE_LA_TERREUR (2).epub (353 Ko)

## La Faille — Franck Thilliez (même titre et auteurs)
  garder   La.Faille.2023.Franck.Thilliez.epub (5.2 Mo)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__FAILLE_LA_1.epub (482 Ko)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__LA_FAILLE.epub (482 Ko)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__LA_FAILLE (2).epub (5.2 Mo)

## La familia grande — Camille Kouchner (même titre et auteurs)
  garder   Books/G/La Familia Grande/LA_FAMILIA_GRANDE__CAMILLE_KOUCHNER.epub (5.0 Mo)
  doublon  Books/K/Camille Kouchner/CAMILLE_KOUCHNER__LA_FAMILIA_GRANDE.epub (5.0 Mo)

## La Femme Aux Lucioles — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__LA_FEMME_AUX_LUCIOLES.epub (759 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__LA_FEMME_AUX_LUCIOLES (2).epub (759 Ko)

## La femme gelée — Ernaux, Annie (même titre et auteurs)
  garder   Books/E/Annie Ernaux/ANNIE_ERNAUX__LA_FEMME_GELEE.epub (5.2 Mo)
  doublon  Books/E/Annie Ernaux/ERNAUX_ANNIE__LA_FEMME_GELEE.epub (5.2 Mo)

## La femme surdouée — Monique de Kermadec (même titre et auteurs)
  garder   Books/D/Monique de Kermadec/MONIQUE_DE_KERMADEC__LA_FEMME_SURDOUEE.epub (244 Ko)
  doublon  Books/D/Monique de Kermadec/MONIQUE_DE_KERMADEC__LA_FEMME_SURDOUEE (2).epub (244 Ko)

## La Ferme des animaux — George Orwell (même titre et auteurs)
  garder   Books/O/George Orwell/GEORGE_ORWELL__LA_FERME_DES_ANIMAUX.epub (109 Ko)
  doublon  Books/O/George Orwell/GEORGE_ORWELL__LA_FERME_DES_ANIMAUX (2).epub (142 Ko)

## La géopolitique pour les Nuls en 50 notions clés — Philippe Moreau-Defarges (même titre et auteurs)
  garder   Books/D/Philippe Moreau Defarges/PHILIPPE_MOREAU_DEFARGES__LA_GEOPOLITIQUE_POUR_LES_NULS_EN_50_NOTIONS_CLES.epub (974 Ko)
  doublon  Books/D/Philippe Moreau Defarges/PHILIPPE_MOREAU_DEFARGES__LA_GEOPOLITIQUE_POUR_LES_NULS_EN_50_NOTIONS_CLES (2).epub (974 Ko)

## La grande épreuve — Etienne de Montety (même titre et auteurs)
  garder   Books/D/Etienne de Montety/ETIENNE_DE_MONTETY__LA_GRANDE_EPREUVE.epub (324 Ko)
  doublon  Books/D/Etienne de Montety/ETIENNE_DE_MONTETY__LA_GRANDE_EPREUVE (2).epub (535 Ko)

## La grande histoire du monde — REYNAERT François (même titre et auteurs)
  garder   Books/F/Reynaert François/REYNAERT_FRANCOIS__LA_GRANDE_HISTOIRE_DU_MONDE.epub (2.0 Mo)
  doublon  Books/F/Reynaert François/REYNAERT_FRANCOIS__LA_GRANDE_HISTOIRE_DU_MONDE (2).epub (2.0 Mo)

## La guerre des pauvres — Eric Vuillard (même titre et auteurs)
  garder   Books/V/Eric Vuillard/ERIC_VUILLARD__LA_GUERRE_DES_PAUVRES.epub (59 Ko)
  doublon  Books/V/Eric Vuillard/ERIC_VUILLARD__LA_GUERRE_DES_PAUVRES (2).epub (78 Ko)

## La guerre du pavot — R. f. Kuang (même titre et auteurs)
  garder   Books/K/R. F. Kuang/R_F_KUANG__LA_GUERRE_DU_PAVOT.epub (833 Ko)
  doublon  Books/K/R. F. Kuang/R_F_KUANG__LA_GUERRE_DU_PAVOT (2).epub (992 Ko)

## La guerre est une ruse — Frédéric Paulin (même titre et auteurs)
  garder   Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_GUERRE_EST_UNE_RUSE.epub (366 Ko)
  doublon  Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_GUERRE_EST_UNE_RUSE (2).epub (366 Ko)

## La Guerre et la Paix - Tome I — Léon Tolstoï (même titre et auteurs)
  garder   Books/T/Léon Tolstoï/LEON_TOLSTOI__LA_GUERRE_ET_LA_PAIX_TOME_I.epub (541 Ko)
  doublon  Books/T/Léon Tolstoï/LEON_TOLSTOI__LA_GUERRE_ET_LA_PAIX_TOME_I (2).epub (545 Ko)

## La guerre par d'autres moyens — Karine Tuil (même titre et auteurs)
  garder   Books/T/Karine Tuil/KARINE_TUIL__LA_GUERRE_PAR_D_AUTRES_MOYENS.epub (5.2 Mo)
  doublon  Books/T/Karine Tuil/KARINE_TUIL__LA_GUERRE_PAR_D_AUTRES_MOYENS (2).epub (5.2 Mo)

## La Horde du Contrevent — Damasio,Alain (même titre et auteurs)
  garder   Books/D/Alain Damasio/ALAIN_DAMASIO__LA_HORDE_DU_CONTREVENT.epub (1.8 Mo)
  doublon  Books/D/Alain Damasio/ALAIN_DAMASIO__LA_HORDE_DU_CONTREVENT (2).epub (1.8 Mo)

## La justice des hommes — Santiago H. Amigorena (même titre et auteurs)
  garder   Books/A/Santiago H. Amigorena/SANTIAGO_H_AMIGORENA__LA_JUSTICE_DES_HOMMES.epub (253 Ko)
  doublon  Books/A/Santiago H. Amigorena/SANTIAGO_H_AMIGORENA__LA_JUSTICE_DES_HOMMES (2).epub (358 Ko)

## La Liberté d'être Libre — Hannah Arendt (même titre et auteurs)
  garder   Books/A/Hannah Arendt/HANNAH_ARENDT__LA_LIBERTE_D_ETRE_LIBRE.epub (59 Ko)
  doublon  Books/A/Hannah Arendt/HANNAH_ARENDT__LA_LIBERTE_D_ETRE_LIBRE (2).epub (59 Ko)

## La librairie des livres interdits — Marc Levy (même titre et auteurs)
  garder   Books/L/Marc Levy/MARC_LEVY__LA_LIBRAIRIE_DES_LIVRES_INTERDITS.epub (365 Ko)
  doublon  Books/L/Marc Levy/MARC_LEVY__LA_LIBRAIRIE_DES_LIVRES_INTERDITS (2).epub (365 Ko)

## La métamorphose suivi de Dans la colonie pénitentiaire — Franz Kafka (même titre et auteurs)
  garder   Books/K/Franz Kafka/FRANZ_KAFKA__LA_METAMORPHOSE_SUIVI_DE_DANS_LA_COLONIE_PENITENTIAIRE.epub (104 Ko)
  doublon  Books/K/Franz Kafka/FRANZ_KAFKA__LA_METAMORPHOSE_SUIVI_DE_DANS_LA_COLONIE_PENITENTIAIRE (2).epub (104 Ko)

## La nuit au cœur — Appanah, Nathacha (même titre et auteurs)
  garder   Books/A/Nathacha Appanah/NATHACHA_APPANAH__LA_NUIT_AU_C_UR.epub (524 Ko)
  doublon  Books/A/Nathacha Appanah/NATHACHA_APPANAH__LA_NUIT_AU_C_UR (2).epub (524 Ko)

## La nuit ravagée — Jean-Baptiste Del Amo (même titre et auteurs)
  garder   Books/D/Jean-Baptiste Del Amo/JEAN_BAPTISTE_DEL_AMO__LA_NUIT_RAVAGEE.epub (5.4 Mo)
  doublon  Books/D/Jean-Baptiste Del Amo/JEAN_BAPTISTE_DEL_AMO__LA_NUIT_RAVAGEE (2).epub (5.4 Mo)

## La nuit tombée sur nos âmes. Gênes, 2001 — Frédéric Paulin (même titre et auteurs)
  garder   Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_NUIT_TOMBEE_SUR_NOS_AMES_GENES_2001.epub (254 Ko)
  doublon  Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_NUIT_TOMBEE_SUR_NOS_AMES.epub (254 Ko)

## La parole est un sport de combat — Bertand Périer (même titre et auteurs)
  garder   Books/P/Bertand Périer/BERTAND_PERIER__LA_PAROLE_EST_UN_SPORT_DE_COMBAT.epub (205 Ko)
  doublon  Books/P/Bertrand Perier/BERTRAND_PERIER__LA_PAROLE_EST_UN_SPORT_DE_COMBAT.epub (205 Ko)

## La petite dernière — Fatima Daas (même titre et auteurs)
  garder   Books/D/Fatima Daas/FATIMA_DAAS__LA_PETITE_DERNIERE.epub (254 Ko)
  doublon  Books/D/Fatima Daas/FATIMA_DAAS__LA_PETITE_DERNIERE (2).epub (254 Ko)

## La prochaine fois que tu mordras la poussière — Pascot Panayotis (même titre et auteurs)
  garder   Books/P/Panayotis Pascot/PASCOT_PANAYOTIS__LA_PROCHAINE_FOIS_QUE_TU_MORDRAS_LA_POUSSIERE.epub (642 Ko)
  doublon  Books/P/Panayotis Pascot/PANAYOTIS_PASCOT__LA_PROCHAINE_FOIS_QUE_TU_MORDRAS_LA_POUSSIERE.epub (642 Ko)

## La Reine du Sud — Pérez-Reverte, Arturo (même titre et auteurs)
  garder   Books/R/Arturo Perez Reverte/ARTURO_PEREZ_REVERTE__LA_REINE_DU_SUD.epub (720 Ko)
  doublon  Books/R/Arturo Perez Reverte/ARTURO_PEREZ_REVERTE__LA_REINE_DU_SUD (2).epub (720 Ko)

## La République des faibles — Bulteau, Gwenaël (même titre et auteurs)
  garder   Books/B/Gwenael Bulteau/GWENAEL_BULTEAU__LA_REPUBLIQUE_DES_FAIBLES.epub (313 Ko)
  doublon  Books/B/Gwenael Bulteau/GWENAEL_BULTEAU__LA_REPUBLIQUE_DES_FAIBLES (2).epub (313 Ko)

## La Servante écarlate - Nouvelle traduction — Atwood, Margaret (même titre et auteurs)
  garder   Books/A/Margaret Atwood/MARGARET_ATWOOD__LA_SERVANTE_ECARLATE_NOUVELLE_TRADUCTION.epub (505 Ko)
  doublon  Books/E/Margaret Atwood La Servante Ecarlate/MARGARET_ATWOOD_LA_SERVANTE_ECARLATE__NOUVELLE_TRADUCTION.epub (504 Ko)

## La Ville des impasses — Aymen Gharbi (même titre et auteurs)
  garder   Books/G/Aymen Gharbi/AYMEN_GHARBI__LA_VILLE_DES_IMPASSES.epub (162 Ko)
  doublon  Books/G/Aymen Gharbi/AYMEN_GHARBI__LA_VILLE_DES_IMPASSES (2).epub (162 Ko)

## Le bastion des larmes — Abdellah Taïa (même titre et auteurs)
  garder   Books/T/Abdellah Taïa/ABDELLAH_TAIA__LE_BASTION_DES_LARMES.epub (185 Ko)
  doublon  Books/T/Abdellah Taïa/ABDELLAH_TAIA__LE_BASTION_DES_LARMES (2).epub (186 Ko)

## Le bûcher des vanités — Tom Wolfe (même titre et auteurs)
  garder   Books/W/Tom Wolfe/TOM_WOLFE__LE_BUCHER_DES_VANITES.epub (702 Ko)
  doublon  Books/W/Tom Wolfe/TOM_WOLFE__LE_BUCHER_DES_VANITES (2).epub (702 Ko)

## Le Chat qui voulait sauver les livres — Sosuke Natsukawa (même titre et auteurs)
  garder   Books/N/Sosuke Natsukawa/SOSUKE_NATSUKAWA__LE_CHAT_QUI_VOULAIT_SAUVER_LES_LIVRES.epub (514 Ko)
  doublon  Books/N/Sosuke Natsukawa/SOSUKE_NATSUKAWA__LE_CHAT_QUI_VOULAIT_SAUVER_LES_LIVRES (2).epub (515 Ko)

## Le chien des étoiles — Dimitri Rouchon-Borie (même titre et auteurs)
  garder   Books/R/Dimitri Rouchon-Borie/DIMITRI_ROUCHON_BORIE__LE_CHIEN_DES_ETOILES.epub (250 Ko)
  doublon  Books/R/Dimitri Rouchon-Borie/DIMITRI_ROUCHON_BORIE__LE_CHIEN_DES_ETOILES (2).epub (250 Ko)

## Le Club des enfants perdus — Rebecca Lighieri (même titre et auteurs)
  garder   Books/L/Rebecca Lighieri/REBECCA_LIGHIERI__LE_CLUB_DES_ENFANTS_PERDUS.epub (446 Ko)
  doublon  Books/L/Rebecca Lighieri/REBECCA_LIGHIERI__LE_CLUB_DES_ENFANTS_PERDUS (2).epub (446 Ko)

## Le Coma Des Mortels — Maxime Chattam (même titre et auteurs)
  garder   Books/C/Maxime Chattam/MAXIME_CHATTAM__LE_COMA_DES_MORTELS.epub (717 Ko)
  doublon  Books/C/Maxime Chattam/MAXIME_CHATTAM__LE_COMA_DES_MORTELS (2).epub (717 Ko)

## Le Dit du mistral — Olivier Mak-Bouchard (même titre et auteurs)
  garder   Books/B/Olivier Mak Bouchard/OLIVIER_MAK_BOUCHARD__LE_DIT_DU_MISTRAL.epub (469 Ko)
  doublon  Books/B/Olivier Mak Bouchard/OLIVIER_MAK_BOUCHARD__LE_DIT_DU_MISTRAL (2).epub (469 Ko)

## Le droit d’emmerder Dieu — Richard Malka (même titre et auteurs)
  garder   Books/M/Richard Malka/RICHARD_MALKA__LE_DROIT_D_EMMERDER_DIEU.epub (78 Ko)
  doublon  Books/M/Richard Malka/RICHARD_MALKA__LE_DROIT_DEMMERDER_DIEU.epub (77 Ko)

## Le Gaslighting ou l'art de faire taire les femmes — Hélène Frappat (même titre et auteurs)
  garder   Books/F/Hélène Frappat/HELENE_FRAPPAT__LE_GASLIGHTING_OU_L_ART_DE_FAIRE_TAIRE_LES_FEMMES.epub (5.6 Mo)
  doublon  Books/F/Hélène Frappat/HELENE_FRAPPAT__LE_GASLIGHTING_OU_L_ART_DE_FAIRE_TAIRE_LES_FEMMES (2).epub (5.6 Mo)

## Le Guide de la répartie — Laurent Baffie (même titre et auteurs)
  garder   Books/B/Laurent Baffie/LAURENT_BAFFIE__LE_GUIDE_DE_LA_REPARTIE.epub (527 Ko)
  doublon  Books/B/Laurent Baffie/LAURENT_BAFFIE__LE_GUIDE_DE_LA_REPARTIE (2).epub (528 Ko)

## Le Joueur d'échecs (PAVILLONS POCHE) (French Edition) — Stefan ZWEIG (même titre et auteurs)
  garder   Books/Z/Stefan Zweig/STEFAN_ZWEIG__LE_JOUEUR_D_ECHECS_PAVILLONS_POCHE_FRENCH_EDITION.epub (133 Ko)
  doublon  Books/Z/Stefan Zweig/STEFAN_ZWEIG__LE_JOUEUR_D_ECHECS.epub (133 Ko)

## Le lambeau — Philippe Lançon (fichiers identiques)
  garder   Books/L/Philippe Lancon/LANCON_PHILIPPE__LE_LAMBEAU.epub (446 Ko)
  doublon  Books/L/Philippe Lancon/PHILIPPE_LANCON__LE_LAMBEAU.epub (446 Ko)

## Le lambeau — Philippe Lançon (même titre et auteurs)
  garder   Books/L/Philippe Lancon/LANCON_PHILIPPE__LE_LAMBEAU.epub (446 Ko)
  doublon  Books/L/Philippe Lancon/PHILIPPE_LANCON__LE_LAMBEAU (2).epub (446 Ko)

## Le Manuscrit inachevé — Franck THILLIEZ (même titre et auteurs)
  garder   Books/T/Franck Thilliez/FRANCK_THILLIEZ__LE_MANUSCRIT_INACHEVE.epub (502 Ko)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__LE_MANUSCRIT_INACHEVE (2).epub (595 Ko)

## Le messie de Dune — Herbert,Frank (même titre et auteurs)
  garder   Books/H/Frank Herbert/FRANK_HERBERT__LE_MESSIE_DE_DUNE.epub (283 Ko)
  doublon  Books/H/Frank Herbert/FRANK_HERBERT__DUNE_2_LE_MESSIE_DE_DUNE.epub (283 Ko)

## Le ministère du futur — Kim Stanley Robinson (même titre et auteurs)
  garder   Books/R/Kim Stanley Robinson/Kim Stanley Robinson_Ministère du futur, Le.epub (906 Ko)
  doublon  Books/R/Kim Stanley Robinson/Le ministère du futur (Kim Stanley Robinson) (Z-Library).epub (905 Ko)
  doublon  Books/R/Kim Stanley Robinson/KIM_STANLEY_ROBINSON__LE_MINISTERE_DU_FUTUR.epub (734 Ko)
  doublon  Books/R/Kim Stanley Robinson/KIM_STANLEY_ROBINSON__LE_MINISTERE_DU_FUTUR (2).epub (733 Ko)

## Le Monde en 2040 vu par la CIA (French Edition) — National Intelligence Council (USA), Smolar, Piotr, Barucq, Laurent (même titre et auteurs)
  garder   Books/L/National Intelligence Council & Smolar, Piotr & Barucq, Laurent/NATIONAL_INTELLIGENCE_COUNCIL_USA_SMOLAR_PIOTR_BARUCQ_LAURENT__LE_MONDE_EN_2040_VU_PAR_LA_CIA_FRENCH_EDITION.epub (1.5 Mo)
  doublon  Books/S/Piotr Smolar/PIOTR_SMOLAR__LE_MONDE_EN_2040_VU_PAR_LA_CIA_UN_MONDE_PLUS_CONTESTE.epub (1.5 Mo)

## Le monde nazi — Johann Chapoutot, Christian Ingrao, Nicolas Patin, Christian Ingrao, Nicolas Patin (même titre et auteurs)
  garder   Books/C/Christian Ingrao Etc. Johann Chapoutot/CHRISTIAN_INGRAO_ETC_JOHANN_CHAPOUTOT__LE_MONDE_NAZI.epub (28.3 Mo)
  doublon  Books/P/Johann Chapoutot, Christian Ingrao, Nicolas Patin & Christian Ingrao & Nicolas Patin/JOHANN_CHAPOUTOT_CHRISTIAN_INGRAO_NICOLAS_PATIN_CHRISTIAN_INGRAO_NICOLAS_PATIN__LE_MONDE_NAZI.epub (28.3 Mo)

## Le nom des rois — MAJDALANI Charif, Charif Majdalani (même titre et auteurs)
  garder   Books/M/Majdalani Charif & Charif Majdalani/MAJDALANI_CHARIF_CHARIF_MAJDALANI__LE_NOM_DES_ROIS.epub (226 Ko)
  doublon  Books/M/Charif Majdalani/CHARIF_MAJDALANI__LE_NOM_DES_ROIS.epub (226 Ko)

## Le Parrain — Mario Puzo (même titre et auteurs)
  garder   Books/P/Mario Puzo/MARIO_PUZO__LE_PARRAIN.epub (1.0 Mo)
  doublon  Books/P/Mario Puzo/MARIO_PUZO__LE_PARRAIN_1968.epub (1.0 Mo)

## Le passeur — Stéphanie Coste (même titre et auteurs)
  garder   Books/C/Stephanie Coste/STEPHANIE_COSTE__LE_PASSEUR.epub (5.2 Mo)
  doublon  Books/C/Stephanie Coste/STEPHANIE_COSTE__LE_PASSEUR (3).epub (214 Ko)
  doublon  Books/C/Stephanie Coste/STEPHANIE_COSTE__LE_PASSEUR (2).epub (214 Ko)

## Le plaisir de la peur — Franck Thilliez (même titre et auteurs)
  garder   Books/T/Franck Thilliez/FRANCK_THILLIEZ__LE_PLAISIR_DE_LA_PEUR.epub (5.4 Mo)
  doublon  Books/D/Le Plaisir de la Peur/LE_PLAISIR_DE_LA_PEUR__FRANCK_THILLIEZ.epub (5.4 Mo)

## Le Procès — Franz Kafka (même titre et auteurs)
  garder   Books/K/Franz Kafka/FRANZ_KAFKA__LE_PROCES.epub (614 Ko)
  doublon  Books/K/Franz Kafka/FRANZ_KAFKA__LE_PROCES (2).epub (614 Ko)

## Le quatrième mur:Roman (Littérature Française) (French Edition) — Chalandon, Sorj (même titre et auteurs)
  garder   Books/S/Chalandon Sorj/CHALANDON_SORJ__LE_QUATRIEME_MUR_ROMAN_LITTERATURE_FRANCAISE_FRENCH_EDITION.epub (251 Ko)
  doublon  Books/S/Chalandon Sorj/CHALANDON_SORJ__LE_QUATRIEME_MURROMAN_LITTERATURE_FRANCAISE.epub (251 Ko)

## Le Roi Lear — William Shakespeare (même titre et auteurs)
  garder   Books/S/William Shakespeare/WILLIAM_SHAKESPEARE__LE_ROI_LEAR.epub (617 Ko)
  doublon  Books/S/William Shakespeare/WILLIAM_SHAKESPEARE__LE_ROI_LEAR (2).epub (618 Ko)

## Le roman du terrorisme — Marc Trevidic (même titre et auteurs)
  garder   Books/T/Marc Trevidic/MARC_TREVIDIC__LE_ROMAN_DU_TERRORISME.epub (259 Ko)
  doublon  Books/T/Marc Trevidic/MARC_TREVIDIC__LE_ROMAN_DU_TERRORISME (2).epub (259 Ko)

## Le soleil des Scorta — Gaudé, Laurent (même titre et auteurs)
  garder   Books/G/Laurent Gaude/LAURENT_GAUDE__LE_SOLEIL_DES_SCORTA.epub (198 Ko)
  doublon  Books/G/Laurent Gaude/LAURENT_GAUDE__LE_SOLEIL_DES_SCORTA (2).epub (198 Ko)

## Le Trône de Fer - L'intégrale 1 — George R.R. Martin (même titre et auteurs)
  garder   Books/M/George R.R. Martin/GEORGE_R_R_MARTIN__LE_TRONE_DE_FER_L_INTEGRALE_1.epub (1.2 Mo)
  doublon  Books/M/George R. Martin/GEORGE_R_R_MARTIN__LE_TRONE_DE_FER_LINTEGRALE_1.epub (1.2 Mo)

## Le Vieux Saltimbanque — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__LE_VIEUX_SALTIMBANQUE.epub (203 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__LE_VIEUX_SALTIMBANQUE (2).epub (203 Ko)

## Légitime violence — Marc Dugain (même titre et auteurs)
  garder   Books/D/Marc Dugain/MARC_DUGAIN__LEGITIME_VIOLENCE.epub (470 Ko)
  doublon  Books/D/Marc Dugain/MARC_DUGAIN__LEGITIME_VIOLENCE (2).epub (470 Ko)

## Les 100 chefs-d'oeuvre du classique pour les Nuls — Benjamin François (même titre et auteurs)
  garder   Books/L/Pour les Nuls/POUR_LES_NULS__LES_100_CHEFS_D_OEUVRE_DU_CLASSIQUE_BENJAMIN_FRANCOIS.epub (1002 Ko)
  doublon  Books/F/Benjamin François/BENJAMIN_FRANCOIS__LES_100_CHEFS_D_OEUVRE_DU_CLASSIQUE_POUR_LES_NULS.epub (1002 Ko)

## Les Animaux dénaturés — Vercors (même titre et auteurs)
  garder   Books/V/Vercors/VERCORS__LES_ANIMAUX_DENATURES.epub (228 Ko)
  doublon  Books/V/Vercors/VERCORS__LES_ANIMAUX_DENATURES (2).epub (228 Ko)

## Les chefs-d'œuvres de la littérature mondiale Pour les Nuls — Gilles GUILLERON (même titre et auteurs)
  garder   Books/G/Gilles Guilleron/GILLES_GUILLERON__LES_CHEFS_D_UVRES_DE_LA_LITTERATURE_MONDIALE_POUR_LES_NULS.epub (1.7 Mo)
  doublon  Books/G/Gilles Guilleron/GILLES_GUILLERON__LES_CHEFS_DOEUVRES_DE_LA_LITTERATURE_MONDIALE_POUR_LES_NULS.epub (1.7 Mo)

## Les Derniers Jours du parti socialiste — Aurélien Bellanger (même titre et auteurs)
  garder   Books/B/Aurélien Bellanger/AURELIEN_BELLANGER__LES_DERNIERS_JOURS_DU_PARTI_SOCIALISTE.epub (896 Ko)
  doublon  Books/B/Aurélien Bellanger/AURELIEN_BELLANGER__LES_DERNIERS_JOURS_DU_PARTI_SOCIALISTE (2).epub (896 Ko)

## Les deux Beune — Pierre Michon (même titre et auteurs)
  garder   Books/M/Pierre Michon/PIERRE_MICHON__LES_DEUX_BEUNE.epub (198 Ko)
  doublon  Books/M/Pierre Michon/PIERRE_MICHON__LES_DEUX_BEUNE (2).epub (198 Ko)

## Les Echecs Pour les Nuls — James EADE, Vincent MORET (même titre et auteurs)
  garder   Books/E/Vincent Moret James Eade/VINCENT_MORET_JAMES_EADE__LES_ECHECS_POUR_LES_NULS.epub (3.5 Mo)
  doublon  Books/E/Vincent Moret James Eade/JAMES_EADE_VINCENT_MORET__LES_ECHECS_POUR_LES_NULS.epub (3.5 Mo)

## Les espions de la terreur — Matthieu Suc (même titre et auteurs)
  garder   Books/S/Matthieu Suc/MATTHIEU_SUC__LES_ESPIONS_DE_LA_TERREUR.epub (443 Ko)
  doublon  Books/S/Matthieu Suc/MATTHIEU_SUC__LES_ESPIONS_DE_LA_TERREUR (2).epub (443 Ko)

## Les espions de la terreur (HarperCollins) (French Edition) — Suc, Matthieu (même titre et auteurs)
  garder   Books/S/Matthieu Suc/SUC_MATTHIEU__LES_ESPIONS_DE_LA_TERREUR.epub (770 Ko)
  doublon  Books/S/Matthieu Suc/MATTHIEU_SUC__LES_ESPIONS_DE_LA_TERREUR_HARPERCOLLINS_FRENCH_EDITION.epub (770 Ko)

## Les fiancés de l'hiver — Dabos, Christelle (même titre et auteurs)
  garder   Books/D/Christelle Dabos/CHRISTELLE_DABOS__LES_FIANCES_DE_LHIVER.epub (672 Ko)
  doublon  Books/D/Christelle Dabos/CHRISTELLE_DABOS__LES_FIANCES_DE_L_HIVER.epub (672 Ko)

## Les fleuves du ciel — Shafak, Elif (même titre et auteurs)
  garder   Books/S/Elif Shafak/ELIF_SHAFAK__LES_FLEUVES_DU_CIEL.epub (1.3 Mo)
  doublon  Books/S/Elif Shafak/ELIF_SHAFAK__LES_FLEUVES_DU_CIEL (2).epub (1.3 Mo)

## Les forces — Laura Vazquez (même titre et auteurs)
  garder   Books/V/Laura Vazquez/LAURA_VAZQUEZ__LES_FORCES.epub (578 Ko)
  doublon  Books/V/Laura Vazquez/LAURA_VAZQUEZ__LES_FORCES (2).epub (579 Ko)

## Les fossoyeurs — Castanet Victor (même titre et auteurs)
  garder   Books/C/Victor Castanet/CASTANET_VICTOR__LES_FOSSOYEURS.epub (496 Ko)
  doublon  Books/C/Victor Castanet/VICTOR_CASTANET__LES_FOSSOYEURS.epub (495 Ko)

## Les grandes oubliées — Titiou Lecoq, Michelle Perrot (même titre et auteurs)
  garder   Books/L/Michelle Perrot Titiou Lecoq/MICHELLE_PERROT_TITIOU_LECOQ__LES_GRANDES_OUBLIEES.epub (5.7 Mo)
  doublon  Books/L/Michelle Perrot Titiou Lecoq/TITIOU_LECOQ_MICHELLE_PERROT__LES_GRANDES_OUBLIEES.epub (5.7 Mo)

## Les grandes plaidoiries des ténors du barreau — Matthieu Aron (même titre et auteurs)
  garder   Books/A/Matthieu Aron/MATTHIEU_ARON__LES_GRANDES_PLAIDOIRIES_DES_TENORS_DU_BARREAUX.epub (427 Ko)
  doublon  Books/A/Matthieu Aron/MATTHIEU_ARON__LES_GRANDES_PLAIDOIRIES_DES_TENORS_DU_BARREAU.epub (427 Ko)

## Les Grands Discours politiques pour les Nuls en 50 citations clés — Florent Vandepitte (même titre et auteurs)
  garder   Books/V/Florent Vandepitte/FLORENT_VANDEPITTE__LES_GRANDS_DISCOURS_POLITIQUES_POUR_LES_NULS_EN_50_CITATIONS_CLES.epub (5.3 Mo)
  doublon  Books/V/Florent Vandepitte/FLORENT_VANDEPITTE__LES_GRANDS_DISCOURS_POLITIQUES_POUR_LES_NULS_EN_50_CITATIONS_CLES (2).epub (5.3 Mo)

## Les Grands Mythes pour les Nuls — Pierre BRUNEL (même titre et auteurs)
  garder   Books/B/Pierre Brunel/PIERRE_BRUNEL__LES_GRANDS_MYTHES_POUR_LES_NULS.epub (1.7 Mo)
  doublon  Books/B/Pierre Brunel/PIERRE_BRUNEL__LES_GRANDS_MYTHES_POUR_LES_NULS (2).epub (1.7 Mo)

## Les guerriers de l’hiver — Olivier Norek (même titre et auteurs)
  garder   Books/N/Olivier Norek/OLIVIER_NOREK__LES_GUERRIERS_DE_L_HIVER.epub (5.1 Mo)
  doublon  Books/N/Olivier Norek/OLIVIER_NOREK__LES_GUERRIERS_DE_L_HIVER (2).epub (5.1 Mo)

## Les hirondelles de Kaboul — Khadra, Yasmina (même titre et auteurs)
  garder   Books/K/Yasmina Khadra/KHADRA_YASMINA__LES_HIRONDELLES_DE_KABOUL.epub (262 Ko)
  doublon  Books/K/Yasmina Khadra/YASMINA_KHADRA__LES_HIRONDELLES_DE_KABOUL.epub (261 Ko)

## Les jeux de la nuit — Harrison,Jim (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__LES_JEUX_DE_LA_NUIT.epub (289 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__LES_JEUX_DE_LA_NUIT (2).epub (289 Ko)

## Les loups blessés (La Martinière, 12 mars) — Molmy, Christophe (même titre et auteurs)
  garder   Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__LES_LOUPS_BLESSES.epub (291 Ko)
  doublon  Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__LES_LOUPS_BLESSES (2).epub (291 Ko)

## Les marins ne savent pas nager — Dominique Scali (même titre et auteurs)
  garder   Books/S/Dominique Scali/DOMINIQUE_SCALI__LES_MARINS_NE_SAVENT_PAS_NAGER.epub (1019 Ko)
  doublon  Books/S/Dominique Scali/DOMINIQUE_SCALI__LES_MARINS_NE_SAVENT_PAS_NAGER (2).epub (1019 Ko)

## Les Mémoires d'un chat — Hiro Arikawa (même titre et auteurs)
  garder   Books/A/Hiro Arikawa/HIRO_ARIKAWA__LES_MEMOIRES_D_UN_CHAT.epub (255 Ko)
  doublon  Books/A/Hiro Arikawa/HIRO_ARIKAWA__LES_MEMOIRES_DUN_CHAT.epub (255 Ko)

## Les Monstres — Charles Roux (même titre et auteurs)
  garder   Books/R/Ebbok Charles Roux/EBBOK_CHARLES_ROUX__LES_MONSTRES.epub (528 Ko)
  doublon  Books/R/Charles Roux/CHARLES_ROUX__LES_MONSTRES.epub (527 Ko)

## Les Naufragés du Wager — David Grann (même titre et auteurs)
  garder   Books/G/David Grann/DAVID_GRANN__LES_NAUFRAGES_DU_WAGER.epub (1.7 Mo)
  doublon  Books/G/David Grann/DAVID_GRANN__LES_NAUFRAGES_DU_WAGER (2).epub (1.7 Mo)

## Les Nymphéas noirs — Bussi, Michel (même titre et auteurs)
  garder   Books/B/Michel Bussi/MICHEL_BUSSI__LES_NYMPHEAS_NOIRS.epub (382 Ko)
  doublon  Books/B/Michel Bussi/MICHEL_BUSSI__LES_NYMPHEAS_NOIRS (2).epub (382 Ko)

## Les pendus du Val Sans Retour — Frédéric Paulin (même titre et auteurs)
  garder   Books/P/Frédéric Paulin/FREDERIC_PAULIN__LES_PENDUS_DU_VAL_SANS_RETOUR.epub (329 Ko)
  doublon  Books/P/Frédéric Paulin/FREDERIC_PAULIN__LES_PENDUS_DU_VAL_SANS_RETOUR (2).epub (329 Ko)

## Les Poudremages T01 - La Promesse du sang — McClellan Brian (même titre et auteurs)
  garder   Books/M/Brian McClellan/MCCLELLAN_BRIAN__LES_POUDREMAGES_T01_LA_PROMESSE_DU_SANG.epub (690 Ko)
  doublon  Books/M/Brian McClellan/BRIAN_MCCLELLAN__LA_PROMESSE_DU_SANG_LA_TRILOGIE_DES_POUDREMAGES_1.epub (690 Ko)

## Les preuves de mon innocence — Coe, Jonathan (même titre et auteurs)
  garder   Books/C/Jonathan Coe/JONATHAN_COE__LES_PREUVES_DE_MON_INNOCENCE.epub (949 Ko)
  doublon  Books/C/Jonathan Coe/JONATHAN_COE__LES_PREUVES_DE_MON_INNOCENCE (2).epub (949 Ko)

## Les Projectiles — Louise Rose (même titre et auteurs)
  garder   Books/R/Louise Rose/LOUISE_ROSE__LES_PROJECTILES.epub (192 Ko)
  doublon  Books/R/Louise Rose/LOUISE_ROSE__LES_PROJECTILES (2).epub (192 Ko)

## Les rois maudits - L'intégrale — Maurice Druon (même titre et auteurs)
  garder   Books/D/Maurice Druon/MAURICE_DRUON__LES_ROIS_MAUDITS_L_INTEGRALE.epub (9.4 Mo)
  doublon  Books/D/Maurice Druon/MAURICE_MAURICE_DRUON_DRUON__LES_ROIS_MAUDITS_LINTEGRALE.epub (9.4 Mo)

## Les Saules — Mathilde Beaussault (même titre et auteurs)
  garder   Books/B/Mathilde Beaussault/MATHILDE_BEAUSSAULT__LES_SAULES.epub (204 Ko)
  doublon  Books/B/Mathilde Beaussault/MATHILDE_BEAUSSAULT__LES_SAULES (2).epub (204 Ko)

## Les Sept Morts D'Evelyn Hardcastle — Fabrice Pointeau, Stuart Turton (même titre et auteurs)
  garder   Books/T/Stuart Turton/STUART_TURTON__LES_SEPT_MORTS_D_EVELYN_HARDCASTLE.epub (686 Ko)
  doublon  Books/T/Stuart Turton/STUART_TURTON__LES_SEPT_MORTS_DEVELYN_HARDCASTLE.epub (685 Ko)

## Les sources — Marie-Hélène Lafon (même titre et auteurs)
  garder   Books/M/Lafon Marie-Hélène/MARIE_HELENE_LAFON__LES_SOURCES.epub (5.1 Mo)
  doublon  Books/M/Lafon Marie-Hélène/MARIE_HELENE_LAFON__LES_SOURCES (2).epub (5.1 Mo)

## Les yeux d'Elsa — Aragon, Louis (même titre et auteurs)
  garder   Books/L/Aragon Louis/ARAGON_LOUIS__LES_YEUX_DELSA.epub (145 Ko)
  doublon  Books/L/Aragon Louis/LOUIS_ARAGON__LES_YEUX_D_ELSA.epub (144 Ko)

## Leurs enfants après eux — Nicolas Mathieu (même titre et auteurs)
  garder   Books/M/Nicolas Mathieu/NICOLAS_MATHIEU__LEURS_ENFANTS_APRES_EUX.epub (5.2 Mo)
  doublon  Books/M/Nicolas Mathieu/NICOLAS_MATHIEU__LEURS_ENFANTS_APRES_EUX (2).epub (5.2 Mo)

## Libres dans leur tête — Stéphanie Castillo-Soler (même titre et auteurs)
  garder   Books/C/Stéphanie Castillo-Soler/STEPHANIE_CASTILLO_SOLER__LIBRES_DANS_LEUR_TETE.epub (342 Ko)
  doublon  Books/C/Stéphanie Castillo-Soler/STEPHANIE_CASTILLO_SOLER__LIBRES_DANS_LEUR_TETE (2).epub (341 Ko)

## Little America — Bromell, Henry (même titre et auteurs)
  garder   Books/B/Henry Bromell/HENRY_BROMELL__LITTLE_AMERICA.epub (703 Ko)
  doublon  Books/B/Henry Bromell/HENRY_BROMELL__LITTLE_AMERICA (2).epub (795 Ko)

## Lux (French Edition) — Chattam, Maxime (même titre et auteurs)
  garder   Books/C/Maxime Chattam/MAXIME_CHATTAM__LUX.epub (587 Ko)
  doublon  Books/C/Maxime Chattam/MAXIME_CHATTAM__LUX_FRENCH_EDITION.epub (587 Ko)

## Macbeth — William Shakespeare (même titre et auteurs)
  garder   Books/S/William Shakespeare/WILLIAM_WILLIAM_SHAKESPEARE_SHAKESPEARE__MACBETH.epub (707 Ko)
  doublon  Books/S/William Shakespeare/WILLIAM_SHAKESPEARE__MACBETH.epub (706 Ko)

## Madelaine avant l'aube — Sandrine Collette (même titre et auteurs)
  garder   Books/C/Sandrine Collette/SANDRINE_COLLETTE__MADELAINE_AVANT_LAUBE.epub (251 Ko)
  doublon  Books/C/Sandrine Collette/SANDRINE_COLLETTE__MADELAINE_AVANT_L_AUBE.epub (251 Ko)

## Mafioso — Ray CELESTIN (même titre et auteurs)
  garder   Books/C/Ray Celestin/RAY_CELESTIN__MAFIOSO.epub (939 Ko)
  doublon  Books/C/Ray Celestin/RAY_CELESTIN__MAFIOSO (2).epub (939 Ko)

## Manières d'être vivant — Morizot, Baptiste (même titre et auteurs)
  garder   Books/M/Baptiste Morizot/BAPTISTE_MORIZOT__MANIERES_D_ETRE_VIVANT.epub (533 Ko)
  doublon  Books/M/Baptiste Morizot/BAPTISTE_MORIZOT__MANIERES_DETRE_VIVANT.epub (533 Ko)

## Mascarade — Ray Celestin (même titre et auteurs)
  garder   Books/C/Ray Celestin/RAY_CELESTIN__MASCARADE.epub (2.0 Mo)
  doublon  Books/C/Ray Celestin/RAY_CELESTIN__MASCARADE (2).epub (2.0 Mo)

## Matin Brun — Franck Pavloff (même titre et auteurs)
  garder   Books/P/Franck Pavloff/FRANCK_PAVLOFF__MATIN_BRUN.epub (25 Ko)
  doublon  Books/P/Franck Pavloff/FRANCK_PAVLOFF__MATIN_BRUN (2).epub (25 Ko)

## Merci, Grazie, thank you — Julien Sandrel (même titre et auteurs)
  garder   Books/S/Julien Sandrel/JULIEN_SANDREL__MERCI_GRAZIE_THANK_YOU.epub (489 Ko)
  doublon  Books/S/Julien Sandrel/JULIEN_SANDREL__MERCI_GRAZIE_THANK_YOU (2).epub (489 Ko)

## Mesopotamia — Olivier Guez (même titre et auteurs)
  garder   Books/G/Olivier Guez/OLIVIER_GUEZ__MESOPOTAMIA.epub (387 Ko)
  doublon  Books/G/Olivier Guez/OLIVIER_GUEZ__MESOPOTAMIA (2).epub (387 Ko)

## Middlemarch - Tome I — George Eliot (même titre et auteurs)
  garder   Books/E/George Eliot/GEORGE_ELIOT__MIDDLEMARCH_TOME_I.epub (1.0 Mo)
  doublon  Books/E/George Eliot/GEORGE_ELIOT__MIDDLEMARCH_TOME_I (2).epub (1.0 Mo)

## Molière — Le Malade imaginaire (même titre et auteurs)
  garder   Books/I/Le Malade Imaginaire/LE_MALADE_IMAGINAIRE__MOLIERE.epub (513 Ko)
  doublon  Books/M/Moliere/MOLIERE__LE_MALADE_IMAGINAIRE.epub (513 Ko)

## Nageur de rivière — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__NAGEUR_DE_RIVIERE.epub (1.8 Mo)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__NAGEUR_DE_RIVIERE (2).epub (1.8 Mo)

## Ne me remerciez pas ! — Caroff, Martial (même titre et auteurs)
  garder   Books/C/Martial Caroff/CAROFF_MARTIAL__NE_ME_REMERCIEZ_PAS.epub (5.1 Mo)
  doublon  Books/C/Martial Caroff/MARTIAL_CAROFF__NE_ME_REMERCIEZ_PAS.epub (5.1 Mo)

## Nerona — Frappat, Hélène (même titre et auteurs)
  garder   Books/F/Hélène Frappat/HELENE_FRAPPAT__NERONA.epub (444 Ko)
  doublon  Books/F/Hélène Frappat/HELENE_FRAPPAT__NERONA (2).epub (444 Ko)

## Norferville — Franck Thilliez (même titre et auteurs)
  garder   Books/T/Franck Thilliez/FRANCK_THILLIEZ__NORFERVILLE.epub (811 Ko)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__NORFERVILLE (2).epub (811 Ko)

## Nos âmes au diable — Jérôme Camut, Nathalie Hug (même titre et auteurs)
  garder   Books/C/Jerome Camut/JEROME_CAMUT__NOS_AMES_AU_DIABLE.epub (5.4 Mo)
  doublon  Books/H/Jérôme Camut & Nathalie Hug/JEROME_CAMUT_NATHALIE_HUG__NOS_AMES_AU_DIABLE.epub (5.4 Mo)

## NOS ÉTOILES CONTRAIRES — Green John (même titre et auteurs)
  garder   Books/J/Green John/GREEN_JOHN__NOS_ETOILES_CONTRAIRES.epub (1.4 Mo)
  doublon  Books/J/Green John/GREEN_JOHN__NOS_ETOILES_CONTRAIRES (2).epub (1.4 Mo)

## Nos résiliences — Agnes Martin-lugand (même titre et auteurs)
  garder   Books/M/Agnes Martin-lugand/AGNES_MARTIN_LUGAND__NOS_RESILIENCES.epub (423 Ko)
  doublon  Books/M/Agnes Martin-lugand/AGNES_MARTIN_LUGAND__NOS_RESILIENCES (2).epub (424 Ko)

## Nos vies — Lafon,Marie-Hélène (même titre et auteurs)
  garder   Books/M/Lafon Marie-Hélène/LAFON_MARIE_HELENE__NOS_VIES.epub (395 Ko)
  doublon  Books/M/Lafon Marie-Hélène/MARIE_HELENE_LAFON__NOS_VIES.epub (394 Ko)

## Nous — Evgueni Zamiatine (même titre et auteurs)
  garder   Books/E/Zamiatine Evgueni/EVGUENI_ZAMIATINE__NOUS.epub (492 Ko)
  doublon  Books/E/Zamiatine Evgueni/ZAMIATINE_EVGUENI__NOUS.epub (492 Ko)

## Passagères de nuit — Yanick Lahens (même titre et auteurs)
  garder   Books/L/Yanick Lahens/YANICK_LAHENS__PASSAGERES_DE_NUIT.epub (178 Ko)
  doublon  Books/L/Yanick Lahens/YANICK_LAHENS__PASSAGERES_DE_NUIT (2).epub (178 Ko)

## Passeport diplomatique : Quarante ans au Quai d'Orsay — Gérard Araud (même titre et auteurs)
  garder   Books/A/Gerard Araud/GERARD_ARAUD__PASSEPORT_DIPLOMATIQUE_QUARANTE_ANS_AU_QUAI_D_ORSAY.epub (338 Ko)
  doublon  Books/A/Gerard Araud/GERARD_ARAUD__PASSEPORT_DIPLOMATIQUE_QUARANTE_ANS_AU_QUAI_D_ORSAY (2).epub (338 Ko)

## Péchés capitaux (Fammarion, 2 septembre) — Harrison, Jim (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__INSPECTEUR_SUNDERSON_2_PECHES_CAPITAUX.epub (2.7 Mo)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__PECHES_CAPITAUX_FAMMARION_2_SEPTEMBRE.epub (2.7 Mo)

## Prémices de la chute — Frederic Paulin (même titre et auteurs)
  garder   Books/P/Frédéric Paulin/FREDERIC_PAULIN__PREMICES_DE_LA_CHUTE.epub (324 Ko)
  doublon  Books/P/Frédéric Paulin/FREDERIC_PAULIN__PREMICES_DE_LA_CHUTE (2).epub (324 Ko)

## Prime Time — Chattam, Maxime (même titre et auteurs)
  garder   Books/C/Maxime Chattam/MAXIME_CHATTAM__PRIME_TIME.epub (949 Ko)
  doublon  Books/C/Maxime Chattam/MAXIME_CHATTAM__PRIME_TIME (2).epub (949 Ko)

## Project Hail Mary — Andy Weir (même titre et auteurs)
  garder   Books/W/Andy Weir/ANDY_WEIR__PROJECT_HAIL_MARY.epub (515 Ko)
  doublon  Books/W/Andy Weir/ANDY_WEIR__PROJECT_HAIL_MARY (2).epub (515 Ko)

## Psychopompe — Nothomb, Amélie (même titre et auteurs)
  garder   Books/N/Amelie Nothomb/AMELIE_NOTHOMB__PSYCHOPOMPE.epub (185 Ko)
  doublon  Books/N/Amelie Nothomb/AMELIE_NOTHOMB__PSYCHOPOMPE (2).epub (185 Ko)

## Quand s'avance l'ombre — Énora Chame (même titre et auteurs)
  garder   Books/C/Énora Chame/ENORA_CHAME__QUAND_S_AVANCE_L_OMBRE.epub (883 Ko)
  doublon  Books/C/Énora Chame/ENORA_CHAME__QUAND_SAVANCE_LOMBRE.epub (882 Ko)

## Quand tu écouteras cette chanson — Lola Lafon (même titre et auteurs)
  garder   Books/L/Lola Lafon/LOLA_LAFON__QUAND_TU_ECOUTERAS_CETTE_CHANSON.epub (175 Ko)
  doublon  Books/L/Lola Lafon/LOLA_LAFON__QUAND_TU_ECOUTERAS_CETTE_CHANSON (2).epub (175 Ko)

## Que ta volonté soit faîte — Maxime Chattam (même titre et auteurs)
  garder   Books/C/Maxime Chattam/MAXIME_CHATTAM__QUE_TA_VOLONTE_SOIT_FAITE.epub (320 Ko)
  doublon  Books/C/Maxime Chattam/MAXIME_CHATTAM__QUE_TA_VOLONTE_SOIT_FAITE (2).epub (321 Ko)

## Quelque part entre le bien et le mal — Molmy,Christophe (même titre et auteurs)
  garder   Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__QUELQUE_PART_ENTRE_LE_BIEN_ET_LE_MAL.epub (321 Ko)
  doublon  Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__QUELQUE_PART_ENTRE_LE_BIEN_ET_LE_MAL (2).epub (321 Ko)

## Quitter la vallée — Renaud de Chaumaray (même titre et auteurs)
  garder   Books/D/Renaud de Chaumaray/RENAUD_DE_CHAUMARAY__QUITTER_LA_VALLEE.epub (235 Ko)
  doublon  Books/D/Renaud de Chaumaray/RENAUD_DE_CHAUMARAY__QUITTER_LA_VALLEE (2).epub (235 Ko)

## Raison et Sentiments — Austen, Jane (même titre et auteurs)
  garder   Books/A/Jane Austen/JANE_AUSTEN__RAISON_ET_SENTIMENTS.epub (647 Ko)
  doublon  Books/A/Jane Austen/JANE_AUSTEN__RAISON_ET_SENTIMENTS (2).epub (647 Ko)

## Reconnaître le fascisme — Eco, Umberto (même titre et auteurs)
  garder   Books/E/Umberto Eco/UMBERTO_ECO__RECONNAITRE_LE_FASCISME.epub (188 Ko)
  doublon  Books/E/Umberto Eco/UMBERTO_ECO__RECONNAITRE_LE_FASCISME (2).epub (188 Ko)

## Résister (French Edition) — Saqué, Salomé (fichiers identiques)
  garder   SAQUE_SALOME_RESISTER_FRENCH_EDITION.epub (293 Ko)
  doublon  Books/S/Salomé Saqué/SALOME_SAQUE__RESISTER.epub (293 Ko)

## Résister (French Edition) — Saqué, Salomé (même titre et auteurs)
  garder   Books/S/Salomé Saqué/SALOME_SAQUE__RESISTER_FRENCH_EDITION.epub (293 Ko)
  doublon  SAQUE_SALOME_RESISTER_FRENCH_EDITION.epub (293 Ko)

## Résister à la culpabilisation : sur quelques empêchements d'exister — Mona Chollet (même titre et auteurs)
  garder   Books/C/Mona Chollet/MONA_CHOLLET__RESISTER_A_LA_CULPABILISATION_SUR_QUELQUES_EMPECHEMENTS_D_EXISTER.epub (1.6 Mo)
  doublon  Books/C/Mona Chollet/MONA_CHOLLET__RESISTER_A_LA_CULPABILISATION_SUR_QUELQUES_EMPECHEMENTS_DEXISTER.epub (1.6 Mo)

## Retour à l’état sauvage — Hunter Erin (même titre et auteurs)
  garder   Books/E/Hunter Erin/HUNTER_ERIN__RETOUR_A_L_ETAT_SAUVAGE.epub (2.3 Mo)
  doublon  Books/D/Erin Hunter La Guerre des Clans 01/ERIN_HUNTER_LA_GUERRE_DES_CLANS_01__RETOUR_A_LETAT_SAUVAGE.epub (2.3 Mo)

## retour en terre — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__RETOUR_EN_TERRE.epub (249 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__RETOUR_EN_TERRE (2).epub (249 Ko)

## Rouge karma — Jean-Christophe Grangé (même titre et auteurs)
  garder   Books/G/Jean-Christophe Grange/JEAN_CHRISTOPHE_GRANGE__ROUGE_KARMA_FRENCH_EDITION.epub (607 Ko)
  doublon  Books/G/Jean-Christophe Grange/JEAN_CHRISTOPHE_GRANGE__ROUGE_KARMA.epub (607 Ko)

## Saint Jacques — Bénédicte Belpois (même titre et auteurs)
  garder   Books/B/Bénédicte Belpois/BENEDICTE_BELPOIS__SAINT_JACQUES.epub (5.1 Mo)
  doublon  Books/B/Bénédicte Belpois/BENEDICTE_BELPOIS__SAINT_JACQUES (2).epub (5.1 Mo)

## Sambre, radioscopie d'un fait divers — Alice Géraud (même titre et auteurs)
  garder   Books/G/Alice Geraud/ALICE_GERAUD__SAMBRE_RADIOSCOPIE_D_UN_FAIT_DIVERS.epub (1.4 Mo)
  doublon  Books/G/Alice Geraud/ALICE_GERAUD__SAMBRE_RADIOSCOPIE_D_UN_FAIT_DIVERS (2).epub (1.4 Mo)

## Sample: The Plot Against America — Philip Roth (même titre et auteurs)
  garder   Books/R/Philip Roth/PHILIP_ROTH__SAMPLE_THE_PLOT_AGAINST_AMERICA.epub (45 Ko)
  doublon  Books/R/Philip Roth/PHILIP_ROTH__SAMPLE_THE_PLOT_AGAINST_AMERICA (2).epub (45 Ko)

## Scorched Grace — Margot Douaihy (même titre et auteurs)
  garder   Books/D/Margot Douaihy/MARGOT_DOUAIHY__SCORCHED_GRACE_A_SISTER_HOLIDAY_MYSTERY_1.epub (1.9 Mo)
  doublon  Books/D/Margot Douaihy/MARGOT_DOUAIHY__SCORCHED_GRACE.epub (1.9 Mo)

## Sept pas vers l'enfer — Alain Chouet (fichiers identiques)
  garder   Books/C/Alain Chouet/ALAIN_CHOUET__SEPT_PAS_VERS_LENFER.epub (440 Ko)
  doublon  Books/C/Alain Chouet/ALAIN_CHOUET__SEPT_PAS_VERS_L_ENFER.epub (440 Ko)

## Sept pas vers l'enfer — Alain Chouet (même titre et auteurs)
  garder   Books/C/Alain Chouet/ALAIN_CHOUET__SEPT_PAS_VERS_LENFER.epub (440 Ko)
  doublon  Books/C/Alain Chouet/ALAIN_CHOUET__SEPT_PAS_VERS_L_ENFER (2).epub (440 Ko)

## Sept Redditions — Ada Palmer (même titre et auteurs)
  garder   Books/P/Ada Palmer/ADA_PALMER__SEPT_REDDITIONS.epub (581 Ko)
  doublon  ADA_PALMER_SEPT_REDDITIONS.epub (549 Ko)

## Seul dans Berlin — Fallada, Hans (même titre et auteurs)
  garder   Books/F/Hans Fallada/HANS_FALLADA__SEUL_DANS_BERLIN.epub (617 Ko)
  doublon  Books/F/Hans Fallada/HANS_FALLADA__SEUL_DANS_BERLIN (2).epub (617 Ko)

## Seule en sa demeure — Coulon, Cécile (même titre et auteurs)
  garder   Books/C/Cécile Coulon/CECILE_COULON__SEULE_EN_SA_DEMEURE.epub (5.2 Mo)
  doublon  Books/C/Cécile Coulon/CECILE_COULON__SEULE_EN_SA_DEMEURE (2).epub (5.2 Mo)

## Sharko et Henebelle T13 : À retardement — Franck Thilliez (fichiers identiques)
  garder   Books/R/A Retardement/A_RETARDEMENT__FRANCK_THILLIEZ.epub (5.4 Mo)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__SHARKO_ET_HENEBELLE_T13_A_RETARDEMENT.epub (5.4 Mo)

## Sharko et Henebelle T13 : À retardement — Franck Thilliez (même titre et auteurs)
  garder   Books/R/A Retardement/A_RETARDEMENT__FRANCK_THILLIEZ.epub (5.4 Mo)
  doublon  Books/T/Franck Thilliez/FRANCK_THILLIEZ__SHARKO_ET_HENEBELLE_T13_A_RETARDEMENT (2).epub (5.4 Mo)

## Sorceleur - L'Intégrale — Andrzej Sapkowski (même titre et auteurs)
  garder   Books/S/Andrzej Sapkowski/ANDRZEJ_SAPKOWSKI__SORCELEUR_L_INTEGRALE.epub (4.1 Mo)
  doublon  Books/S/Sorceleur/SORCELEUR__L_INTEGRALE_ANDRZEJ_SAPKOWSKI.epub (4.1 Mo)

## Souvenirs de la Cour d’Assises — André Gide (même titre et auteurs)
  garder   Books/G/André Gide/ANDRE_GIDE__SOUVENIRS_DE_LA_COUR_D_ASSISES.epub (110 Ko)
  doublon  Books/G/André Gide/ANDRE_GIDE__SOUVENIRS_DE_LA_COUR_D_ASSISES (2).epub (110 Ko)

## Stefan Zweig — Le Monde d'hier (même titre et auteurs)
  garder   Books/D/Le Monde D'Hier/LE_MONDE_D_HIER__STEFAN_ZWEIG.epub (710 Ko)
  doublon  Books/Z/Stefan Zweig/STEFAN_ZWEIG__LE_MONDE_D_HIER.epub (710 Ko)

## Surface — Olivier Norek (même titre et auteurs)
  garder   Books/N/Olivier Norek/OLIVIER_NOREK__SURFACE.epub (460 Ko)
  doublon  Books/N/Olivier Norek/OLIVIER_NOREK__SURFACE (2).epub (460 Ko)

## Tant mieux — Amélie Nothomb (même titre et auteurs)
  garder   Books/N/Amelie Nothomb/AMELIE_NOTHOMB__TANT_MIEUX_FRENCH_EDITION.epub (295 Ko)
  doublon  Books/N/Amelie Nothomb/AMELIE_NOTHOMB__TANT_MIEUX.epub (295 Ko)

## The Day of the Jackal — Frederick Forsyth (même titre et auteurs)
  garder   Books/F/Frederick Forsyth/FREDERICK_FORSYTH__THE_DAY_OF_THE_JACKAL.epub (399 Ko)
  doublon  Books/F/Frederick Forsyth/FREDERICK_FORSYTH__THE_DAY_OF_THE_JACKAL (2).epub (399 Ko)

## Too Like the Lightning (Terra Ignota Book 1) — Ada Palmer (même titre et auteurs)
  garder   Books/P/Ada Palmer/ADA_PALMER__TOO_LIKE_THE_LIGHTNING_TERRA_IGNOTA_BOOK_1.epub (1.1 Mo)
  doublon  Books/P/Ada Palmer/ADA_PALMER__TOO_LIKE_THE_LIGHTNING.epub (1.1 Mo)

## Tous les hommes n'habitent pas le monde de la même façon — Dubois,Jean-Paul (même titre et auteurs)
  garder   Books/J/Dubois Jean-Paul/DUBOIS_JEAN_PAUL__TOUS_LES_HOMMES_NHABITENT_PAS_LE_MONDE_DE_LA_MEME_FACON.epub (213 Ko)
  doublon  Books/J/Dubois Jean-Paul/JEAN_PAUL_DUBOIS__TOUS_LES_HOMMES_N_HABITENT_PAS_LE_MONDE_DE_LA_MEME_FACON.epub (213 Ko)

## Tout le bruit du Guéliz — Ruben Barrouk (même titre et auteurs)
  garder   Books/B/Ruben Barrouk/RUBEN_BARROUK__TOUT_LE_BRUIT_DU_GUELIZ.epub (444 Ko)
  doublon  Books/B/Ruben Barrouk/RUBEN_BARROUK_RUBEN_BARROUK__TOUT_LE_BRUIT_DU_GUELIZ.epub (443 Ko)

## Toute la culture générale — Éric Cobast (même titre et auteurs)
  garder   Books/C/Éric Cobast/ERIC_COBAST__TOUTE_LA_CULTURE_GENERALE.epub (5.5 Mo)
  doublon  Books/C/Éric Cobast/ERIC_COBAST__TOUTE_LA_CULTURE_GENERALE (2).epub (5.5 Mo)

## Traité sur l’intolérance — Richard Malka (fichiers identiques)
  garder   Traite sur l intolerance 2.epub (138 Ko)
  doublon  Books/M/Richard Malka/RICHARD_MALKA__TRAITE_SUR_L_INTOLERANCE (2).epub (138 Ko)

## Traité sur l’intolérance — Richard Malka (fichiers identiques)
  garder   Traite sur l intolerance.epub (5.4 Mo)
  doublon  Books/M/Richard Malka/RICHARD_MALKA__TRAITE_SUR_L_INTOLERANCE.epub (5.4 Mo)

## Traité sur l’intolérance — Richard Malka (même titre et auteurs)
  garder   Traite sur l intolerance.epub (5.4 Mo)
  doublon  Traite sur l intolerance 2.epub (138 Ko)
  doublon  Books/M/Richard Malka/RICHARD_MALKA__TRAITE_SUR_L_INTOLERANCE (3).epub (138 Ko)

## Traverser les forêts — Hinault, Caroline (même titre et auteurs)
  garder   Books/H/Caroline Hinault/CAROLINE_HINAULT__TRAVERSER_LES_FORETS.epub (169 Ko)
  doublon  Books/H/Caroline Hinault/CAROLINE_HINAULT__TRAVERSER_LES_FORETS (2).epub (169 Ko)

## Trilogie New-Yorkaise — Auster Paul (même titre et auteurs)
  garder   Books/A/Paul Auster/AUSTER_PAUL__TRILOGIE_NEW_YORKAISE.epub (477 Ko)
  doublon  Books/A/Paul Auster/PAUL_AUSTER__TRILOGIE_NEW_YORKAISE.epub (477 Ko)

## Trop intelligent pour être heureux ? L'adulte surdoué — Jeanne Siaud-Facchin (même titre et auteurs)
  garder   Books/S/Jeanne Siaud-Facchin/JEANNE_SIAUD_FACCHIN__TROP_INTELLIGENT_POUR_ETRE_HEUREUX_L_ADULTE_SURDOUE.epub (466 Ko)
  doublon  Books/S/Jeanne Siaud-Facchin/JEANNE_SIAUD_FACCHIN__TROP_INTELLIGENT_POUR_ETRE_HEUREUX_L_ADULTE_SURDOUE (2).epub (466 Ko)

## Trop semblable à l'éclair — Ada Palmer (même titre et auteurs)
  garder   Books/P/Ada Palmer/ADA_PALMER__TROP_SEMBLABLE_A_LECLAIR_TERRA_IGNOTA_1.epub (798 Ko)
  doublon  Books/P/Ada Palmer/ADA_PALMER__TROP_SEMBLABLE_A_L_ECLAIR.epub (798 Ko)

## Truismes - Marie Darrieussecq — Divers Roman (même titre et auteurs)
  garder   Books/R/Divers Roman/DIVERS_ROMAN__TRUISMES_MARIE_DARRIEUSSECQ.epub (102 Ko)
  doublon  Books/D/Marie Darrieussecq/MARIE_DARRIEUSSECQ__TRUISMES.epub (102 Ko)

## Tsunami — Dugain Marc, Marc Dugain (même titre et auteurs)
  garder   Books/D/Dugain Marc & Marc Dugain/DUGAIN_MARC_MARC_DUGAIN__TSUNAMI.epub (466 Ko)
  doublon  Books/D/Marc Dugain/MARC_DUGAIN__TSUNAMI.epub (466 Ko)

## Tu me manqueras demain — Heine Bakkeid (même titre et auteurs)
  garder   Books/B/Heine Bakkeid/HEINE_BAKKEID__TU_ME_MANQUERAS_DEMAIN.epub (350 Ko)
  doublon  Books/B/Heine Bakkeid/HEINE_BAKKEID__TU_ME_MANQUERAS_DEMAIN (2).epub (350 Ko)

## Un amour infini — Ghislaine Dunant (même titre et auteurs)
  garder   Books/D/Ghislaine Dunant/GHISLAINE_DUNANT__UN_AMOUR_INFINI.epub (982 Ko)
  doublon  Books/D/Ghislaine Dunant/GHISLAINE_DUNANT__UN_AMOUR_INFINI (2).epub (982 Ko)

## Un bon jour pour mourir — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__UN_BON_JOUR_POUR_MOURIR.epub (335 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__UN_BON_JOUR_POUR_MOURIR (2).epub (334 Ko)

## Un bref instant de splendeur — Ocean Vuong (même titre et auteurs)
  garder   Books/V/Ocean Vuong/OCEAN_VUONG__UN_BREF_INSTANT_DE_SPLENDEUR.epub (968 Ko)
  doublon  Books/V/Ocean Vuong/OCEAN_VUONG__UN_BREF_INSTANT_DE_SPLENDEUR (2).epub (968 Ko)

## Un crime sans importance — Irène Frain (même titre et auteurs)
  garder   Books/F/Irène Frain/IRENE_FRAIN__UN_CRIME_SANS_IMPORTANCE.epub (5.2 Mo)
  doublon  Books/F/Irène Frain/IRENE_FRAIN__UN_CRIME_SANS_IMPORTANCE (2).epub (5.4 Mo)

## Un frère — David Thomas (même titre et auteurs)
  garder   Books/T/David Thomas/DAVID_THOMAS__UN_FRERE.epub (200 Ko)
  doublon  Books/T/David Thomas/DAVID_THOMAS__UN_FRERE (2).epub (203 Ko)

## Un oeil dans la nuit — Bernard Minier (même titre et auteurs)
  garder   Books/B/Minier Bernard/BERNARD_MINIER__UN_IL_DANS_LA_NUIT.epub (532 Ko)
  doublon  Books/B/Minier Bernard/BERNARD_MINIER__UN_OEIL_DANS_LA_NUIT.epub (532 Ko)

## Un printemps pour soi — Jeanne Siaud-Facchin (fichiers identiques)
  garder   Books/S/Jeanne Siaud-Facchin/JEANNE_SIAUD_FACCHIN__UN_PRINTEMPS_POUR_SOI.epub (3.3 Mo)
  doublon  Books/S/Jeanne Siaud-Facchin/JEANNE_JEANNE_SIAUD_FACCHIN_SIAUD_FACCHIN__UN_PRINTEMPS_POUR_SOI.epub (3.3 Mo)

## Un printemps pour soi — Jeanne Siaud-Facchin (même titre et auteurs)
  garder   Books/S/Jeanne Siaud-Facchin/JEANNE_SIAUD_FACCHIN__UN_PRINTEMPS_POUR_SOI.epub (3.3 Mo)
  doublon  Books/S/Jeanne Siaud-Facchin/JEANNE_SIAUD_FACCHIN__UN_PRINTEMPS_POUR_SOI (2).epub (3.3 Mo)

## Une femme à Berlin — Marta Hillers (même titre et auteurs)
  garder   Books/H/Marta Hillers/MARTA_MARTA_HILLERS_HILLERS__UNE_FEMME_A_BERLIN.epub (351 Ko)
  doublon  Books/H/Marta Hillers/MARTA_HILLERS__UNE_FEMME_A_BERLIN.epub (350 Ko)

## Une odyssée américaine — Jim Harrison (même titre et auteurs)
  garder   Books/H/Jim Harrison/JIM_HARRISON__UNE_ODYSSEE_AMERICAINE.epub (451 Ko)
  doublon  Books/H/Jim Harrison/JIM_HARRISON__UNE_ODYSSEE_AMERICAINE (2).epub (451 Ko)

## Une petite ville nazie — William S. Allen (même titre et auteurs)
  garder   Books/A/William S. Allen/WILLIAM_S_ALLEN__UNE_PETITE_VILLE_NAZIE.epub (900 Ko)
  doublon  Books/A/William S. Allen/WILLIAM_S_ALLEN__UNE_PETITE_VILLE_NAZIE (2).epub (900 Ko)

## Une vérité si délicate — Le Carré, John (même titre et auteurs)
  garder   Books/L/John Le Carre/JOHN_LE_CARRE__UNE_VERITE_SI_DELICATE.epub (332 Ko)
  doublon  Books/L/John Le Carre/JOHN_LE_CARRE__UNE_VERITE_SI_DELICATE (2).epub (332 Ko)

## Victor Coste T4 Dans les brumes de Capelans — Olivier Norek (même titre et auteurs)
  garder   Books/N/Olivier Norek/OLIVIER_NOREK__VICTOR_COSTE_T4_DANS_LES_BRUMES_DE_CAPELANS.epub (542 Ko)
  doublon  Books/N/Olivier Norek/OLIVIER_NOREK__VICTOR_COSTE_T4_DANS_LES_BRUMES_DE_CAPELANS (2).epub (542 Ko)

## Waylander II, Dans le Royaume du Loup — Gemmell, David (même titre et auteurs)
  garder   Books/D/Gemmell David/GEMMELL_DAVID__WAYLANDER_II_DANS_LE_ROYAUME_DU_LOUP.epub (438 Ko)
  doublon  Books/D/Gemmell David/DAVID_GEMMELL__WAYLANDER_II_DANS_LE_ROYAUME_DU_LOUP.epub (438 Ko)

## 1 fichiers illisibles (comparés sur le contenu seulement)
  Books/I/Nemirovsky Irene/IRENE_NEMIROVSKY__LE_BAL.epub: Invalid EPUB "/mnt/c/Users/Nam/lib/books/Books/I/Nemirovsky Irene/IRENE_NEMIROVSKY__LE_BAL.epub": not a readable zip (invalid relative path: OPS/../cover.jpg)
```
