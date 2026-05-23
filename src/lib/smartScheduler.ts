/**
 * Smart Local Scheduler Heuristics
 * Analyzes task titles in real-time to auto-detect deadlines based on quick Portuguese keywords
 */

export interface DetectedSchedule {
  matches: boolean;
  dateStr: string;
  label: string;
}

export function detectScheduleFromText(title: string): DetectedSchedule {
  if (!title) return { matches: false, dateStr: '', label: '' };

  const lowercase = title.toLowerCase().trim();
  const today = new Date();
  const targetDate = new Date(today);
  let matches = false;
  let label = '';

  // 1. Literal "hoje"
  if (/\bhoje\b/i.test(lowercase)) {
    matches = true;
    label = 'Hoje';
  } 
  // 2. Literal "amanhã" / "amanha"
  else if (/\bamanhã\b|\bamanha\b/i.test(lowercase)) {
    targetDate.setDate(today.getDate() + 1);
    matches = true;
    label = 'Amanhã';
  } 
  // 3. Weekday shortcuts
  else {
    const weekdaysMap: { [key: string]: number } = {
      segunda: 1, seg: 1,
      terça: 2, terca: 2, ter: 2,
      quarta: 3, qua: 3,
      quinta: 4, qui: 4,
      sexta: 5, sex: 5,
      sábado: 6, sabado: 6, sab: 6,
      domingo: 0, dom: 0
    };

    for (const [key, dayIndex] of Object.entries(weekdaysMap)) {
      // Use specific boundary-like regex for precise detection matching word endings
      const regex = new RegExp(`\\b${key}(?:-feira)?\\b`, 'i');
      if (regex.test(lowercase)) {
        const currentDayIndex = today.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
        let diff = dayIndex - currentDayIndex;
        
        // If the day index is today or has passed, schedule for the next week's corresponding day
        if (diff <= 0) {
          diff += 7;
        }
        
        targetDate.setDate(today.getDate() + diff);
        matches = true;
        const daysLabelMap = [
          'Domingo',
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado'
        ];
        label = daysLabelMap[dayIndex];
        break;
      }
    }
  }

  if (matches) {
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    return {
      matches: true,
      dateStr: `${yyyy}-${mm}-${dd}`,
      label: `${label} (${dd}/${mm})`
    };
  }

  return { matches: false, dateStr: '', label: '' };
}
