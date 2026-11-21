# Plan de rangement de `mega:Library` (rien n'a été modifié)

585 EPUB analysés : 584 à renommer/déplacer, 0 déjà au bon endroit, 1 illisibles laissés tels quels.

Format : `Books/<Lettre du nom>/<Prénom Nom>/<Prénom Nom - Titre>.epub`, d'après les métadonnées EPUB.

## Collisions — 5 groupes de fichiers qui tombent sur le même nom (doublons probables)

- `Books/A/Jean-Baptiste Andrea/JEAN_BAPTISTE_ANDREA__VEILLER_SUR_ELLE (2).epub` et `Books/A/Jean-Baptiste Andrea/JEAN_BAPTISTE_ANDREA__VEILLER_SUR_ELLE.epub`
  → `Books/A/Jean-Baptiste Andrea/Jean-Baptiste Andrea - Veiller sur elle.epub`
- `Books/B/Philippe Besson/PHILIPPE_BESSON__CECI_N_EST_PAS_UN_FAIT_DIVERS (3).epub` et `ceci-n-est-pas-un-fait-divers_bookys.epub`
  → `Books/B/Philippe Besson/Philippe Besson - Ceci n'est pas un fait divers.epub`
- `Books/D/Savinien de Cyrano de Bergerac/SAVINIEN_DE_CYRANO_DE_BERGERAC__L_AUTRE_MONDE_OU_LES_201_TATS_ET_EMPIRES_DE_LA_LUNE.epub` et `Books/D/Savinien de Cyrano de Bergerac/SAVINIEN_DE_CYRANO_DE_BERGERAC__L_AUTRE_MONDE_OU_LES_ETATS_ET_EMPIRES_DE_LA_LUNE.epub`
  → `Books/B/Savinien de Cyrano de Bergerac/Savinien de Cyrano de Bergerac - L'Autre Monde ou Les États et Empires de la Lune.epub`
- `Books/E/Umberto Eco/UMBERTO_ECO__RECONNAITRE_LE_FASCISME.epub` et `UMBERTO_ECO_RECONNAITRE_LE_FASCISME.epub`
  → `Books/E/Umberto Eco/Umberto Eco - Reconnaître le fascisme.epub`
- `Books/S/Bram Stoker/BRAM_STOKER__1897_DRACULA.epub` et `Books/S/Bram Stoker/Stoker, Bram_Dracula.epub`
  → `Books/S/Bram Stoker/Bram Stoker - Dracula.epub`

## Exceptions manuelles — 16 fichiers aux métadonnées fausses, cibles fixées à la main

- `Books/A/Athame/ATHAME__JAMES_E_L_CINQUANTE_NUANCES_DE_GREY_FIFTY_SHADES_OF_GREY_T1.epub`
  → `Books/J/E. L. James/E. L. James - Cinquante nuances de Grey T1.epub`
- `Books/A/Sonia Alain/SONIA_ALAIN__LES_CONTES_INTERDITS_LE_PETIT_CHAPERON_ROUGE.epub`
  → `Books/A/Sonia Alain/Sonia Alain - Les contes interdits - Le petit chaperon rouge.epub`
- `Books/E/Etc/ETC__WAYLANDER.epub`
  → `Books/G/David Gemmell/David Gemmell - Waylander T1 - Waylander.epub`
- `Books/E/Mathias Enard/MATHIAS_ENARD__BOUSSOLE.epub`
  → `Books/E/Mathias Enard/Mathias Enard - Boussole.epub`
- `Books/G/Laurent Gaude/LAURENT_GAUDE__CHIEN_51.epub`
  → `Books/G/Laurent Gaudé/Laurent Gaudé - Chien 51.epub`
- `Books/H/Samantha Harvey/SAMANTHA_HARVEY__ORBITAL.epub`
  → `Books/H/Samantha Harvey/Samantha Harvey - Orbital.epub`
- `Books/J/Green John/GREEN_JOHN__NOS_ETOILES_CONTRAIRES.epub`
  → `Books/G/John Green/John Green - Nos étoiles contraires.epub`
- `Books/K/R. F. Kuang/R_F_KUANG__BABEL_OR_THE_NECESSITY_OF_VIOLENCE_AN_ARCANE_HISTORY_OF_THE_OXFORD_TRANSLATORS_REVOLUTION.epub`
  → `Books/K/R. F. Kuang/R. F. Kuang - Babel, or the Necessity of Violence.epub`
- `Books/L/L'échiquier/L_ECHIQUIER__JEAN_PHILIPPE_TOUSSAINT.epub`
  → `Books/T/Jean-Philippe Toussaint/Jean-Philippe Toussaint - L'échiquier.epub`
- `Books/L/National Intelligence Council & Smolar, Piotr & Barucq, Laurent/NATIONAL_INTELLIGENCE_COUNCIL_USA_SMOLAR_PIOTR_BARUCQ_LAURENT__LE_MONDE_EN_2040_VU_PAR_LA_CIA_FRENCH_EDITION.epub`
  → `Books/N/National Intelligence Council/National Intelligence Council - Le Monde en 2040 vu par la CIA.epub`
- `Books/S/Elliot Ackerman Et James Stavridis/ELLIOT_ACKERMAN_ET_JAMES_STAVRIDIS__2034.epub`
  → `Books/A/Elliot Ackerman/Elliot Ackerman, James Stavridis - 2034.epub`
- `Books/S/Jeanne Siaud-Facchin/JEANNE_SIAUD_FACCHIN__TROP_INTELLIGENT_POUR_ETRE_HEUREUX_L_ADULTE_SURDOUE.epub`
  → `Books/S/Jeanne Siaud-Facchin/Jeanne Siaud-Facchin - Trop intelligent pour être heureux - L'adulte surdoué.epub`
- `Books/W/Herbert George Wells/HERBERT_GEORGE_WELLS__LILE_DU_DOCTEUR_MOREAU.epub`
  → `Books/W/Herbert George Wells/Herbert George Wells - L'île du docteur Moreau.epub`
- `ROBIN_HOBB_ASSASSIN_ROYAL_13_ADIEUX_ET_RETROUVAILLES.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin royal T13 - Adieux et retrouvailles.epub`
- `UNKNOWN__0750A83791D14C71D790DBD54C108DFB.epub`
  → `Books/_À identifier/0750a83791d14c71d790dbd54c108dfb.epub`
- `UNKNOWN__6E0876F36BD8236C37638C49ABE94C96.epub`
  → `Books/_À identifier/6e0876f36bd8236c37638c49abe94c96.epub`

## À relire — 30 fichiers où la normalisation a dû deviner

- [title-had-forbidden-chars] `Books/A/Gerard Araud/GERARD_ARAUD__PASSEPORT_DIPLOMATIQUE_QUARANTE_ANS_AU_QUAI_D_ORSAY.epub`
  → `Books/A/Gérard Araud/Gérard Araud - Passeport diplomatique - Quarante ans au Quai d'Orsay.epub`
- [name-collision] `Books/A/Jean-Baptiste Andrea/JEAN_BAPTISTE_ANDREA__VEILLER_SUR_ELLE (2).epub`
  → `Books/A/Jean-Baptiste Andrea/Jean-Baptiste Andrea - Veiller sur elle.epub`
- [name-collision] `Books/A/Jean-Baptiste Andrea/JEAN_BAPTISTE_ANDREA__VEILLER_SUR_ELLE.epub`
  → `Books/A/Jean-Baptiste Andrea/Jean-Baptiste Andrea - Veiller sur elle (2).epub`
- [title-had-forbidden-chars] `Books/B/James Bamford/JAMES_BAMFORD__BODY_OF_SECRETS_ANATOMY_OF_THE_ULTRA_SECRET_NATIONAL_SECURITY_AGENCY.epub`
  → `Books/B/James Bamford/James Bamford - Body of Secrets - Anatomy of the Ultra-Secret National Security Agency.epub`
- [title-all-caps] `Books/B/Minier Bernard/BERNARD_MINIER__H.epub`
  → `Books/M/Bernard Minier/Bernard Minier - H.epub`
- [name-collision] `Books/B/Philippe Besson/PHILIPPE_BESSON__CECI_N_EST_PAS_UN_FAIT_DIVERS (3).epub`
  → `Books/B/Philippe Besson/Philippe Besson - Ceci n'est pas un fait divers.epub`
- [single-word-author] `Books/C/Colette/COLETTE__LA_CHATTE.epub`
  → `Books/C/Colette/Colette - La Chatte.epub`
- [title-had-forbidden-chars] `Books/C/Mona Chollet/MONA_CHOLLET__RESISTER_A_LA_CULPABILISATION_SUR_QUELQUES_EMPECHEMENTS_D_EXISTER.epub`
  → `Books/C/Mona Chollet/Mona Chollet - Résister à la culpabilisation - sur quelques empêchements d'exister.epub`
- [title-had-forbidden-chars] `Books/D/Alexandre Dumas/ALEXANDRE_DUMAS__CREATION_ET_REDEMPTION_01_LE_DOCTEUR_MYSTERIEUX.epub`
  → `Books/D/Alexandre Dumas/Alexandre Dumas - Création et rédemption, première partie - Le docteur mystérieux.epub`
- [title-had-forbidden-chars] `Books/D/Alexandre Dumas/ALEXANDRE_DUMAS__CREATION_ET_REDEMPTION_02_LA_FILLE_DU_MARQUIS.epub`
  → `Books/D/Alexandre Dumas/Alexandre Dumas - Création et rédemption, deuxième partie - La fille du marquis.epub`
- [name-collision] `Books/D/Savinien de Cyrano de Bergerac/SAVINIEN_DE_CYRANO_DE_BERGERAC__L_AUTRE_MONDE_OU_LES_201_TATS_ET_EMPIRES_DE_LA_LUNE.epub`
  → `Books/B/Savinien de Cyrano de Bergerac/Savinien de Cyrano de Bergerac - L'Autre Monde ou Les États et Empires de la Lune.epub`
- [name-collision] `Books/D/Savinien de Cyrano de Bergerac/SAVINIEN_DE_CYRANO_DE_BERGERAC__L_AUTRE_MONDE_OU_LES_ETATS_ET_EMPIRES_DE_LA_LUNE.epub`
  → `Books/B/Savinien de Cyrano de Bergerac/Savinien de Cyrano de Bergerac - L'Autre Monde ou Les États et Empires de la Lune (2).epub`
- [name-collision] `Books/E/Umberto Eco/UMBERTO_ECO__RECONNAITRE_LE_FASCISME.epub`
  → `Books/E/Umberto Eco/Umberto Eco - Reconnaître le fascisme.epub`
- [title-had-forbidden-chars] `Books/G/Franz-Olivier Giesbert/FRANZ_OLIVIER_GIESBERT__HISTOIRE_INTIME_DE_LA_VE_REPUBLIQUE_TOME_2_LA_BELLE_EPOQUE_FRENCH_EDITION.epub`
  → `Books/G/Franz-Olivier Giesbert/Franz-Olivier Giesbert - Histoire intime de la Ve République T2 - La belle époque.epub`
- [title-had-forbidden-chars] `Books/G/Thomas Gomart/THOMAS_GOMART__L_AFFOLEMENT_DU_MONDE_10_ENJEUX_GEOPOLITIQUES.epub`
  → `Books/G/Thomas Gomart/Thomas Gomart - l'Affolement du monde - 10 enjeux géopolitiques.epub`
- [title-had-forbidden-chars] `Books/J/Jean-Philippe Jaworski/JEAN_PHILIPPE_JAWORSKI__GAGNER_LA_GUERRE_RECIT_DU_VIEUX_ROYAUME_LA_BIBLIOTHEQUE_VOLTAIQUE_FRENCH_EDITION.epub`
  → `Books/J/Jean-Philippe Jaworski/Jean-Philippe Jaworski - Gagner la guerre - Récit du Vieux royaume (La bibliothèque voltaïque).epub`
- [title-had-forbidden-chars] `Books/M/Freida McFadden/FREIDA_MCFADDEN__LA_FEMME_DE_MENAGE_T3_LA_FEMME_DE_MENAGE_VOIT_TOUT.epub`
  → `Books/M/Freida McFadden/Freida McFadden - La femme de ménage T3 - La femme de ménage voit tout.epub`
- [title-had-forbidden-chars] `Books/R/A Retardement/A_RETARDEMENT__FRANCK_THILLIEZ.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - Sharko et Henebelle T13 - À retardement.epub`
- [title-had-forbidden-chars] `Books/R/Philip Roth/PHILIP_ROTH__SAMPLE_THE_PLOT_AGAINST_AMERICA.epub`
  → `Books/R/Philip Roth/Philip Roth - Sample - The Plot Against America.epub`
- [title-had-forbidden-chars] `Books/S/Aurelien Barrau Et Louis Schweitzer/AURELIEN_BARRAU_ET_LOUIS_SCHWEITZER__L_ANIMAL_EST_IL_UN_HOMME_COMME_LES_AUTRES.epub`
  → `Books/B/Aurelien Barrau/Aurelien Barrau, Louis Schweitzer - L'Animal Est-Il un Homme Comme les Autres.epub`
- [title-all-caps, name-collision] `Books/S/Bram Stoker/BRAM_STOKER__1897_DRACULA.epub`
  → `Books/S/Bram Stoker/Bram Stoker - Dracula.epub`
- [name-collision] `Books/S/Bram Stoker/Stoker, Bram_Dracula.epub`
  → `Books/S/Bram Stoker/Bram Stoker - Dracula (2).epub`
- [single-word-author] `Books/V/Vercors/VERCORS__LES_ANIMAUX_DENATURES.epub`
  → `Books/V/Vercors/Vercors - Les Animaux dénaturés.epub`
- [title-had-forbidden-chars] `Books/W/Chloe Walsh 1/CHLOE_WALSH_1__BINDING_13_BOYS_OF_TOMMEN.epub`
  → `Books/W/Chloe Walsh/Chloe Walsh - 1 - Binding 13 - Boys of Tommen.epub`
- [name-collision] `ceci-n-est-pas-un-fait-divers_bookys.epub`
  → `Books/B/Philippe Besson/Philippe Besson - Ceci n'est pas un fait divers (2).epub`
- [title-had-forbidden-chars] `JOHN_GWYNNE_LE_LIVRE_DES_TERRES_BANNIES_T1_MALICE.epub`
  → `Books/G/John Gwynne/John Gwynne - Le Livre des Terres Bannies T1 - Malice.epub`
- [title-had-forbidden-chars] `JOHN_GWYNNE_LE_LIVRE_DES_TERRES_BANNIES_T2_BRAVOURE.epub`
  → `Books/G/John Gwynne/John Gwynne - Le Livre des Terres Bannies T2 - Bravoure.epub`
- [title-had-forbidden-chars] `JOHN_GWYNNE_LE_LIVRE_DES_TERRES_BANNIES_T3_RUINE.epub`
  → `Books/G/John Gwynne/John Gwynne - Le Livre des Terres Bannies T3 - Ruine.epub`
- [single-word-author] `QNTM_LA_DIVISION_ANTIMEMETIQUE_N_EXISTE_PAS.epub`
  → `Books/Q/qntm/qntm - La division antimémétique n'existe pas.epub`
- [name-collision] `UMBERTO_ECO_RECONNAITRE_LE_FASCISME.epub`
  → `Books/E/Umberto Eco/Umberto Eco - Reconnaître le fascisme (2).epub`

## Les 538 autres

- `1991.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - 1991.epub`
- `ADA_PALMER_L_ALPHABET_DES_CREATEURS.epub`
  → `Books/P/Ada Palmer/Ada Palmer - L’Alphabet des Créateurs.epub`
- `ADA_PALMER_LA_VOLONTE_DE_SE_BATTRE.epub`
  → `Books/P/Ada Palmer/Ada Palmer - La volonté de se battre.epub`
- `ADA_PALMER_TERRA_IGNOTA_T5_PEUT_ETRE_LES_ETOILES.epub`
  → `Books/P/Ada Palmer/Ada Palmer - Terra Ignota T5 Peut-être les étoiles.epub`
- `ANNE_GODARD_NOUS_AUSSI.epub`
  → `Books/G/Anne Godard/Anne Godard - Nous aussi.epub`
- `ARTHUR_DREYFUS_LA_PUNITION.epub`
  → `Books/D/Arthur Dreyfus/Arthur Dreyfus - La punition.epub`
- `BARRELLON_NILS_SEINE_DE_CRIME.epub`
  → `Books/B/Nils Barrellon/Nils Barrellon - Seine de crime.epub`
- `BERENICE_PICHAT_UN_MARCHE_NOIR.epub`
  → `Books/P/Bérénice Pichat/Bérénice Pichat - Un marché noir.epub`
- `BERGMANN_BORIS_MINOTAURE.epub`
  → `Books/B/Boris Bergmann/Boris Bergmann - Minotaure.epub`
- `Books/A/André Aciman/ANDRE_ACIMAN__CALL_ME_BY_YOUR_NAME.epub`
  → `Books/A/André Aciman/André Aciman - Call Me by Your Name.epub`
- `Books/A/Dante Alighieri/DANTE_ALIGHIERI__LA_DIVINE_COMEDIE_RISSET.epub`
  → `Books/A/Dante Alighieri/Dante Alighieri - La Divine Comédie (Risset).epub`
- `Books/A/Emily Audrin/EMILY_AUDRIN__BRAQCOEUR_S.epub`
  → `Books/A/Emily Audrin/Emily Audrin - Braqcœur(s).epub`
- `Books/A/Florence Aubenas/FLORENCE_AUBENAS__L_INCONNU_DE_LA_POSTE.epub`
  → `Books/A/Florence Aubenas/Florence Aubenas - L'Inconnu de la poste.epub`
- `Books/A/Hannah Arendt/HANNAH_ARENDT__LA_LIBERTE_D_ETRE_LIBRE.epub`
  → `Books/A/Hannah Arendt/Hannah Arendt - La Liberté d'être Libre.epub`
- `Books/A/Harwicz Ariana/HARWICZ_ARIANA__CREVE_MON_AMOUR.epub`
  → `Books/H/Ariana Harwicz/Ariana Harwicz - Crève, mon amour.epub`
- `Books/A/Hiro Arikawa/HIRO_ARIKAWA__LES_MEMOIRES_D_UN_CHAT.epub`
  → `Books/A/Hiro Arikawa/Hiro Arikawa - Les Mémoires d'un chat.epub`
- `Books/A/Jane Austen/JANE_AUSTEN__RAISON_ET_SENTIMENTS.epub`
  → `Books/A/Jane Austen/Jane Austen - Raison et Sentiments.epub`
- `Books/A/Margaret Atwood/MARGARET_ATWOOD__LA_SERVANTE_ECARLATE_NOUVELLE_TRADUCTION.epub`
  → `Books/A/Margaret Atwood/Margaret Atwood - La Servante écarlate - Nouvelle traduction.epub`
- `Books/A/Matthieu Aron/MATTHIEU_ARON__LES_GRANDES_PLAIDOIRIES_DES_TENORS_DU_BARREAUX.epub`
  → `Books/A/Matthieu Aron/Matthieu Aron - Les grandes plaidoiries des ténors du barreau.epub`
- `Books/A/Maud Ankaoua/MAUD_ANKAOUA__KILOMETRE_ZERO.epub`
  → `Books/A/Maud Ankaoua/Maud Ankaoua - Kilomètre zéro.epub`
- `Books/A/Maud Ankaoua/MAUD_ANKAOUA__PLUS_JAMAIS_SANS_MOI (2).epub`
  → `Books/A/Maud Ankaoua/Maud Ankaoua - Plus jamais sans moi.epub`
- `Books/A/Maud Ankaoua/MAUD_ANKAOUA__PLUS_JAMAIS_SANS_MOI.epub`
  → `Books/M/Ankaoua Maud/Ankaoua Maud, Maud Ankaoua - Plus jamais sans moi.epub`
- `Books/A/Mona Awad/MONA_AWAD__BUNNY.epub`
  → `Books/A/Mona Awad/Mona Awad - Bunny.epub`
- `Books/A/Nathacha Appanah/NATHACHA_APPANAH__LA_NUIT_AU_C_UR.epub`
  → `Books/A/Nathacha Appanah/Nathacha Appanah - La nuit au cœur.epub`
- `Books/A/Paul Auster/AUSTER_PAUL__TRILOGIE_NEW_YORKAISE.epub`
  → `Books/P/Auster Paul/Auster Paul - Trilogie New-Yorkaise.epub`
- `Books/A/Santiago H. Amigorena/SANTIAGO_H_AMIGORENA__LA_JUSTICE_DES_HOMMES.epub`
  → `Books/A/Santiago H. Amigorena/Santiago H. Amigorena - La justice des hommes.epub`
- `Books/A/Sfeir Antoine/SFEIR_ANTOINE__BREVE_HISTOIRE_DE_L_ISLAM_A_L_USAGE_DE_TOUS.epub`
  → `Books/S/Antoine Sfeir/Antoine Sfeir - Brève histoire de l'islam à l'usage de tous.epub`
- `Books/A/William S. Allen/WILLIAM_S_ALLEN__UNE_PETITE_VILLE_NAZIE.epub`
  → `Books/A/William S. Allen/William S. Allen - Une petite ville nazie.epub`
- `Books/B/Anouar Benmalek/ANOUAR_BENMALEK__L_AMOUR_AU_TEMPS_DES_SCELERATS.epub`
  → `Books/B/Anouar Benmalek/Anouar Benmalek - L'amour au temps des scélérats.epub`
- `Books/B/Aurélien Bellanger/AURELIEN_BELLANGER__LES_DERNIERS_JOURS_DU_PARTI_SOCIALISTE.epub`
  → `Books/B/Aurélien Bellanger/Aurélien Bellanger - Les Derniers Jours du parti socialiste.epub`
- `Books/B/Bénédicte Belpois/BENEDICTE_BELPOIS__SAINT_JACQUES.epub`
  → `Books/B/Bénédicte Belpois/Bénédicte Belpois - Saint Jacques.epub`
- `Books/B/Cedric Bannel/CEDRIC_BANNEL__LESPION_FRANCAIS.epub`
  → `Books/B/Cédric Bannel/Cédric Bannel - L'Espion français.epub`
- `Books/B/Edouard Baer/EDOUARD_BAER__LES_ELUCUBRATIONS_D_UN_HOMME_SOUDAIN_FRAPPE_PAR_LA_GRACE.epub`
  → `Books/B/Édouard Baer/Édouard Baer - Les Elucubrations d'un homme soudain frappé par la grâce.epub`
- `Books/B/Eugenie Bastie/EUGENIE_BASTIE__LA_GUERRE_DES_IDEES.epub`
  → `Books/B/Eugénie Bastié/Eugénie Bastié - La guerre des idées.epub`
- `Books/B/Florence Braunstein/FLORENCE_BRAUNSTEIN__1_KILO_DE_CULTURE_GENERALE.epub`
  → `Books/B/Florence Braunstein/Florence Braunstein - 1 kilo de culture générale.epub`
- `Books/B/Francoise Bourdin/BOURDIN_FRANCOISE__TERRE_INDIGO.epub`
  → `Books/B/Françoise Bourdin/Françoise Bourdin - Terre indigo.epub`
- `Books/B/Francoise Bourdin/FRANCOISE_BOURDIN__JUILLET_EN_HIVER.epub`
  → `Books/B/Françoise Bourdin/Françoise Bourdin - Juillet en hiver.epub`
- `Books/B/Francoise Bourdin/FRANCOISE_BOURDIN__LE_MEILLEUR_EST_A_VENIR.epub`
  → `Books/B/Françoise Bourdin/Françoise Bourdin - Le meilleur est à venir.epub`
- `Books/B/Francoise Bourdin/FRANCOISE_BOURDIN__LES_VENDANGES_DE_JUILLET.epub`
  → `Books/B/Françoise Bourdin/Françoise Bourdin - Les vendanges de Juillet.epub`
- `Books/B/Francoise Bourdin/FRANCOISE_BOURDIN__UN_MARIAGE_D_AMOUR.epub`
  → `Books/B/Françoise Bourdin/Françoise Bourdin - Un mariage d’amour.epub`
- `Books/B/Gerald Bronner/GERALD_BRONNER__COMME_DES_DIEUX.epub`
  → `Books/B/Gérald Bronner/Gérald Bronner - Comme des dieux.epub`
- `Books/B/Gwenael Bulteau/GWENAEL_BULTEAU__LA_REPUBLIQUE_DES_FAIBLES.epub`
  → `Books/B/Gwenaël Bulteau/Gwenaël Bulteau - La République des faibles.epub`
- `Books/B/Heine Bakkeid/HEINE_BAKKEID__TU_ME_MANQUERAS_DEMAIN.epub`
  → `Books/B/Heine Bakkeid/Heine Bakkeid - Tu me manqueras demain.epub`
- `Books/B/Henry Bromell/HENRY_BROMELL__LITTLE_AMERICA.epub`
  → `Books/B/Henry Bromell/Henry Bromell - Little America.epub`
- `Books/B/Jamey Bradbury/JAMEY_BRADBURY__SAUVAGE.epub`
  → `Books/B/Jamey Bradbury/Jamey Bradbury - Sauvage.epub`
- `Books/B/Jean-François Pepin Florence Braunstein/JEAN_FRANCOIS_PEPIN_FLORENCE_BRAUNSTEIN__LA_CULTURE_GENERALE_POUR_LES_NULS_3E_EDITION.epub`
  → `Books/P/Jean-François Florence BRAUNSTEIN Pepin/Jean-François Florence BRAUNSTEIN Pepin - La Culture générale Pour les Nuls, 3e édition.epub`
- `Books/B/Katherine Pancol & Anne Boudart/KATHERINE_PANCOL_ANNE_BOUDART__EUGENE_ET_MOI.epub`
  → `Books/P/Katherine Pancol/Katherine Pancol, Anne Boudart - Eugène et moi.epub`
- `Books/B/Laurent Baffie/LAURENT_BAFFIE__LE_GUIDE_DE_LA_REPARTIE.epub`
  → `Books/B/Laurent Baffie/Laurent Baffie - Le Guide de la répartie.epub`
- `Books/B/Laurent Binet/LAURENT_BINET__HHHH.epub`
  → `Books/B/Laurent Binet/Laurent Binet - HHhH.epub`
- `Books/B/Mathilde Beaussault/MATHILDE_BEAUSSAULT__LES_SAULES.epub`
  → `Books/B/Mathilde Beaussault/Mathilde Beaussault - Les Saules.epub`
- `Books/B/Maylis Besserie/MAYLIS_BESSERIE__LES_AMOURS_DISPERSEES.epub`
  → `Books/B/Maylis Besserie/Maylis Besserie - Les amours dispersées.epub`
- `Books/B/Michel Bussi/MICHEL_BUSSI__LES_NYMPHEAS_NOIRS.epub`
  → `Books/B/Michel Bussi/Michel Bussi - Les Nymphéas noirs.epub`
- `Books/B/Minier Bernard/BERNARD_MINIER__UN_IL_DANS_LA_NUIT.epub`
  → `Books/M/Bernard Minier/Bernard Minier - Un oeil dans la nuit.epub`
- `Books/B/Minier Bernard/MINIER_BERNARD__LE_CERCLE.epub`
  → `Books/M/Bernard Minier/Bernard Minier - Le Cercle.epub`
- `Books/B/Muriel Barbery/MURIEL_BARBERY__UNE_HEURE_DE_FERVEUR.epub`
  → `Books/B/Muriel Barbery/Muriel Barbery - Une heure de ferveur.epub`
- `Books/B/Nina Bouraoui/NINA_BOURAOUI__SATISFACTION.epub`
  → `Books/B/Nina Bouraoui/Nina Bouraoui - Satisfaction.epub`
- `Books/B/Olivier Mak Bouchard/OLIVIER_MAK_BOUCHARD__LE_DIT_DU_MISTRAL.epub`
  → `Books/M/Olivier Mak-Bouchard/Olivier Mak-Bouchard - Le Dit du mistral.epub`
- `Books/B/Philippe Besson/PHILIPPE_BESSON__PARIS_BRIANCON.epub`
  → `Books/B/Philippe Besson/Philippe Besson - Paris-Briançon.epub`
- `Books/B/Philippe Cachau Jean-Jacques Breton/PHILIPPE_CACHAU_JEAN_JACQUES_BRETON__HISTOIRE_DE_L_ART_POUR_LES_NULS.epub`
  → `Books/B/Philippe Cachau Jean-Jacques Breton/Philippe Cachau Jean-Jacques Breton - Histoire de l'Art Pour les Nuls.epub`
- `Books/B/Pierre Brunel/PIERRE_BRUNEL__LES_GRANDS_MYTHES_POUR_LES_NULS.epub`
  → `Books/B/Pierre Brunel/Pierre Brunel - Les Grands Mythes pour les Nuls.epub`
- `Books/B/Pierre Etienne Bram/PIERRE_ETIENNE_BRAM__PROJET_MARS_ALPHA_FRENCH_EDITION.epub`
  → `Books/B/Pierre-Etienne Bram/Pierre-Etienne Bram - Projet Mars Alpha.epub`
- `Books/B/Rachid Benzine/RACHID_BENZINE__VOYAGE_AU_BOUT_DE_L_ENFANCE.epub`
  → `Books/B/Rachid Benzine/Rachid Benzine - Voyage au bout de l'enfance.epub`
- `Books/B/Ruben Barrouk/RUBEN_BARROUK__TOUT_LE_BRUIT_DU_GUELIZ.epub`
  → `Books/B/Ruben Barrouk/Ruben Barrouk - Tout le bruit du Guéliz.epub`
- `Books/C/Alain Chouet/ALAIN_CHOUET__SEPT_PAS_VERS_LENFER.epub`
  → `Books/C/Alain Chouet/Alain Chouet - Sept pas vers l'enfer.epub`
- `Books/C/Albert Camus/ALBERT_CAMUS__L_ETRANGER.epub`
  → `Books/C/Albert Camus/Albert Camus - L’Étranger.epub`
- `Books/C/Berengere Cournut/BERENGERE_COURNUT__ELISE_SUR_LES_CHEMINS.epub`
  → `Books/C/Bérengère Cournut/Bérengère Cournut - Élise sur les chemins.epub`
- `Books/C/Catherine Cusset/CATHERINE_CUSSET__LA_DEFINITION_DU_BONHEUR.epub`
  → `Books/C/Catherine Cusset/Catherine Cusset - La définition du bonheur.epub`
- `Books/C/Cécile Coulon/CECILE_COULON__SEULE_EN_SA_DEMEURE.epub`
  → `Books/C/Cécile Coulon/Cécile Coulon - Seule en sa demeure.epub`
- `Books/C/Christian Ingrao Etc. Johann Chapoutot/CHRISTIAN_INGRAO_ETC_JOHANN_CHAPOUTOT__LE_MONDE_NAZI.epub`
  → `Books/C/Christian Ingrao, Nicolas Patin Johann Chapoutot/Christian Ingrao, Nicolas Patin Johann Chapoutot et al. - Le monde nazi.epub`
- `Books/C/Claire Castillon/CLAIRE_CASTILLON__SON_EMPIRE.epub`
  → `Books/C/Claire Castillon/Claire Castillon - Son empire.epub`
- `Books/C/Énora Chame/ENORA_CHAME__QUAND_S_AVANCE_L_OMBRE.epub`
  → `Books/C/Énora Chame/Énora Chame - Quand s'avance l'ombre.epub`
- `Books/C/Éric Cobast/ERIC_COBAST__TOUTE_LA_CULTURE_GENERALE.epub`
  → `Books/C/Éric Cobast/Éric Cobast - Toute la culture générale.epub`
- `Books/C/Harlan Coben/HARLAN_COBEN__GAGNER_NEST_PAS_JOUER.epub`
  → `Books/C/Harlan Coben/Harlan Coben - Gagner n’est pas jouer.epub`
- `Books/C/Herve Broquet Collectif/HERVE_BROQUET_COLLECTIF__LES_100_DISCOURS_QUI_ONT_MARQUE_LE_XXE_SIECLE_1900_1946.epub`
  → `Books/B/Hervé Broquet/Hervé Broquet et al. - Les 100 discours qui ont marqué le XXe siècle - 1900-1945.epub`
- `Books/C/J. M. Coetzee/J_M_COETZEE__DISGRACE.epub`
  → `Books/C/John Maxwell Coetzee/John Maxwell Coetzee - Disgrâce.epub`
- `Books/C/Jeanine Cummins/JEANINE_CUMMINS__AMERICAN_DIRT.epub`
  → `Books/C/Jeanine Cummins/Jeanine Cummins - American Dirt.epub`
- `Books/C/Jeanine Cummins/JEANINE_CUMMINS__UNE_DECHIRURE_DANS_LE_CIEL.epub`
  → `Books/C/Jeanine Cummins/Jeanine Cummins - Une déchirure dans le ciel.epub`
- `Books/C/Jerome Camut/JEROME_CAMUT__NOS_AMES_AU_DIABLE.epub`
  → `Books/C/Jérôme Camut/Jérôme Camut, Nathalie Hug - Nos âmes au diable.epub`
- `Books/C/Jonathan Coe/JONATHAN_COE__LES_PREUVES_DE_MON_INNOCENCE.epub`
  → `Books/C/Jonathan Coe/Jonathan Coe - Les preuves de mon innocence.epub`
- `Books/C/Laurent Cappe/LAURENT_CAPPE__BLEU.epub`
  → `Books/C/Laurent Cappe/Laurent Cappe - Bleu.epub`
- `Books/C/Louis-Ferdinand Celine/LOUIS_FERDINAND_CELINE__VOYAGE_AU_BOUT_DE_LA_NUIT.epub`
  → `Books/C/Louis-Ferdinand Céline/Louis-Ferdinand Céline - Voyage au bout de la nuit.epub`
- `Books/C/Martial Caroff/CAROFF_MARTIAL__NE_ME_REMERCIEZ_PAS.epub`
  → `Books/C/Martial Caroff/Martial Caroff - Ne me remerciez pas !.epub`
- `Books/C/Maxime Chattam/CHATTAM_MAXIME__L_ILLUSION.epub`
  → `Books/M/Chattam Maxime/Chattam Maxime - L' Illusion.epub`
- `Books/C/Maxime Chattam/MAXIME_CHATTAM__LA_CONSTANCE_DU_PREDATEUR.epub`
  → `Books/C/Maxime Chattam/Maxime Chattam - La constance du prédateur.epub`
- `Books/C/Maxime Chattam/MAXIME_CHATTAM__LE_COMA_DES_MORTELS.epub`
  → `Books/C/Maxime Chattam/Maxime Chattam - Le Coma Des Mortels.epub`
- `Books/C/Maxime Chattam/MAXIME_CHATTAM__LUX.epub`
  → `Books/C/Maxime Chattam/Maxime Chattam - Lux.epub`
- `Books/C/Maxime Chattam/MAXIME_CHATTAM__PRIME_TIME.epub`
  → `Books/C/Maxime Chattam/Maxime Chattam - Prime Time.epub`
- `Books/C/Maxime Chattam/MAXIME_CHATTAM__QUE_TA_VOLONTE_SOIT_FAITE.epub`
  → `Books/C/Maxime Chattam/Maxime Chattam - Que ta volonté soit faîte.epub`
- `Books/C/Maxime Chattam/MAXIME_CHATTAM__UNESECTE.epub`
  → `Books/C/Maxime Chattam/Maxime Chattam - Un(e)secte.epub`
- `Books/C/Michael Cunningham/MICHAEL_CUNNINGHAM__LES_HEURES.epub`
  → `Books/C/Michael Cunningham/Michael Cunningham, Anne Damour - Les heures.epub`
- `Books/C/N K Jemisin Michelle Charrier/N_K_JEMISIN_MICHELLE_CHARRIER__LA_CINQUIEME_SAISON.epub`
  → `Books/J/Michelle Charrier N.K. Jemisin/Michelle Charrier N.K. Jemisin - La cinquième saison.epub`
- `Books/C/Phoebe Hadjimarkos Clarke/PH_BE_HADJIMARKOS_CLARKE__ALIENE_RENTREE_LITTERAIRE_HIVER_2024.epub`
  → `Books/C/Phœbe Hadjimarkos Clarke/Phœbe Hadjimarkos Clarke - Aliène (Rentrée littéraire hiver 2024).epub`
- `Books/C/Ray Celestin/RAY_CELESTIN__MAFIOSO.epub`
  → `Books/C/Ray Celestin/Ray Celestin - Mafioso.epub`
- `Books/C/Ray Celestin/RAY_CELESTIN__MASCARADE.epub`
  → `Books/C/Ray Celestin/Ray Celestin - Mascarade.epub`
- `Books/C/Sandrine Collette/SANDRINE_COLLETTE__MADELAINE_AVANT_LAUBE.epub`
  → `Books/C/Sandrine Collette/Sandrine Collette - Madelaine avant l'aube.epub`
- `Books/C/Shay Carrot/SHAY_SHAY_CARROT_CARROT__ACCORDS_MALSAINS.epub`
  → `Books/C/Shay Carrot/Shay Carrot - Accords malsains.epub`
- `Books/C/Soman Chainani/SOMAN_CHAINANI__1_L_ECOLE_DU_BIEN_ET_DU_MAL_FRENCH_EDITION.epub`
  → `Books/C/Soman Chainani/Soman Chainani - 1. L'école du bien et du mal.epub`
- `Books/C/Soman Chainani/SOMAN_CHAINANI__L_ECOLE_DU_BIEN_ET_DU_MAL_T2.epub`
  → `Books/C/Soman Chainani/Soman Chainani - L'école du bien et du mal T2 Un monde sans princes.epub`
- `Books/C/Stéphanie Castillo-Soler/STEPHANIE_CASTILLO_SOLER__LIBRES_DANS_LEUR_TETE.epub`
  → `Books/C/Stéphanie Castillo-Soler/Stéphanie Castillo-Soler - Libres dans leur tête.epub`
- `Books/C/Stephanie Coste/STEPHANIE_COSTE__LE_PASSEUR.epub`
  → `Books/C/Stéphanie Coste/Stéphanie Coste - Le passeur.epub`
- `Books/C/Stephen Crane/STEPHEN_CRANE__L_INSIGNE_ROUGE_DU_COURAGE.epub`
  → `Books/C/Stephen Crane/Stephen Crane - L'Insigne rouge du courage.epub`
- `Books/C/Sylvie Goulard Thibaut Caulier/SYLVIE_GOULARD_THIBAUT_CAULIER__50_NOTIONS_CLES_SUR_L_EUROPE_POUR_LES_NULS.epub`
  → `Books/G/Sylvie Thibaut CAULIER Goulard/Sylvie Thibaut CAULIER Goulard - 50 notions clés sur l'Europe pour les Nuls.epub`
- `Books/C/Tarik Chenah/TARIK_CHENAH__UNKNOWN.epub`
  → `Books/C/Tarik Chenah/Tarik Chenah - Unknown.epub`
- `Books/C/Victor Castanet/CASTANET_VICTOR__LES_FOSSOYEURS.epub`
  → `Books/V/Castanet Victor/Castanet Victor - Les fossoyeurs.epub`
- `Books/D/Adeline Dieudonne/ADELINE_DIEUDONNE__KEROZENE.epub`
  → `Books/D/Adeline Dieudonné/Adeline Dieudonné - Kerozene.epub`
- `Books/D/Alain Damasio/ALAIN_DAMASIO__LA_HORDE_DU_CONTREVENT.epub`
  → `Books/D/Alain Damasio/Alain Damasio - La Horde du Contrevent.epub`
- `Books/D/Antoine Dole/ANTOINE_DOLE__SIX_PIEDS_SUR_TERRE.epub`
  → `Books/D/Antoine Dole/Antoine Dole - Six pieds sur terre.epub`
- `Books/D/Benjamin Dierstein/BENJAMIN_DIERSTEIN__BLEUS_BLANCS_ROUGES.epub`
  → `Books/D/Benjamin Dierstein/Benjamin Dierstein - Bleus, Blancs, Rouges.epub`
- `Books/D/Bui Doan/BUI_DOAN__LA_TOUR.epub`
  → `Books/D/Bui Doan/Bui Doan - La Tour.epub`
- `Books/D/Charles de Gaulle/CHARLES_DE_GAULLE__MEMOIRES_DE_GUERRE_1.epub`
  → `Books/G/Charles de Gaulle/Charles de Gaulle - Mémoires de guerre (Tome 1).epub`
- `Books/D/Christelle Dabos/CHRISTELLE_DABOS__LES_FIANCES_DE_LHIVER.epub`
  → `Books/D/Christelle Dabos/Christelle Dabos - Les fiancés de l'hiver.epub`
- `Books/D/Coulin Delphine/COULIN_DELPHINE__LOIN_A_LOUEST.epub`
  → `Books/D/Coulin Delphine/Coulin Delphine - Loin, à l'Ouest.epub`
- `Books/D/David Dufresne/DAVID_DUFRESNE__19_H_59.epub`
  → `Books/D/David Dufresne/David Dufresne - 19 h 59.epub`
- `Books/D/David Dufresne/DAVID_DUFRESNE__DERNIERE_SOMMATION.epub`
  → `Books/D/David Dufresne/David Dufresne - Dernière sommation.epub`
- `Books/D/De Montaigu, Thibault & Thibault de Montaigu/DE_MONTAIGU_THIBAULT_THIBAULT_DE_MONTAIGU__COEUR.epub`
  → `Books/M/Thibault de Montaigu/Thibault de Montaigu - Coeur.epub`
- `Books/D/Dugain Marc & Marc Dugain/DUGAIN_MARC_MARC_DUGAIN__TSUNAMI.epub`
  → `Books/M/Dugain Marc/Dugain Marc, Marc Dugain - Tsunami.epub`
- `Books/D/Eric de Kermel/ERIC_DE_KERMEL__LES_JARDINS_DE_ZAGARAND.epub`
  → `Books/K/Eric de Kermel/Eric de Kermel - Les jardins de Zagarand.epub`
- `Books/D/Erri De Luca/ERRI_DE_LUCA__IMPOSSIBLE.epub`
  → `Books/L/Erri de Luca/Erri de Luca - Impossible.epub`
- `Books/D/Etienne de Montety/ETIENNE_DE_MONTETY__LA_GRANDE_EPREUVE.epub`
  → `Books/M/Etienne de Montety/Etienne de Montety - La grande épreuve.epub`
- `Books/D/Fatima Daas/FATIMA_DAAS__JOUER_LE_JEU.epub`
  → `Books/D/Fatima Daas/Fatima Daas - Jouer le jeu.epub`
- `Books/D/Fatima Daas/FATIMA_DAAS__LA_PETITE_DERNIERE.epub`
  → `Books/D/Fatima Daas/Fatima Daas - La petite dernière.epub`
- `Books/D/Fedor Dostoievski/FEDOR_DOSTOIEVSKI__CRIME_ET_CHATIMENT.epub`
  → `Books/D/Fédor Dostoïevski/Fédor Dostoïevski - Crime et châtiment.epub`
- `Books/D/Francois-Henri Deserable/FRANCOIS_HENRI_DESERABLE__L_USURE_D_UN_MONDE.epub`
  → `Books/D/François-Henri Désérable/François-Henri Désérable - L’usure d’un monde.epub`
- `Books/D/Francois-Henri Deserable/FRANCOIS_HENRI_DESERABLE__MON_MAITRE_ET_MON_VAINQUEUR.epub`
  → `Books/D/François-Henri Désérable/François-Henri Désérable - Mon maître et mon vainqueur.epub`
- `Books/D/François-René de Chateaubriand/FRANCOIS_RENE_DE_CHATEAUBRIAND__MEMOIRES_DOUTRE_TOMBE_LIVRES_I_A_XII.epub`
  → `Books/C/Francois-René de Chateaubriand/Francois-René de Chateaubriand - Mémoires d'outre-tombe.epub`
- `Books/D/Gemmell David/GEMMELL_DAVID__WAYLANDER_II_DANS_LE_ROYAUME_DU_LOUP.epub`
  → `Books/G/David Gemmell/David Gemmell - Waylander II, Dans le Royaume du Loup.epub`
- `Books/D/Ghislaine Dunant/GHISLAINE_DUNANT__UN_AMOUR_INFINI.epub`
  → `Books/D/Ghislaine Dunant/Ghislaine Dunant - Un amour infini.epub`
- `Books/D/Giuliano Da Empoli/GIULIANO_DA_EMPOLI__L_HEURE_DES_PREDATEURS.epub`
  → `Books/E/Giuliano da Empoli/Giuliano da Empoli - L'heure des prédateurs.epub`
- `Books/D/Giuliano Da Empoli/GIULIANO_DA_EMPOLI__LE_MAGE_DU_KREMLIN.epub`
  → `Books/D/Giuliano Da Empoli/Giuliano Da Empoli - Le mage du Kremlin.epub`
- `Books/D/Guy-Roger Duvert/GUY_ROGER_DUVERT__VIRTUAL_REVOLUTION_2046.epub`
  → `Books/D/Guy-Roger Duvert/Guy-Roger Duvert - Virtual Revolution 2046.epub`
- `Books/D/Jean Marc Dopffer/JEAN_MARC_DOPFFER__ORGLIN_LA_PRIMITIVE.epub`
  → `Books/D/Jean-Marc Dopffer/Jean-Marc Dopffer - Orglin la Primitive.epub`
- `Books/D/Jean-Baptiste Del Amo/JEAN_BAPTISTE_DEL_AMO__LA_NUIT_RAVAGEE.epub`
  → `Books/D/Jean-Baptiste Del Amo/Jean-Baptiste Del Amo - La nuit ravagée.epub`
- `Books/D/Jean-Baptiste Del Amo/JEAN_BAPTISTE_DEL_AMO__LE_FILS_DE_LHOMME.epub`
  → `Books/A/Jean-Baptiste-Del Amo/Jean-Baptiste-Del Amo - Le fils de l’homme.epub`
- `Books/D/Kamel Daoud/KAMEL_DAOUD__HOURIS.epub`
  → `Books/D/Kamel Daoud/Kamel Daoud - Houris.epub`
- `Books/D/Le Monde D'Hier/LE_MONDE_D_HIER__STEFAN_ZWEIG.epub`
  → `Books/D/Le Monde d'hier/Le Monde d'hier - Stefan Zweig.epub`
- `Books/D/Leonor de Recondo/LEONOR_DE_RECONDO__REVENIR_A_TOI.epub`
  → `Books/R/Léonor de Récondo/Léonor de Récondo - Revenir à toi.epub`
- `Books/D/Marc Dugain/MARC_DUGAIN__2023_TSUNAMI.epub`
  → `Books/D/Marc Dugain/Marc Dugain - 2023 - Tsunami.epub`
- `Books/D/Marc Dugain/MARC_DUGAIN__LEGITIME_VIOLENCE.epub`
  → `Books/D/Marc Dugain/Marc Dugain - Légitime violence.epub`
- `Books/D/Margot Douaihy/MARGOT_DOUAIHY__SCORCHED_GRACE_A_SISTER_HOLIDAY_MYSTERY_1.epub`
  → `Books/D/Margot Douaihy/Margot Douaihy - Scorched Grace.epub`
- `Books/D/Marguerite Duras/MARGUERITE_DURAS__L_AMANT.epub`
  → `Books/D/Marguerite Duras/Marguerite Duras - L'Amant.epub`
- `Books/D/Maurice Druon/MAURICE_DRUON__LES_ROIS_MAUDITS_L_INTEGRALE.epub`
  → `Books/D/Maurice Druon/Maurice Druon - Les rois maudits - L'intégrale.epub`
- `Books/D/Michel Deguy/MICHEL_DEGUY__LA_POESIE_N_EST_PAS_SEULE.epub`
  → `Books/D/Michel Deguy/Michel Deguy - La Poésie n'est pas seule.epub`
- `Books/D/Monique de Kermadec/MONIQUE_DE_KERMADEC__LA_FEMME_SURDOUEE.epub`
  → `Books/K/Monique de Kermadec/Monique de Kermadec - La femme surdouée.epub`
- `Books/D/Negar Djavadi/NEGAR_DJAVADI__ARENE.epub`
  → `Books/D/Negar Djavadi/Negar Djavadi - Arène.epub`
- `Books/D/Nicolas Druart/NICOLAS_DRUART__JEU_DE_DAMES.epub`
  → `Books/D/Nicolas Druart/Nicolas Druart - Jeu de dames.epub`
- `Books/D/Pascale Robert Diard/PASCALE_ROBERT_DIARD__LA_PETITE_MENTEUSE.epub`
  → `Books/R/Pascale Robert-­Diard/Pascale Robert-­Diard, Pascale Robert-Diard - La petite menteuse.epub`
- `Books/D/Philippe Boxho Dr/PHILIPPE_BOXHO_DR__ENTRETIEN_AVEC_UN_CADAVRE.epub`
  → `Books/D/Philippe Boxho Dr/Philippe Boxho Dr - Entretien avec un cadavre.epub`
- `Books/D/Philippe Durant/DURANT_PHILIPPE__ENCYCLOPEDIE_DES_REPLIQUES_DE_FILMS_TOME_2.epub`
  → `Books/P/Durant Philippe/Durant Philippe - Encyclopédie des Répliques de Films Tome 2.epub`
- `Books/D/Philippe Durant/PHILIPPE_DURANT__ENCYCLOPEDIE_DES_REPLIQUES_DE_FILMS_TOME_1.epub`
  → `Books/D/Philippe Durant/Philippe Durant - Encyclopédie des répliques de films Tome 1.epub`
- `Books/D/Philippe Moreau Defarges/PHILIPPE_MOREAU_DEFARGES__L_HISTOIRE_DU_MONDE_POUR_LES_NULS_GRAND_FORMAT_3E_ED.epub`
  → `Books/D/Philippe Moreau Defarges/Philippe Moreau Defarges - L'Histoire du monde pour les Nuls, grand format, 3e éd.epub`
- `Books/D/Philippe Moreau Defarges/PHILIPPE_MOREAU_DEFARGES__LA_GEOPOLITIQUE_POUR_LES_NULS_EN_50_NOTIONS_CLES.epub`
  → `Books/M/Philippe Moreau-Defarges/Philippe Moreau-Defarges - La géopolitique pour les Nuls en 50 notions clés.epub`
- `Books/D/Renaud de Chaumaray/RENAUD_DE_CHAUMARAY__QUITTER_LA_VALLEE.epub`
  → `Books/C/Renaud de Chaumaray/Renaud de Chaumaray - Quitter la vallée.epub`
- `Books/D/Une Façon D'Aimer/UNE_FACON_D_AIMER__DOMINIQUE_BARBERIS.epub`
  → `Books/D/Une façon d'aimer/Une façon d'aimer - Dominique Barbéris.epub`
- `Books/D/Vinciane Despret/VINCIANE_DESPRET__AUTOBIOGRAPHIE_D_UN_POULPE.epub`
  → `Books/D/Vinciane Despret/Vinciane Despret - Autobiographie d'un poulpe.epub`
- `Books/D/Virginie Despentes/VIRGINIE_DESPENTES__VERNON_SUBUTEX_T1.epub`
  → `Books/D/Virginie Despentes/Virginie Despentes - Vernon Subutex T1.epub`
- `Books/E/Acevedo Elizabeth/ACEVEDO_ELIZABETH__SIGNE_POETE_X.epub`
  → `Books/A/Elizabeth Acevedo/Elizabeth Acevedo - The Poet X-EPUB3.epub`
- `Books/E/Andreas Eschbach/ANDREAS_ESCHBACH__DES_MILLIARDS_DE_TAPIS_DE_CHEVEUX.epub`
  → `Books/E/Andreas Eschbach/Andreas Eschbach - Des milliards de tapis de cheveux.epub`
- `Books/E/Annie Ernaux/ANNIE_ERNAUX__LA_FEMME_GELEE.epub`
  → `Books/E/Annie Ernaux/Annie Ernaux - La femme gelée.epub`
- `Books/E/Annie Ernaux/ANNIE_ERNAUX__LES_ANNEES.epub`
  → `Books/E/Annie Ernaux/Annie Ernaux - Les années.epub`
- `Books/E/George Eliot/GEORGE_ELIOT__MIDDLEMARCH_TOME_I.epub`
  → `Books/E/George Eliot/George Eliot - Middlemarch - Tome I.epub`
- `Books/E/Hunter Erin/HUNTER_ERIN__RETOUR_A_L_ETAT_SAUVAGE.epub`
  → `Books/E/Hunter Erin/Hunter Erin - Retour à l’état sauvage.epub`
- `Books/E/Julie Ewa/JULIE_EWA__JUNGLE_POURPRE.epub`
  → `Books/P/Jungle pourpre/Jungle pourpre - Julie Ewa.epub`
- `Books/E/Vincent Moret James Eade/VINCENT_MORET_JAMES_EADE__LES_ECHECS_POUR_LES_NULS.epub`
  → `Books/M/Vincent James EADE Moret/Vincent James EADE Moret - Les Echecs Pour les Nuls.epub`
- `Books/E/Zamiatine Evgueni/EVGUENI_ZAMIATINE__NOUS.epub`
  → `Books/Z/Evgueni Zamiatine/Evgueni Zamiatine - Nous.epub`
- `Books/F/Anatole France/ANATOLE_FRANCE__LES_DIEUX_ONT_SOIF.epub`
  → `Books/F/Anatole France/Anatole France - Les Dieux ont soif.epub`
- `Books/F/Anouck Faure/ANOUCK_FAURE__AATEA.epub`
  → `Books/F/Anouck Faure/Anouck Faure - Aatea.epub`
- `Books/F/Carole Fives/CAROLE_FIVES__QUELQUE_CHOSE_A_TE_DIRE.epub`
  → `Books/F/Carole Fives/Carole Fives - Quelque chose à te dire.epub`
- `Books/F/Frederick Forsyth/FREDERICK_FORSYTH__THE_DAY_OF_THE_JACKAL.epub`
  → `Books/F/Frederick Forsyth/Frederick Forsyth - The Day of the Jackal.epub`
- `Books/F/Gaël Faye/GAEL_FAYE__JACARANDA.epub`
  → `Books/F/Gaël Faye/Gaël Faye - Jacaranda.epub`
- `Books/F/Hans Fallada/HANS_FALLADA__SEUL_DANS_BERLIN.epub`
  → `Books/F/Hans Fallada/Hans Fallada - Seul dans Berlin.epub`
- `Books/F/Hélène Frappat/HELENE_FRAPPAT__LE_GASLIGHTING_OU_L_ART_DE_FAIRE_TAIRE_LES_FEMMES.epub`
  → `Books/F/Hélène Frappat/Hélène Frappat - Le Gaslighting ou l'art de faire taire les femmes.epub`
- `Books/F/Hélène Frappat/HELENE_FRAPPAT__NERONA.epub`
  → `Books/F/Hélène Frappat/Hélène Frappat - Nerona.epub`
- `Books/F/Ian Fleming/IAN_FLEMING__BOND_01_CASINO_ROYALE.epub`
  → `Books/F/Ian Fleming/Ian Fleming - Bond 01 - Casino Royale.epub`
- `Books/F/Irène Frain/IRENE_FRAIN__UN_CRIME_SANS_IMPORTANCE.epub`
  → `Books/F/Irène Frain/Irène Frain - Un crime sans importance.epub`
- `Books/F/Jerome Fourquet/JEROME_FOURQUET__LA_FRANCE_SOUS_NOS_YEUX.epub`
  → `Books/F/Jérôme Fourquet/Jérôme Fourquet et al. - La France sous nos yeux.epub`
- `Books/F/Reynaert François/REYNAERT_FRANCOIS__LA_GRANDE_HISTOIRE_DU_MONDE.epub`
  → `Books/R/François Reynaert/François Reynaert - La grande histoire du monde.epub`
- `Books/G/Alice Geraud/ALICE_GERAUD__SAMBRE_RADIOSCOPIE_D_UN_FAIT_DIVERS.epub`
  → `Books/G/Alice Géraud/Alice Géraud - Sambre, radioscopie d'un fait divers.epub`
- `Books/G/André Gide/ANDRE_GIDE__SOUVENIRS_DE_LA_COUR_D_ASSISES.epub`
  → `Books/G/André Gide/André Gide - Souvenirs de la Cour d’Assises.epub`
- `Books/G/Aymen Gharbi/AYMEN_GHARBI__LA_VILLE_DES_IMPASSES.epub`
  → `Books/G/Aymen Gharbi/Aymen Gharbi - La Ville des impasses.epub`
- `Books/G/Brigitte Giraud/BRIGITTE_GIRAUD__VIVRE_VITE.epub`
  → `Books/G/Brigitte Giraud/Brigitte Giraud - Vivre vite.epub`
- `Books/G/Brisac Genevieve/BRISAC_GENEVIEVE__LES_ENCHANTEURS.epub`
  → `Books/B/Geneviève Brisac/Geneviève Brisac - Les Enchanteurs.epub`
- `Books/G/David Grann/DAVID_GRANN__LES_NAUFRAGES_DU_WAGER.epub`
  → `Books/G/David Grann/David Grann - Les Naufragés du Wager.epub`
- `Books/G/Franz-Olivier Giesbert/FRANZ_OLIVIER_GIESBERT__HISTOIRE_INTIME_DE_LA_VE_REPUBLIQUE_TOME_1_LE_SURSAUT_FRENCH_EDITION.epub`
  → `Books/G/Franz-Olivier Giesbert/Franz-Olivier Giesbert - Histoire intime de la Ve République (Tome 1) - Le sursaut.epub`
- `Books/G/Gilles Guilleron/GILLES_GUILLERON__LES_CHEFS_D_UVRES_DE_LA_LITTERATURE_MONDIALE_POUR_LES_NULS.epub`
  → `Books/G/Gilles Guilleron/Gilles Guilleron - Les chefs-d'œuvres de la littérature mondiale Pour les Nuls.epub`
- `Books/G/Jean Giraudoux/JEAN_GIRAUDOUX__LA_GUERRE_DE_TROIE_N_AURA_PAS_LIEU.epub`
  → `Books/G/Jean Giraudoux/Jean Giraudoux - La guerre de Troie n'aura pas lieu.epub`
- `Books/G/Jean-Christophe Grange/JEAN_CHRISTOPHE_GRANGE__ROUGE_KARMA_FRENCH_EDITION.epub`
  → `Books/G/Jean-Christophe Grangé/Jean-Christophe Grangé - Rouge karma.epub`
- `Books/G/La Familia Grande/LA_FAMILIA_GRANDE__CAMILLE_KOUCHNER.epub`
  → `Books/K/Camille Kouchner/Camille Kouchner - La familia grande.epub`
- `Books/G/Laurent Gaude/GAUDE_LAURENT__MORT_DU_ROI_TSONGOR.epub`
  → `Books/G/Laurent Gaudé/Laurent Gaudé - Mort du roi Tsongor.epub`
- `Books/G/Laurent Gaude/LAURENT_GAUDE__DE_SANG_ET_DE_LUMIERE.epub`
  → `Books/G/Laurent Gaudé/Laurent Gaudé - De sang et de lumière.epub`
- `Books/G/Laurent Gaude/LAURENT_GAUDE__LE_SOLEIL_DES_SCORTA.epub`
  → `Books/G/Laurent Gaudé/Laurent Gaudé - Le soleil des Scorta.epub`
- `Books/G/Laurent Gounelle/LAURENT_GOUNELLE__INTUITIO.epub`
  → `Books/G/Laurent Gounelle/Laurent Gounelle - Intuitio.epub`
- `Books/G/Les Abeilles Grises/LES_ABEILLES_GRISES__LES_ABEILLES_GRISES.epub`
  → `Books/K/Andrei Kourkov/Andrei Kourkov, Les abeilles grises - Les Abeilles grises.epub`
- `Books/G/Olivier Guez/OLIVIER_GUEZ__MESOPOTAMIA.epub`
  → `Books/G/Olivier Guez/Olivier Guez - Mesopotamia.epub`
- `Books/G/Paul Gasnier/PAUL_GASNIER__LA_COLLISION.epub`
  → `Books/G/Paul Gasnier/Paul Gasnier - La collision.epub`
- `Books/G/Sabyl Ghoussoub/SABYL_GHOUSSOUB__BEYROUTH_SUR_SEINE.epub`
  → `Books/G/Sabyl Ghoussoub/Sabyl Ghoussoub - Beyrouth-sur-seine.epub`
- `Books/G/Yvan Godbout/YVAN_GODBOUT__LES_CONTES_INTERDITS_HANSEL_ET_GRETEL.epub`
  → `Books/G/Yvan Godbout/Yvan Godbout - Hansel et Gretel.epub`
- `Books/H/Aldous Huxley/ALDOUS_HUXLEY__LE_MEILLEUR_DES_MONDES.epub`
  → `Books/H/Aldous Huxley/Aldous Huxley - Le meilleur des mondes.epub`
- `Books/H/Caroline Hinault/CAROLINE_HINAULT__TRAVERSER_LES_FORETS.epub`
  → `Books/H/Caroline Hinault/Caroline Hinault - Traverser les forêts.epub`
- `Books/H/Claudie Hunzinger/CLAUDIE_HUNZINGER_CLAUDIE_HUNZINGER__IL_NEIGE_SUR_LE_PIANISTE.epub`
  → `Books/H/Claudie Hunzinger/Claudie Hunzinger - Il neige sur le pianiste.epub`
- `Books/H/Francois Heisbourg/FRANCOIS_HEISBOURG__LE_TEMPS_DES_PREDATEURS.epub`
  → `Books/H/François Heisbourg/François Heisbourg - Le Temps des prédateurs.epub`
- `Books/H/Frank Herbert/FRANK_HERBERT__LE_MESSIE_DE_DUNE.epub`
  → `Books/H/Frank Herbert/Frank Herbert - Le messie de Dune.epub`
- `Books/H/Frank Herbert/HERBERT_FRANK__DUNE.epub`
  → `Books/H/Frank Herbert/Frank Herbert - Dune.epub`
- `Books/H/Jean Hegland/JEAN_HEGLAND__DANS_LA_FORET.epub`
  → `Books/H/Jean Hegland/Jean Hegland - Dans la forêt.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__AVENTURES_D_UN_GOURMAND_VAGABOND.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Aventures d’un gourmand vagabond.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__DALVA.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Dalva.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__EN_MARGE_LA_ROUTE_DU_RETOUR_DE_MARQUETTE_A_VERACRUZ.epub`
  → `Books/H/Jim Harrison/Jim Harrison - En marge ; La route du retour ; De Marquette à VeraCruz.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__EN_MARGE.epub`
  → `Books/H/Jim Harrison/Jim Harrison - En marge.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__EN_ROUTE_VERS_L_OUEST.epub`
  → `Books/H/Jim Harrison/Jim Harrison - En Route Vers l’Ouest.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__GRAND_MAITRE.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Grand Maître.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__INSPECTEUR_SUNDERSON_2_PECHES_CAPITAUX.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Péchés capitaux (Fammarion, 2 septembre).epub`
- `Books/H/Jim Harrison/JIM_HARRISON__JULIP.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Julip.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__L_ETE_OU_IL_FAILLIT_MOURIR.epub`
  → `Books/H/Jim Harrison/Jim Harrison - L'Eté où il faillit mourir.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__LA_FEMME_AUX_LUCIOLES.epub`
  → `Books/H/Jim Harrison/Jim Harrison - La Femme Aux Lucioles.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__LE_VIEUX_SALTIMBANQUE.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Le Vieux Saltimbanque.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__LEGENDES_D_AUTOMNE.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Légendes d’automne.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__LES_JEUX_DE_LA_NUIT.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Les jeux de la nuit.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__MARQUETTE_A_VERACRUZ_DE.epub`
  → `Books/H/Jim Harrison/Jim Harrison - De Marquette à Veracruz.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__NAGEUR_DE_RIVIERE.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Nageur de rivière.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__RETOUR_EN_TERRE.epub`
  → `Books/H/Jim Harrison/Jim Harrison - retour en terre.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__UN_BON_JOUR_POUR_MOURIR.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Un bon jour pour mourir.epub`
- `Books/H/Jim Harrison/JIM_HARRISON__UNE_ODYSSEE_AMERICAINE.epub`
  → `Books/H/Jim Harrison/Jim Harrison - Une odyssée américaine.epub`
- `Books/H/Lilia Hassaine/LILIA_HASSAINE__SOLEIL_AMER.epub`
  → `Books/H/Lilia Hassaine/Lilia Hassaine - Soleil amer.epub`
- `Books/H/Marta Hillers/MARTA_MARTA_HILLERS_HILLERS__UNE_FEMME_A_BERLIN.epub`
  → `Books/H/Marta Hillers/Marta Hillers - Une femme à Berlin.epub`
- `Books/H/Matt Haig/MATT_HAIG__LA_BIBLIOTHEQUE_DE_MINUIT.epub`
  → `Books/H/Matt Haig/Matt Haig - La Bibliothèque de Minuit.epub`
- `Books/H/Michel Houellebecq/MICHEL_HOUELLEBECQ__ANEANTIR.epub`
  → `Books/H/Michel Houellebecq/Michel Houellebecq - Michel Houellebecq.epub`
- `Books/H/Morris Heather/MORRIS_HEATHER__LE_TATOUEUR_D_AUSCHWITZ.epub`
  → `Books/H/Morris Heather/Morris Heather - Le tatoueur d'Auschwitz.epub`
- `Books/H/Nathan Hill/NATHAN_HILL__BIEN_ETRE.epub`
  → `Books/H/Nathan Hill/Nathan Hill - Bien-être.epub`
- `Books/H/Sebastian Haffner/SEBASTIAN_HAFFNER__HISTOIRE_D_UN_ALLEMAND.epub`
  → `Books/H/Sebastian Haffner/Sebastian Haffner - Histoire d'un allemand.epub`
- `Books/I/John Irving/JOHN_IRVING__JE_TE_RETROUVERAI.epub`
  → `Books/I/John Irving/John Irving - Je te retrouverai.epub`
- `Books/I/Kazuo Ishiguro/KAZUO_ISHIGURO__KLARA_ET_LE_SOLEIL.epub`
  → `Books/I/Kazuo Ishiguro/Kazuo Ishiguro - Klara et le soleil.epub`
- `Books/I/Le Malade Imaginaire/LE_MALADE_IMAGINAIRE__MOLIERE.epub`
  → `Books/I/Le Malade imaginaire/Le Malade imaginaire - Molière.epub`
- `Books/I/Nemirovsky Irene/NEMIROVSKY_IRENE__LE_BAL.epub`
  → `Books/N/Irène Némirovsky/Irène Némirovsky - Le Bal.epub`
- `Books/J/Claire Jehanno/CLAIRE_JEHANNO__LA_JUREE.epub`
  → `Books/J/Claire Jéhanno/Claire Jéhanno - La jurée.epub`
- `Books/J/Dubois Jean-Paul/DUBOIS_JEAN_PAUL__TOUS_LES_HOMMES_NHABITENT_PAS_LE_MONDE_DE_LA_MEME_FACON.epub`
  → `Books/D/Jean-Paul Dubois/Jean-Paul Dubois - Tous les hommes n'habitent pas le monde de la même façon.epub`
- `Books/J/Echenoz Jean/ECHENOZ_JEAN__BRISTOL.epub`
  → `Books/E/Jean Echenoz/Jean Echenoz - Bristol.epub`
- `Books/J/Ferrari Jerome/FERRARI_JEROME__LE_SERMON_SUR_LA_CHUTE_DE_ROME.epub`
  → `Books/F/Jérôme Ferrari/Jérôme Ferrari - Le sermon sur la chute de Rome.epub`
- `Books/J/James Joyce/JAMES_JOYCE__GENS_DE_DUBLIN.epub`
  → `Books/J/James Joyce/James Joyce - Gens De Dublin.epub`
- `Books/J/Jean-Noël Orengo & Orengo Jean-Noël/JEAN_NOEL_ORENGO_ORENGO_JEAN_NOEL__VOUS_ETES_L_AMOUR_MALHEUREUX_DU_FUHRER.epub`
  → `Books/O/Jean-Noël Orengo/Jean-Noël Orengo, Orengo Jean-Noël - « Vous êtes l'amour malheureux du Führer ».epub`
- `Books/J/Laurent Jullier/LAURENT_JULLIER__ANALYSER_UN_FILM.epub`
  → `Books/J/Laurent Jullier/Laurent Jullier - Analyser un film.epub`
- `Books/J/Philippe Jaenada/PHILIPPE_JAENADA__AU_PRINTEMPS_DES_MONSTRES.epub`
  → `Books/J/Philippe Jaenada/Philippe Jaenada - Au printemps des monstres.epub`
- `Books/J/Philippe Jaenada/PHILIPPE_JAENADA__LA_DESINVOLTURE_EST_UNE_BIEN_BELLE_CHOSE.epub`
  → `Books/J/Philippe Jaenada/Philippe Jaenada - La désinvolture est une bien belle chose.epub`
- `Books/J/Sarah Jollien-Fardel/SARAH_JOLLIEN_FARDEL__SA_PREFEREE.epub`
  → `Books/J/Sarah Jollien-Fardel/Sarah Jollien-Fardel - Sa préférée.epub`
- `Books/J/Simon Johannin Capucine Johannin/SIMON_JOHANNIN_CAPUCINE_JOHANNIN__NINO_DANS_LA_NUIT.epub`
  → `Books/J/Capucine Johannin/Capucine Johannin, Simon Johannin - Nino dans la nuit.epub`
- `Books/J/Sylvain Johnson/SYLVAIN_JOHNSON__LES_CONTES_INTERDITS_CENDRILLON.epub`
  → `Books/J/Sylvain Johnson/Sylvain Johnson - Cendrillon.epub`
- `Books/K/Andrei Kourkov/ANDREI_KOURKOV__LES_ABEILLES_GRISES.epub`
  → `Books/K/Andrei Kourkov/Andrei Kourkov - Les Abeilles grises.epub`
- `Books/K/Bernard Marie Koltes/BERNARD_MARIE_KOLTES__COMBAT_DE_NEGRE_ET_DE_CHIENS.epub`
  → `Books/K/Bernard-Marie Koltes/Bernard-Marie Koltes - Combat de negre et de chiens.epub`
- `Books/K/Daniel Keyes/DANIEL_KEYES__DES_FLEURS_POUR_ALGERNON.epub`
  → `Books/K/Daniel Keyes/Daniel Keyes - Des fleurs pour Algernon.epub`
- `Books/K/Elizabeth Kay/ELIZABETH_KAY__SEPT_MENSONGES.epub`
  → `Books/K/Elizabeth Kay/Elizabeth Kay - Sept mensonges.epub`
- `Books/K/Franz Kafka/FRANZ_KAFKA__LA_METAMORPHOSE_SUIVI_DE_DANS_LA_COLONIE_PENITENTIAIRE.epub`
  → `Books/K/Franz Kafka/Franz Kafka - La métamorphose suivi de Dans la colonie pénitentiaire.epub`
- `Books/K/Franz Kafka/FRANZ_KAFKA__LE_PROCES.epub`
  → `Books/K/Franz Kafka/Franz Kafka - Le Procès.epub`
- `Books/K/Jack Kerouac/JACK_KEROUAC__SUR_LA_ROUTE_LE_ROULEAU_ORIGINAL.epub`
  → `Books/K/Jack Kerouac/Jack Kerouac - Sur la route - Le rouleau original.epub`
- `Books/K/Jemisin N K/JEMISIN_N_K__LA_PORTE_DE_CRISTAL.epub`
  → `Books/J/N.K. Jemisin/N.K. Jemisin - La porte de cristal.epub`
- `Books/K/Jemisin N K/N_K_JEMISIN__LES_CIEUX_PETRIFIES.epub`
  → `Books/J/N.k. Jemisin/N.k. Jemisin - Les Cieux pétrifiés.epub`
- `Books/K/Joseph Kessel/KESSEL_JOSEPH_KESSEL_JOSEPH__LARMEE_DES_OMBRES.epub`
  → `Books/K/Joseph Kessel/Joseph Kessel - L'Armée des ombres.epub`
- `Books/K/Marc-Uwe Kling/MARC_UWE_KLING__QUALITY_LAND.epub`
  → `Books/K/Marc-Uwe Kling/Marc-Uwe Kling - Quality Land.epub`
- `Books/K/Milan Kundera/MILAN_KUNDERA__L_INSOUTENABLE_LEGERETE_DE_L_ETRE.epub`
  → `Books/K/Milan Kundera/Milan Kundera - L'insoutenable légéreté de l'être.epub`
- `Books/K/R. F. Kuang/R_F_KUANG__LA_GUERRE_DU_PAVOT.epub`
  → `Books/K/R. f. Kuang/R. f. Kuang - La guerre du pavot.epub`
- `Books/K/Salome Kiner/SALOME_KINER__GRANDE_COURONNE.epub`
  → `Books/K/Salomé Kiner/Salomé Kiner - Grande Couronne.epub`
- `Books/K/Stephen King/STEPHEN_KING__MARCHE_OU_CREVE.epub`
  → `Books/K/Stephen King/Stephen King - Marche ou crève.epub`
- `Books/K/Stephen King/STEPHEN_KING__SIMETIERRE.epub`
  → `Books/K/Stephen King/Stephen King - Simetierre.epub`
- `Books/K/Yasmina Khadra/KHADRA_YASMINA__LES_HIRONDELLES_DE_KABOUL.epub`
  → `Books/K/Yasmina Khadra/Yasmina Khadra - Les hirondelles de Kaboul.epub`
- `Books/K/Yasmina Khadra/YASMINA_KHADRA__L_ATTENTAT.epub`
  → `Books/K/Yasmina Khadra/Yasmina Khadra - L'Attentat.epub`
- `Books/K/Yusuke Kishi/YUSUKE_KISHI__LA_LECON_DU_MAL.epub`
  → `Books/D/Diane Durocher/Diane Durocher, Yûsuke Kishi - La leçon du mal.epub`
- `Books/L/Alexis Laipsker/ALEXIS_LAIPSKER__HURLEMENTS.epub`
  → `Books/L/Alexis Laipsker/Alexis Laipsker - Hurlements.epub`
- `Books/L/Alexis Laipsker/ALEXIS_LAIPSKER__LES_POUPEES.epub`
  → `Books/L/Alexis Laipsker/Alexis Laipsker - Les Poupées.epub`
- `Books/L/Antoine Laurain/ANTOINE_LAURAIN__LES_CAPRICES_DUN_ASTRE.epub`
  → `Books/L/Antoine Laurain/Antoine Laurain - Les Caprices d'un astre.epub`
- `Books/L/Aragon Louis/ARAGON_LOUIS__LES_YEUX_DELSA.epub`
  → `Books/A/Louis Aragon/Louis Aragon - Les yeux d'Elsa.epub`
- `Books/L/Blanka Lipinska/BLANKA_LIPINSKA__365_JOURS_TOME_1.epub`
  → `Books/L/Blanka Lipinska/Blanka Lipinska - 365 jours - Tome 1.epub`
- `Books/L/Christian Lequesne/CHRISTIAN_LEQUESNE__ETHNOGRAPHIE_DU_QUAI_D_ORSAY.epub`
  → `Books/L/Christian Lequesne/Christian Lequesne - Ethnographie du Quai d'Orsay.epub`
- `Books/L/Christina Lauren/CHRISTINA_LAUREN__BEAUTIFUL_BASTARD_VERSION_FRANCAISE_FRENCH_EDITION.epub`
  → `Books/L/Christina Lauren/Christina Lauren - Beautiful Bastard - Version Française -.epub`
- `Books/L/Emmanuelle Lambert/EMMANUELLE_LAMBERT__AUCUN_RESPECT.epub`
  → `Books/L/Emmanuelle Lambert/Emmanuelle Lambert - Aucun respect.epub`
- `Books/L/Herve Le Tellier/HERVE_LE_TELLIER__LANOMALIE.epub`
  → `Books/L/Hervé Le Tellier/Hervé Le Tellier - L'anomalie.epub`
- `Books/L/Howard Phillips Lovecraft/HOWARD_PHILLIPS_LOVECRAFT__L_APPEL_DE_CTHULHU_LOVECRAFT_NOUVELLE_TRADUCTION_FRENCH_EDITION.epub`
  → `Books/L/Howard Phillips Lovecraft/Howard Phillips Lovecraft - L'appel de Cthulhu.epub`
- `Books/L/Hugo Lindenberg/HUGO_LINDENBERG__LES_ANNEES_SOUTERRAINES.epub`
  → `Books/L/Hugo Lindenberg/Hugo Lindenberg - Les années souterraines.epub`
- `Books/L/Jack London/JACK_LONDON__L_APPEL_DE_LA_FORET.epub`
  → `Books/L/Jack London/Jack London - L'appel de la forêt.epub`
- `Books/L/Jean-Marie Gustave Le Clezio/JEAN_MARIE_GUSTAVE_LE_CLEZIO__LE_FLOT_DE_LA_POESIE_CONTINUERA_DE_COULER.epub`
  → `Books/L/J.M.G. Le Clézio/J.M.G. Le Clézio - Le flot de la poésie continuera de couler.epub`
- `Books/L/Jerome Leroy/JEROME_LEROY__LES_DERNIERS_JOURS_DES_FAUVES.epub`
  → `Books/L/Jérôme Leroy/Jérôme Leroy - Les derniers jours des fauves.epub`
- `Books/L/John Le Carre/JOHN_LE_CARRE__LESPION_QUI_VENAIT_DU_FROID.epub`
  → `Books/L/John Le Carré/John Le Carré - L'espion qui venait du froid.epub`
- `Books/L/John Le Carre/JOHN_LE_CARRE__UNE_VERITE_SI_DELICATE.epub`
  → `Books/L/John Le Carré/John Le Carré - Une vérité si délicate.epub`
- `Books/L/Lola Lafon/LOLA_LAFON__QUAND_TU_ECOUTERAS_CETTE_CHANSON.epub`
  → `Books/L/Lola Lafon/Lola Lafon - Quand tu écouteras cette chanson.epub`
- `Books/L/Marc Laine/MARC_LAINE__L_HERITAGE_DU_CLAN.epub`
  → `Books/L/Marc Lainé/Marc Lainé - L’héritage du clan.epub`
- `Books/L/Marc Levy/MARC_LEVY__LA_LIBRAIRIE_DES_LIVRES_INTERDITS.epub`
  → `Books/L/Marc Levy/Marc Levy - La librairie des livres interdits.epub`
- `Books/L/Mathieu Laine/MATHIEU_LAINE__LA_COMPAGNIE_DES_VOYANTS.epub`
  → `Books/L/Mathieu Laine/Mathieu Laine - La compagnie des voyants.epub`
- `Books/L/Michelle Perrot Titiou Lecoq/MICHELLE_PERROT_TITIOU_LECOQ__LES_GRANDES_OUBLIEES.epub`
  → `Books/L/Titiou Lecoq/Titiou Lecoq, Michelle Perrot - Les grandes oubliées.epub`
- `Books/L/Nicolas Lebel/NICOLAS_LEBEL__CAPITAINE_MEHRLICHT_1_L_HEURE_DES_FOUS.epub`
  → `Books/L/Nicolas Lebel/Nicolas Lebel - L'heure des fous.epub`
- `Books/L/Philippe Lancon/LANCON_PHILIPPE__LE_LAMBEAU.epub`
  → `Books/L/Philippe Lançon/Philippe Lançon - Le lambeau.epub`
- `Books/L/Pierre Lemaitre/PIERRE_LEMAITRE__CADRES_NOIRS.epub`
  → `Books/L/Pierre Lemaitre/Pierre Lemaitre - Cadres Noirs.epub`
- `Books/L/Pierre Lemaitre/PIERRE_LEMAITRE__LE_GRAND_MONDE_2022.epub`
  → `Books/L/Pierre Lemaitre/Pierre Lemaitre - Le Grand Monde (Littérature Française).epub`
- `Books/L/Pour les Nuls/POUR_LES_NULS__LES_100_CHEFS_D_OEUVRE_DU_CLASSIQUE_BENJAMIN_FRANCOIS.epub`
  → `Books/F/Benjamin François/Benjamin François - Les 100 chefs-d'oeuvre du classique pour les Nuls.epub`
- `Books/L/Primo Levi/PRIMO_LEVI__SI_CEST_UN_HOMME.epub`
  → `Books/L/Primo Levi/Primo Levi - Si c'est un homme.epub`
- `Books/L/Rebecca Lighieri/REBECCA_LIGHIERI__LE_CLUB_DES_ENFANTS_PERDUS.epub`
  → `Books/L/Rebecca Lighieri/Rebecca Lighieri - Le Club des enfants perdus.epub`
- `Books/L/Sidney Lumet/SIDNEY_LUMET__FAIRE_UN_FILM.epub`
  → `Books/L/Sidney Lumet/Sidney Lumet - Faire un film.epub`
- `Books/L/Tardieu Laurence/TARDIEU_LAURENCE__D_UNE_AUBE_A_L_AUTRE.epub`
  → `Books/T/Laurence Tardieu/Laurence Tardieu - D’une aube à l’autre.epub`
- `Books/L/Villanova,Thibaud & Léonard,Maxime/VILLANOVA_THIBAUD_LEONARD_MAXIME__GASTRONOGEEK.epub`
  → `Books/V/Thibaud Villanova/Thibaud Villanova, Maxime Léonard - GastronoGEEK.epub`
- `Books/L/Voyage Dans la Lune/VOYAGE_DANS_LA_LUNE__CYRANO_DE_BERGERAC.epub`
  → `Books/B/Cyrano de Bergerac/Cyrano de Bergerac - Voyage dans la Lune.epub`
- `Books/L/Yanick Lahens/YANICK_LAHENS__PASSAGERES_DE_NUIT.epub`
  → `Books/L/Yanick Lahens/Yanick Lahens - Passagères de nuit.epub`
- `Books/M/Agnes Martin-lugand/AGNES_MARTIN_LUGAND__LA_DATCHA.epub`
  → `Books/M/Agnès Martin-Lugand/Agnès Martin-Lugand - La Datcha.epub`
- `Books/M/Agnes Martin-lugand/AGNES_MARTIN_LUGAND__NOS_RESILIENCES.epub`
  → `Books/M/Agnes Martin-Lugand/Agnes Martin-Lugand - Nos résiliences.epub`
- `Books/M/Baptiste Morizot/BAPTISTE_MORIZOT__MANIERES_D_ETRE_VIVANT.epub`
  → `Books/M/Baptiste Morizot/Baptiste Morizot - Manières d'être vivant.epub`
- `Books/M/Brian McClellan/MCCLELLAN_BRIAN__LES_POUDREMAGES_T01_LA_PROMESSE_DU_SANG.epub`
  → `Books/B/McClellan Brian/McClellan Brian - Les Poudremages T01 - La Promesse du sang.epub`
- `Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__APRES_LE_JOUR.epub`
  → `Books/M/Christophe Molmy/Christophe Molmy - Après le jour.epub`
- `Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__LA_FOSSE_AUX_AMES.epub`
  → `Books/M/Christophe Molmy/Christophe Molmy - La Fosse aux âmes.epub`
- `Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__LES_LOUPS_BLESSES.epub`
  → `Books/M/Christophe Molmy/Christophe Molmy - Les loups blessés (La Martinière, 12 mars).epub`
- `Books/M/Christophe Molmy/CHRISTOPHE_MOLMY__QUELQUE_PART_ENTRE_LE_BIEN_ET_LE_MAL.epub`
  → `Books/M/Christophe Molmy/Christophe Molmy - Quelque part entre le bien et le mal.epub`
- `Books/M/Claire Mcgowan/CLAIRE_MCGOWAN__DEUX_VERITES_UN_MENSONGE.epub`
  → `Books/M/Claire Mcgowan/Claire Mcgowan - Deux vérités, un mensonge.epub`
- `Books/M/Clare Mackintosh/CLARE_MACKINTOSH__OTAGE.epub`
  → `Books/M/Clare Mackintosh/Clare Mackintosh - Otage.epub`
- `Books/M/Emilienne Malfatto/EMILIENNE_MALFATTO__QUE_SUR_TOI_SE_LAMENTE_LE_TIGRE.epub`
  → `Books/M/Emilienne Malfatto/Emilienne Malfatto - Que sur toi se lamente le Tigre.epub`
- `Books/M/Freida McFadden/FREIDA_MCFADDEN__LA_FEMME_DE_MENAGE_SE_MARIE.epub`
  → `Books/M/Freida McFadden/Freida McFadden - La Femme de ménage se marie.epub`
- `Books/M/Freida McFadden/FREIDA_MCFADDEN__LA_FEMME_DE_MENAGE.epub`
  → `Books/M/Freida McFadden/Freida McFadden - La femme de ménage.epub`
- `Books/M/Freida McFadden/FREIDA_MCFADDEN__LA_PROF.epub`
  → `Books/M/Freida McFadden/Freida McFadden - La prof.epub`
- `Books/M/Freida McFadden/FREIDA_MCFADDEN__LES_SECRETS_DE_LA_FEMME_DE_MENAGE.epub`
  → `Books/M/Freida McFadden/Freida McFadden - Les secrets de la femme de ménage.epub`
- `Books/M/George R.R. Martin/GEORGE_R_R_MARTIN__LE_TRONE_DE_FER_L_INTEGRALE_1.epub`
  → `Books/M/George R.R. Martin/George R.R. Martin - Le Trône de Fer - L'intégrale 1.epub`
- `Books/M/Guillaume Musso/GUILLAUME_MUSSO__L_INCONNUE_DE_LA_SEINE.epub`
  → `Books/M/Guillaume Musso/Guillaume Musso - L'Inconnue de la Seine.epub`
- `Books/M/Julien L Morain/JULIEN_L_MORAIN__REK_RED_EYED_KILLER.epub`
  → `Books/M/Julien L. Morain/Julien L. Morain - REK (Red Eyed Killer).epub`
- `Books/M/Lafon Marie-Hélène/LAFON_MARIE_HELENE__NOS_VIES.epub`
  → `Books/L/Marie-Hélène Lafon/Marie-Hélène Lafon - Nos vies.epub`
- `Books/M/Lafon Marie-Hélène/MARIE_HELENE_LAFON__LES_SOURCES.epub`
  → `Books/L/Marie-Hélène Lafon/Marie-Hélène Lafon - Les sources.epub`
- `Books/M/Majdalani Charif & Charif Majdalani/MAJDALANI_CHARIF_CHARIF_MAJDALANI__LE_NOM_DES_ROIS.epub`
  → `Books/M/Charif Majdalani/Charif Majdalani - Le nom des rois.epub`
- `Books/M/Marsha Mehran/MARSHA_MEHRAN__UNE_SOUPE_A_LA_GRENADE.epub`
  → `Books/M/Marsha Mehran/Marsha Mehran - Une soupe à la grenade.epub`
- `Books/M/Nicolas Mathieu/NICOLAS_MATHIEU__LEURS_ENFANTS_APRES_EUX.epub`
  → `Books/M/Nicolas Mathieu/Nicolas Mathieu - Leurs enfants après eux.epub`
- `Books/M/Patrick Modiano/PATRICK_MODIANO__LA_DANSEUSE.epub`
  → `Books/M/Patrick Modiano/Patrick Modiano - La danseuse.epub`
- `Books/M/Patrick Modiano/PATRICK_MODIANO__RUE_DES_BOUTIQUES_OBSCURES_GONCOURT_1978.epub`
  → `Books/M/Patrick Modiano/Patrick Modiano - Rue des boutiques obscures.epub`
- `Books/M/Pierre Michon/PIERRE_MICHON__LES_DEUX_BEUNE.epub`
  → `Books/M/Pierre Michon/Pierre Michon - Les deux Beune.epub`
- `Books/M/Pour Rien Au Monde/POUR_RIEN_AU_MONDE__KEN_FOLLETT.epub`
  → `Books/F/Ken Follett/Ken Follett - Pour rien au monde.epub`
- `Books/M/Raphael Meltz/RAPHAEL_MELTZ__24_FOIS_LA_VERITE.epub`
  → `Books/M/Raphaël Meltz/Raphaël Meltz - 24 fois la vérité.epub`
- `Books/M/Richard Malka/RICHARD_MALKA__LE_DROIT_D_EMMERDER_DIEU.epub`
  → `Books/M/Richard Malka/Richard Malka - Le droit d’emmerder Dieu.epub`
- `Books/M/Tiffany McDaniel/TIFFANY_MCDANIEL__BETTY.epub`
  → `Books/M/Tiffany McDaniel/Tiffany McDaniel - Betty.epub`
- `Books/M/Walter Murch/WALTER_MURCH__IN_THE_BLINK_OF_AN_EYE.epub`
  → `Books/M/Walter Murch/Walter Murch - In the Blink of an Eye.epub`
- `Books/N/Amelie Nothomb/AMELIE_NOTHOMB__L_ADOLESCENCE_DU_PERROQUET.epub`
  → `Books/N/Amélie Nothomb/Amélie Nothomb - L'Adolescence du perroquet.epub`
- `Books/N/Amelie Nothomb/AMELIE_NOTHOMB__L_IMPOSSIBLE_RETOUR_FRENCH_EDITION.epub`
  → `Books/N/Amélie Nothomb/Amélie Nothomb - L'impossible retour.epub`
- `Books/N/Amelie Nothomb/AMELIE_NOTHOMB__LE_LIVRE_DES_SOEURS.epub`
  → `Books/N/Amélie Nothomb/Amélie Nothomb - Le livre des sœurs.epub`
- `Books/N/Amelie Nothomb/AMELIE_NOTHOMB__PREMIER_SANG.epub`
  → `Books/N/Amélie Nothomb/Amélie Nothomb - Premier sang.epub`
- `Books/N/Amelie Nothomb/AMELIE_NOTHOMB__PSYCHOPOMPE.epub`
  → `Books/N/Amélie Nothomb/Amélie Nothomb - Psychopompe.epub`
- `Books/N/Amelie Nothomb/AMELIE_NOTHOMB__TANT_MIEUX_FRENCH_EDITION.epub`
  → `Books/N/Amélie Nothomb/Amélie Nothomb - Tant mieux.epub`
- `Books/N/Olivier Norek/OLIVIER_NOREK__IMPACT.epub`
  → `Books/N/Olivier Norek/Olivier Norek - Impact.epub`
- `Books/N/Olivier Norek/OLIVIER_NOREK__LES_GUERRIERS_DE_L_HIVER.epub`
  → `Books/N/Olivier Norek/Olivier Norek - Les guerriers de l’hiver.epub`
- `Books/N/Olivier Norek/OLIVIER_NOREK__SURFACE.epub`
  → `Books/N/Olivier Norek/Olivier Norek - Surface.epub`
- `Books/N/Olivier Norek/OLIVIER_NOREK__VICTOR_COSTE_T4_DANS_LES_BRUMES_DE_CAPELANS.epub`
  → `Books/N/Olivier Norek/Olivier Norek - Victor Coste T4 Dans les brumes de Capelans.epub`
- `Books/N/Sosuke Natsukawa/SOSUKE_NATSUKAWA__LE_CHAT_QUI_VOULAIT_SAUVER_LES_LIVRES.epub`
  → `Books/N/Sosuke Natsukawa/Sosuke Natsukawa - Le Chat qui voulait sauver les livres.epub`
- `Books/O/Audur Ava Olafsdottir/AUDUR_AVA_OLAFSDOTTIR__LA_VERITE_SUR_LA_LUMIERE.epub`
  → `Books/O/Auður Ava Ólafsdóttir/Auður Ava Ólafsdóttir - La vérité sur la lumière.epub`
- `Books/O/Fabien Olicard/FABIEN_OLICARD__CE_LIVRE_VOUS_FERA_GAGNER_DU_TEMPS.epub`
  → `Books/O/Fabien Olicard/Fabien Olicard - Ce livre vous fera gagner du temps.epub`
- `Books/O/Fabien Olicard/FABIEN_OLICARD__VOTRE_ATTENTION_EST_VOTRE_SUPERPOUVOIR.epub`
  → `Books/O/Fabien Olicard/Fabien Olicard - Votre attention est votre superpouvoir.epub`
- `Books/O/George Orwell/GEORGE_ORWELL__1984.epub`
  → `Books/O/George Orwell/George Orwell - 1984.epub`
- `Books/O/George Orwell/GEORGE_ORWELL__LA_FERME_DES_ANIMAUX.epub`
  → `Books/O/George Orwell/George Orwell - La Ferme des animaux.epub`
- `Books/O/John OHara/JOHN_OHARA__LENFER_COMMENCE_AVEC_ELLE.epub`
  → `Books/O/John O'Hara/John O'Hara - L'enfer commence avec elle.epub`
- `Books/O/Makenzy Orcel/MAKENZY_ORCEL__UNE_SOMME_HUMAINE.epub`
  → `Books/O/Makenzy Orcel/Makenzy Orcel - Une somme humaine.epub`
- `Books/P/Ada Palmer/ADA_PALMER__SEPT_REDDITIONS.epub`
  → `Books/P/Ada Palmer/Ada Palmer - Sept Redditions.epub`
- `Books/P/Ada Palmer/ADA_PALMER__TOO_LIKE_THE_LIGHTNING_TERRA_IGNOTA_BOOK_1.epub`
  → `Books/P/Ada Palmer/Ada Palmer - Too Like the Lightning (Terra Ignota Book 1).epub`
- `Books/P/Ada Palmer/ADA_PALMER__TROP_SEMBLABLE_A_LECLAIR_TERRA_IGNOTA_1.epub`
  → `Books/P/Ada Palmer/Ada Palmer - Trop semblable à l'éclair.epub`
- `Books/P/Anthony Palou/ANTHONY_PALOU__DANS_MA_RUE_Y_AVAIT_TROIS_BOUTIQUES.epub`
  → `Books/P/Anthony Palou/Anthony Palou - Dans ma rue y avait trois boutiques.epub`
- `Books/P/Bernard Petit/BERNARD_PETIT__LA_TRAQUE.epub`
  → `Books/P/Bernard Petit/Bernard Petit - La Traque.epub`
- `Books/P/Bertand Périer/BERTAND_PERIER__LA_PAROLE_EST_UN_SPORT_DE_COMBAT.epub`
  → `Books/P/Bertand Périer/Bertand Périer - La parole est un sport de combat.epub`
- `Books/P/Edgar Allan Poe/EDGAR_ALLAN_POE__OEUVRES.epub`
  → `Books/P/Edgar Allan Poe/Edgar Allan Poe - Edgar Allan Poe - Oeuvres.epub`
- `Books/P/Edgar Allan Poe/POE_EDGAR_ALLAN_POE_EDGAR_ALLAN__LE_MYSTERE_DE_MARIE_ROGET.epub`
  → `Books/A/Poe Edgar Allan/Poe Edgar Allan - Le mystère de marie roget.epub`
- `Books/P/Franck Pavloff/FRANCK_PAVLOFF__MATIN_BRUN.epub`
  → `Books/P/Franck Pavloff/Franck Pavloff - Matin Brun.epub`
- `Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_DIGNITE_DES_PSYCHOPATHES.epub`
  → `Books/P/Frédéric Paulin/Frédéric Paulin - La dignité des psychopathes.epub`
- `Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_FABRIQUE_DE_LA_TERREUR.epub`
  → `Books/P/Frédéric Paulin/Frédéric Paulin - La Fabrique de la terreur.epub`
- `Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_GUERRE_EST_UNE_RUSE.epub`
  → `Books/P/Frédéric Paulin/Frédéric Paulin - La guerre est une ruse.epub`
- `Books/P/Frédéric Paulin/FREDERIC_PAULIN__LA_NUIT_TOMBEE_SUR_NOS_AMES_GENES_2001.epub`
  → `Books/P/Frédéric Paulin/Frédéric Paulin - La nuit tombée sur nos âmes. Gênes, 2001.epub`
- `Books/P/Frédéric Paulin/FREDERIC_PAULIN__LES_PENDUS_DU_VAL_SANS_RETOUR.epub`
  → `Books/P/Frédéric Paulin/Frédéric Paulin - Les pendus du Val Sans Retour.epub`
- `Books/P/Frédéric Paulin/FREDERIC_PAULIN__PREMICES_DE_LA_CHUTE.epub`
  → `Books/P/Frederic Paulin/Frederic Paulin - Prémices de la chute.epub`
- `Books/P/Georges Perec/GEORGES_PEREC__LA_DISPARITION_LES_REVENENTES_ET_AUTRES_LIPOGRAMMES.epub`
  → `Books/P/Georges Perec/Georges Perec - La Disparition. Les Revenentes et autres lipogrammes.epub`
- `Books/P/Jean Marc Parisis/JEAN_MARC_PARISIS__ON_VA_BOUGER_CE_PUTAIN_DE_PAYS.epub`
  → `Books/P/Jean-Marc Parisis/Jean-Marc Parisis - On va bouger ce putain de pays.epub`
- `Books/P/Jean Potocki/JEAN_POTOCKI__MANUSCRIT_TROUVE_A_SARAGOSSE.epub`
  → `Books/P/Jan Potocki/Jan Potocki - Manuscrit Trouvé À Saragosse.epub`
- `Books/P/Jean-Francois Pasques/JEAN_FRANCOIS_PASQUES__FILS_DE_PERSONNE.epub`
  → `Books/P/Jean-François Pasques/Jean-François Pasques - Fils de personne.epub`
- `Books/P/Katherine Pancol/KATHERINE_PANCOL__LA_MARIEE_PORTAIT_DES_BOTTES_JAUNES.epub`
  → `Books/K/Pancol Katherine/Pancol Katherine - La Mariée portait des bottes jaunes.epub`
- `Books/P/Langellier Jean Pierre/LANGELLIER_JEAN_PIERRE__LEOPOLD_SEDAR_SENGHOR.epub`
  → `Books/L/Jean-Pierre Langellier/Jean-Pierre Langellier - Léopold Sédar Senghor.epub`
- `Books/P/Maria Pourchet/MARIA_POURCHET__FEU.epub`
  → `Books/P/Maria Pourchet/Maria Pourchet - Feu.epub`
- `Books/P/Mario Puzo/MARIO_PUZO__LE_PARRAIN.epub`
  → `Books/P/Mario Puzo/Mario Puzo - Le Parrain.epub`
- `Books/P/Michael Palmer/MICHAEL_PALMER__A_HEARTBEAT_AWAY.epub`
  → `Books/P/Michael Palmer/Michael Palmer - A Heartbeat Away.epub`
- `Books/P/Panayotis Pascot/PASCOT_PANAYOTIS__LA_PROCHAINE_FOIS_QUE_TU_MORDRAS_LA_POUSSIERE.epub`
  → `Books/P/Pascot Panayotis/Pascot Panayotis - La prochaine fois que tu mordras la poussière.epub`
- `Books/P/Pulixi Piergiorgio/PULIXI_PIERGIORGIO__LILLUSION_DU_MAL_MARA_RAIS_EVA_CROCE_2.epub`
  → `Books/P/Piergiorgio Pulixi/Piergiorgio Pulixi - L’illusion du mal - 02 Mara Rais & Eva Croce.epub`
- `Books/P/Richard Powers/RICHARD_POWERS__LARBRE_MONDE.epub`
  → `Books/P/Richard Powers/Richard Powers - L'Arbre-Monde.epub`
- `Books/P/Terry Pratchett/TERRY_PRATCHETT__ANNALES_DU_DISQUE_MONDE_01_LA_HUITIEME_COULEUR.epub`
  → `Books/P/Terry Pratchett/Terry Pratchett - Annales Du Disque-Monde 01 - La Huitième Couleur.epub`
- `Books/Q/Jeanne Quilfen/JEANNE_QUILFEN__DANS_LES_YEUX_DU_PROCUREUR_CHRONIQUE_DE_LA_JUSTICE_ORDINAIRE_FRENCH_EDITION.epub`
  → `Books/Q/Jeanne Quilfen/Jeanne Quilfen - Dans les yeux du procureur - Chronique de la justice ordinaire.epub`
- `Books/R/Ajar Emile Gary Romain/AJAR_EMILE_GARY_ROMAIN__LA_VIE_DEVANT_SOI.epub`
  → `Books/G/Emile Ajar / Romain Gary/Emile Ajar / Romain Gary - La vie devant soi.epub`
- `Books/R/Arturo Perez Reverte/ARTURO_PEREZ_REVERTE__LA_REINE_DU_SUD.epub`
  → `Books/P/Arturo Pérez-Reverte/Arturo Pérez-Reverte - La Reine du Sud.epub`
- `Books/R/Cyrielle Hariel Sylvain Reymond/CYRIELLE_HARIEL_SYLVAIN_REYMOND__NOS_RAISONS_DETRE.epub`
  → `Books/R/Sylvain Reymond/Sylvain Reymond, Cyrielle Hariel - Nos raisons d'être.epub`
- `Books/R/Dimitri Rouchon-Borie/DIMITRI_ROUCHON_BORIE__LE_CHIEN_DES_ETOILES.epub`
  → `Books/R/Dimitri Rouchon-Borie/Dimitri Rouchon-Borie - Le chien des étoiles.epub`
- `Books/R/Divers Roman/DIVERS_ROMAN__TRUISMES_MARIE_DARRIEUSSECQ.epub`
  → `Books/R/Divers Roman/Divers Roman - Truismes - Marie Darrieussecq.epub`
- `Books/R/Ebbok Charles Roux/EBBOK_CHARLES_ROUX__LES_MONSTRES.epub`
  → `Books/R/Charles Roux/Charles Roux - Les Monstres.epub`
- `Books/R/Kim Stanley Robinson/Kim Stanley Robinson_Ministère du futur, Le.epub`
  → `Books/R/Kim Stanley Robinson/Kim Stanley Robinson - Le ministère du futur.epub`
- `Books/R/Le Petit Chaperon Rouge/LE_PETIT_CHAPERON_ROUGE__LE_PETIT_CHAPERON_ROUGE.epub`
  → `Books/R/Le Petit Chaperon Rouge/Le Petit Chaperon Rouge - Le petit chaperon rouge.epub`
- `Books/R/Louise Rose/LOUISE_ROSE__LES_PROJECTILES.epub`
  → `Books/R/Louise Rose/Louise Rose - Les Projectiles.epub`
- `Books/R/Véronique Rivat/VERONIQUE_RIVAT__CHATS_NOIRS.epub`
  → `Books/R/Véronique Rivat/Véronique Rivat - Chats noirs.epub`
- `Books/R/Yves Ravey/YVES_RAVEY__TAORMINE.epub`
  → `Books/R/Yves Ravey/Yves Ravey - Taormine.epub`
- `Books/S/Alain Bauer Christophe Soullez/ALAIN_BAUER_CHRISTOPHE_SOULLEZ__CRIMINOLOGIE_POUR_LES_NULS_LA_1.epub`
  → `Books/B/Alain Bauer/Alain Bauer, Christophe Soullez - La criminologie pour les nuls.epub`
- `Books/S/Andrzej Sapkowski/ANDRZEJ_SAPKOWSKI__SORCELEUR_L_INTEGRALE.epub`
  → `Books/S/Andrzej Sapkowski/Andrzej Sapkowski - Sorceleur - L'Intégrale.epub`
- `Books/S/Benoît Severac/BENOIT_SEVERAC__LE_BRUIT_DE_NOS_PAS_PERDUS (2).epub`
  → `Books/S/Benoît Severac/Benoît Severac - Le Bruit de nos pas perdus.epub`
- `Books/S/Benoît Severac/BENOIT_SEVERAC__LE_BRUIT_DE_NOS_PAS_PERDUS.epub`
  → `Books/S/Benoît Séverac/Benoît Séverac - Le Bruit de nos pas perdus.epub`
- `Books/S/Boualem Sansal/BOUALEM_SANSAL__2084.epub`
  → `Books/S/Boualem Sansal/Boualem Sansal - 2084.epub`
- `Books/S/Cédric Sire/CEDRIC_SIRE__2025_SURVIVANTES.epub`
  → `Books/S/Cédric Sire/Cédric Sire - 2025 - Survivantes.epub`
- `Books/S/Chalandon Sorj/CHALANDON_SORJ__LE_QUATRIEME_MUR_ROMAN_LITTERATURE_FRANCAISE_FRENCH_EDITION.epub`
  → `Books/C/Sorj Chalandon/Sorj Chalandon - Le quatrième mur.epub`
- `Books/S/Dan Simmons/DAN_SIMMONS__L_ECHIQUIER_DU_MAL_TOME_1.epub`
  → `Books/S/Dan Simmons/Dan Simmons - L'échiquier du mal - Tome 1.epub`
- `Books/S/Dominique Scali/DOMINIQUE_SCALI__LES_MARINS_NE_SAVENT_PAS_NAGER.epub`
  → `Books/S/Dominique Scali/Dominique Scali - Les marins ne savent pas nager.epub`
- `Books/S/Douglas Stuart/DOUGLAS_STUART__SHUGGIE_BAIN.epub`
  → `Books/S/Douglas Stuart/Douglas Stuart - Shuggie Bain.epub`
- `Books/S/Elif Shafak/ELIF_SHAFAK__LES_FLEUVES_DU_CIEL.epub`
  → `Books/S/Elif Shafak/Elif Shafak - Les fleuves du ciel.epub`
- `Books/S/Fitzgerald Francis Scott/FRANCIS_SCOTT_FITZGERALD__GATSBY_LE_MAGNIFIQUE.epub`
  → `Books/F/Francis Scott Fitzgerald/Francis Scott Fitzgerald - Gatsby le magnifique.epub`
- `Books/S/J.D. Salinger/J_D_SALINGER__LATTRAPE_COEURS.epub`
  → `Books/S/Jerome David Salinger/Jerome David Salinger - L'attrape-cœurs.epub`
- `Books/S/Jeanne Siaud-Facchin/JEANNE_SIAUD_FACCHIN__UN_PRINTEMPS_POUR_SOI.epub`
  → `Books/S/Jeanne Siaud-Facchin/Jeanne Siaud-Facchin - Un printemps pour soi.epub`
- `Books/S/Jon Kalman Stefansson/JON_KALMAN_STEFANSSON__TON_ABSENCE_NEST_QUE_TENEBRES.epub`
  → `Books/S/Jon-Kalman Stefansson/Jon-Kalman Stefansson - Ton absence n’est que ténèbres.epub`
- `Books/S/Joseph Steinberg/JOSEPH_STEINBERG__LA_CYBERSECURITE_POUR_LES_NULS_GRAND_FORMAT.epub`
  → `Books/S/Joseph Steinberg/Joseph Steinberg - La Cybersécurité pour les Nuls, grand format.epub`
- `Books/S/Julien Sandrel/JULIEN_SANDREL__MERCI_GRAZIE_THANK_YOU.epub`
  → `Books/S/Julien Sandrel/Julien Sandrel - Merci, Grazie, thank you.epub`
- `Books/S/L.P Sicard/L_P_SICARD__LES_CONTES_INTERDITS_LA_BELLE_AU_BOIS_DORMANT.epub`
  → `Books/S/L.P Sicard/L.P Sicard - Les contes interdits - La belle au bois dormant.epub`
- `Books/S/Matthieu Suc/MATTHIEU_SUC__LES_ESPIONS_DE_LA_TERREUR.epub`
  → `Books/S/Matthieu Suc/Matthieu Suc - Les espions de la terreur.epub`
- `Books/S/Matthieu Suc/SUC_MATTHIEU__LES_ESPIONS_DE_LA_TERREUR.epub`
  → `Books/S/Matthieu Suc/Matthieu Suc - Les espions de la terreur (HarperCollins).epub`
- `Books/S/Mohamed Mbougar Sarr/MOHAMED_MBOUGAR_SARR__LA_PLUS_SECRETE_MEMOIRE_DES_HOMMES.epub`
  → `Books/M/Mohamed Mbougar-Sarr/Mohamed Mbougar-Sarr - La plus secrète mémoire des hommes.epub`
- `Books/S/Mohamed Mbougar Sarr/MOHAMED_MBOUGAR_SARR__PURS_HOMMES_DE.epub`
  → `Books/S/Mohamed Mbougar Sarr/Mohamed Mbougar Sarr - De purs hommes.epub`
- `Books/S/Monica Sabolo/MONICA_SABOLO__LA_VIE_CLANDESTINE.epub`
  → `Books/S/Monica Sabolo/Monica Sabolo - La vie clandestine.epub`
- `Books/S/Peter Swanson/PETER_SWANSON__CEUX_QU_ON_SAUVE.epub`
  → `Books/S/Peter Swanson/Peter Swanson - Ceux qu’on sauve.epub`
- `Books/S/Peter Swanson/PETER_SWANSON__HUIT_CRIMES_PARFAIT.epub`
  → `Books/S/Peter Swanson/Peter Swanson - Huit crimes parfaits.epub`
- `Books/S/Roberto Saviano/ROBERTO_SAVIANO__GOMORRA_DANS_LEMPIRE_DE_LA_CAMORA.epub`
  → `Books/S/Robert Saciano/Robert Saciano - Gomorra, dans l'empire de la Camorra.epub`
- `Books/S/Salomé Saqué/SALOME_SAQUE__RESISTER_FRENCH_EDITION.epub`
  → `Books/S/Salomé Saqué/Salomé Saqué - Résister.epub`
- `Books/S/Tom Sweterlitsch/TOM_SWETERLITSCH__TERMINUS.epub`
  → `Books/T/Sweterlitsch Tom/Sweterlitsch Tom - Terminus.epub`
- `Books/S/William Shakespeare/WILLIAM_SHAKESPEARE__HAMLET_EDITION_ENRICHIE_FOLIO_CLASSIQUE_FRENCH_EDITION.epub`
  → `Books/S/William Shakespeare/William Shakespeare - Hamlet (édition enrichie) (Folio Classique).epub`
- `Books/S/William Shakespeare/WILLIAM_SHAKESPEARE__LE_ROI_LEAR.epub`
  → `Books/S/William Shakespeare/William Shakespeare - Le Roi Lear.epub`
- `Books/S/William Shakespeare/WILLIAM_WILLIAM_SHAKESPEARE_SHAKESPEARE__MACBETH.epub`
  → `Books/S/William Shakespeare/William Shakespeare - Macbeth.epub`
- `Books/T/Abdellah Taïa/ABDELLAH_TAIA__LE_BASTION_DES_LARMES.epub`
  → `Books/T/Abdellah Taïa/Abdellah Taïa - Le bastion des larmes.epub`
- `Books/T/Clementine Thiebault/CLEMENTINE_THIEBAULT__EN_VOTRE_INTIME_CONVICTION.epub`
  → `Books/T/Clémentine Thiebault/Clémentine Thiebault - En votre intime conviction.epub`
- `Books/T/David Thomas/DAVID_THOMAS__UN_FRERE.epub`
  → `Books/T/David Thomas/David Thomas - Un frère.epub`
- `Books/T/Franck Thilliez/FRANCK_THILLIEZ__10_SHARKO.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - 10 Sharko.epub`
- `Books/T/Franck Thilliez/FRANCK_THILLIEZ__2004_TRAIN_D_ENFER_POUR_ANGE_ROUGE.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - Train D'Enfer Pour Ange Rouge.epub`
- `Books/T/Franck Thilliez/FRANCK_THILLIEZ__IL_ETAIT_DEUX_FOIS.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - Il était deux fois.epub`
- `Books/T/Franck Thilliez/FRANCK_THILLIEZ__LABYRINTHES.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - Labyrinthes.epub`
- `Books/T/Franck Thilliez/FRANCK_THILLIEZ__LE_MANUSCRIT_INACHEVE.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - Le Manuscrit inachevé.epub`
- `Books/T/Franck Thilliez/FRANCK_THILLIEZ__LE_PLAISIR_DE_LA_PEUR.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - Le plaisir de la peur.epub`
- `Books/T/Franck Thilliez/FRANCK_THILLIEZ__NORFERVILLE.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - Norferville.epub`
- `Books/T/Karine Tuil/KARINE_TUIL__KADDISH_POUR_UN_AMOUR.epub`
  → `Books/A/Kaddish pour un amour/Kaddish pour un amour - Karine Tuil.epub`
- `Books/T/Karine Tuil/KARINE_TUIL__LA_GUERRE_PAR_D_AUTRES_MOYENS.epub`
  → `Books/T/Karine Tuil/Karine Tuil - La guerre par d'autres moyens.epub`
- `Books/T/Karine Tuil/KARINE_TUIL__LES_CHOSES_HUMAINES.epub`
  → `Books/T/Karine Tuil/Karine Tuil - Les choses humaines.epub`
- `Books/T/Kressmann Taylor/KRESSMANN_TAYLOR__INCONNU_A_CETTE_ADRESSE.epub`
  → `Books/T/Kressmann Taylor/Kressmann Taylor - Inconnu à cette adresse.epub`
- `Books/T/Léon Tolstoï/LEON_TOLSTOI__LA_GUERRE_ET_LA_PAIX_TOME_I.epub`
  → `Books/T/Léon Tolstoï/Léon Tolstoï - La Guerre et la Paix - Tome I.epub`
- `Books/T/Marc Hecker Et Elie Tenenbaum/MARC_HECKER_ET_ELIE_TENENBAUM__LA_GUERRE_DE_VINGT_ANS.epub`
  → `Books/H/Marc Hecker/Marc Hecker, Élie Tenenbaum - La guerre de vingt ans.epub`
- `Books/T/Marc Trevidic/MARC_TREVIDIC__LE_ROMAN_DU_TERRORISME.epub`
  → `Books/T/Marc Trevidic/Marc Trevidic - Le roman du terrorisme.epub`
- `Books/T/Romain Bertolino & Alexandre Negrus & Nato Tardieu/ROMAIN_BERTOLINO_ALEXANDRE_NEGRUS_NATO_TARDIEU__ATLAS_GEOPOLITIQUE_DU_MONDE_CONTEMPORAIN.epub`
  → `Books/B/Romain Bertolino/Romain Bertolino et al. - Atlas géopolitique du monde contemporain.epub`
- `Books/T/Strasser Todd/STRASSER_TODD__LA_VAGUE.epub`
  → `Books/S/Todd Strasser/Todd Strasser - La vague.epub`
- `Books/T/Stuart Turton/STUART_TURTON__LES_SEPT_MORTS_D_EVELYN_HARDCASTLE.epub`
  → `Books/P/Fabrice Pointeau/Fabrice Pointeau, Stuart Turton - Les Sept Morts D'Evelyn Hardcastle.epub`
- `Books/T/Viel Tanguy/TANGUY_VIEL__ARTICLE_353_DU_CODE_PENAL.epub`
  → `Books/V/Tanguy Viel/Tanguy Viel - Article 353 du code pénal.epub`
- `Books/U/Fred Ulhman/FRED_ULHMAN__L_AMI_RETROUVE.epub`
  → `Books/U/Fred Ulhman/Fred Ulhman - L'ami retrouvé.epub`
- `Books/V/Aurelie Valognes/AURELIE_VALOGNES__NE_SOUS_UNE_BONNE_ETOILE.epub`
  → `Books/V/Aurélie Valognes/Aurélie Valognes - Né sous une bonne étoile.epub`
- `Books/V/Boris Vian/BORIS_VIAN__L_ARRACHE_COEUR.epub`
  → `Books/V/Boris Vian/Boris Vian - L'Arrache-coeur.epub`
- `Books/V/Boris Vian/BORIS_VIAN__L_ECUME_DES_JOURS.epub`
  → `Books/V/Boris Vian/Boris Vian - L'Écume des jours.epub`
- `Books/V/Eric Vuillard/ERIC_VUILLARD__LA_GUERRE_DES_PAUVRES.epub`
  → `Books/V/Eric Vuillard/Eric Vuillard - La guerre des pauvres.epub`
- `Books/V/Eric Vuillard/ERIC_VUILLARD__UNE_SORTIE_HONORABLE.epub`
  → `Books/V/Eric Vuillard/Eric Vuillard - Une sortie honorable.epub`
- `Books/V/Florent Vandepitte/FLORENT_VANDEPITTE__LES_GRANDS_DISCOURS_POLITIQUES_POUR_LES_NULS_EN_50_CITATIONS_CLES.epub`
  → `Books/V/Florent Vandepitte/Florent Vandepitte - Les Grands Discours politiques pour les Nuls en 50 citations clés.epub`
- `Books/V/Fred Vargas/FRED_VARGAS__PARS_VITE_ET_REVIENS_TARD.epub`
  → `Books/V/Fred Vargas/Fred Vargas - Pars vite et reviens tard.epub`
- `Books/V/Laura Vazquez/LAURA_VAZQUEZ__LES_FORCES.epub`
  → `Books/V/Laura Vazquez/Laura Vazquez - Les forces.epub`
- `Books/V/Marie Vingtras/MARIE_VINGTRAS__BLIZZARD.epub`
  → `Books/V/Marie Vingtras/Marie Vingtras - Blizzard.epub`
- `Books/V/Ocean Vuong/OCEAN_VUONG__UN_BREF_INSTANT_DE_SPLENDEUR.epub`
  → `Books/V/Ocean Vuong/Ocean Vuong - Un bref instant de splendeur.epub`
- `Books/W/Andy Weir/ANDY_WEIR__PROJECT_HAIL_MARY.epub`
  → `Books/W/Andy Weir/Andy Weir - Project Hail Mary.epub`
- `Books/W/Antoine Wauters/ANTOINE_WAUTERS__HAUTE_FOLIE.epub`
  → `Books/W/Antoine Wauters/Antoine Wauters - Haute-folie.epub`
- `Books/W/Antoine Wauters/ANTOINE_WAUTERS__MAHMOUD_OU_LA_MONTEE_DES_EAUX_2021.epub`
  → `Books/W/Antoine Wauters/Antoine Wauters - Mahmoud ou la montée des eaux.epub`
- `Books/W/Chloe Walsh/CHLOE_WALSH__BOYS_OF_TOMMEN_1_BINDING_13.epub`
  → `Books/W/Chloe Walsh/Chloe Walsh - Boys of Tommen 1 - Binding 13.epub`
- `Books/W/Don Winslow/DON_WINSLOW__LA_GRIFFE_DU_CHIEN.epub`
  → `Books/W/Don Winslow/Don Winslow - La Griffe du chien.epub`
- `Books/W/Henry War/HENRY_WAR__ARKONE.epub`
  → `Books/W/Henry War/Henry War - ArkOne.epub`
- `Books/W/Maurice Barthelemy Charlotte Wils/MAURICE_BARTHELEMY_CHARLOTTE_WILS__FORT_COMME_UN_HYPERSENSIBLE.epub`
  → `Books/B/Maurice Barthelemy/Maurice Barthelemy, Charlotte Wils - Fort comme un hypersensible.epub`
- `Books/W/Tevis Walter/TEVIS_WALTER__LE_JEU_DE_LA_DAME.epub`
  → `Books/D/Le jeu de la dame/Le jeu de la dame - Walter Tevis.epub`
- `Books/W/Tom Wolfe/TOM_WOLFE__LE_BUCHER_DES_VANITES.epub`
  → `Books/W/Tom Wolfe/Tom Wolfe - Le bûcher des vanités.epub`
- `Books/Z/Alice Zeniter/ALICE_ZENITER__COMME_UN_EMPIRE_DANS_UN_EMPIRE_2020.epub`
  → `Books/Z/Alice Zeniter/Alice Zeniter - Comme un empire dans un empire.epub`
- `Books/Z/Stefan Zweig/STEFAN_ZWEIG__CONSCIENCE_CONTRE_VIOLENCE.epub`
  → `Books/Z/Stefan Zweig/Stefan Zweig - Conscience Contre Violence.epub`
- `Books/Z/Stefan Zweig/STEFAN_ZWEIG__LE_JOUEUR_D_ECHECS_PAVILLONS_POCHE_FRENCH_EDITION.epub`
  → `Books/Z/Stefan Zweig/Stefan Zweig - Le Joueur d'échecs (PAVILLONS POCHE).epub`
- `BROWN_PIERCE_RED_RISING.epub`
  → `Books/B/Pierce Brown/Pierce Brown - Red rising.epub`
- `CHATTAM_MAXIME_MORSURES.epub`
  → `Books/M/Chattam Maxime/Chattam Maxime, Maxime Chattam - Morsures.epub`
- `CLAIRE_DUVIVIER_LA_DAME_DE_LA_SEINE.epub`
  → `Books/D/Claire Duvivier/Claire Duvivier - La dame de la Seine.epub`
- `CLAIRE_NORTON_LES_ENRACINES.epub`
  → `Books/N/Claire Norton/Claire Norton - Les enracinés.epub`
- `CLARKE_EVELYN_UNE_HISTOIRE_QUI_FINIT_MAL.epub`
  → `Books/C/Evelyn Clarke/Evelyn Clarke - Une histoire qui finit mal.epub`
- `DAVID_GEMMELL_DRUSS_LA_LEGENDE.epub`
  → `Books/G/David Gemmell/David Gemmell - Druss la légende.epub`
- `DAVID_GEMMELL_LA_LEGENDE_DE_MARCHE_MORT.epub`
  → `Books/G/David Gemmell/David Gemmell - La Légende de Marche-Mort.epub`
- `DAVID_GEMMELL_WAYLANDER_III_LE_HEROS_DANS_L_OMBRE.epub`
  → `Books/G/David Gemmell/David Gemmell - Waylander III - Le Héros dans l'ombre.epub`
- `DEVI_ANANDA_CHRONIQUE_D_UN_ROYAUME_PERDU.epub`
  → `Books/A/Devi Ananda/Devi Ananda - Chronique d'un royaume perdu.epub`
- `DEVILLERS_SONIA_LE_FABULEUX_PIANO.epub`
  → `Books/D/Sonia Devillers/Sonia Devillers - Le Fabuleux piano.epub`
- `DUMIOT_VICTOR_LOLA_VA_MOURIR.epub`
  → `Books/V/Dumiot Victor/Dumiot Victor - Lola va mourir.epub`
- `ELGIN_SUZETTE_HADEN_LANGUE_NATALE.epub`
  → `Books/E/Suzette Haden Elgin/Suzette Haden Elgin - Langue natale.epub`
- `EMMANUEL_CHASTELLIERE_LE_RESTAURANT_DES_ROBOTS_REVEURS.epub`
  → `Books/C/Emmanuel Chastellière/Emmanuel Chastellière, Annalee Newitz - Le restaurant des robots rêveurs.epub`
- `FRANCOIS_HENRI_DESERABLE_LE_PALAIS.epub`
  → `Books/D/François-Henri Désérable/François-Henri Désérable - Le palais.epub`
- `GEMMELL_DAVID_LEGENDE.epub`
  → `Books/G/David Gemmell/David Gemmell - Légende.epub`
- `GIULIANO_DA_EMPOLI_LE_FONDATEUR.epub`
  → `Books/E/Giuliano da Empoli/Giuliano da Empoli - Le fondateur.epub`
- `GLEN_COOK_LES_ANNALES_DE_LA_COMPAGNIE_NOIRE_INTEGRALE_1.epub`
  → `Books/C/Glen Cook/Glen Cook - Les annales de la Compagnie noire - Intégrale 1.epub`
- `GLEN_COOK_LES_ANNALES_DE_LA_COMPAGNIE_NOIRE_INTEGRALE_2.epub`
  → `Books/C/Glen Cook/Glen Cook - Les annales de la Compagnie noire - Intégrale 2.epub`
- `GLEN_COOK_LES_ANNALES_DE_LA_COMPAGNIE_NOIRE_INTEGRALE_3.epub`
  → `Books/C/Glen Cook/Glen Cook - Les annales de la Compagnie noire - Intégrale 3.epub`
- `GLEN_COOK_LES_ANNALES_DE_LA_COMPAGNIE_NOIRE_L_INTEGRALE_TOME_4.epub`
  → `Books/C/Glen Cook/Glen Cook - Les annales de la Compagnie noire (L'Intégrale - Tome 4).epub`
- `GLUKHOVSKY_DMITRY_METRO_2033.epub`
  → `Books/G/Dmitry Glukhovsky/Dmitry Glukhovsky - Métro 2033.epub`
- `HASSAINE_LILIA_JE.epub`
  → `Books/H/Lilia Hassaine/Lilia Hassaine - Je.epub`
- `HINAULT_CAROLINE_CE_QUI_SE_JOUE.epub`
  → `Books/H/Caroline Hinault/Caroline Hinault - Ce qui se joue.epub`
- `HOBB_ROBIN_L_ASSASSIN_ROYAL_10_SERMENTS_ET_DEUILS.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin Royal-10-Serments et Deuils.epub`
- `HOBB_ROBIN_L_ASSASSIN_ROYAL_11_LE_DRAGON_DES_GLACES.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin Royal-11-Le Dragon des glaces.epub`
- `HOBB_ROBIN_L_ASSASSIN_ROYAL_12_L_HOMME_NOIR.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin Royal-12-L'Homme Noir.epub`
- `HOBB_ROBIN_L_ASSASSIN_ROYAL_5_LA_VOIE_MAGIQUE.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin Royal 5-La voie magique.epub`
- `HOBB_ROBIN_L_ASSASSIN_ROYAL_6_LA_REINE_SOLITAIRE.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin Royal-6-La reine solitaire.epub`
- `HOBB_ROBIN_L_ASSASSIN_ROYAL_7_LE_PROPHETE_BLANC.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin Royal-7-Le prophète blanc.epub`
- `HOBB_ROBIN_L_ASSASSIN_ROYAL_8_LA_SECTE_MAUDITE.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin Royal-8-La secte maudite.epub`
- `HOBB_ROBIN_L_ASSASSIN_ROYAL_9_LES_SECRETS_DE_CASTELCERF.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'Assassin Royal-9-Les secrets de Castelcerf.epub`
- `IRIS_BREY_LE_REGARD_FEMININ_UNE_REVOLUTION_A_L_ECRAN.epub`
  → `Books/B/Iris Brey/Iris Brey - Le Regard féminin. Une révolution à l'écran.epub`
- `IRIS_BREY_SEX_AND_THE_SERIES.epub`
  → `Books/B/Iris Brey/Iris Brey - Sex and the Series.epub`
- `JEAN_LUC_LAGARCE_JUSTE_LA_FIN_DU_MONDE.epub`
  → `Books/L/Jean-Luc Lagarce/Jean-Luc Lagarce - Juste la fin du monde.epub`
- `JEAN_MARC_LIGNY_ECOWARRIORS.epub`
  → `Books/L/Jean-Marc Ligny/Jean-Marc Ligny - Ecowarriors.epub`
- `JEAN_MARC_LIGNY_JIHAD.epub`
  → `Books/L/Jean-Marc Ligny/Jean-Marc Ligny - Jihad.epub`
- `JEAN_YVES_JOUANNAIS_UNE_FORET.epub`
  → `Books/J/Jean-Yves Jouannais/Jean-Yves Jouannais - Une forêt.epub`
- `JOHN_GWYNNE_FUREUR.epub`
  → `Books/G/John Gwynne/John Gwynne - Fureur.epub`
- `JOHN_SCALZI_L_EFFONDREMENT_DE_L_EMPIRE.epub`
  → `Books/S/John Scalzi/John Scalzi - L'effondrement de l'empire.epub`
- `JOHN_SCALZI_LA_DERNIERE_EMPEROX.epub`
  → `Books/S/John Scalzi/John Scalzi - La Dernière Emperox.epub`
- `JOHN_SCALZI_LES_FLAMMES_DE_L_EMPIRE_L_INTERDEPENDANCE_T2.epub`
  → `Books/S/John Scalzi/John Scalzi - Les Flammes de l'empire L'Interdépendance T2.epub`
- `La.Faille.2023.Franck.Thilliez.epub`
  → `Books/T/Franck Thilliez/Franck Thilliez - La Faille.epub`
- `LOUISE_CHENNEVIERE_FAIRE_LA_PEAU.epub`
  → `Books/C/Louise Chennevière/Louise Chennevière - Faire la peau.epub`
- `MARIE_NDIAYE_ROYAN.epub`
  → `Books/N/Marie NDiaye/Marie NDiaye - Royan.epub`
- `MARION_BRUNET_NE_CHERCHE_PAS_LE_CHAOS.epub`
  → `Books/B/Marion Brunet/Marion Brunet - Ne cherche pas le chaos.epub`
- `MELOIS_CLEMENTINE_CHOSES_QUE_JE_CROYAIS_PERDUES.epub`
  → `Books/M/Clémentine Mélois/Clémentine Mélois - Choses que je croyais perdues.epub`
- `MOUAWAD_WAJDI_INCENDIES.epub`
  → `Books/M/Wajdi Mouawad/Wajdi Mouawad - Incendies.epub`
- `NEWLANDS_TOM_ICI_MAINTENANT.epub`
  → `Books/N/Tom Newlands/Tom Newlands - Ici, maintenant.epub`
- `NINA_BOURAOUI_CHAMPIONNE.epub`
  → `Books/B/Nina Bouraoui/Nina Bouraoui - Championne.epub`
- `NIVEN_LARRY_LES_INGENIEURS_DE_L_ANNEAU_MONDE.epub`
  → `Books/L/Niven Larry/Niven Larry - Les Ingénieurs de l'Anneau-Monde.epub`
- `OLIVIER_NOREK_DET_VICTOR_COSTE_T01_CODE_93.epub`
  → `Books/N/Olivier Norek/Olivier Norek - det_VICTOR COSTE - T01 - Code 93.epub`
- `OLIVIER_ROLIN_LA_GUERRE_ETERNELLE.epub`
  → `Books/R/Olivier Rolin/Olivier Rolin - La guerre éternelle.epub`
- `PATRICE_JEAN_STAY_FREE.epub`
  → `Books/J/Patrice Jean/Patrice Jean - Stay free.epub`
- `PHILIPPE_JAENADA_L_INCONNUE_DU_QUAI_DE_JAVEL.epub`
  → `Books/J/Philippe Jaenada/Philippe Jaenada - L'Inconnue du quai de Javel.epub`
- `PRUDHOMME_SYLVAIN_DE_L_AUTRE_COTE_DU_LAC.epub`
  → `Books/P/Sylvain Prudhomme/Sylvain Prudhomme - De l'autre côté du lac.epub`
- `RICHARD_POWERS_UN_JEU_SANS_FIN.epub`
  → `Books/P/Richard Powers/Richard Powers - Un jeu sans fin.epub`
- `ROBERT_MCCAMMON_L_HEURE_DU_LOUP_VOLUME_DEUX.epub`
  → `Books/M/Robert McCammon/Robert McCammon - L'Heure du loup, volume deux.epub`
- `ROBERT_MCCAMMON_L_HEURE_DU_LOUP_VOLUME_UN.epub`
  → `Books/M/Robert McCammon/Robert McCammon - L'Heure du loup, volume un.epub`
- `ROBIN_HOBB_L_ASSASSIN_ROYAL_001_L_APPRENTI_ASSASSIN.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'assassin royal [001] – L'apprenti assassin.epub`
- `ROBIN_HOBB_L_ASSASSIN_ROYAL_002_L_ASSASSIN_DU_ROI.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'assassin royal [002] – L'assassin du roi.epub`
- `ROBIN_HOBB_L_ASSASSIN_ROYAL_003_LA_NEF_DU_CREPUSCULE.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'assassin royal [003] – La nef du crépuscule.epub`
- `ROBIN_HOBB_L_ASSASSIN_ROYAL_004_LE_POISON_DE_LA_VENGEANCE.epub`
  → `Books/H/Robin Hobb/Robin Hobb - L'assassin royal [004] – Le poison de la vengeance.epub`
- `STEVEN_ERIKSON_LA_MAISON_DES_CHAINES.epub`
  → `Books/E/Steven Erikson/Steven Erikson - La Maison des Chaînes.epub`
- `STEVEN_ERIKSON_LE_LIVRE_DES_MARTYRS_06_LES_OSSELEURS.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Le Livre Des Martyrs 06 - Les Osseleurs.epub`
- `STEVEN_ERIKSON_LE_LIVRE_DES_MARTYRS_T10_LE_DIEU_ESTROPIE.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Le Livre des Martyrs T10 Le dieu estropié.epub`
- `STEVEN_ERIKSON_LE_LIVRE_DES_MARTYRS_T7_LE_SOUFFLE_DU_MOISSONNEUR.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Le Livre des Martyrs T7 Le Souffle du Moissonneur.epub`
- `STEVEN_ERIKSON_LE_LIVRE_DES_MARTYRS_T8_LA_RANCON_DES_MOLOSSES.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Le Livre des Martyrs T8 La Rançon des Molosses.epub`
- `STEVEN_ERIKSON_LE_LIVRE_DES_MARTYRS_T9_LA_POUSSIERE_DES_REVES.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Le Livre des Martyrs T9 La Poussière des Rêves.epub`
- `STEVEN_ERIKSON_LES_JARDINS_DE_LA_LUNE.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Les Jardins de la Lune.epub`
- `STEVEN_ERIKSON_LES_MAREES_DE_MINUIT.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Les Marées de Minuit.epub`
- `STEVEN_ERIKSON_LES_PORTES_DE_LA_MAISON_DES_MORTS_NOUVELLE_TRADUCTION.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Les portes de la maison des morts (nouvelle traduction).epub`
- `STEVEN_ERIKSON_LES_SOUVENIRS_DE_LA_GLACE.epub`
  → `Books/E/Steven Erikson/Steven Erikson - Les Souvenirs de la Glace.epub`
- `THELYSON_ORELIEN_C_ETAIT_CA_OU_MOURIR.epub`
  → `Books/O/Thélyson Orélien/Thélyson Orélien - C'était ça ou mourir.epub`
- `THIERRY_FREMAUX_SELECTION_OFFICIELLE.epub`
  → `Books/F/Thierry Frémaux/Thierry Frémaux - Sélection officielle.epub`
- `TONI_MORRISON_L_IL_LE_PLUS_BLEU.epub`
  → `Books/M/Toni Morrison/Toni Morrison - L'Œil le plus bleu.epub`
- `TR_XE9_VIDIC_MARC_HUITI_XE8_ME_SECTION.epub`
  → `Books/T/Marc Trévidic/Marc Trévidic - Huitième section.epub`
- `Traite sur l intolerance.epub`
  → `Books/M/Richard Malka/Richard Malka - Traité sur l’intolérance.epub`
- `YANNICK_HAENEL_LA_SOLITUDE_DES_PROFESSEURS_EST_INFINIE.epub`
  → `Books/H/Yannick Haenel/Yannick Haenel - La solitude des professeurs est infinie.epub`

## Illisibles (non déplacés)

- `Books/I/Nemirovsky Irene/IRENE_NEMIROVSKY__LE_BAL.epub` : Invalid EPUB "/mnt/c/Users/Nam/lib/books/Books/I/Nemirovsky Irene/IRENE_NEMIROVSKY__LE_BAL.epub": not a readable zip (invalid relative path: OPS/../cover.jpg)
