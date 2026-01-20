require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Script pour transformer les articles drafts dans la bonne structure
 * 
 * Usage: node scripts/transformDraftArticles.js
 * 
 * Transforme tous les fichiers JSON dans Prod/articles/drafts
 * selon la structure complète d'un Article
 */

// Mapping des catégories string vers slug
const categoryMapping = {
  'finance': 'finance',
  'connectivite': 'connectivite',
  'actualites-aeronautiques': 'actualites-aeronautiques',
  'securite': 'securite',
  'technologie': 'technologie',
  'reglementation': 'reglementation'
};

/**
 * Nettoie l'excerpt en enlevant le markdown et limitant à 500 caractères
 */
function cleanExcerpt(excerpt) {
  if (!excerpt) return '';
  
  // Enlever le markdown (titres, gras, etc.)
  let cleaned = excerpt
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Enlever **gras**
    .replace(/\*([^*]+)\*/g, '$1') // Enlever *italique*
    .replace(/#{1,6}\s+/g, '') // Enlever les titres markdown
    .replace(/\n+/g, ' ') // Remplacer les sauts de ligne par des espaces
    .trim();
  
  // Limiter à 500 caractères
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 497) + '...';
  }
  
  return cleaned;
}

/**
 * Génère un slug à partir du titre
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Transforme un article draft en structure complète
 */
function transformArticle(originalArticle) {
  const transformed = {
    title: originalArticle.title || '',
    slug: generateSlug(originalArticle.title),
    content: originalArticle.content || '',
    excerpt: cleanExcerpt(originalArticle.excerpt),
    category: originalArticle.category || 'actualites-aeronautiques', // Sera remplacé par ObjectId plus tard
    author: originalArticle.author || 'Admin XC Afrique',
    featuredImage: originalArticle.featuredImage || '',
    videoUrl: originalArticle.videoUrl || '',
    tags: originalArticle.tags || [],
    status: 'draft', // Toujours draft comme demandé
    views: 0,
    publishedAt: null // null car status = draft
  };
  
  // Nettoyer les tags (enlever les doublons, trim)
  if (Array.isArray(transformed.tags)) {
    transformed.tags = transformed.tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .filter((tag, index, self) => self.indexOf(tag) === index); // Enlever les doublons
  } else {
    transformed.tags = [];
  }
  
  return transformed;
}

/**
 * Traite tous les fichiers JSON dans le dossier drafts
 */
async function transformAllArticles() {
  const draftsDir = path.join(__dirname, '..', 'Prod', 'articles', 'drafts');
  
  if (!fs.existsSync(draftsDir)) {
    console.error('❌ Dossier non trouvé:', draftsDir);
    process.exit(1);
  }
  
  console.log('📝 Transformation des articles drafts...\n');
  console.log(`📁 Dossier: ${draftsDir}\n`);
  
  // Lire tous les fichiers JSON
  const files = fs.readdirSync(draftsDir)
    .filter(file => file.endsWith('.json'))
    .sort();
  
  if (files.length === 0) {
    console.log('⚠️  Aucun fichier JSON trouvé dans le dossier drafts');
    process.exit(0);
  }
  
  console.log(`📄 ${files.length} fichier(s) trouvé(s)\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Traiter chaque fichier
  for (const file of files) {
    try {
      const filePath = path.join(draftsDir, file);
      
      // Lire le fichier original
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const originalArticle = JSON.parse(fileContent);
      
      // Transformer l'article
      const transformedArticle = transformArticle(originalArticle);
      
      // Sauvegarder le fichier transformé (écrase l'original)
      fs.writeFileSync(
        filePath,
        JSON.stringify(transformedArticle, null, 2),
        'utf8'
      );
      
      console.log(`✅ ${file}`);
      console.log(`   Titre: ${transformedArticle.title.substring(0, 60)}...`);
      console.log(`   Slug: ${transformedArticle.slug}`);
      console.log(`   Catégorie: ${transformedArticle.category}`);
      console.log(`   Tags: ${transformedArticle.tags.length}`);
      console.log(`   Status: ${transformedArticle.status}\n`);
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ Erreur avec ${file}:`, error.message);
      errors.push({ file, error: error.message });
      errorCount++;
    }
  }
  
  // Résumé
  console.log('='.repeat(50));
  console.log('📊 Résumé de la transformation');
  console.log('='.repeat(50));
  console.log(`✅ Réussis: ${successCount}`);
  console.log(`❌ Échoués: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Erreurs détaillées:');
    errors.forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`);
    });
  }
  
  console.log('\n💡 Note: Les articles sont en status "draft"');
  console.log('💡 La catégorie est en string, elle sera convertie en ObjectId lors de l\'import dans MongoDB');
  console.log('\n✅ Transformation terminée !');
}

// Exécuter le script
transformAllArticles().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

