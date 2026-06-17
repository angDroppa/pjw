import nodemailer from "nodemailer";

export const transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function inviaEmailRiparazioneCostosa(
  emailUtente: string,
  nomeUtente: string,
  idRiparazione: number,
  costo: number,
) {
  await transport.sendMail({
    from: process.env.EMAIL_USER,
    to: emailUtente,
    subject: `Riparazione #${idRiparazione} — costo elevato`,
    html: `
      <p>Ciao ${nomeUtente},</p>
      <p>La riparazione <strong>#${idRiparazione}</strong> ha raggiunto un costo di <strong>€${costo.toFixed(2)}</strong>.</p>
      <p>Ti contatteremo a breve per aggiornarti.</p>
    `,
  });
}

export async function inviaEmailPromemoria(
  emailUtente: string,
  nomeUtente: string,
  dataRitiro: string,
  oraRitiro: string,
  locationNome: string,
  locationIndirizzo: string,
) {
  await transport.sendMail({
    from: process.env.EMAIL_USER,
    to: emailUtente,
    subject: `Promemoria ritiro bici — ${dataRitiro}`,
    html: `
      <p>Ciao ${nomeUtente},</p>
      <p>Ti ricordiamo che la tua bici è pronta per il ritiro il <strong>${dataRitiro}</strong> alle <strong>${oraRitiro}</strong>.</p>
      <p>Puoi ritirarla presso: <strong>${locationNome}</strong> — ${locationIndirizzo}.</p>
      <p>A presto!</p>
    `,
  });
}

export async function inviaEmailConfermaPrenotazioni(
  emailUtente: string,
  nomeUtente: string,
  prenotazioni: {
    dataRitiro: string;
    oraRitiro: string;
    dataConsegna: string;
    oraConsegna: string;
    locationNome: string;
    totalePagato: number;
  }[],
  totaleComplessivo: number,
) {
  const righe = prenotazioni.map((p, i) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">#${i + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.locationNome}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.dataRitiro} ${p.oraRitiro} → ${p.dataConsegna} ${p.oraConsegna}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">€${p.totalePagato.toFixed(2)}</td>
    </tr>
  `).join('');

  await transport.sendMail({
    from: process.env.EMAIL_USER,
    to: emailUtente,
    subject: 'Conferma prenotazione bici',
    html: `
      <p>Ciao ${nomeUtente},</p>
      <p>La tua prenotazione è confermata! Ecco il riepilogo:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">#</th>
            <th style="padding: 8px; text-align: left;">Negozio</th>
            <th style="padding: 8px; text-align: left;">Date</th>
            <th style="padding: 8px; text-align: left;">Totale</th>
          </tr>
        </thead>
        <tbody>${righe}</tbody>
      </table>
      <p style="margin-top: 16px; font-size: 18px;"><strong>Totale complessivo: €${totaleComplessivo.toFixed(2)}</strong></p>
      <p>A presto!</p>
    `,
  });
}