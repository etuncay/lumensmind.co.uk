# Ubuntu + nginx — Lumensmind (3 site)

Monorepo içindeki statik siteleri tek sunucuda nginx ile yayınlama.

| Alan adı | Paket dizini | nginx `root` | Ek alias |
|----------|--------------|--------------|----------|
| `lumensmind.co.uk`, `www` | `lumensmind.co.uk/` | `pages/` | `/export/`, `/assets/` |
| `game-company.lumensmind.co.uk` | `game-company.lumensmind.co.uk/` | `pages/` | `/export/` |
| `admin-panel.lumensmind.co.uk` | `admin-panel.lumensmind.co.uk/` | `pages/` | `/export/`, `/favicon.ico` |

### Domain açıldığında (`/`)

HTML dosyaları `pages/` altında; linkler `./…` ve `../export/…` ile **URL’de `/pages` öneki olmadan** yazılmıştır.

| Site | `https://domain/` | Örnek alt sayfa |
|------|-------------------|-----------------|
| Marketing | `pages/index.html` (ana sayfa, spec: route `/`) | `/6.pricing.html` → `pages/6.pricing.html` |
| Game company | `pages/index.html` (giriş) | `/3.dashboard.html` → demo panel |
| Admin | `pages/index.html` → hemen `1.1.admin-sign-in.html` yönlendirmesi | `/2.admin-shell.html` vb. |

CSS/JS ve Next çıktısı `pages` içinden `../export/…` ile istenir; nginx bunu `/export/…` alias ile sunar.

## Gereksinimler

- Ubuntu 22.04 / 24.04 LTS
- DNS kayıtları sunucu IP’sine yönlendirilmiş
- SSH erişimi

## Tek betik

Tüm işlemler `deploy/lumensmind.sh` üzerinden yapılır.

### Sunucuda ilk kurulum

```bash
export GIT_REMOTE="https://github.com/KULLANICI/lumensmind.co.uk.git"  # veya SSH URL
sudo mkdir -p /home/sites
cd /home/sites/lumensmind.co.uk   # clone sonrası
sudo bash deploy/lumensmind.sh setup
```

`REPO_DIR` varsayılanı: `/home/sites/lumensmind.co.uk`

### Sunucuda güncelleme (git pull)

```bash
cd /home/sites/lumensmind.co.uk
sudo bash deploy/lumensmind.sh sync
```

### Yerel makineden rsync

```bash
bash deploy/lumensmind.sh push user@SUNUCU
```

## HTTPS (Let's Encrypt)

DNS kayıtları sunucuya işaret ettikten sonra (HTTP siteleri zaten açılıyor olmalı):

```bash
sudo CERTBOT_EMAIL=admin@lumensmind.co.uk bash deploy/lumensmind.sh https
```

Tek sertifika, dört host adı: `lumensmind.co.uk`, `www`, `game-company…`, `admin-panel…`. Certbot HTTP → HTTPS yönlendirmesi ekler.

`sync` repo nginx şablonunu yazdıktan sonra mevcut sertifikayı `certbot install` ile nginx'e geri yükler (TLS silinmez).

Sertifika yenileme otomatik (`certbot renew`). Test:

```bash
sudo certbot renew --dry-run
```

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `deploy/lumensmind.sh` | Kurulum, sync, https ve push |
| `deploy/nginx/lumensmind.conf` | Üç site için nginx config şablonu |

## Sorun giderme

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/lumensmind.co.uk.error.log
sudo tail -f /var/log/nginx/game-company.lumensmind.co.uk.error.log
sudo tail -f /var/log/nginx/admin-panel.lumensmind.co.uk.error.log
```

Sayfa 404 veriyorsa `export/` ve `pages/` dizinlerinin repoda güncel olduğundan emin olun.

## Güvenlik duvarı

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
