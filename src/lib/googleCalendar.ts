import { Task } from '../types';

// Helper to calculate the next day date string of YYYY-MM-DD
const getNextDateStr = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    d.setDate(d.getDate() + 1);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (err) {
    console.error('Error calculating next date:', err);
    return dateStr;
  }
};

export async function createCalendarEvent(task: Partial<Task>, token: string): Promise<string> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = task.dueDate || new Date().toISOString().split('T')[0];
  
  let start: any = {};
  let end: any = {};

  if (task.dueTime) {
    // Combine date and time
    const dateTimeStartStr = `${date}T${task.dueTime}:00`;
    const startObj = new Date(dateTimeStartStr);
    
    // Default duration is 1 hour
    const endObj = new Date(startObj.getTime() + 60 * 60 * 1000);

    start = {
      dateTime: startObj.toISOString(),
      timeZone: tz
    };
    end = {
      dateTime: endObj.toISOString(),
      timeZone: tz
    };
  } else {
    // All day event (Requires end date to be next day in ISO YYYY-MM-DD format as Google Calendar API standard)
    start = {
      date: date
    };
    end = {
      date: getNextDateStr(date)
    };
  }

  // Handle Recurrence RRULE rules
  const recurrenceList: string[] = [];
  if (task.recurrence === 'daily') {
    recurrenceList.push('RRULE:FREQ=DAILY');
  } else if (task.recurrence === 'weekly') {
    recurrenceList.push('RRULE:FREQ=WEEKLY');
  } else if (task.recurrence === 'biweekly') {
    // Quinzenal: Weekly with interval 2
    recurrenceList.push('RRULE:FREQ=WEEKLY;INTERVAL=2');
  } else if (task.recurrence === 'monthly') {
    recurrenceList.push('RRULE:FREQ=MONTHLY');
  }

  const categoryInfo = task.category ? `[Categoria: ${task.category}]` : '';
  const pomodoroInfo = task.pomodorosTarget ? `[Pomodoros: ${task.pomodorosTarget}]` : '';
  const recurrenceInfo = task.recurrence && task.recurrence !== 'none' ? `[Recorrência: ${task.recurrence}]` : '';
  const taskStatus = task.completed ? '✅ Concluída' : '⏳ Pendente';

  const description = `${task.description || ''}\n\n---\nSincronizado via Citrino MVP.\nStatus: ${taskStatus}\n${categoryInfo} ${pomodoroInfo} ${recurrenceInfo}`;

  const eventData: any = {
    summary: `${task.completed ? '[Concluída] ' : ''}${task.title}`,
    description,
    start,
    end,
  };

  if (recurrenceList.length > 0) {
    eventData.recurrence = recurrenceList;
  }

  if (task.reminderMinutes !== undefined && task.reminderMinutes > 0) {
    eventData.reminders = {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: task.reminderMinutes }
      ]
    };
  }

  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao criar evento na agenda externa: ${errorText}`);
  }

  const data = await res.json();
  return data.id;
}

export async function updateCalendarEvent(eventId: string, task: Partial<Task>, token: string): Promise<void> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = task.dueDate || new Date().toISOString().split('T')[0];
  
  let start: any = {};
  let end: any = {};

  if (task.dueTime) {
    const dateTimeStartStr = `${date}T${task.dueTime}:00`;
    const startObj = new Date(dateTimeStartStr);
    const endObj = new Date(startObj.getTime() + 60 * 60 * 1000);

    start = {
      dateTime: startObj.toISOString(),
      timeZone: tz
    };
    end = {
      dateTime: endObj.toISOString(),
      timeZone: tz
    };
  } else {
    start = {
      date: date
    };
    end = {
      date: getNextDateStr(date)
    };
  }

  const recurrenceList: string[] = [];
  if (task.recurrence === 'daily') {
    recurrenceList.push('RRULE:FREQ=DAILY');
  } else if (task.recurrence === 'weekly') {
    recurrenceList.push('RRULE:FREQ=WEEKLY');
  } else if (task.recurrence === 'biweekly') {
    recurrenceList.push('RRULE:FREQ=WEEKLY;INTERVAL=2');
  } else if (task.recurrence === 'monthly') {
    recurrenceList.push('RRULE:FREQ=MONTHLY');
  }

  const categoryInfo = task.category ? `[Categoria: ${task.category}]` : '';
  const pomodoroInfo = task.pomodorosTarget ? `[Pomodoros: ${task.pomodorosTarget}]` : '';
  const recurrenceInfo = task.recurrence && task.recurrence !== 'none' ? `[Recorrência: ${task.recurrence}]` : '';
  const taskStatus = task.completed ? '✅ Concluída' : '⏳ Pendente';

  const description = `${task.description || ''}\n\n---\nSincronizado via Citrino MVP.\nStatus: ${taskStatus}\n${categoryInfo} ${pomodoroInfo} ${recurrenceInfo}`;

  const eventData: any = {
    summary: `${task.completed ? '[Concluída] ' : ''}${task.title}`,
    description,
    start,
    end,
  };

  if (recurrenceList.length > 0) {
    eventData.recurrence = recurrenceList;
  } else {
    // If updating to none but previous was recurring, we reset by not providing recurrence,
    // Google API requires put with empty/unset recurrence to remove it
    eventData.recurrence = null;
  }

  if (task.reminderMinutes !== undefined && task.reminderMinutes > 0) {
    eventData.reminders = {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: task.reminderMinutes }
      ]
    };
  } else if (task.reminderMinutes === 0) {
    eventData.reminders = {
      useDefault: false,
      overrides: []
    };
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao atualizar evento na agenda externa: ${errorText}`);
  }
}

export async function deleteCalendarEvent(eventId: string, token: string): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // 410 Gone means already deleted on calendar, 404 means not found; we can safely ignore these
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errorText = await res.text();
    throw new Error(`Erro ao deletar evento na agenda externa: ${errorText}`);
  }
}
