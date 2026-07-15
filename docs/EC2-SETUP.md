# EC2 setup for the ikman scraper — full step-by-step

This guide walks through **every step** to run the Playwright scraper on Amazon EC2 with cron.

The Next.js app can stay on Vercel. Only the scrape **job** moves to EC2.

**Related:** [SCRAPER-HOSTING.md](./SCRAPER-HOSTING.md) (GitHub Actions limits and alternatives).

---

## Before you start

### What you need

| Item | Notes |
|------|--------|
| AWS account with billing/credits | You mentioned ~\$100 credit |
| GitHub access to this repo | Clone on the instance (public, deploy key, or PAT) |
| Supabase project URL + **service role** key | Same as GHA `SUPABASE_*` secrets |
| Telegram bot token | Same as GHA `TELEGRAM_BOT_TOKEN` |
| Laptop with SSH | Terminal (macOS/Linux) or Windows Terminal / WSL |
| ~30–45 minutes | First-time setup |

### What you will build

```
Internet
   │
   │  Inbound: SSH (port 22) from YOUR IP only
   ▼
┌─────────────────────────────────────┐
│  EC2 Ubuntu 24.04  ·  t3.small      │
│  /opt/ikman                         │
│  cron every 10 min + flock          │
│  npx tsx scraper/index.ts           │
└──────────────────┬──────────────────┘
                   │ Outbound HTTPS
                   ▼
         ikman.lk · Supabase · Telegram
```

### What does **not** change (Level 1)

| Area | Still where? |
|------|----------------|
| Next.js / Clerk / dashboard | Vercel (or wherever the app is) |
| Database | Supabase |
| Multi-user filters & alerts | Inside one scrape job already |
| Dashboard **Run Now** / Telegram `/scrape` | Still GitHub Actions (until you change code later) |

**No application code changes** are required for scheduled scraping on EC2.

---

## Progress checklist

Use this as you go:

- [ ] Step 0 — Billing alert  
- [ ] Step 1 — Choose region  
- [ ] Step 2 — Launch EC2 instance (name, AMI, type, key, network, storage)  
- [ ] Step 3 — Wait until instance is **Running**  
- [ ] Step 4 — (Optional) Elastic IP  
- [ ] Step 5 — SSH from your laptop  
- [ ] Step 6 — System packages  
- [ ] Step 7 — Install Node.js 22  
- [ ] Step 8 — Clone the repo  
- [ ] Step 9 — `npm ci` + Playwright  
- [ ] Step 10 — Create `.env`  
- [ ] Step 11 — Manual smoke test  
- [ ] Step 12 — Cron job  
- [ ] Step 13 — Disable GitHub Actions schedule  
- [ ] Step 14 — Verify scheduled runs  
- [ ] Step 15 — Hardening & backups of secrets  

---

## Step 0 — Set a billing alert (do this first)

So you do not burn the whole credit by accident.

1. Open [AWS Console](https://console.aws.amazon.com/).
2. Search for **Billing** → open **Billing and Cost Management**.
3. Left menu → **Budgets** → **Create budget**.
4. Choose **Use a template** → **Monthly cost budget** (or custom).
5. Example:
   - Budget name: `ikman-monthly`
   - Amount: `20` USD (first warning)
6. Add email for alerts (e.g. 50% and 100% of budget).
7. Create the budget.

Optional: create a second budget at `50` USD.

---

## Step 1 — Choose the AWS region

1. Top-right of the AWS Console: open the **region** dropdown.
2. Pick a region and stay on it for all later steps.

| Suggestion | Region code | When |
|------------|-------------|------|
| Asia (Singapore) | `ap-southeast-1` | Users / you in South/Southeast Asia |
| Asia (Mumbai) | `ap-south-1` | Closer to India/Sri Lanka sometimes |
| US East (N. Virginia) | `us-east-1` | Default; often cheapest |

Write down your choice: **Region = _______________**

---

## Step 2 — Launch the EC2 instance

### 2.1 Open the launch wizard

1. Search bar → type **EC2** → open **EC2**.
2. Confirm the region (top right) is still the one you chose.
3. Left menu → **Instances** → **Launch instances**.

### 2.2 Name

1. **Name and tags** → Name: `ikman-scraper`

### 2.3 Application and OS image (AMI)

1. Under **Application and OS Images (Amazon Machine Image)**:
2. Quick Start → **Ubuntu**.
3. AMI: **Ubuntu Server 24.04 LTS** (or 22.04 LTS if 24.04 is missing).
4. Architecture: **64-bit (x86)**  
   - Only pick **64-bit (Arm)** if you also pick a `t4g` instance type later.

### 2.4 Instance type

1. **Instance type** → open the dropdown.
2. Select **t3.small**  
   - **vCPUs:** 2  
   - **Memory:** 2 GiB  
3. Do **not** use `t3.micro` / `t2.micro` for Playwright (often runs out of memory).

If `t3.small` is unavailable in your region, use **t3a.small** or **t2.small** (still 2 GB RAM).

### 2.5 Key pair (login)

1. **Key pair (login)** → **Create new key pair** (if you do not already have one).
2. Fill in:
   - **Name:** `ikman-scraper-key`
   - **Key pair type:** RSA  
   - **Private key file format:**  
     - **`.pem`** — macOS / Linux / WSL / Windows OpenSSH  
     - **`.ppk`** — only if you use PuTTY  
3. Click **Create key pair**.
4. The file downloads automatically (e.g. `ikman-scraper-key.pem`).
5. **Store it safely** (password manager folder, not the git repo).
6. You cannot download it again later.

If you already have a key pair you use for AWS, select it instead of creating a new one.

### 2.6 Network settings (important)

Click **Edit** next to **Network settings**.

#### VPC and subnet

| Field | What to set |
|-------|-------------|
| **VPC** | Default VPC (or your only VPC) |
| **Subnet** | Any **public** subnet (name often includes `public`, or pick the first default subnet) |
| **Auto-assign public IP** | **Enable** |

Do **not** create a NAT Gateway. Do **not** put this instance in a private-only subnet for v1.

#### Firewall (security group)

1. Select **Create security group**.
2. **Security group name:** `ikman-scraper-sg`
3. **Description:** `SSH only for ikman scraper`

**Inbound security group rules** — you want **exactly one** rule for v1:

| Field | Value |
|-------|--------|
| Type | **SSH** |
| Protocol | TCP |
| Port range | **22** |
| Source type | **My IP** |
| Source | (auto-filled with your current public IP, e.g. `203.0.113.10/32`) |
| Description | `Admin SSH` |

**Remove** any extra rules that say:

- HTTP  
- HTTPS  
- All traffic  
- SSH from `0.0.0.0/0` (Anywhere)

**Outbound rules:** leave the default **Allow all traffic** to `0.0.0.0/0`.  
The scraper needs outbound HTTPS to ikman.lk, Supabase, Telegram, and package registries.

#### Summary of network choices

| Question | Your setting |
|----------|----------------|
| Public subnet? | Yes |
| Public IP? | Yes (auto-assign) |
| Inbound | SSH 22 from **My IP** only |
| Inbound 80/443 | **No** |
| Outbound | All allowed |
| Load balancer | None |

### 2.7 Configure storage

1. **Configure storage**
2. Size: **20** GiB (or **30** if you prefer headroom)
3. Volume type: **gp3**
4. Leave encryption as default (usually enabled)

### 2.8 Advanced details (optional but useful)

Expand **Advanced details** if you want:

| Field | Suggested |
|-------|-----------|
| **Shutdown behavior** | Stop |
| **Termination protection** | Enable (prevents accidental Terminate) |
| **Detailed CloudWatch monitoring** | Disable (saves a bit of money) |
| **IAM instance profile** | None for v1 |

You can skip everything else (user data, metadata options defaults are fine).

### 2.9 Review and launch

1. Right panel **Summary**:
   - Number of instances: **1**
   - Instance type: **t3.small**
   - Security group: **ikman-scraper-sg**
2. Click **Launch instance**.
3. Wait for success → click **View all instances** (or **Instances** in the left menu).

---

## Step 3 — Wait until the instance is running

1. **EC2 → Instances**.
2. Select instance **ikman-scraper**.
3. Wait until:
   - **Instance state** = `Running`
   - **Status checks** = `2/2 checks passed` (may take 1–2 minutes)
4. Copy **Public IPv4 address** from the details panel.  
   Example: `54.169.xxx.xxx`

Write it down: **Public IP = _______________**

If public IP is blank:

- Instance may still be starting, or  
- Auto-assign public IP was off → fix by allocating an Elastic IP (Step 4) or recreate with auto-assign **Enable**.

---

## Step 4 — (Optional) Allocate an Elastic IP

Do this if you want the public IP to **stay the same** after Stop/Start.

1. Left menu → **Network & Security** → **Elastic IPs**.
2. **Allocate Elastic IP address** → leave defaults → **Allocate**.
3. Select the new address → **Actions** → **Associate Elastic IP address**.
4. Resource type: **Instance**
5. Instance: **ikman-scraper**
6. Private IP: default  
7. **Associate**
8. Copy the Elastic IP — use this as your SSH address from now on.

**Billing note:** Elastic IP is free while associated with a **running** instance. You can be charged if it sits unattached.

---

## Step 5 — SSH into the instance from your laptop

### 5.1 Fix key permissions (macOS / Linux / WSL)

In the folder where you saved the key:

```bash
chmod 400 ikman-scraper-key.pem
```

If permissions are too open, SSH refuses the key.

### 5.2 Connect

Replace the IP and path:

```bash
ssh -i /path/to/ikman-scraper-key.pem ubuntu@PUBLIC_IP
```

Example:

```bash
ssh -i ~/Downloads/ikman-scraper-key.pem ubuntu@54.169.12.34
```

First connection prompt:

```text
Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and Enter.

You should see an Ubuntu prompt, e.g.:

```text
ubuntu@ip-172-31-xx-xx:~$
```

### 5.3 If SSH fails

| Error | Fix |
|-------|-----|
| `Permission denied (publickey)` | Wrong key file, wrong user (must be `ubuntu`), or wrong instance |
| `Connection timed out` | Security group not allowing your IP; confirm **My IP** and that you are not on VPN with a different egress IP |
| `WARNING: UNPROTECTED PRIVATE KEY FILE` | Run `chmod 400` on the `.pem` |
| IP changed after stop/start | Use new public IP or attach Elastic IP (Step 4) |

Update security group if your IP changed:

1. EC2 → **Security Groups** → `ikman-scraper-sg`
2. **Inbound rules** → **Edit**
3. SSH source → **My IP** again → **Save**

---

## Step 6 — Update the OS and install base packages

On the EC2 instance (SSH session):

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl ca-certificates build-essential
```

Confirm tools:

```bash
git --version
curl --version
```

---

## Step 7 — Install Node.js 22

Use Node **22** (same major version as GitHub Actions).

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v    # expect v22.x.x
npm -v     # expect 10.x on many Node 22 builds
```

---

## Step 8 — Clone the repository

### 8.1 Create app directory

```bash
sudo mkdir -p /opt/ikman
sudo chown "$USER:$USER" /opt/ikman
cd /opt/ikman
```

### 8.2 Clone

**If the repo is public:**

```bash
git clone https://github.com/sampath-kumaramd/ikman.git .
```

**If the repo is private — option A: HTTPS + fine-grained or classic PAT (read-only)**

1. GitHub → Settings → Developer settings → Personal access tokens  
2. Create a token with **Contents: Read** on this repo only  
3. Clone (GitHub will prompt for username + token as password, or embed carefully):

```bash
git clone https://github.com/sampath-kumaramd/ikman.git .
# Username: your-github-username
# Password: paste the PAT (not your GitHub password)
```

Prefer not leaving the token in shell history; use a deploy key when you can.

**If the repo is private — option B: deploy key (recommended)**

On the EC2 instance:

```bash
ssh-keygen -t ed25519 -C "ikman-ec2-deploy" -f ~/.ssh/ikman_deploy -N ""
cat ~/.ssh/ikman_deploy.pub
```

1. Copy the **public** key output.  
2. GitHub repo → **Settings** → **Deploy keys** → **Add deploy key**  
3. Title: `ec2-ikman-scraper`  
4. Paste the public key  
5. Leave **Allow write access** unchecked (read-only)  
6. Add key  

Configure SSH for GitHub on the instance:

```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/ikman_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config ~/.ssh/ikman_deploy
```

Clone via SSH:

```bash
cd /opt/ikman
git clone git@github.com:sampath-kumaramd/ikman.git .
```

### 8.3 Confirm files

```bash
ls -la
# expect: package.json  package-lock.json  scraper/  app/  ...
```

---

## Step 9 — Install npm dependencies and Playwright

Still in `/opt/ikman`:

```bash
cd /opt/ikman
npm ci
```

If `npm ci` fails with **package.json and package-lock.json are not in sync**:

1. On your laptop (with npm 10 if possible): fix and push the lockfile  
2. On EC2: `git pull` and run `npm ci` again  

Install Chromium system libraries and browser:

```bash
sudo npx playwright install-deps chromium
npx playwright install chromium
```

This can take several minutes and downloads a large browser binary.

Quick check:

```bash
npx playwright --version
ls ~/.cache/ms-playwright
```

---

## Step 10 — Create the environment file

### 10.1 Gather secrets

From Supabase / GitHub Actions secrets / Vercel (same values the scrape workflow uses):

| Variable | Required | Where to find |
|----------|----------|----------------|
| `SUPABASE_URL` | Yes | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase → API → `service_role` secret (**not** `anon`) |
| `TELEGRAM_BOT_TOKEN` | Recommended | BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | Optional | Your admin chat id for scrape progress |

You may use `NEXT_PUBLIC_SUPABASE_URL` instead of `SUPABASE_URL`; the scraper accepts either.

### 10.2 Write `.env`

```bash
cd /opt/ikman
nano .env
```

Paste (replace placeholders):

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

TELEGRAM_BOT_TOKEN=123456789:AA...
TELEGRAM_ADMIN_CHAT_ID=
```

Save in nano: `Ctrl+O`, Enter, then `Ctrl+X`.

### 10.3 Lock down permissions

```bash
chmod 600 /opt/ikman/.env
ls -la /opt/ikman/.env
# expect: -rw-------  (only owner can read/write)
```

**Never** commit `.env` to git. **Never** put the service role key in a public gist or chat.

---

## Step 11 — Manual smoke test

Load env and run the scraper once:

```bash
cd /opt/ikman
set -a
source .env
set +a

npx tsx scraper/index.ts
```

### Success looks like

- Terminal prints steps (users found, scraped N listings, etc.)
- Supabase table **`scrape_runs`** gets a new row (`running` → `done` or `failed`)
- If there are new matching listings and Telegram is configured, users get messages

### Common failures

| Message / symptom | Fix |
|-------------------|-----|
| `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY` | `.env` not loaded or wrong names |
| DB / JWT errors | Wrong service role key or URL |
| Browser launch errors | Re-run Playwright install-deps / install chromium |
| Killed / out of memory | Upgrade to **t3.medium** or reduce load |
| `No onboarded users yet` | Onboard at least one user in the app first |

Only continue to cron after a successful manual run (or a clean “no users / no new listings” exit without crash).

---

## Step 12 — Schedule with cron

### 12.1 Install the wrapper script (recommended)

The repo includes `scripts/run-scrape.sh` (flock + **timeout** so a long first
run cannot block every later cron).

```bash
cd /opt/ikman
git pull --ff-only origin master
chmod +x /opt/ikman/scripts/run-scrape.sh
```

Optional env (in `.env` or crontab):

| Variable | Default | Meaning |
|----------|---------|---------|
| `SCRAPE_TIMEOUT_SEC` | `720` (12 min) | Kill hung/long scrapes |
| `SCRAPE_MAX_PAGES` | `2` | Pages per area×type |
| `MAX_DETAIL_FETCHES` | `40` | Max detail-page fetches per run |

Test:

```bash
/opt/ikman/scripts/run-scrape.sh
```

#### “scrape already running — skip” forever

That means **flock** still sees a live process (or a zombie scrape). Multi-user
first runs can take a long time (many areas × types × detail pages).

```bash
# See what holds the lock
fuser -v /tmp/ikman-scrape.lock
ps aux | grep -E 'tsx|chromium|playwright' | grep -v grep

# If stuck > 15–20 min, kill it so the next cron can run
pkill -f 'tsx scraper/index.ts' || true
# Chromium children usually exit after the parent dies

# Confirm lock is free
fuser /tmp/ikman-scrape.lock || echo "lock free"
```

Then pull the timeout wrapper and restart cron.

### 12.2 Install the cron job

```bash
crontab -e
```

If asked to choose an editor, pick `nano`.

Add **one** of these lines at the bottom:

**Every 10 minutes (recommended start):**

```cron
*/10 * * * * /opt/ikman/scripts/run-scrape.sh >> /home/ubuntu/scrape.log 2>&1
```

**Every 5 minutes (after you confirm runs usually finish under 5 minutes):**

```cron
*/5 * * * * /opt/ikman/scripts/run-scrape.sh >> /home/ubuntu/scrape.log 2>&1
```

**Every 15 minutes (matches old GHA / UI cooldown):**

```cron
*/15 * * * * /opt/ikman/scripts/run-scrape.sh >> /home/ubuntu/scrape.log 2>&1
```

Save and exit.

Confirm crontab:

```bash
crontab -l
```

### 12.3 Watch logs

```bash
touch /home/ubuntu/scrape.log
tail -f /home/ubuntu/scrape.log
```

Wait for the next interval (or run the script once manually again).  
`Ctrl+C` to stop following the log.

### 12.4 Optional — rotate logs

```bash
sudo nano /etc/logrotate.d/ikman-scrape
```

```text
/home/ubuntu/scrape.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
  copytruncate
}
```

---

## Step 13 — Disable the GitHub Actions schedule

If GHA and EC2 both scrape, you double-run and waste Actions minutes.

### 13.1 Edit the workflow (on your laptop, in the repo)

File: [`.github/workflows/scrape.yml`](../.github/workflows/scrape.yml)

Change:

```yaml
on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:
```

To:

```yaml
on:
  # schedule disabled — scraper runs on EC2 (see docs/EC2-SETUP.md)
  # schedule:
  #   - cron: '*/15 * * * *'
  workflow_dispatch:
```

### 13.2 Commit and push

```bash
git add .github/workflows/scrape.yml
git commit -m "Disable GHA scrape schedule; scraper runs on EC2"
git push origin master
```

### 13.3 Confirm in GitHub

1. Repo → **Actions** → **Scrape ikman.lk**  
2. Scheduled runs should stop after the change is on the default branch  
3. **Run workflow** (manual) still works if you keep `workflow_dispatch`

---

## Step 14 — End-to-end verification

After the next cron tick (or a manual script run):

| Check | How |
|-------|-----|
| Cron installed | `crontab -l` shows the line |
| Log growing | `tail -20 /home/ubuntu/scrape.log` |
| DB progress | Supabase → `scrape_runs` recent row |
| Listings | New rows in listings table when ikman has new posts |
| Telegram | Matching users receive alerts when enabled |
| No double schedule | GHA Actions tab shows no new scheduled runs |

Optional from laptop: SSH and run:

```bash
free -h
df -h
```

Ensure disk and memory look healthy after a scrape.

---

## Step 15 — Hardening and ongoing ops

### 15.1 Security

- [ ] Security group still **SSH / My IP only**  
- [ ] No inbound 80/443 unless you deliberately add a webhook later  
- [ ] `.env` is `chmod 600`  
- [ ] Deploy key is **read-only** if used  
- [ ] `.pem` file is not in Dropbox/public folders / git  
- [ ] Billing budget alert active  

### 15.2 When your home IP changes

1. EC2 → Security Groups → `ikman-scraper-sg`  
2. Edit inbound SSH → **My IP** → Save  
3. SSH again  

### 15.3 Update the scraper code on EC2

```bash
cd /opt/ikman
git pull --ff-only origin master
npm ci
# If package.json playwright version changed:
# sudo npx playwright install-deps chromium
# npx playwright install chromium
```

### 15.4 Stop / start / terminate (cost control)

| Action | Effect |
|--------|--------|
| **Stop** | No compute charges; EBS still billed; public IP may change unless Elastic IP |
| **Start** | Resume; re-check IP if no Elastic IP |
| **Terminate** | Deletes the instance; data on the root volume is lost unless you snapshotted |

### 15.5 Optional: pull latest code on a schedule

Only if you trust `master` and want auto-updates (optional; many people skip this):

```cron
0 4 * * * cd /opt/ikman && git pull --ff-only origin master && npm ci >> /home/ubuntu/scrape-deploy.log 2>&1
```

---

## What about dashboard “Run Now”?

After this setup:

| Trigger | Runs on |
|---------|---------|
| Cron on EC2 | **EC2** |
| Dashboard **Run Now** | **GitHub Actions** (unchanged) |
| Telegram `/scrape` | **GitHub Actions** (unchanged) |

That is fine for Level 1. Pointing Run Now at EC2 needs a small code change later (`lib/trigger-scrape.ts` + an authenticated trigger on the instance). Not required for frequent scheduled scrapes.

---

## Troubleshooting

| Symptom | Steps |
|---------|--------|
| Cannot SSH | Security group My IP; `chmod 400` key; user `ubuntu`; correct public IP |
| `npm ci` lockfile error | Fix lockfile on laptop with npm 10; push; `git pull` on EC2 |
| Playwright / browser errors | Re-run `install-deps` and `install chromium`; check `free -h` |
| Process killed | Instance too small → **t3.medium** |
| Cron not running | `crontab -l`; check system time `date`; log file path writable |
| `scrape already running — skip` always | Previous run stuck/hung; check `ps aux \| grep tsx`; kill if needed; fix hang |
| No Telegram | Token, user chat id, `notifications_enabled` |
| Wrong project data | `.env` points at wrong Supabase project |

---

## Quick reference card

```bash
# SSH
ssh -i ikman-scraper-key.pem ubuntu@PUBLIC_IP

# App paths
/opt/ikman
/opt/ikman/.env
/opt/ikman/scripts/run-scrape.sh
/home/ubuntu/scrape.log
/tmp/ikman-scrape.lock

# Manual run
/opt/ikman/scripts/run-scrape.sh

# Follow logs
tail -f /home/ubuntu/scrape.log
```

| AWS resource | Name |
|--------------|------|
| Instance | `ikman-scraper` |
| Security group | `ikman-scraper-sg` |
| Key pair | `ikman-scraper-key` |
| Instance type | `t3.small` |
| AMI | Ubuntu 24.04 LTS |

---

## Suggested order if you only have one hour

1. Step 0 budget → Step 1 region → Step 2 launch (network as documented)  
2. Step 5 SSH → Steps 6–11 install and smoke test  
3. Step 12 cron every **10** minutes  
4. Step 13 disable GHA schedule  
5. Step 14 verify once in Supabase  

Done: scheduled multi-user scrapes on EC2 without burning GitHub Actions minutes.
