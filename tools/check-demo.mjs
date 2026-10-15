/* Проверка single-file демо: file:// (без сети) и http:// */
import { chromium } from 'playwright-core';
const EXE='/tmp/.cache/ms-playwright/chromium-1148/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: EXE, args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
for (const base of ['file://'+process.cwd()+'/demo.html', 'http://127.0.0.1:8123/demo.html']) {
  const errs=[];
  const p = await b.newPage({ viewport:{width:1280,height:800} });
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,140)); });
  p.on('pageerror', e=>errs.push('PAGEERROR '+e.message.slice(0,140)));
  await p.goto(base, {waitUntil:'load'});
  await p.waitForTimeout(800);
  const games = await p.locator('a.game').count();
  // клик по карточке V
  await p.click('a.game[href*="game=v"]');
  await p.waitForTimeout(2300);
  const s1 = await p.evaluate(()=>({
    radioVisible: !document.getElementById('screenRadio').hidden,
    homeHidden: document.getElementById('screenHome').hidden,
    mode: window.radioAudio.mode,
    ctx: window.radioAudio.ctx ? window.radioAudio.ctx.state : 'none',
    hud: document.querySelector('#hudName').textContent,
  }));
  // смена волны
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(900);
  const hud2 = await p.locator('#hudName').textContent();
  // назад на главную
  await p.click('#btnBack');
  await p.waitForTimeout(600);
  const backHome = await p.evaluate(()=>!document.getElementById('screenHome').hidden && document.getElementById('screenRadio').hidden);
  // вход по хэшу
  await p.goto(base + (base.includes('?')?'&':'?') + 'x=1#game=sa', {waitUntil:'load'});
  await p.waitForTimeout(1200);
  const sa = await p.evaluate(()=>({vis:!document.getElementById('screenRadio').hidden, hud:document.querySelector('#hudName').textContent, theme:document.body.className}));
  console.log('==', base.slice(0,34), '| games:', games, '| radio:', JSON.stringify(s1), '| after→:', hud2, '| backHome:', backHome, '| hash sa:', JSON.stringify(sa));
  console.log('   errors:', errs.length ? errs.slice(0,6) : 'none');
  if (base.startsWith('file')) await p.screenshot({path:'_shots/demo-file.png'});
  await p.close();
}
await b.close();
