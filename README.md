# napfdeal.com

Preisvergleich und Preis-Alarm für Haustierbedarf in Deutschland und Österreich.

- **Stack:** Next.js (App Router, TypeScript strict), PostgreSQL 16 + Drizzle, pg-boss-Worker, Tailwind CSS v4, Caddy, Docker Compose
- **Design:** [`docs/design-system.md`](docs/design-system.md). Gilt für jede Änderung.
- **Status:** Phase 0 (Gerüst, Startseiten-Rohbau, rechtliche Seiten, Deployment)

```
src/app/              Seiten (App Router)
  page.tsx            Länderwahl "/" (x-default)
  [country]/          /de/ und /at/
  (legal)/            Impressum, Datenschutz, Cookies & Speicher, Nutzungsbedingungen, So verdienen wir Geld
  api/health/         Health-Check (Web + DB)
src/components/       UI-Komponenten und Illustrationen
src/lib/              Länder, Kategorien, Betreiberdaten, DB
src/worker/           Hintergrund-Worker (pg-boss) und Migrations-Runner
deploy/               Caddyfile, systemd-Units
scripts/              deploy, backup, restore, migrate-server
.github/workflows/    Image-Build nach GitHub Container Registry
```

---

## Wie Code auf den Server kommt

```
du/Claude pushen nach GitHub (privates Repo)
        │
        ▼
GitHub Actions baut zwei Docker-Images (web, worker) → ghcr.io (privat)
        │
        ▼
Server: scripts/deploy.sh  →  git pull + docker compose pull + up -d
```

Auf dem VPS wird nichts kompiliert. Das schont RAM und CPU.

---

## 1. GitHub einrichten (einmalig)

1. Auf github.com ein **neues Repository** anlegen, Name `napfdeal`, Sichtbarkeit **Private**.
   Private Repos sind kostenlos; nur du (und wen du einlädst) siehst den Code.
   Die Docker-Images in `ghcr.io` sind bei einem privaten Repo ebenfalls privat.
2. Code hochladen (macht Claude, sobald GitHub in claude.ai verbunden ist).
3. Unter **Actions** prüfen, dass „Build images“ grün durchläuft. Danach gibt es unter
   *Packages* `napfdeal/web` und `napfdeal/worker`.

> **Server-Architektur prüfen:** `uname -m` auf dem VPS. Bei `x86_64` passt alles. Bei `aarch64` (ARM)
> in `.github/workflows/docker.yml` `platforms: linux/arm64` eintragen.

---

## 2. Domain über Cloudflare (DNS)

1. Bei Cloudflare die Domain `napfdeal.com` hinzufügen (Free-Plan reicht).
2. Beim Registrar die Nameserver auf die beiden von Cloudflare angezeigten umstellen.
3. DNS-Einträge in Cloudflare:

   | Typ   | Name  | Inhalt            | Proxy-Status            |
   |-------|-------|-------------------|-------------------------|
   | A     | `@`   | `159.195.109.20`  | **Nur DNS** (graue Wolke) |
   | CNAME | `www` | `napfdeal.com`    | **Nur DNS** (graue Wolke) |

**Warum „Nur DNS“?** Mit oranger Wolke liefen alle Besucher über Cloudflare (US-Unternehmen),
das müsste in die Datenschutzerklärung, und Caddy sähe nur Cloudflare-IPs. Mit grauer Wolke ist
Cloudflare nur das Telefonbuch; Caddy holt sich das HTTPS-Zertifikat selbst bei Let's Encrypt.

Optional, kostenlos: **Cloudflare Email Routing** leitet z. B. `hallo@napfdeal.com` an dein Gmail weiter.
Das brauchst du später als Absender für Brevo (siehe Abschnitt 7).

---

## 3. Server einrichten (Debian 12)

Alle Befehle als `root` auf dem VPS (`ssh root@159.195.109.20`).

### 3.1 System und Firewall

```bash
apt update && apt full-upgrade -y
apt install -y ca-certificates curl git gnupg rsync ufw unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades   # automatische Sicherheitsupdates: "Ja"
```

> **Server mit anderen Diensten:** Eine Firewall mit `default deny` sperrt alle Ports, die nicht ausdrücklich
> erlaubt sind. Vorher mit `ss -tlnp` nachsehen, welche Ports deine anderen Dienste brauchen, und die mit
> `ufw allow PORT/tcp` freigeben, **bevor** du `ufw enable` ausführst. napfdeal selbst braucht keinen offenen Port.

```bash
ufw default deny incoming
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
# ufw allow <weitere Ports deiner anderen Dienste>
ufw enable
```

Empfohlen: SSH nur noch mit Schlüssel. Erst prüfen, dass Login per Schlüssel klappt, dann in
`/etc/ssh/sshd_config` `PasswordAuthentication no` setzen und `systemctl restart ssh`.

### 3.2 Docker (offizielles Repo)

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker run --rm hello-world
```

### 3.3 Repo auf den Server holen (Deploy-Key, nur lesen)

```bash
ssh-keygen -t ed25519 -N "" -f /root/.ssh/napfdeal_deploy -C "napfdeal-server"
cat /root/.ssh/napfdeal_deploy.pub
```

Den ausgegebenen Schlüssel auf GitHub unter **Repo → Settings → Deploy keys → Add deploy key** eintragen
(„Allow write access“ **nicht** anhaken).

Eigener Host-Alias, damit sich der Schlüssel nicht mit Deploy-Keys anderer Projekte auf dem Server beißt:

```bash
printf '\nHost github-napfdeal\n  HostName github.com\n  User git\n  IdentityFile /root/.ssh/napfdeal_deploy\n  IdentitiesOnly yes\n' >> /root/.ssh/config
git clone git@github-napfdeal:DEIN-GITHUB-NAME/napfdeal.git /opt/napfdeal
```

### 3.4 Zugriff auf die privaten Images

Auf GitHub: **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate**,
nur Haken bei `read:packages`, Ablauf z. B. 1 Jahr.

```bash
echo "DEIN_TOKEN" | docker login ghcr.io -u DEIN-GITHUB-NAME --password-stdin
```

### 3.5 Konfiguration

```bash
cd /opt/napfdeal
cp .env.example .env
chmod 600 .env
openssl rand -base64 32 | tr -d '/+='   # → POSTGRES_PASSWORD (auch in DATABASE_URL eintragen)
nano .env
```

Mindestens setzen: `POSTGRES_PASSWORD`, `DATABASE_URL` (gleiches Passwort), `IMAGE_PREFIX=ghcr.io/dein-github-name/napfdeal` (**kleingeschrieben**).

Backup-Passwort anlegen und **zusätzlich in deinem Passwort-Manager speichern** (ohne dieses Passwort sind alle Backups wertlos):

```bash
openssl rand -base64 48 > /root/.napfdeal-backup-pass
chmod 600 /root/.napfdeal-backup-pass
cat /root/.napfdeal-backup-pass
```

### 3.5b Reverse Proxy: Server teilt sich 80/443 mit anderen Diensten

napfdeal läuft standardmäßig **ohne** eigenen Proxy. Die App hört nur auf `127.0.0.1:3100`
(von außen nicht erreichbar, Port über `WEB_PORT` in `.env` änderbar). Der Proxy, der auf deinem Server
schon 80/443 belegt, leitet `napfdeal.com` dorthin weiter:

| Vorhandener Proxy | Vorlage                         |
|-------------------|---------------------------------|
| nginx             | `deploy/nginx-napfdeal.conf` (+ `certbot --nginx`) |
| Caddy (direkt installiert) | `deploy/Caddyfile.snippet` |
| Caddy/nginx **in Docker** | `compose.edge.yaml` + in `.env` `COMPOSE_FILE=compose.yaml:compose.edge.yaml` und `EDGE_NETWORK=<Netzwerk des Proxys>`; im Proxy `reverse_proxy napfdeal-web:3000` |

Belegt nichts die Ports 80/443, kann napfdeal seinen eigenen Caddy mitbringen: in `.env`
`COMPOSE_PROFILES=caddy` setzen.

### 3.6 Starten und Autostart

```bash
cd /opt/napfdeal
docker compose pull
docker compose up -d
docker compose ps            # alle "running"/"healthy", migrate "exited (0)"
curl -s https://napfdeal.com/api/health/

cp deploy/napfdeal.service deploy/napfdeal-backup.service deploy/napfdeal-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable napfdeal.service napfdeal-backup.timer
systemctl start napfdeal-backup.timer
```

Caddy holt sich beim ersten Aufruf automatisch das Zertifikat. Voraussetzung: Der DNS-Eintrag aus Abschnitt 2 zeigt schon auf den Server.

### 3.7 Updates einspielen

Nachdem GitHub Actions grün ist:

```bash
/opt/napfdeal/scripts/deploy.sh
```

---

## 4. Backups (Hetzner Storage Box)

- Täglich um 03:15: `pg_dump`, verschlüsselt mit GPG (AES-256), lokal in `/var/backups/napfdeal`.
- Rotation: 30 Tage, lokal und auf der Storage Box (rsync `--delete`).

Einrichtung:

1. Bei Hetzner eine **Storage Box** bestellen (kleinste Größe reicht), in der Konsole **SSH-Support** aktivieren.
2. Schlüssel hinterlegen:
   ```bash
   ssh-keygen -t ed25519 -N "" -f /root/.ssh/id_ed25519   # falls noch keiner existiert
   cat /root/.ssh/id_ed25519.pub | ssh -p 23 uXXXXXX@uXXXXXX.your-storagebox.de install-ssh-key
   ssh -p 23 uXXXXXX@uXXXXXX.your-storagebox.de mkdir napfdeal
   ```
3. In `.env`: `STORAGEBOX_TARGET=uXXXXXX@uXXXXXX.your-storagebox.de:napfdeal`
4. Testen: `/opt/napfdeal/scripts/backup.sh`

**Restore testen** (einmal nach der Einrichtung, dann z. B. vierteljährlich):

```bash
/opt/napfdeal/scripts/restore.sh /var/backups/napfdeal/napfdeal-<zeitstempel>.dump.gpg
```

## 5. Umzug auf einen neuen VPS

1. Neuen Server nach Abschnitt 3.1 bis 3.4 vorbereiten (ohne 3.5/3.6).
2. Vom alten Server aus root-SSH auf den neuen ermöglichen (`ssh-copy-id root@NEUE-IP`).
3. Auf dem alten Server: `docker compose stop web worker` (damit nichts mehr geschrieben wird), dann
   ```bash
   /opt/napfdeal/scripts/migrate-server.sh NEUE-IP
   ```
4. In Cloudflare den A-Eintrag auf die neue IP ändern. Das Skript zeigt am Ende alle restlichen Schritte.

---

## 6. Awin-Bewerbung

Awin verlangt eine öffentlich erreichbare Website und empfiehlt, „Awin“ in den Quelltext zu schreiben.
Das ist erledigt: Jede Seite enthält

```html
<meta name="awin-verification" content="Awin">
```

(gesetzt in `src/app/layout.tsx`). Prüfen: `curl -s https://napfdeal.com/de/ | grep -i awin`

Vor dem Absenden der Bewerbung:
- [ ] napfdeal.com ist per HTTPS erreichbar
- [ ] Impressum, Datenschutz, „So verdienen wir Geld“ sind online
- [ ] Bei der Werbeart „Preisvergleich“ angeben; Länder DE und AT
- [ ] Wenn Awin eine eigene Verifizierungs-ID schickt: in `layout.tsx` als zusätzlichen Meta-Tag eintragen

Nach der Freischaltung: `AWIN_PUBLISHER_ID`, `AWIN_API_TOKEN`, `AWIN_FEED_KEY` in `.env` (Phase 1).

---

## 7. E-Mail (Brevo) – SPF, DKIM, DMARC

Wird ab Phase 3 gebraucht. Absender muss eine Adresse **@napfdeal.com** sein (nicht Gmail, sonst landen Mails im Spam).

1. Brevo-Konto anlegen → **Senders, Domains & Dedicated IPs → Domains → Add a domain** → `napfdeal.com`.
2. Brevo zeigt die nötigen Einträge an. In Cloudflare genau so anlegen (alle „Nur DNS“):
   - **Brevo-Code** (TXT auf `@`) zur Bestätigung
   - **DKIM** (die von Brevo angezeigten Einträge, meist auf `brevo1._domainkey` / `brevo2._domainkey`)
   - **SPF** (TXT auf `@`): `v=spf1 include:spf.brevo.com ~all`
     Es darf nur **einen** SPF-Eintrag geben. Nutzt du Cloudflare Email Routing, fügt Cloudflare seinen eigenen ein; dann beide `include:` in einen Eintrag zusammenführen.
   - **DMARC** (TXT auf `_dmarc`): zuerst `v=DMARC1; p=none; rua=mailto:napfdeal@gmail.com`,
     nach 2–4 Wochen ohne Probleme auf `p=quarantine`.
3. In Brevo „Authenticate“ klicken, bis alles grün ist.
4. SMTP-Zugang: **SMTP & API → SMTP** → Login und Schlüssel in `.env` (`SMTP_USER`, `SMTP_PASSWORD`),
   API-Schlüssel (für das Löschen von Kontakten) in `BREVO_API_KEY`.

---

## 7b. Konten: Secret, Google- und Discord-Login

**Pflicht** (ohne das startet die Anmeldung nicht):

```bash
cd /opt/napfdeal
grep -q '^BETTER_AUTH_SECRET=.' .env || sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 32)|" .env
grep -q '^BETTER_AUTH_SECRET=' .env || echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .env
docker compose up -d
```

Registrierung mit E-Mail braucht funktionierenden Mailversand (Abschnitt 7).

### Google (optional)

1. https://console.cloud.google.com → neues Projekt „napfdeal“.
2. **APIs & Dienste → OAuth-Zustimmungsbildschirm**: Typ „Extern“, App-Name „napfdeal“, Support-Mail, Logo (optional),
   App-Startseite `https://napfdeal.com`, Datenschutz `https://napfdeal.com/datenschutz/`,
   Nutzungsbedingungen `https://napfdeal.com/nutzungsbedingungen/`, autorisierte Domain `napfdeal.com`.
   Bereiche (Scopes): nur `openid`, `email`, `profile`. Danach **App veröffentlichen** (für diese Scopes ohne Google-Prüfung).
3. **Anmeldedaten → Anmeldedaten erstellen → OAuth-Client-ID**, Typ „Webanwendung“.
   - Autorisierte JavaScript-Quelle: `https://napfdeal.com`
   - Autorisierte Weiterleitungs-URI: `https://napfdeal.com/api/auth/callback/google`
4. Client-ID und Clientschlüssel in `.env` → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dann `docker compose up -d`.

### Discord (optional)

1. https://discord.com/developers/applications → **New Application** „napfdeal“.
2. **General Information**: App-Icon, Beschreibung, Terms of Service URL `https://napfdeal.com/nutzungsbedingungen/`,
   Privacy Policy URL `https://napfdeal.com/datenschutz/`.
3. **OAuth2**: Redirect `https://napfdeal.com/api/auth/callback/discord` hinzufügen.
   Scopes nutzt napfdeal nur `identify` und `email`.
4. Client ID und Client Secret (Reset Secret) in `.env` → `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, dann `docker compose up -d`.

Dieselbe Discord-Anwendung wird in Phase 4 auch die Discord-App für Preis-Alarme.

Gleiche, bestätigte E-Mail-Adresse = gleiches Konto: Wer sich erst mit E-Mail registriert und später „Weiter mit Google“
wählt, landet im selben Konto.

---

## 8. Lokale Entwicklung

```bash
npm install
docker compose -f compose.dev.yaml up -d
cp .env.example .env.local   # DATABASE_URL=postgres://napfdeal:napfdeal@localhost:5432/napfdeal
npm run dev                  # http://localhost:3000
npm run worker:dev           # zweites Terminal
```

> **Hinweis Lockfile:** Phase 0 wurde ohne Paket-Download geschrieben, es gibt noch keine `package-lock.json`.
> Der erste `npm install` erzeugt sie; danach committen, damit Builds reproduzierbar sind.

---

## Datenschutz-Grundsätze im Betrieb

- Keine Zugriffslogs mit IP-Adressen (Caddy ohne `log`-Block).
- Container-Logs werden von Docker auf 3 × 10 MB begrenzt.
- Keine externen Skripte, Schriften oder CDNs. CSP in `next.config.ts` erlaubt nur `'self'`.
- Backups: 30 Tage Rotation, verschlüsselt.
