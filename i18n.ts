
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Basic translations for the main navigation and common UI elements
const resources = {
    fr: {
        translation: {
            "nav": {
                "dashboard": "Tableau de bord",
                "members": "Membres",
                "finances": "Finances",
                "attendance": "Présences",
                "departments": "Départements",
                "events": "Événements",
                "communications": "Communications",
                "resources": "Ressources",
                "settings": "Paramètres",
                "roles": "Rôles & Accès"
            },
            "common": {
                "logout": "Déconnexion",
                "save": "Enregistrer",
                "cancel": "Annuler",
                "delete": "Supprimer",
                "add": "Ajouter",
                "edit": "Modifier",
                "search": "Rechercher...",
                "admin_app": "NCD Admin"
            }
        }
    },
    en: {
        translation: {
            "nav": {
                "dashboard": "Dashboard",
                "members": "Members",
                "finances": "Finances",
                "attendance": "Attendance",
                "departments": "Departments",
                "events": "Events",
                "communications": "Communications",
                "resources": "Resources",
                "settings": "Settings",
                "roles": "Roles & Access"
            },
            "common": {
                "logout": "Logout",
                "save": "Save",
                "cancel": "Cancel",
                "delete": "Delete",
                "add": "Add",
                "edit": "Edit",
                "search": "Search...",
                "admin_app": "NCD Admin"
            }
        }
    },
    ln: {
        translation: {
            "nav": {
                "dashboard": "Esika ya Mokambi",
                "members": "Bandimi",
                "finances": "Makambo ya Mbongo",
                "attendance": "Bopemi/Koya",
                "departments": "Bitépá",
                "events": "Makambo",
                "communications": "Bapanzi Sango",
                "resources": "Bisaleli",
                "settings": "Bongisa",
                "roles": "Bokonzi mpe Ndenge"
            },
            "common": {
                "logout": "Kokende",
                "save": "Kobomba",
                "cancel": "Kotika",
                "delete": "Kolongola",
                "add": "Kobakisa",
                "edit": "Kobongisa",
                "search": "Koluka...",
                "admin_app": "NCD Admin"
            }
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('ncd_lang') || 'fr',
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false // React already escapes values
        }
    });

export default i18n;
