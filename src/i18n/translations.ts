export type Language = 'en' | 'fr';

export interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

export const translations: Translations = {
  // Brand & Header
  'app.name': {
    en: 'JIPAS',
    fr: 'JIPAS'
  },
  'app.subtitle': {
    en: 'School Management System • Est. 1990',
    fr: 'Système de Gestion Scolaire • Fondé en 1990'
  },
  'app.motto': {
    en: 'Education is Wealth',
    fr: "L'Éducation est une Richesse"
  },
  'app.dbSynced': {
    en: 'Firestore Synced',
    fr: 'Firestore Synchronisé'
  },
  'app.role': {
    en: 'Role',
    fr: 'Rôle'
  },
  'app.role.admin': {
    en: 'Admin',
    fr: 'Administrateur'
  },
  'app.role.sub_admin': {
    en: 'Sub-Admin',
    fr: 'Sous-Administrateur'
  },
  'app.role.clerk': {
    en: 'Clerk / Officer',
    fr: 'Commis / Agent'
  },
  'app.role.teacher': {
    en: 'Teacher',
    fr: 'Enseignant'
  },
  'app.role.accountant': {
    en: 'Accountant',
    fr: 'Comptable'
  },
  'app.role.student': {
    en: 'Student / Parent',
    fr: 'Élève / Parent'
  },
  'app.logout': {
    en: 'Logout',
    fr: 'Déconnexion'
  },
  'app.language': {
    en: 'Language',
    fr: 'Langue'
  },
  'app.language.en': {
    en: 'English',
    fr: 'Anglais'
  },
  'app.language.fr': {
    en: 'French',
    fr: 'Français'
  },

  // Admin Dashboard Cards
  'dashboard.totalEnrolled': {
    en: 'Total Enrolled',
    fr: 'Total Inscrits'
  },
  'dashboard.activeStudents': {
    en: 'Active Students',
    fr: 'Élèves Actifs'
  },
  'dashboard.pendingPayments': {
    en: 'Pending Payments',
    fr: 'Paiements en Attente'
  },
  'dashboard.outstandingBalances': {
    en: 'Outstanding Balances',
    fr: 'Soldes Restants'
  },
  'dashboard.newNotifications': {
    en: 'New Notifications',
    fr: 'Nouvelles Notifications'
  },
  'dashboard.unreadAlerts': {
    en: 'Unread Alerts',
    fr: 'Alertes Non Lues'
  },
  'dashboard.totalRevenue': {
    en: 'Total Revenue',
    fr: 'Recettes Totales'
  },
  'dashboard.feeCollections': {
    en: 'Fee Collections',
    fr: 'Frais Collectés'
  },
  'dashboard.teachingStaff': {
    en: 'Teaching Staff',
    fr: 'Corps Enseignant'
  },
  'dashboard.certifiedEducators': {
    en: 'Certified Educators',
    fr: 'Éducateurs Certifiés'
  },
  'dashboard.title': {
    en: 'School Management System Dashboard',
    fr: 'Tableau de Bord du Système Scolaire'
  },
  'dashboard.activeTerm': {
    en: 'Active Term',
    fr: 'Trimestre Actif'
  },
  'dashboard.backupDb': {
    en: 'Backup Database',
    fr: 'Sauvegarder la Base'
  },
  'dashboard.enrollStudent': {
    en: 'Enroll New Student',
    fr: 'Inscrire un Élève'
  },

  // Modules & Navigation
  'nav.dashboard': {
    en: 'Dashboard',
    fr: 'Tableau de bord'
  },
  'nav.students': {
    en: 'Students',
    fr: 'Élèves'
  },
  'nav.teachers': {
    en: 'Teachers',
    fr: 'Enseignants'
  },
  'nav.classes': {
    en: 'Classes & Departments',
    fr: 'Classes & Départements'
  },
  'nav.fees': {
    en: 'Fees & Billing',
    fr: 'Frais & Facturation'
  },
  'nav.reports': {
    en: 'Terminal Reports',
    fr: 'Bulletins Trimestriels'
  },
  'nav.calendar': {
    en: 'Academic Calendar',
    fr: 'Calendrier Académique'
  },
  'nav.notifications': {
    en: 'Notifications & SMS',
    fr: 'Notifications & SMS'
  },
  'nav.academicSetup': {
    en: 'Academic Setup',
    fr: 'Configuration Académique'
  },
  'nav.loginHistory': {
    en: 'Login History',
    fr: 'Historique des Connexions'
  },
  'nav.profile': {
    en: 'Profile',
    fr: 'Profil'
  },

  // Common Actions
  'action.save': {
    en: 'Save',
    fr: 'Enregistrer'
  },
  'action.cancel': {
    en: 'Cancel',
    fr: 'Annuler'
  },
  'action.delete': {
    en: 'Delete',
    fr: 'Supprimer'
  },
  'action.edit': {
    en: 'Edit',
    fr: 'Modifier'
  },
  'action.search': {
    en: 'Search...',
    fr: 'Rechercher...'
  },
  'action.filter': {
    en: 'Filter',
    fr: 'Filtrer'
  },
  'action.print': {
    en: 'Print',
    fr: 'Imprimer'
  },
  'action.download': {
    en: 'Download',
    fr: 'Télécharger'
  },
  'action.export': {
    en: 'Export',
    fr: 'Exporter'
  },
  'action.back': {
    en: 'Back',
    fr: 'Retour'
  },
  'action.close': {
    en: 'Close',
    fr: 'Fermer'
  },
  'action.refresh': {
    en: 'Refresh',
    fr: 'Actualiser'
  },
  'action.view': {
    en: 'View',
    fr: 'Voir'
  },
  'action.submit': {
    en: 'Submit',
    fr: 'Soumettre'
  },
  'action.signIn': {
    en: 'Sign In',
    fr: 'Se Connecter'
  },

  // Student & Parent Portal
  'student.reportCard': {
    en: 'Terminal Report Card',
    fr: 'Bulletin de Notes Trimestriel'
  },
  'student.accountStatement': {
    en: 'Statement of Account',
    fr: 'Relevé de Compte'
  },
  'student.digitalId': {
    en: 'Digital Student ID',
    fr: "Carte Scolaire Numérique"
  },
  'student.parentGuardian': {
    en: 'Parent / Guardian Name',
    fr: 'Nom du Parent / Tuteur'
  },
  'student.emergencyPhone': {
    en: 'Parent Emergency Phone',
    fr: "Téléphone d'Urgence Parent"
  },
  'student.attendanceRate': {
    en: 'Attendance Rate',
    fr: 'Taux de Présence'
  },
  'student.averageScore': {
    en: 'Average Score',
    fr: 'Moyenne Générale'
  },
  'student.classPosition': {
    en: 'Class Position',
    fr: 'Rang de Classe'
  },
  'student.feesClearance': {
    en: 'Fees Clearance',
    fr: 'Règlement des Frais'
  },
  'student.tuitionFee': {
    en: 'Tuition Fee',
    fr: 'Frais de Scolarité'
  },
  'student.totalPayable': {
    en: 'Total Payable',
    fr: 'Total à Payer'
  },
  'student.totalPaid': {
    en: 'Total Paid',
    fr: 'Total Payé'
  },
  'student.balanceDue': {
    en: 'Balance Due',
    fr: 'Solde Dû'
  },
  'student.selectTerm': {
    en: 'Select Academic Term',
    fr: 'Sélectionner le Trimestre'
  },
  'student.notificationsAlerts': {
    en: 'Student & Parent Notifications & Fee Alerts',
    fr: 'Notifications et Alertes de Frais pour Élèves et Parents'
  },

  // Login Screen
  'login.welcome': {
    en: 'Welcome to JIPAS Portal',
    fr: 'Bienvenue sur le Portail JIPAS'
  },
  'login.prompt': {
    en: 'Sign in to access your administrative, educator, or student account',
    fr: 'Connectez-vous pour accéder à votre compte administratif, enseignant ou élève'
  },
  'login.identifier': {
    en: 'Email, Staff ID, or Student Admission No.',
    fr: "Email, Identifiant ou N° d'Admission Élève"
  },
  'login.password': {
    en: 'Password / Access PIN',
    fr: "Mot de Passe / PIN d'Accès"
  },
  'login.rememberMe': {
    en: 'Remember me on this device',
    fr: 'Se souvenir de moi sur cet appareil'
  },
  'login.signInBtn': {
    en: 'Sign In to Portal',
    fr: 'Accéder au Portail'
  },
  'login.demoCredentials': {
    en: 'Demo Credentials & Quick Fill',
    fr: 'Comptes de Démonstration & Remplissage Rapide'
  }
};
