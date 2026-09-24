export function buildEmailHtml(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F9F9;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background-color:#FFFFFF;border-radius:9px;border:1px solid #D0D5DD;">
        <tr>
          <td style="padding:36px 32px 40px;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
            <div style="font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#101828;margin:0 0 28px;">WESTLINE</div>
            ${content}
            <p style="font-size:12px;line-height:1.6;color:#667085;margin:28px 0 0;">© 2026 WESTLINE. Find Your Line.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}
