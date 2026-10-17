# Свой Icecast «как у gtaradio.net» — рецепт и конфиги

Цель: поддомен `audio.твой-домен.ru`, на нём маунты `/v/rock`, `/sa/rls` и т.д. —
живые 24/7-потоки, которые наш сайт играет через `{ type: "stream", src: "https://audio.твой-домен.ru/v/rock" }`.

> Напоминание: транслировать можно только ту музыку, на которую у тебя есть права
> (свои миксы, CC-лицензии, собственные записи). Публичный стрим чужого саундтрека —
> тот самый риск, который ты принимаешь осознанно; технически это ничем не отличается
> от любого другого интернет-радио.

## 1. Сервер

Любой VPS за ~300–500 ₽/мес (Ubuntu 22.04+, 1 vCPU / 1 GB хватит на десятки слушателей).
Нужен домен (или бесплатный поддомен) + Let's Encrypt для HTTPS: браузеры не дают
стримить с http-страницы https-сайта (mixed content).

```bash
sudo apt update && sudo apt install -y icecast2 liquidsoap ffmpeg certbot python3-certbot-nginx nginx
```

## 2. Icecast (`/etc/icecast2/icecast.xml`) — ключевые места

Полный образец: `icecast.xml.sample` рядом. Суть:

```xml
<hostname>audio.твой-домен.ru</hostname>
<listen-socket><port>8000</port></listen-socket>
<!-- CORS: без этого браузер сайтa не даст читать поток/метаданные -->
<http-headers>
  <header name="Access-Control-Allow-Origin" value="*" />
</http-headers>
<source-password>ПАРOЛЬ_ИСТОЧНИКА</source-password>   <!-- им source-клиент льёт эфир -->
<admin-password>…</admin-password>
```

Маунты создаются сами, когда liquidsoap подключается как source к `/v/rock` и т.д.

## 3. Liquidsoap: автодиджей на каждую станцию (`/etc/liquidsoap/radio.liq`)

Образец: `radio.liq.sample`. Одна станция = плейлист папки + джинглы + нормализация:

```liquidsoap
def mk(id, dir) =
  output.icecast(
    %mp3(bitrate=192), host="127.0.0.1", port=8000,
    password="ПАРOЛЬ_ИСТОЧНИКА", mount="/" ^ id,
    mksafe(normalize(replaygain(playlist(mode="randomize", reload=3600, dir))))
  )
end
mk("v/rock",   "/srv/radio/v-rock")
mk("sa/rls",   "/srv/radio/sa-rls")
# …по станции на папку
```

`mksafe` = тишина-заглушка, если папка пуста; `replaygain` = ровная громкость треков.

## 4. Nginx + HTTPS

```nginx
server {
  server_name audio.твой-домен.ru;
  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_buffering off;              # потоки не буферизуем
    add_header Access-Control-Allow-Origin "*" always;
  }
}
```
`sudo certbot --nginx -d audio.твой-домен.ru` — сертификат сам.

## 5. Подключить к сайту

В `js/config.js` у станции:

```js
tracks: [ { type: "stream", src: "https://audio.твой-домен.ru/v/rock" } ]
```

Всё: HUD покажет бейдж **LIVE**, эквалайзер поедет, а переключение станций будет
с нашим фирменным свипом. Метаданные «сейчас играет» Icecast отдаёт на
`/status-json.xsl` — при желании дотянем (скажи — добавлю парсер).

---

# «Одно радио на всех» БЕЗ сервера (уже встроено в сайт)

Если VPS не нужен, сайт умеет синхронизировать mp3-плейлисты по epoch-времени:

- позиция эфира = `Date.now()/1000 % сумма_длительностей_треков`;
- каждый посетитель стартует тот же трек на той же секунде и подтягивается при дрейфе > 0.9 c;
- демо-музыка тоже синхронна: фаза тактов и «название трека» привязаны к epoch;
- бейдж **SYNC** в HUD означает «все слушают это же сейчас».

Требование: у треков должна читаться длительность (обычные mp3 — читается).
Ограничение: это синхронизация плейлиста, а не живого диджея — но для радио из
игр большего и не нужно.
