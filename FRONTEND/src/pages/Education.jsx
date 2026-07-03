// =============================================================
// src/pages/Education.jsx — Espace interactif de guides écologiques
// Design: Grille de guides + accordion + quiz interactif
// =============================================================
import React, { useState } from 'react'

// Guides écologiques détaillés pour Kinshasa
const GUIDES = [
  {
    id: 1,
    icon: 'bi-recycle',
    color: '#27ae60',
    categorie: 'Déchets',
    titre: 'Tri et Gestion des Plastiques',
    resume: 'Kinshasa génère 1 500 tonnes de déchets par jour. Seulement 30% sont collectés. Voici comment chaque foyer peut contribuer.',
    contenu: [
      { sous: 'Pourquoi trier ?', texte: 'Le plastique met 500 ans à se dégrader. En le triant, on réduit la pollution des rivières N\'Djili, Funa et Kalamu.' },
      { sous: 'Les 3 bacs à Kinshasa', texte: '🟢 Bac VERT: Plastiques, verre, carton. 🟤 Bac MARRON: Déchets organiques (épluchures). ⚫ Bac NOIR: Déchets ménagers mixtes.' },
      { sous: 'Points de collecte', texte: 'Des points de collecte OPE (Office de Propreté et Écologie) sont disponibles dans chaque commune. Vérifiez le calendrier des collectes dans votre quartier.' },
    ],
    badge: '5 min de lecture',
  },
  {
    id: 2,
    icon: 'bi-water',
    color: '#2980b9',
    categorie: 'Eau',
    titre: 'Protéger les Cours d\'Eau de Kinshasa',
    resume: 'Les rivières N\'Djili, Funa et Kalamu approvisionnent des millions de Kinois. Leur protection est vitale.',
    contenu: [
      { sous: 'Les menaces principales', texte: 'Le déversement d\'huiles usagées, de détergents et de déchets solides dans les rivières contamine l\'eau potable de 90% des habitants de Kinshasa.' },
      { sous: 'Gestes quotidiens', texte: '✅ Ne jamais jeter de déchets dans les caniveaux. ✅ Utiliser des détergents biodégradables. ✅ Porter vos huiles de vidange aux points de collecte spécialisés.' },
      { sous: 'Signaler une pollution', texte: 'Si vous observez une pollution visible d\'un cours d\'eau, signalez-la immédiatement sur la plateforme EcoRDC avec des photos géolocalisées.' },
    ],
    badge: '8 min de lecture',
  },
  {
    id: 3,
    icon: 'bi-tree-fill',
    color: '#16a085',
    categorie: 'Érosion',
    titre: 'Lutter contre l\'Érosion des Collines',
    resume: 'L\'érosion menace des dizaines de milliers de foyers à Kinshasa, notamment à Ngaliema, Mont-Ngafula et Ngaba.',
    contenu: [
      { sous: 'Comprendre l\'érosion kinoise', texte: 'Le sol latéritique de Kinshasa est très vulnérable à l\'érosion hydrique. Combiné aux pluies tropicales intenses (1 400 mm/an), il crée des ravines dévastatrices.' },
      { sous: 'Solution: Le reboisement', texte: 'Planter des vétiver, des bambous et des arbres fruitiers sur les flancs de collines crée un système racinaire qui retient le sol. L\'INERA distribue des plants gratuits.' },
      { sous: 'Signaler une ravine', texte: 'Une petite ravine peut devenir catastrophique en une saison des pluies. Signalez immédiatement toute nouvelle érosion pour une intervention rapide.' },
    ],
    badge: '6 min de lecture',
  },
  {
    id: 4,
    icon: 'bi-fire',
    color: '#e74c3c',
    categorie: 'Air',
    titre: 'Stop au Brûlage des Déchets',
    resume: 'Le brûlage à ciel ouvert de plastiques est une pratique répandue à Kinshasa mais extrêmement dangereuse pour la santé.',
    contenu: [
      { sous: 'Les dangers du brûlage', texte: 'Brûler des sacs plastiques libère des dioxines et furanes, des agents cancérigènes 100 fois plus toxiques que la fumée de cigarette.' },
      { sous: 'Alternatives légales', texte: '✅ Déposez vos déchets aux bacs de collecte. ✅ Compostez vos déchets organiques. ✅ Vendez vos plastiques aux centres de recyclage (ex: Kin Recyclage à Gombe).' },
      { sous: 'Que faire si vous voyez un brûlage ?', texte: 'Signalez-le sur EcoRDC. Nos agents peuvent intervenir sous 2 heures dans les zones urbaines denses.' },
    ],
    badge: '4 min de lecture',
  },
  {
    id: 5,
    icon: 'bi-sun-fill',
    color: '#f39c12',
    categorie: 'Énergie',
    titre: 'Économiser l\'Énergie au Quotidien',
    resume: 'Avec les délestages fréquents à Kinshasa, adopter des habitudes d\'économie d\'énergie protège l\'environnement et votre budget.',
    contenu: [
      { sous: 'Éclairage LED', texte: 'Remplacer vos ampoules classiques par des LED réduit votre consommation de 80%. Un foyer kinois peut économiser 30$ par an.' },
      { sous: 'Cuisson efficace', texte: 'Utiliser des marmites autocuiseurs et des réchauds améliorés réduit la consommation de charbon de bois de 50%, préservant ainsi les forêts du Bas-Congo.' },
      { sous: 'Énergie solaire', texte: 'Les panneaux solaires sont de plus en plus accessibles à Kinshasa. Des kits de 100W permettent d\'alimenter lampes, téléphones et petits appareils pour moins de 200$.' },
    ],
    badge: '7 min de lecture',
  },
  {
    id: 6,
    icon: 'bi-people-fill',
    color: '#8e44ad',
    categorie: 'Communauté',
    titre: 'Mobiliser son Quartier pour l\'Écologie',
    resume: 'Le changement commence dans votre quartier. Voici comment organiser des actions collectives à Kinshasa.',
    contenu: [
      { sous: 'Journées de nettoyage', texte: 'Organisez des "Samedis Verts" dans votre avenue. Contactez le chef de quartier pour coordonner avec l\'OPE. EcoRDC peut vous fournir des dossards et des sacs poubelles.' },
      { sous: 'Éducation des enfants', texte: 'Les enfants sont les meilleurs ambassadeurs. Organisez des ateliers dans les écoles primaires sur le tri des déchets et la protection des rivières.' },
      { sous: 'Groupes WhatsApp écologiques', texte: 'Créez un groupe WhatsApp "Éco-[Nom du quartier]" pour signaler les dépôts sauvages, organiser des collectes et partager les bonnes pratiques.' },
    ],
    badge: '10 min de lecture',
  },
]

// Quiz écologique de 20 questions
const QUIZ = [
  { q: 'Combien de tonnes de déchets Kinshasa produit-elle par jour ?', options: ['500 tonnes', '1 000 tonnes', '1 500 tonnes', '3 000 tonnes'], correct: 2, explication: 'Kinshasa génère environ 1 500 tonnes de déchets par jour, dont seulement 30% sont collectés.' },
  { q: 'Quelle plante est recommandée pour lutter contre l\'érosion à Kinshasa ?', options: ['Le maïs', 'Le vétiver', 'La patate douce', 'Le bananier'], correct: 1, explication: 'Le vétiver a un système racinaire profond (jusqu\'à 3m) qui retient efficacement le sol latéritique.' },
  { q: 'Quel pourcentage de l\'eau de Kinshasa est fourni par les rivières locales ?', options: ['30%', '50%', '70%', '90%'], correct: 3, explication: 'Environ 90% de l\'eau potable de Kinshasa provient de la rivière Congo et ses affluents.' },
  { q: 'Combien de temps met un sac plastique pour se dégrader dans la nature ?', options: ['5 ans', '50 ans', '100 ans', '400 ans et plus'], correct: 3, explication: 'Les plastiques peuvent mettre plus de 400 ans à se dégrader, polluant durablement nos sols.' },
  { q: 'Quel gaz est principalement responsable du réchauffement climatique dû aux activités humaines ?', options: ['Oxygène', 'Dioxyde de carbone (CO2)', 'Azote', 'Hélium'], correct: 1, explication: 'Le CO2, issu principalement de la combustion des énergies fossiles et de la déforestation, est le principal gaz à effet de serre.' },
  { q: 'Que signifie l\'acronyme OPE à Kinshasa ?', options: ['Organisation pour la Protection de l\'Eau', 'Office de Propreté et Écologie', 'Observatoire Provincial de l\'Environnement', 'Ordre des Professionnels de l\'Écologie'], correct: 1, explication: 'C\'est l\'Office de Propreté et Écologie, un acteur majeur de la gestion des déchets.' },
  { q: 'Quel est le meilleur moyen de se débarrasser des huiles de vidange usagées ?', options: ['Les verser dans les caniveaux', 'Les jeter dans le fleuve', 'Les déposer dans un centre spécialisé', 'Les enterrer dans le jardin'], correct: 2, explication: 'Les huiles usagées sont extrêmement polluantes, un seul litre peut polluer un million de litres d\'eau.' },
  { q: 'Quel pourcentage d\'énergie peut-on économiser en remplaçant ses ampoules par des LED ?', options: ['20%', '50%', '80%', '100%'], correct: 2, explication: 'Les ampoules LED consomment jusqu\'à 80% moins d\'électricité que les ampoules à incandescence.' },
  { q: 'Quelle est la principale cause de l\'érosion sévère à Kinshasa ?', options: ['Les tremblements de terre', 'Le déboisement et l\'urbanisation anarchique', 'Le vent', 'Les animaux sauvages'], correct: 1, explication: 'La construction sur des pentes non viabilisées sans végétation empêche le sol de retenir l\'eau des pluies.' },
  { q: 'Pourquoi ne faut-il jamais jeter les piles usagées à la poubelle ?', options: ['Elles peuvent exploser', 'Elles contiennent des métaux lourds très toxiques', 'Elles sentent mauvais', 'C\'est illégal'], correct: 1, explication: 'Les piles contiennent du plomb, du mercure et du cadmium qui contaminent gravement les sols et les nappes phréatiques.' },
  { q: 'Comment appelle-t-on le processus de recyclage naturel des déchets organiques ?', options: ['Le compostage', 'Le brûlage', 'L\'incinération', 'L\'oxydation'], correct: 0, explication: 'Le compostage transforme vos restes de nourriture en un engrais riche et gratuit pour les plantes.' },
  { q: 'Parmi ces rivières, laquelle n\'est pas située à Kinshasa ?', options: ['Funa', 'N\'Djili', 'Kalamu', 'Kasaï'], correct: 3, explication: 'Le Kasaï est une rivière majeure de la RDC, mais elle ne traverse pas la ville province de Kinshasa.' },
  { q: 'Dans nos maisons, quelle action permet de préserver fortement les forêts congolaises ?', options: ['Laisser la lumière allumée', 'Utiliser des réchauds améliorés (foyers écologiques)', 'Laver sa voiture tous les jours', 'Acheter des meubles en bois massif'], correct: 1, explication: 'Les réchauds améliorés divisent par deux la consommation de charbon de bois (makala), réduisant la pression sur les forêts.' },
  { q: 'Quelles substances toxiques sont libérées lors du brûlage sauvage des plastiques ?', options: ['De l\'oxygène pur', 'De la vitamine D', 'Des dioxines cancérigènes', 'Du sodium'], correct: 2, explication: 'Respirer la fumée de plastiques brûlés expose à des risques graves de cancer et de maladies respiratoires.' },
  { q: 'Quel arbre fruitier est souvent recommandé à Kinshasa pour retenir les sols ?', options: ['Le baobab', 'Le manguier', 'Le palmier à huile', 'Le pin'], correct: 1, explication: 'Le manguier possède des racines robustes et fournit en plus de la nourriture et de l\'ombre.' },
  { q: 'Quel type de déchet doit idéalement être placé dans le "Bac Vert" ?', options: ['Les restes de fufu', 'Les bouteilles en plastique et le verre', 'Les piles', 'La terre'], correct: 1, explication: 'Le bac vert est réservé aux déchets recyclables secs (plastique, verre, carton, papier).' },
  { q: 'Que faire en priorité si on observe un déversement industriel chimique dans une rivière ?', options: ['Essayer de le nettoyer avec ses mains', 'Le filmer pour TikTok sans rien dire', 'Le signaler immédiatement sur l\'application EcoRDC', 'Attendre qu\'il pleuve'], correct: 2, explication: 'Le signalement géolocalisé permet aux autorités d\'intervenir le plus rapidement possible.' },
  { q: 'Pourquoi est-il dangereux de jeter les ordures ménagères dans les caniveaux ?', options: ['Parce que les poissons les mangent', 'Cela obstrue l\'évacuation des eaux et provoque des inondations mortelles', 'Cela change la couleur de l\'eau', 'Ce n\'est pas dangereux'], correct: 1, explication: 'Les caniveaux bouchés sont la cause numéro 1 des inondations dévastatrices à Kinshasa lors des fortes pluies.' },
  { q: 'Quelle action est une bonne "alternative légale" au brûlage des déchets ?', options: ['Les enterrer près de la rivière', 'Les vendre à des centres de recyclage', 'Les jeter la nuit', 'Les brûler, mais petit à petit'], correct: 1, explication: 'Les bouteilles plastiques peuvent être vendues à des récupérateurs ou des entreprises de recyclage locales.' },
  { q: 'Quelle part de Kinshasa est concernée par des problèmes d\'érosion hydrique ?', options: ['Seulement la Gombe', 'Principalement les communes de collines (Ngaliema, Mont-Ngafula, Selembao)', 'Aucune', 'Toute la ville équitablement'], correct: 1, explication: 'Les communes accidentées au sol sableux-latéritique sont les plus vulnérables aux érosions (têtes d\'érosion).' }
]

const Education = () => {
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [categorieFiltre, setCategorieFiltre] = useState('Tout')
  const [quiz, setQuiz] = useState({ current: 0, score: 0, answered: null, finished: false })
  const [pdfLoading, setPdfLoading] = useState(false)

  const categories = ['Tout', ...new Set(GUIDES.map((g) => g.categorie))]

  const filteredGuides = categorieFiltre === 'Tout'
    ? GUIDES
    : GUIDES.filter((g) => g.categorie === categorieFiltre)

  const handleQuizAnswer = (idx) => {
    if (quiz.answered !== null) return
    const correct = idx === QUIZ[quiz.current].correct
    setQuiz((p) => ({
      ...p,
      answered: idx,
      score: correct ? p.score + 1 : p.score,
    }))
  }

  const handleNextQuiz = () => {
    if (quiz.current >= QUIZ.length - 1) {
      setQuiz((p) => ({ ...p, finished: true }))
    } else {
      setQuiz((p) => ({ ...p, current: p.current + 1, answered: null }))
    }
  }

  // Simulation du téléchargement PDF
  const handleDownloadPDF = () => {
    setPdfLoading(true)
    setTimeout(() => {
      setPdfLoading(false)
      // Simulation d'une action réussie sans ouvrir un vrai lien
      const link = document.createElement('a')
      link.href = '#'
      link.setAttribute('download', `EcoRDC_Guide_${selectedGuide.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, 1500)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ==================== EN-TÊTE HERO ==================== */}
      <div
        className="rounded-4 p-5 mb-5 text-center animate-fade-in glass-panel"
        style={{ background: 'var(--eco-accent-gradient)', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -150, right: -150 }}></div>
        <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', backdropFilter: 'blur(10px)' }}>
          <i className="bi bi-book-fill text-white" style={{ fontSize: '2.5rem' }}></i>
        </div>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '2rem', marginBottom: 12 }}>Centre d'Éducation Écologique</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontSize: '1.05rem' }}>
          Téléchargez nos guides pratiques en PDF et testez vos connaissances pour protéger Kinshasa.
        </p>
      </div>

      {/* ==================== FILTRES DE CATÉGORIES ==================== */}
      {!selectedGuide && (
        <div className="d-flex gap-2 mb-4 flex-wrap animate-fade-in-up">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorieFiltre(cat)}
              className="btn rounded-pill"
              style={{
                padding: '8px 24px',
                border: `1.5px solid ${categorieFiltre === cat ? 'var(--eco-accent)' : 'var(--eco-border)'}`,
                background: categorieFiltre === cat ? 'var(--eco-accent-gradient)' : 'var(--eco-bg-card)',
                color: categorieFiltre === cat ? '#fff' : 'var(--eco-text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                boxShadow: categorieFiltre === cat ? '0 4px 12px rgba(30, 92, 58, 0.2)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ==================== VUE DÉTAIL D'UN GUIDE ==================== */}
      {selectedGuide ? (
        <div className="animate-fade-in">
          <button
            onClick={() => setSelectedGuide(null)}
            className="btn btn-link p-0 mb-4 d-flex align-items-center gap-2"
            style={{ color: 'var(--eco-text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--eco-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-arrow-left"></i>
            </div>
            Retour aux guides
          </button>
          
          <div className="eco-card p-4 p-md-5">
            {/* En-tête de la fiche */}
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-4 mb-4">
              <div className="d-flex align-items-center gap-4">
                <div style={{ width: 72, height: 72, borderRadius: 20, background: `${selectedGuide.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: selectedGuide.color, border: `1.5px solid ${selectedGuide.color}25` }}>
                  <i className={`bi ${selectedGuide.icon}`}></i>
                </div>
                <div>
                  <span style={{ padding: '4px 12px', borderRadius: 99, background: `${selectedGuide.color}15`, color: selectedGuide.color, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedGuide.categorie}</span>
                  <h1 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--eco-text-primary)', margin: '8px 0 0' }}>{selectedGuide.titre}</h1>
                </div>
              </div>
              
              {/* Bouton Télécharger PDF */}
              <button 
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="btn-eco btn d-flex align-items-center gap-2" 
                style={{ background: selectedGuide.color, boxShadow: `0 4px 15px ${selectedGuide.color}40` }}
              >
                {pdfLoading ? (
                  <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Préparation...</>
                ) : (
                  <><i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '1.2rem' }}></i> Télécharger en PDF</>
                )}
              </button>
            </div>

            <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 32, maxWidth: 800 }}>{selectedGuide.resume}</p>
            
            <div className="d-flex flex-column gap-4">
              {selectedGuide.contenu.map((c, i) => (
                <div key={i} className="glass-panel" style={{ padding: '24px', borderRadius: 16, borderLeft: `6px solid ${selectedGuide.color}` }}>
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--eco-text-primary)', marginBottom: 12 }}>{c.sous}</h4>
                  <p style={{ color: 'var(--eco-text-secondary)', margin: 0, lineHeight: 1.8, fontSize: '0.95rem' }}>{c.texte}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ==================== À PROPOS DE LA PLATEFORME ==================== */}
          <div className="eco-card p-4 p-md-5 mb-5 animate-fade-in-up">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(39,174,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#27ae60' }}>
                <i className="bi bi-info-circle-fill"></i>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--eco-text-primary)', margin: 0 }}>À propos d'EcoRDC</h2>
            </div>
            <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 16 }}>
              EcoRDC est une plateforme d'intelligence citoyenne dédiée à la protection de l'environnement urbain à Kinshasa. 
              Notre mission est de connecter les éco-citoyens aux autorités compétentes pour résoudre rapidement les problèmes d'insalubrité, d'érosion et de pollution.
            </p>
            <p style={{ color: 'var(--eco-text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, margin: 0 }}>
              Grâce à cette section Éducation, vous pouvez vous informer sur les bonnes pratiques environnementales, apprendre à trier vos déchets, et participer activement à la construction d'une ville plus propre et durable. Lisez nos guides ou testez vos connaissances avec notre quiz interactif !
            </p>
          </div>

          {/* ==================== GRILLE DES GUIDES ==================== */}
          <div className="row g-4 mb-5">
            {filteredGuides.map((guide, i) => (
              <div key={guide.id} className={`col-md-6 col-lg-4 animate-fade-in-up delay-${(i % 3 + 1) * 100}`}>
                <div
                  className="eco-card h-100 p-4"
                  onClick={() => setSelectedGuide(guide)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                >
                  <div className="d-flex align-items-start gap-3 mb-4">
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: `${guide.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', color: guide.color, flexShrink: 0, border: `1px solid ${guide.color}30` }}>
                      <i className={`bi ${guide.icon}`}></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6, background: `${guide.color}15`, color: guide.color, fontWeight: 700, textTransform: 'uppercase' }}>{guide.categorie}</span>
                      <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--eco-text-primary)', margin: '6px 0 0', lineHeight: 1.4 }}>{guide.titre}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--eco-text-secondary)', lineHeight: 1.7, flexGrow: 1, margin: '0 0 20px' }}>{guide.resume}</p>
                  
                  <div className="d-flex align-items-center justify-content-between pt-3" style={{ borderTop: '1px solid var(--eco-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--eco-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-file-earmark-pdf" style={{ color: guide.color, fontSize: '1rem' }}></i> PDF Inclus
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--eco-text-primary)', fontWeight: 700, background: 'var(--eco-bg-primary)', padding: '6px 14px', borderRadius: 99 }}>
                      Lire <i className="bi bi-arrow-right ms-1"></i>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ==================== SECTION QUIZ (20 QUESTIONS) ==================== */}
          <div className="eco-card p-4 p-md-5 mb-5 animate-fade-in-up delay-400" style={{ borderTop: `4px solid var(--eco-accent)` }}>
            <div className="d-flex align-items-center gap-4 mb-4">
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(243,156,18,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🧠</div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--eco-text-primary)', margin: 0 }}>Quiz Écologique : Masterclass</h2>
                <p style={{ color: 'var(--eco-text-secondary)', margin: '4px 0 0', fontSize: '0.9rem' }}>Testez vos connaissances approfondies en {QUIZ.length} questions.</p>
              </div>
            </div>

            {quiz.finished ? (
              // Résultat final du quiz
              <div className="text-center py-5 animate-fade-in glass-panel" style={{ borderRadius: 24 }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>{quiz.score >= 18 ? '🏆' : quiz.score >= 10 ? '🥈' : '📚'}</div>
                <h3 style={{ fontWeight: 800, color: 'var(--eco-text-primary)', marginBottom: 8, fontSize: '2rem' }}>
                  Score Final : {quiz.score} / {QUIZ.length}
                </h3>
                <p style={{ color: 'var(--eco-text-secondary)', marginBottom: 32, fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 32px' }}>
                  {quiz.score >= 18 ? 'Exceptionnel ! Vous êtes un véritable expert de la protection environnementale à Kinshasa.' : 
                   quiz.score >= 10 ? 'Bon niveau ! Vous connaissez bien les enjeux, mais quelques révisions de nos guides PDF vous rendront imbattable.' : 
                   'Il est temps de télécharger et de lire attentivement nos guides pour maîtriser les enjeux écologiques de votre ville.'}
                </p>
                <button
                  onClick={() => setQuiz({ current: 0, score: 0, answered: null, finished: false })}
                  className="btn-eco btn rounded-pill px-5"
                >
                  <i className="bi bi-arrow-clockwise me-2"></i> Refaire le Quiz
                </button>
              </div>
            ) : (
              <div className="glass-panel p-4" style={{ borderRadius: 20 }}>
                {/* Barre de progression du quiz */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ fontSize: '0.85rem', color: 'var(--eco-accent)', fontWeight: 800 }}>
                      Question {quiz.current + 1} sur {QUIZ.length}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--eco-text-secondary)', fontWeight: 700 }}>
                      Score : {quiz.score}
                    </span>
                  </div>
                  <div className="eco-progress">
                    <div className="eco-progress-bar" style={{ width: `${((quiz.current) / QUIZ.length) * 100}%` }}></div>
                  </div>
                </div>

                {/* Question */}
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--eco-text-primary)', marginBottom: 24, lineHeight: 1.5 }}>
                  {QUIZ[quiz.current].q}
                </h3>

                {/* Options de réponse */}
                <div className="row g-3 mb-4">
                  {QUIZ[quiz.current].options.map((opt, idx) => {
                    let bg = 'var(--eco-bg-card)', border = 'var(--eco-border)', color = 'var(--eco-text-primary)'
                    if (quiz.answered !== null) {
                      if (idx === QUIZ[quiz.current].correct) { bg = 'rgba(39,174,96,0.1)'; border = '#27ae60'; color = '#27ae60' }
                      else if (idx === quiz.answered) { bg = 'rgba(231,76,60,0.1)'; border = '#e74c3c'; color = '#e74c3c' }
                    }
                    return (
                      <div className="col-md-6" key={idx}>
                        <button
                          onClick={() => handleQuizAnswer(idx)}
                          disabled={quiz.answered !== null}
                          className="text-start btn w-100 d-flex align-items-center gap-3"
                          style={{ 
                            background: bg, border: `2px solid ${border}`, color, 
                            padding: '16px', borderRadius: 16, fontWeight: 600, fontSize: '0.95rem', 
                            transition: 'all 0.2s ease', height: '100%' 
                          }}
                        >
                          <span style={{ 
                            width: 32, height: 32, borderRadius: '50%', border: `2px solid ${border}`, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: '0.9rem', flexShrink: 0, fontWeight: 800, background: quiz.answered !== null && idx === QUIZ[quiz.current].correct ? '#27ae60' : (quiz.answered !== null && idx === quiz.answered ? '#e74c3c' : 'transparent'), color: quiz.answered !== null && (idx === QUIZ[quiz.current].correct || idx === quiz.answered) ? '#fff' : color
                          }}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span style={{ flex: 1 }}>{opt}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Explication après réponse */}
                {quiz.answered !== null && (
                  <div className="p-4 rounded-4 mb-4 animate-fade-in" style={{ background: 'rgba(45,122,78,0.08)', border: '1px solid rgba(45,122,78,0.2)' }}>
                    <div style={{ fontSize: '0.95rem', color: 'var(--eco-text-secondary)', lineHeight: 1.7 }}>
                      <div style={{ fontWeight: 800, color: 'var(--eco-accent)', marginBottom: 8, fontSize: '1rem' }}><i className="bi bi-lightbulb-fill me-2"></i>Explication :</div>
                      {QUIZ[quiz.current].explication}
                    </div>
                  </div>
                )}

                {/* Bouton suivant */}
                {quiz.answered !== null && (
                  <div className="text-end mt-4 pt-4" style={{ borderTop: '1px solid var(--eco-border)' }}>
                    <button onClick={handleNextQuiz} className="btn-eco btn rounded-pill px-5">
                      {quiz.current >= QUIZ.length - 1 ? 'Voir mon Score Final' : 'Question suivante'} <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Education
