#!/usr/bin/env bash
# Lumensmind monorepo — tek deploy betiği (3 site)
#
# Sunucu (ilk kurulum):  sudo bash deploy/lumensmind.sh setup
# Sunucu (güncelleme):   sudo bash deploy/lumensmind.sh sync
# Yerel → sunucu:        bash deploy/lumensmind.sh push user@SUNUCU
#
# Ortam değişkenleri:
#   REPO_DIR   — sunucudaki repo yolu (varsayılan: /home/sites/lumensmind.co.uk)
#   GIT_REMOTE — git clone/pull adresi (setup/sync için)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_REPO="$(cd "${SCRIPT_DIR}/.." && pwd)"

REPO_DIR="${REPO_DIR:-/home/sites/lumensmind.co.uk}"
NGINX_AVAILABLE="/etc/nginx/sites-available/lumensmind.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/lumensmind.conf"

SITE_PACKAGES=(
  lumensmind.co.uk
  game-company.lumensmind.co.uk
  admin-panel.lumensmind.co.uk
)

usage() {
  cat <<'EOF'
Kullanım:
  sudo bash deploy/lumensmind.sh setup     Sunucuda nginx + site dosyaları (ilk kurulum)
  sudo bash deploy/lumensmind.sh sync      Sunucuda git pull + izinler + nginx reload
  bash deploy/lumensmind.sh push USER@HOST Yerel repoyu rsync ile sunucuya gönder

Ortam:
  REPO_DIR=/home/sites/lumensmind.co.uk
  GIT_REMOTE=https://github.com/KULLANICI/lumensmind.co.uk.git
EOF
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "HATA: Bu komut root veya sudo ile çalıştırılmalı."
    exit 1
  fi
}

install_nginx_config() {
  local template="${SCRIPT_DIR}/nginx/lumensmind.conf"
  if [[ ! -f "${template}" ]]; then
    echo "HATA: ${template} bulunamadı."
    exit 1
  fi
  sed "s|__REPO_DIR__|${REPO_DIR}|g" "${template}" > "${NGINX_AVAILABLE}"
  ln -sf "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
  rm -f /etc/nginx/sites-enabled/default
}

fix_permissions() {
  chown -R www-data:www-data "${REPO_DIR}"
  find "${REPO_DIR}" -type d -exec chmod 755 {} \;
  find "${REPO_DIR}" -type f -exec chmod 644 {} \;
}

verify_site_trees() {
  local pkg missing=0
  for pkg in "${SITE_PACKAGES[@]}"; do
    if [[ ! -f "${REPO_DIR}/${pkg}/pages/index.html" ]]; then
      echo "HATA: ${REPO_DIR}/${pkg}/pages/index.html yok."
      missing=1
    fi
  done
  if [[ "${missing}" -ne 0 ]]; then
    exit 1
  fi
}

cmd_setup() {
  require_root

  echo "==> Paketler kuruluyor..."
  apt update
  apt install -y nginx git rsync

  echo "==> Repo dizini: ${REPO_DIR}"
  mkdir -p "$(dirname "${REPO_DIR}")"

  if [[ ! -d "${REPO_DIR}/.git" ]]; then
    if [[ -z "${GIT_REMOTE:-}" ]]; then
      echo "HATA: Repo yok. GIT_REMOTE tanımlayın veya dosyaları ${REPO_DIR} altına kopyalayın."
      exit 1
    fi
    echo "==> Git clone: ${GIT_REMOTE}"
    git clone "${GIT_REMOTE}" "${REPO_DIR}"
  fi

  if [[ ! -f "${REPO_DIR}/lumensmind.co.uk/pages/index.html" ]] && [[ -f "${LOCAL_REPO}/lumensmind.co.uk/pages/index.html" ]]; then
    echo "==> Yerel dosyalar ${REPO_DIR} altına kopyalanıyor..."
    rsync -a --delete \
      --exclude '.git' \
      --exclude '.DS_Store' \
      "${LOCAL_REPO}/" "${REPO_DIR}/"
  fi

  verify_site_trees

  echo "==> İzinler..."
  fix_permissions

  echo "==> nginx site config..."
  install_nginx_config

  echo "==> nginx test + reload..."
  nginx -t
  systemctl enable nginx
  systemctl reload nginx

  echo ""
  echo "Kurulum tamamlandı."
  echo "  Repo    : ${REPO_DIR}"
  echo "  Config  : ${NGINX_AVAILABLE}"
  echo ""
  echo "Siteler:"
  echo "  http://lumensmind.co.uk/"
  echo "  http://game-company.lumensmind.co.uk/"
  echo "  http://admin-panel.lumensmind.co.uk/"
  echo ""
  echo "HTTPS (DNS hazırsa):"
  echo "  apt install -y certbot python3-certbot-nginx"
  echo "  certbot --nginx -d lumensmind.co.uk -d www.lumensmind.co.uk"
  echo "  certbot --nginx -d game-company.lumensmind.co.uk"
  echo "  certbot --nginx -d admin-panel.lumensmind.co.uk"
}

cmd_sync() {
  require_root

  if [[ ! -d "${REPO_DIR}" ]]; then
    echo "HATA: ${REPO_DIR} yok. Önce: sudo bash deploy/lumensmind.sh setup"
    exit 1
  fi

  if [[ -d "${REPO_DIR}/.git" ]]; then
    echo "==> Git pull..."
    cd "${REPO_DIR}"
    sudo -u www-data git pull --ff-only
  else
    echo "Uyarı: ${REPO_DIR}/.git yok; git pull atlandı."
  fi

  verify_site_trees

  echo "==> nginx config güncelleniyor..."
  install_nginx_config

  echo "==> İzinler..."
  fix_permissions

  echo "==> nginx test + reload..."
  nginx -t
  systemctl reload nginx

  echo "Güncelleme tamamlandı: $(date)"
}

cmd_push() {
  local target="${1:-}"
  if [[ -z "${target}" ]]; then
    echo "HATA: push için SSH hedefi gerekli. Örnek: bash deploy/lumensmind.sh push user@sunucu"
    exit 1
  fi

  echo "==> rsync → ${target}:${REPO_DIR}/"
  rsync -avz --delete \
    --exclude '.git' \
    --exclude '.DS_Store' \
    "${LOCAL_REPO}/" "${target}:${REPO_DIR}/"

  echo "==> Sunucuda izinler + nginx reload..."
  ssh "${target}" "sudo chown -R www-data:www-data '${REPO_DIR}' && sudo bash '${REPO_DIR}/deploy/lumensmind.sh' sync"

  echo "Push tamamlandı."
}

main() {
  local cmd="${1:-}"
  case "${cmd}" in
    setup) cmd_setup ;;
    sync) cmd_sync ;;
    push) cmd_push "${2:-}" ;;
    -h|--help|help|"") usage ;;
    *)
      echo "Bilinmeyen komut: ${cmd}"
      usage
      exit 1
      ;;
  esac
}

main "$@"
