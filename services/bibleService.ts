
export interface BibleVerse {
  reference: string;
  text: string;
  translation_name: string;
}

/**
 * Fetches a bible verse from the public bible-api.com
 * No API key required.
 */
export const fetchBibleVerse = async (reference: string): Promise<BibleVerse | null> => {
  try {
    // We use the English reference as the API is primarily English-based for lookups, 
    // but the model can translate the intent.
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
    if (!response.ok) throw new Error('Bible API Error');
    const data = await response.json();
    return {
      reference: data.reference,
      text: data.text,
      translation_name: data.translation_name
    };
  } catch (error) {
    console.error("Failed to fetch verse:", error);
    return null;
  }
};
