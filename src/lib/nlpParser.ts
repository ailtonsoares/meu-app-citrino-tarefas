/**
 * NATURAL LANGUAGE PARSER FOR DATE EXTRACTION (Portuguese)
 * Citrino Task App - Zero API Cost NLP Motor
 */

interface ParsedResult {
  title: string;
  dueDate?: string;
  detectedWord?: string;
}

export function parseNaturalLanguageDate(title: string): ParsedResult {
  if (!title) return { title: '' };

  const today = new Date();
  let parsedDate: Date | null = null;
  let wordFound = '';

  const lowerTitle = title.toLowerCase();

  // 1. Check for "hoje"
  if (/\bhoje\b/i.test(lowerTitle)) {
    parsedDate = today;
    wordFound = 'hoje';
  } 
  // 2. Check for "amanhã" / "amanha"
  else if (/\b(amanh[ãa])\b/i.test(lowerTitle)) {
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    parsedDate = tomorrow;
    wordFound = lowerTitle.match(/\b(amanh[ãa])\b/i)?.[0] || 'amanhã';
  } 
  // 3. Days of the week in Portuguese
  else {
    const daysMap: { [key: string]: number } = {
      'domingo': 0,
      'segunda-feira': 1,
      'segunda': 1,
      'terça-feira': 2,
      'terça': 2,
      'terca': 2,
      'quarta-feira': 3,
      'quarta': 3,
      'quinta-feira': 4,
      'quinta': 4,
      'sexta-feira': 5,
      'sexta': 5,
      'sábado': 6,
      'sabado': 6,
    };

    for (const [key, targetDay] of Object.entries(daysMap)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(lowerTitle)) {
        const currentDay = today.getDay(); // 0-6
        let daysToAdd = targetDay - currentDay;
        
        // If targetDay is in the past or is today, point to next week's occurrence
        if (daysToAdd < 0) {
          daysToAdd += 7;
        } else if (daysToAdd === 0) {
          daysToAdd = 7; // Treat today's weekday name as next week's
        }

        const targetDate = new Date();
        targetDate.setDate(today.getDate() + daysToAdd);
        parsedDate = targetDate;
        wordFound = lowerTitle.match(regex)?.[0] || key;
        break;
      }
    }
  }

  if (parsedDate) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // Clean Portuguese connectors/prepositions like:
    // "para hoje", "na segunda", "na terça-feira", "de amanhã", "neste sábado", "pro domingo"
    const escapedWord = wordFound.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const cleaningRegexes = [
      new RegExp(`\\b(para|em|na|no|de|o|a|pro|pra|nesta|neste|na)\\s+${escapedWord}\\b`, 'i'),
      new RegExp(`\\b${escapedWord}\\s+(de|para|em|na|no|o|a|pro|pra|nesta|neste|na)\\b`, 'i'),
      new RegExp(`\\b${escapedWord}\\b`, 'i')
    ];

    let cleanTitle = title;
    for (const rx of cleaningRegexes) {
      if (rx.test(cleanTitle)) {
        cleanTitle = cleanTitle.replace(rx, '');
        break;
      }
    }

    // Clean up multiple spaces and trim
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

    // Secondary fallback in case cleaning left it empty
    if (!cleanTitle) {
      cleanTitle = title.replace(new RegExp(`\\b${escapedWord}\\b`, 'i'), '').trim();
    }

    // Capitalize first letter
    if (cleanTitle) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }

    return {
      title: cleanTitle,
      dueDate: formattedDate,
      detectedWord: wordFound
    };
  }

  return { title };
}
