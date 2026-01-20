require('dotenv').config();
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');

async function checkArticleDetails(slug) {
  try {
    await connectDB();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const article = await Article.findOne({ slug })
      .populate('category', 'name slug color');
    
    if (!article) {
      console.log('❌ Article non trouvé');
      process.exit(1);
    }
    
    console.log('📄 Détails de l\'article:\n');
    console.log(`Titre: ${article.title}`);
    console.log(`Slug: ${article.slug}`);
    console.log(`\n📝 Contenu (premiers 200 caractères):`);
    console.log(article.content.substring(0, 200) + '...\n');
    
    console.log(`📚 Sources (${article.sources?.length || 0}):`);
    if (article.sources && article.sources.length > 0) {
      article.sources.forEach((source, index) => {
        console.log(`\n  ${index + 1}. ${source.title || 'Sans titre'}`);
        if (source.url) console.log(`     URL: ${source.url}`);
        if (source.author) console.log(`     Auteur: ${source.author}`);
        if (source.date) console.log(`     Date: ${source.date}`);
        if (source.type) console.log(`     Type: ${source.type}`);
      });
    } else {
      console.log('  ❌ Aucune source trouvée');
    }
    
    console.log(`\n🏷️  Tags: ${article.tags.join(', ')}`);
    console.log(`\n📅 Modifié le: ${new Date(article.updatedAt).toLocaleString('fr-FR')}`);
    
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

const slug = process.argv[2] || 'brussels-airlines-valorise-la-richesse-culinaire-africaine-a-bord-de-ses-vols-long-courriers-vers-bruxelles-des-2026';
checkArticleDetails(slug);

