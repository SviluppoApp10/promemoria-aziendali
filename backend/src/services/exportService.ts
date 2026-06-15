import { Response } from 'express';
import * as XLSX from 'xlsx';
import { query } from '../config/database';
import logger from '../utils/logger';

export async function exportEventsExcel(res: Response, filters: {
  start_date?: string;
  end_date?: string;
  collaborator_email?: string;
}) {
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (filters.start_date) { conditions.push(`event_date >= $${p}`); params.push(filters.start_date); p++; }
    if (filters.end_date) { conditions.push(`event_date <= $${p}`); params.push(filters.end_date); p++; }
    if (filters.collaborator_email) { conditions.push(`collaborator_email = $${p}`); params.push(filters.collaborator_email); p++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT
         collaborator_name as "Collaboratore",
         collaborator_email as "Email Collaboratore",
         title as "Titolo",
         description as "Descrizione",
         TO_CHAR(event_date, 'DD/MM/YYYY') as "Data Evento",
         event_time as "Ora Evento",
         TO_CHAR(reminder_datetime, 'DD/MM/YYYY HH24:MI') as "Data Promemoria",
         CASE WHEN reminder_sent THEN 'Inviato' ELSE 'Non inviato' END as "Stato Promemoria",
         TO_CHAR(reminder_sent_at, 'DD/MM/YYYY HH24:MI') as "Promemoria Inviato Il",
         TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as "Creato Il",
         TO_CHAR(updated_at, 'DD/MM/YYYY HH24:MI') as "Modificato Il"
       FROM events ${where}
       ORDER BY event_date DESC`,
      params
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Stile intestazioni
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    ws['!cols'] = [
      { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 40 },
      { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Eventi');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `eventi_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    logger.error('Errore export Excel:', err);
    res.status(500).json({ error: 'Errore esportazione Excel' });
  }
}
