/**
 * Utility script to initialize Weekly Services and Annual Programme 2026
 * 
 * This script should be run once to populate Firestore with:
 * 1. Weekly Services (Mercredi, Vendredi, Dimanche services)
 * 2. Annual Programme 2026 (13 major events from the poster)
 * 
 * Usage: Call from Settings page or run as a one-time script
 */

import { weeklyServicesService } from '../services/weeklyServicesService';
import { annualProgrammeService } from '../services/annualProgrammeService';

export const initializeProgramme = async (): Promise<{ weeklyServices: number; annualEvents: number }> => {
  console.log('🔄 Initializing Programme...');
  
  try {
    // Initialize Weekly Services
    const weeklyCount = await weeklyServicesService.initializeDefaults();
    console.log(`✅ Weekly Services: ${weeklyCount} services initialized`);

    // Initialize Annual Programme 2026
    const annualCount = await annualProgrammeService.initialize2026();
    console.log(`✅ Annual Programme 2026: ${annualCount} events initialized`);

    return {
      weeklyServices: weeklyCount,
      annualEvents: annualCount
    };
  } catch (error) {
    console.error('❌ Error initializing programme:', error);
    throw error;
  }
};
