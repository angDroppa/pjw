import { transport } from "@/lib/email/transport"

export async function sendConfermaRegistrazione(
  email: string,
  firstName: string,
  verificationToken: string,
) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${verificationToken}`

  const result = await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Conferma la tua registrazione",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="margin-bottom: 8px;">Ciao ${firstName}! 👋</h2>
        <p style="color: #64748b; margin-bottom: 24px;">
          Grazie per esserti registrato. Clicca il pulsante qui sotto per confermare il tuo indirizzo email e attivare il tuo account.
        </p>
        <a href="${url}"
          style="
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
          ">
          Conferma email
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
          Se non hai creato un account, ignora questa email.<br/>
          Il link scade tra 24 ore.
        </p>
      </div>
    `,
  })

  console.log("NodeMailer result:", result)
}