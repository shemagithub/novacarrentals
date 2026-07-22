"""
SMTP email delivery for admin notifications (contact, bookings, notification center).

Configuration priority: environment variables, then admin Settings document.
cPanel / Namecheap: outgoing server is usually your domain (e.g. novacarrentals.com) on port 465 SSL —
not the cPanel web URL (server97.web-hosting.com:2083).
"""

from __future__ import annotations

import asyncio
import html
import logging
import os
import re
import smtplib
import ssl
from email.message import EmailMessage
from functools import partial
from typing import Any, Dict, List, Optional, Sequence, Tuple

logger = logging.getLogger(__name__)

BRAND_RED = "#E60000"
BRAND_DARK = "#111111"
BRAND_MUTED = "#71717a"
BRAND_BG = "#f4f4f5"
BRAND_CARD = "#ffffff"


def smtp_config_from_settings(settings: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    s = settings or {}
    host = (os.environ.get("SMTP_HOST") or s.get("smtp_host") or "").strip()
    user = (os.environ.get("SMTP_USER") or s.get("smtp_user") or "").strip()
    password = (os.environ.get("SMTP_PASSWORD") or s.get("smtp_password") or "").strip()
    if not host or not user or not password:
        return None

    port_raw = os.environ.get("SMTP_PORT") or s.get("smtp_port") or 465
    try:
        port = int(port_raw)
    except (TypeError, ValueError):
        port = 465

    ssl_env = os.environ.get("SMTP_USE_SSL")
    if ssl_env is not None:
        use_ssl = str(ssl_env).strip().lower() in ("1", "true", "yes", "on")
    else:
        use_ssl = s.get("smtp_use_ssl")
        if use_ssl is None:
            use_ssl = port == 465
        else:
            use_ssl = bool(use_ssl)

    from_addr = (
        (os.environ.get("SMTP_FROM") or s.get("smtp_from_email") or user).strip()
    )
    reply_to = (s.get("company_email") or from_addr).strip()

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "from_addr": from_addr,
        "reply_to": reply_to,
        "use_ssl": use_ssl,
    }


def admin_notify_email(settings: Optional[Dict[str, Any]]) -> str:
    s = settings or {}
    return (
        (os.environ.get("NOTIFY_EMAIL_TO") or s.get("notification_email_to") or s.get("company_email") or s.get("smtp_user") or "")
        .strip()
        .lower()
    )


def _normalize_website_origin(raw: str) -> str:
    u = (raw or "").strip().rstrip("/")
    if not u:
        return ""
    if not u.startswith("http://") and not u.startswith("https://"):
        u = f"https://{u}"
    return u


def _website_origin(settings: Optional[Dict[str, Any]]) -> str:
    s = settings or {}
    raw = (
        os.environ.get("PUBLIC_WEBSITE_URL")
        or s.get("website_url")
        or ""
    ).strip()
    if not raw:
        smtp_user = (os.environ.get("SMTP_USER") or s.get("smtp_user") or "").strip()
        if "@" in smtp_user:
            domain = smtp_user.split("@", 1)[1]
            if domain and "." in domain:
                raw = f"https://{domain}"
    return _normalize_website_origin(raw)


def _resolve_asset_url(settings: Optional[Dict[str, Any]], raw: Optional[str]) -> str:
    candidate = str(raw or "").strip()
    if not candidate:
        return ""
    if candidate.startswith("http://") or candidate.startswith("https://"):
        return candidate
    origin = _website_origin(settings)
    if candidate.startswith("/"):
        return f"{origin}{candidate}" if origin else candidate
    if candidate.startswith("/api/files/"):
        path = candidate
    elif "/api/files/" in candidate:
        path = candidate[candidate.index("/api/files/") :]
    else:
        path = f"/api/files/{candidate.lstrip('/')}"
    return f"{origin}{path}" if origin else path


def _brand_context(settings: Optional[Dict[str, Any]]) -> Dict[str, str]:
    s = settings or {}
    company = str(s.get("company_name") or "NovaCar Rentals").strip()
    logo_url = _resolve_asset_url(s, s.get("logo_url"))
    website = _website_origin(s)
    phone = str(s.get("company_phone") or "").strip()
    email = str(s.get("company_email") or s.get("smtp_from_email") or s.get("smtp_user") or "").strip()
    tagline = str(s.get("footer_tagline") or s.get("company_description") or "").strip()
    city = str(s.get("city") or "").strip()
    country = str(s.get("country") or "").strip()
    location = ", ".join(x for x in (city, country) if x)
    return {
        "company": company,
        "company_esc": html.escape(company),
        "logo_url": logo_url,
        "logo_url_esc": html.escape(logo_url) if logo_url else "",
        "website": website,
        "website_esc": html.escape(website) if website else "",
        "phone": phone,
        "phone_esc": html.escape(phone) if phone else "",
        "email": email,
        "email_esc": html.escape(email) if email else "",
        "tagline": tagline,
        "tagline_esc": html.escape(tagline) if tagline else "",
        "location": location,
        "location_esc": html.escape(location) if location else "",
    }


def _email_header_html(brand: Dict[str, str]) -> str:
    logo_url = brand.get("logo_url") or ""
    company = brand["company_esc"]
    if logo_url:
        logo_block = f"""
          <img src="{html.escape(logo_url)}" alt="{company}" width="180" height="auto"
               style="display:block;margin:0 auto;max-width:180px;max-height:64px;width:auto;height:auto;border:0;outline:none;text-decoration:none;" />
        """
    else:
        logo_block = f"""
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;">
            {company}
          </div>
        """
    tagline = brand.get("tagline_esc") or ""
    tagline_block = (
        f'<p style="margin:10px 0 0;font-size:13px;line-height:1.4;color:rgba(255,255,255,0.78);">{tagline}</p>'
        if tagline
        else ""
    )
    return f"""
      <tr>
        <td align="center" style="background:{BRAND_DARK};padding:28px 32px 24px;border-bottom:4px solid {BRAND_RED};">
          {logo_block}
          {tagline_block}
        </td>
      </tr>
    """


def _email_footer_html(brand: Dict[str, str]) -> str:
    company = brand["company_esc"]
    parts: List[str] = []
    if brand.get("phone_esc"):
        parts.append(f'<span style="white-space:nowrap;">{brand["phone_esc"]}</span>')
    if brand.get("email_esc"):
        parts.append(f'<a href="mailto:{brand["email_esc"]}" style="color:{BRAND_MUTED};text-decoration:none;">{brand["email_esc"]}</a>')
    if brand.get("location_esc"):
        parts.append(f'<span>{brand["location_esc"]}</span>')
    contact_line = " · ".join(parts) if parts else ""
    website = brand.get("website") or ""
    website_link = (
        f'<p style="margin:0 0 8px;"><a href="{brand["website_esc"]}" style="color:{BRAND_RED};text-decoration:none;font-weight:600;">Visit our website</a></p>'
        if website
        else ""
    )
    return f"""
      <tr>
        <td align="center" style="background:#fafafa;padding:24px 32px;border-top:1px solid #e4e4e7;">
          {website_link}
          <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#18181b;">{company}</p>
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:{BRAND_MUTED};">{contact_line}</p>
          <p style="margin:14px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#a1a1aa;">
            You received this email because you interacted with {company}.
          </p>
        </td>
      </tr>
    """


def render_detail_table(rows: Sequence[Tuple[str, str]]) -> str:
    items: List[str] = []
    for label, value in rows:
        if not value:
            continue
        items.append(
            f"""
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid #f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:{BRAND_MUTED};margin-bottom:4px;">{html.escape(label)}</div>
                <div style="font-size:15px;line-height:1.5;color:#18181b;">{value}</div>
              </td>
            </tr>
            """
        )
    if not items:
        return ""
    return f"""
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 0;">
        {''.join(items)}
      </table>
    """


def render_message_box(content_html: str) -> str:
    return f"""
      <div style="margin-top:20px;padding:18px 20px;background:#fafafa;border-left:4px solid {BRAND_RED};border-radius:0 6px 6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#27272a;white-space:pre-wrap;">
        {content_html}
      </div>
    """


def render_cta_button(label: str, url: str) -> str:
    if not label or not url:
        return ""
    return f"""
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0;">
        <tr>
          <td align="center" style="border-radius:4px;background:{BRAND_RED};">
            <a href="{html.escape(url)}" target="_blank"
               style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#ffffff;text-decoration:none;border-radius:4px;">
              {html.escape(label)}
            </a>
          </td>
        </tr>
      </table>
    """


def render_branded_email(
    settings: Optional[Dict[str, Any]],
    headline: str,
    inner_html: str,
    *,
    subtitle: Optional[str] = None,
    preheader: Optional[str] = None,
) -> str:
    brand = _brand_context(settings)
    preheader_text = html.escape(preheader or headline)
    subtitle_block = (
        f'<p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:{BRAND_MUTED};">{html.escape(subtitle)}</p>'
        if subtitle
        else ""
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{html.escape(headline)}</title>
</head>
<body style="margin:0;padding:0;background:{BRAND_BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{preheader_text}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:{BRAND_BG};min-width:100%;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:{BRAND_CARD};border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          {_email_header_html(brand)}
          <tr>
            <td style="padding:32px 32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:#18181b;letter-spacing:-0.02em;">{html.escape(headline)}</h1>
              {subtitle_block}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3f3f46;">
              {inner_html}
            </td>
          </tr>
          {_email_footer_html(brand)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _send_sync(
    cfg: Dict[str, Any],
    to_addrs: List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> None:
    recipients = [a.strip() for a in to_addrs if a and a.strip()]
    if not recipients:
        raise ValueError("No recipients")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = cfg["from_addr"]
    msg["To"] = ", ".join(recipients)
    if cfg.get("reply_to"):
        msg["Reply-To"] = cfg["reply_to"]

    plain = text_body or re.sub(r"<[^>]+>", "", html_body.replace("<br>", "\n").replace("<br/>", "\n"))
    plain = re.sub(r"\n{3,}", "\n\n", plain).strip()
    msg.set_content(plain)
    msg.add_alternative(html_body, subtype="html")

    if cfg["use_ssl"]:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=context, timeout=30) as server:
            server.login(cfg["user"], cfg["password"])
            server.send_message(msg)
    else:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=30) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
            server.login(cfg["user"], cfg["password"])
            server.send_message(msg)


async def send_email(
    settings: Optional[Dict[str, Any]],
    to_addrs: List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> bool:
    cfg = smtp_config_from_settings(settings)
    if not cfg:
        logger.warning("send_email skipped: SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASSWORD)")
        return False
    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None,
            partial(_send_sync, cfg, to_addrs, subject, html_body, text_body),
        )
        logger.info("Email sent to %s subject=%s", to_addrs, subject[:80])
        return True
    except Exception:
        logger.exception("send_email failed to=%s subject=%s", to_addrs, subject[:80])
        return False


async def send_notification_email(settings: Optional[Dict[str, Any]], doc: Dict[str, Any]) -> bool:
    channel = str(doc.get("channel") or "in_app").strip().lower()
    if channel not in ("email", "in_app", "sms", "whatsapp"):
        channel = "in_app"

    if channel not in ("email", "in_app"):
        return False

    recipient = str(doc.get("recipient_email") or "").strip().lower()
    if channel == "email" and not recipient:
        recipient = admin_notify_email(settings)
    elif channel == "in_app":
        recipient = admin_notify_email(settings)

    if not recipient:
        logger.warning("notification email skipped: no recipient")
        return False

    brand = _brand_context(settings)
    title = str(doc.get("title") or "Notification")
    message = html.escape(str(doc.get("message") or ""))
    ntype = html.escape(str(doc.get("type") or "system"))
    channel_esc = html.escape(channel)

    inner = f"""
      {render_message_box(message)}
      <p style="margin:20px 0 0;font-size:12px;color:{BRAND_MUTED};">
        Type: <strong style="color:#18181b;">{ntype}</strong> · Channel: <strong style="color:#18181b;">{channel_esc}</strong>
      </p>
    """
    html_body = render_branded_email(
        settings,
        title,
        inner,
        subtitle="Admin notification",
        preheader=str(doc.get("message") or title)[:120],
    )
    return await send_email(settings, [recipient], f"[{brand['company']}] {title}", html_body)


async def send_contact_admin_email(settings: Optional[Dict[str, Any]], doc: Dict[str, Any]) -> bool:
    admin_to = admin_notify_email(settings)
    if not admin_to:
        return False

    brand = _brand_context(settings)
    name = html.escape(str(doc.get("name") or "Guest"))
    email_disp = html.escape(str(doc.get("email") or ""))
    subject_line = str(doc.get("subject") or "Contact form")
    subject_esc = html.escape(subject_line)
    message = html.escape(str(doc.get("message") or ""))

    inner = f"""
      {render_detail_table([
          ("From", f"{name} &lt;{email_disp}&gt;"),
          ("Subject", subject_esc),
      ])}
      {render_message_box(message)}
    """
    html_admin = render_branded_email(
        settings,
        "New contact message",
        inner,
        subtitle="Someone reached out via your website contact form.",
        preheader=f"New message from {doc.get('name') or 'Guest'}",
    )
    ok = await send_email(
        settings,
        [admin_to],
        f"[{brand['company']}] Contact: {subject_line}",
        html_admin,
    )

    guest_raw = str(doc.get("email") or "").strip().lower()
    guest_name = str(doc.get("name") or "Guest")
    if ok and guest_raw:
        guest_inner = f"""
          <p style="margin:0 0 16px;">Hi {html.escape(guest_name)},</p>
          <p style="margin:0 0 16px;">Thank you for contacting <strong>{brand['company_esc']}</strong>. We received your message and a member of our team will reply shortly.</p>
          {render_message_box(f"<strong>Your subject:</strong> {subject_esc}")}
          <p style="margin:20px 0 0;font-size:14px;color:{BRAND_MUTED};">We typically respond within a few business hours.</p>
        """
        guest_html = render_branded_email(
            settings,
            "We received your message",
            guest_inner,
            subtitle="Thanks for getting in touch with us.",
            preheader="We received your message and will reply soon.",
        )
        await send_email(
            settings,
            [guest_raw],
            f"Thanks for contacting {brand['company']}",
            guest_html,
            f"Hi {guest_name},\n\nThank you for contacting {brand['company']}. We received your message and will reply shortly.\n\n— {brand['company']}",
        )
    return ok


async def send_booking_emails(settings: Optional[Dict[str, Any]], booking: Dict[str, Any], vehicle_name: str) -> bool:
    admin_to = admin_notify_email(settings)
    guest_email_raw = str(booking.get("guest_email_snapshot") or "").strip().lower()
    brand = _brand_context(settings)

    pickup = html.escape(str(booking.get("pickup_date") or ""))
    ret = html.escape(str(booking.get("return_date") or ""))
    total = html.escape(str(booking.get("total_amount")))
    guest = html.escape(str(booking.get("guest_name_snapshot") or "Guest"))
    phone = html.escape(str(booking.get("guest_phone_snapshot") or ""))
    guest_email_disp = html.escape(guest_email_raw)
    vehicle_name_esc = html.escape(vehicle_name)
    status = html.escape(str(booking.get("status") or ""))
    pickup_loc = html.escape(str(booking.get("pickup_location") or ""))
    return_loc = html.escape(str(booking.get("return_location") or ""))

    admin_inner = f"""
      {render_detail_table([
          ("Vehicle", vehicle_name_esc),
          ("Guest", f"{guest} &lt;{guest_email_disp}&gt;"),
          ("Phone", phone),
          ("Pickup date", pickup),
          ("Return date", ret),
          ("Total", f"${total}"),
          ("Status", status),
          ("Pickup location", pickup_loc),
          ("Return location", return_loc),
      ])}
    """
    html_admin = render_branded_email(
        settings,
        "New booking request",
        admin_inner,
        subtitle="A customer submitted a rental request on your website.",
        preheader=f"{booking.get('guest_name_snapshot') or 'Guest'} — {vehicle_name}",
    )

    ok = False
    if admin_to:
        ok = await send_email(
            settings,
            [admin_to],
            f"[{brand['company']}] New booking — {vehicle_name}",
            html_admin,
        )

    if guest_email_raw:
        guest_inner = f"""
          <p style="margin:0 0 16px;">Hi {guest},</p>
          <p style="margin:0 0 20px;">We received your booking request. Our team will review availability and confirm within <strong>2 hours</strong>.</p>
          {render_detail_table([
              ("Vehicle", vehicle_name_esc),
              ("Pickup", pickup),
              ("Return", ret),
              ("Estimated total", f"${total}"),
          ])}
          {render_cta_button("Visit our website", brand.get("website") or "")}
        """
        guest_html = render_branded_email(
            settings,
            "Booking request received",
            guest_inner,
            subtitle=f"Your {vehicle_name} reservation is pending confirmation.",
            preheader=f"Booking request for {vehicle_name} ({pickup} to {ret})",
        )
        await send_email(
            settings,
            [guest_email_raw],
            f"Booking request received — {brand['company']}",
            guest_html,
            f"Hi {booking.get('guest_name_snapshot') or 'Guest'},\n\nWe received your booking request for {vehicle_name} ({pickup} to {ret}). Our team will confirm within 2 hours.\n\n— {brand['company']}",
        )
    return ok


async def send_test_email(settings: Optional[Dict[str, Any]], to: str) -> bool:
    brand = _brand_context(settings)
    inner = f"""
      <p style="margin:0 0 16px;">This is a test message from your NovaCar admin panel.</p>
      <p style="margin:0;">If you can read this email with your company logo in the header, SMTP and branding are configured correctly.</p>
      {render_detail_table([
          ("SMTP host", html.escape(str((settings or {}).get("smtp_host") or ""))),
          ("From address", html.escape(str((settings or {}).get("smtp_from_email") or ""))),
          ("Company", brand["company_esc"]),
      ])}
    """
    html_body = render_branded_email(
        settings,
        "SMTP test successful",
        inner,
        subtitle="Your email notifications are ready to go.",
        preheader="SMTP test from NovaCar admin",
    )
    return await send_email(
        settings,
        [to],
        f"Test email — {brand['company']}",
        html_body,
        f"SMTP is working for {brand['company']}.",
    )
