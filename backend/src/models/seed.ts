import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import logger from '../utils/logger';

async function seed() {
  const client = await pool.connect();
  try {
    const adminHash = await bcrypt.hash('Admin@2024!', 12);
    const userHash = await bcrypt.hash('User@2024!', 12);

    await client.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES
        ('admin', 'admin@azienda.it', $1, 'admin', 'Mario', 'Rossi'),
        ('marco', 'marco@azienda.it', $2, 'user', 'Marco', 'Bianchi'),
        ('giulia', 'giulia@azienda.it', $2, 'user', 'Giulia', 'Verdi')
      ON CONFLICT (username) DO NOTHING
    `, [adminHash, userHash]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reminderTomorrow = new Date();
    reminderTomorrow.setDate(reminderTomorrow.getDate() + 1);
    reminderTomorrow.setHours(8, 0, 0, 0);

    const { rows: [admin] } = await client.query(`SELECT id FROM users WHERE username = 'admin'`);

    await client.query(`
      INSERT INTO events (collaborator_name, collaborator_email, title, description, event_date, event_time, reminder_datetime, created_by)
      VALUES
        ('Marco Bianchi', 'marco@azienda.it', 'Riunione Team', 'Revisione obiettivi Q1', $1, '10:00', $3, $5),
        ('Giulia Verdi', 'giulia@azienda.it', 'Scadenza Report', 'Consegna report mensile', $2, '17:00', $4, $5)
      ON CONFLICT DO NOTHING
    `, [
      tomorrow.toISOString().split('T')[0],
      nextWeek.toISOString().split('T')[0],
      reminderTomorrow.toISOString(),
      nextWeek.toISOString(),
      admin.id,
    ]);

    logger.info('Seed database completato');
    logger.info('Credenziali admin: admin / Admin@2024!');
    logger.info('Credenziali utente: marco / User@2024!');
  } catch (err) {
    logger.error('Errore seed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
