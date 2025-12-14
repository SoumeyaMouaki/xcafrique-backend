require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Article = require('../models/Article');
const Category = require('../models/Category');
const User = require('../models/User');
const Contact = require('../models/Contact');

/**
 * Script pour peupler la base de données avec des données fictives
 * Utile pour tester l'API
 * 
 * Usage: node scripts/seedData.js
 */

async function seedData() {
  try {
    // Connexion à la base de données
    await connectDB();
    
    // Attendre un peu pour s'assurer que la connexion est bien établie
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🌱 Début du peuplement de la base de données...');

    // Nettoyer les collections existantes (optionnel)
    await Article.deleteMany({});
    await Category.deleteMany({});
    await Contact.deleteMany({});
    console.log('✅ Collections nettoyées');

    // Créer un utilisateur admin par défaut
    const existingAdmin = await User.findOne({ email: 'admin@xcafrique.com' });
    if (!existingAdmin) {
      const admin = await User.create({
        username: 'admin',
        email: 'admin@xcafrique.com',
        password: 'admin123', // Sera automatiquement hashé
        role: 'admin'
      });
      console.log('✅ Admin créé:', admin.email);
    } else {
      console.log('ℹ️  Admin existe déjà');
    }

    // Créer des catégories (une par une pour que les hooks pre-save fonctionnent et génèrent les slugs)
    const categoryData = [
      {
        name: 'Actualités Aéronautiques',
        description: 'Les dernières actualités du secteur aéronautique en Afrique',
        color: '#007bff'
      },
      {
        name: 'Sécurité Aérienne',
        description: 'Articles sur la sécurité et la sûreté aérienne',
        color: '#dc3545'
      },
      {
        name: 'Réglementation',
        description: 'Informations sur la réglementation aéronautique',
        color: '#28a745'
      },
      {
        name: 'Technologie',
        description: 'Innovations technologiques dans l\'aviation',
        color: '#ffc107'
      },
      {
        name: 'Formation',
        description: 'Articles sur la formation et les métiers de l\'aviation',
        color: '#17a2b8'
      }
    ];

    // Créer les catégories une par une pour que les slugs soient générés
    const categories = [];
    for (const catData of categoryData) {
      const category = await Category.create(catData);
      categories.push(category);
    }
    console.log(`✅ ${categories.length} catégories créées`);

    // Créer des articles
    const articles = [
      {
        title: 'L\'aviation africaine en pleine croissance',
        content: 'L\'industrie aéronautique africaine connaît une croissance remarquable ces dernières années. Avec l\'augmentation du trafic passagers et l\'expansion des compagnies aériennes locales, le continent se positionne comme un acteur majeur du transport aérien mondial. Les investissements dans les infrastructures aéroportuaires et la modernisation des flottes témoignent de cette dynamique positive.',
        excerpt: 'L\'industrie aéronautique africaine connaît une croissance remarquable avec l\'augmentation du trafic et l\'expansion des compagnies aériennes.',
        category: categories[0]._id,
        author: 'Admin XC Afrique',
        tags: ['aviation', 'afrique', 'croissance'],
        status: 'published',
        views: 150
      },
      {
        title: 'Nouvelles normes de sécurité pour les vols régionaux',
        content: 'Les autorités aéronautiques africaines ont annoncé de nouvelles normes de sécurité pour les vols régionaux. Ces mesures visent à renforcer la sûreté des opérations aériennes et à harmoniser les standards à travers le continent. Les compagnies aériennes ont jusqu\'à la fin de l\'année pour se conformer à ces nouvelles exigences.',
        excerpt: 'Nouvelles normes de sécurité annoncées pour harmoniser les standards aériens en Afrique.',
        category: categories[1]._id,
        author: 'Admin XC Afrique',
        tags: ['sécurité', 'normes', 'réglementation'],
        status: 'published',
        views: 89
      },
      {
        title: 'Réforme de la réglementation aéronautique en Afrique de l\'Ouest',
        content: 'Une réforme majeure de la réglementation aéronautique est en cours dans les pays d\'Afrique de l\'Ouest. Cette initiative vise à créer un espace aérien unifié et à faciliter les opérations transfrontalières. Les experts estiment que cette réforme pourrait stimuler significativement le trafic aérien dans la région.',
        excerpt: 'Réforme en cours pour créer un espace aérien unifié en Afrique de l\'Ouest.',
        category: categories[2]._id,
        author: 'Admin XC Afrique',
        tags: ['réglementation', 'afrique de l\'ouest', 'réforme'],
        status: 'published',
        views: 67
      },
      {
        title: 'L\'intelligence artificielle dans la gestion du trafic aérien',
        content: 'Les systèmes de gestion du trafic aérien intègrent de plus en plus l\'intelligence artificielle pour optimiser les opérations. En Afrique, plusieurs aéroports majeurs testent ces nouvelles technologies qui permettent de réduire les délais, d\'améliorer la sécurité et de diminuer la consommation de carburant.',
        excerpt: 'L\'IA révolutionne la gestion du trafic aérien avec des bénéfices significatifs.',
        category: categories[3]._id,
        author: 'Admin XC Afrique',
        tags: ['technologie', 'IA', 'trafic aérien'],
        status: 'published',
        views: 120
      },
      {
        title: 'Formation des pilotes : nouveaux programmes en Afrique',
        content: 'Plusieurs écoles de pilotage africaines lancent de nouveaux programmes de formation pour répondre à la demande croissante de pilotes. Ces programmes intègrent les dernières technologies de simulation et suivent les standards internationaux. L\'objectif est de former une nouvelle génération de professionnels compétitifs sur le marché mondial.',
        excerpt: 'Nouveaux programmes de formation pour répondre à la demande croissante de pilotes.',
        category: categories[4]._id,
        author: 'Admin XC Afrique',
        tags: ['formation', 'pilotes', 'écoles'],
        status: 'published',
        views: 95
      },
      {
        title: 'Développement des aéroports secondaires en Afrique',
        content: 'Les gouvernements africains investissent massivement dans le développement des aéroports secondaires pour désenclaver les régions et stimuler le tourisme intérieur. Ces projets d\'infrastructure représentent des opportunités majeures pour les opérateurs aéroportuaires et les compagnies aériennes régionales.',
        excerpt: 'Investissements massifs dans les aéroports secondaires pour désenclaver les régions.',
        category: categories[0]._id,
        author: 'Admin XC Afrique',
        tags: ['infrastructure', 'aéroports', 'développement'],
        status: 'draft',
        views: 0
      }
    ];

    // Créer les articles une par une pour que les slugs soient générés
    const createdArticles = [];
    for (const articleData of articles) {
      const article = await Article.create(articleData);
      createdArticles.push(article);
    }
    console.log(`✅ ${createdArticles.length} articles créés`);

    // Créer des messages de contact fictifs
    const contactData = [
      {
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        subject: 'Question sur la réglementation',
        message: 'Bonjour, j\'aimerais obtenir des informations sur les nouvelles normes de sécurité pour les vols régionaux. Merci.',
        phone: '+221 77 123 45 67',
        status: 'new'
      },
      {
        name: 'Marie Konaté',
        email: 'marie.konate@example.com',
        subject: 'Demande de partenariat',
        message: 'Nous sommes une école de pilotage et souhaiterions établir un partenariat avec votre média. Serait-il possible d\'en discuter ?',
        phone: '+225 07 12 34 56 78',
        status: 'read'
      },
      {
        name: 'Amadou Diallo',
        email: 'amadou.diallo@example.com',
        subject: 'Information sur les formations',
        message: 'Je souhaite devenir pilote. Pourriez-vous me renseigner sur les meilleures écoles de formation en Afrique de l\'Ouest ?',
        status: 'replied',
        repliedAt: new Date()
      }
    ];

    // Créer les contacts un par un
    const contacts = [];
    for (const contactItem of contactData) {
      const contact = await Contact.create(contactItem);
      contacts.push(contact);
    }
    console.log(`✅ ${contacts.length} messages de contact créés`);

    console.log('\n🎉 Peuplement de la base de données terminé avec succès !');
    console.log('\n📝 Identifiants de connexion admin:');
    console.log('   Email: admin@xcafrique.com');
    console.log('   Mot de passe: admin123');
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion !\n');

    // Fermer la connexion à la base de données
    await mongoose.connection.close();
    console.log('✅ Connexion à la base de données fermée');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    // Fermer la connexion en cas d'erreur
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Exécuter le script
seedData();

