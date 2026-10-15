#!/usr/bin/env python3
"""Публикация сайта в GitHub + включение Pages одним запуском.

Использование:
    python3 tools/publish.py <файл-с-токеном> [имя-репозитория]

Делает:
  1. читает токен (fine-grained PAT: Contents RW + Pages RW),
  2. узнаёт имя пользователя через API,
  3. создаёт репозиторий, если его ещё нет (public),
  4. пушит ветку main,
  5. включает GitHub Pages (build_type: workflow),
  6. ждёт первый успешный деплой и печатает URL сайта.

Токен нигде не коммитится: передаётся только в окружении процессов,
а remote после пуша возвращается к адресу без токена.
"""
import json, os, subprocess, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://api.github.com"


def api(path, token, method="GET", body=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "gta-radio-publish")
    if body is not None:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(body).encode()
    else:
        data = None
    with urllib.request.urlopen(req, data) as r:
        raw = r.read()
        return json.loads(raw) if raw else {}


def git(*args, env=None):
    e = dict(os.environ)
    if env:
        e.update(env)
    return subprocess.run(["git", *args], cwd=ROOT, env=e, check=True,
                          capture_output=True, text=True).stdout.strip()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    token = open(sys.argv[1]).read().strip()
    repo = sys.argv[2] if len(sys.argv) > 2 else "GTA-Radio"

    me = api("/user", token)
    user = me["login"]
    print("→ пользователь:", user)

    # 1. репозиторий
    try:
        info = api(f"/repos/{user}/{repo}", token)
        print("→ репозиторий уже есть:", info["html_url"], "(приватность:", info["private"], ")")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        info = api("/user/repos", token, "POST", {"name": repo, "public": True,
                                                  "description": "GTA RADIO — фанатский концепт-сайт с радиостанциями из игр серии",
                                                  "has_issues": False, "has_wiki": False})
        print("→ создан репозиторий:", info["html_url"])

    # 2. пуш
    dirty = git("status", "--porcelain")
    if dirty:
        git("add", "-A")
        git("commit", "-m", "update " + time.strftime("%Y-%m-%d %H:%M"))
    remote = f"https://{user}:{token}@github.com/{user}/{repo}.git"
    try:
        git("remote", "remove", "origin")
    except subprocess.CalledProcessError:
        pass
    git("remote", "add", "origin", remote)
    print("→ пушу main …")
    git("push", "-u", "origin", "main")
    git("remote", "set-url", "origin", f"https://github.com/{user}/{repo}.git")  # токен из конфига вон
    print("→ пуш готов, токен из remote убран")

    # 3. Pages
    try:
        pg = api(f"/repos/{user}/{repo}/pages", token)
        print("→ Pages уже включён:", pg.get("html_url"))
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise
        api(f"/repos/{user}/{repo}/pages", token, "POST", {"build_type": "workflow"})
        print("→ Pages включён (source: GitHub Actions)")

    # 4. ждём деплой
    url = f"https://{user}.github.io/{repo}/"
    for i in range(40):
        time.sleep(6)
        try:
            runs = api(f"/repos/{user}/{repo}/actions/runs?per_page=1", token)["workflow_runs"]
            st = runs[0]["conclusion"] if runs and runs[0].get("conclusion") else runs[0]["status"] if runs else "…"
            print(f"   workflow: {st}")
            if st == "success":
                break
        except Exception as ex:
            print("   …", ex)
    print("\n✅ Сайт должен быть здесь:", url)
    print("   (если 404 — подожди минуту-две и обнови; статус: Settings → Pages)")


if __name__ == "__main__":
    main()
