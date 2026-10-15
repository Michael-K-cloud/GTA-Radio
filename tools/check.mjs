/* Автотест интерфейса (не часть сайта).
   Запуск из корня проекта:
     npm i -D playwright-core && npx playwright install chromium
     python3 -m http.server 8123 &
     node tools/check.mjs
*/
import { chromium } from 'playwright-core';
const BASE='http://127.0.0.1:8123/';
const b = await chromium.launch({ executablePath:'/tmp/.cache/ms-playwright/chromium-1148/chrome-linux/chrome', args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport:{width:1440,height:900}, deviceScaleFactor:2 });
const errs=[];
p.on('console', m => { if(m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,160)); });
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));

await p.goto(BASE+'index.html', {waitUntil:'networkidle'});
await p.screenshot({path:'_shots/home.png'});

for (const [g,name] of [['v','v'],['iv','iv'],['sa','sa'],['vc','vc'],['iii','iii']]) {
  await p.goto(BASE+'radio.html?game='+g, {waitUntil:'networkidle'});
  await p.evaluate(()=>document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
  await p.waitForTimeout(2200);
  const geo = await p.evaluate(()=>{
    const w=document.querySelector('.wheel'); if(!w) return null;
    const wb=w.getBoundingClientRect();
    const cx=wb.left+wb.width/2, cy=wb.top+wb.height/2;
    const chips=[...document.querySelectorAll('.st-chip')].map(c=>{
      const r=(c.querySelector('.disc')||c).getBoundingClientRect();
      const dx=(r.left+r.width/2-cx), dy=(r.top+r.height/2-cy);
      return {d: Math.round(Math.hypot(dx,dy)), ang: Math.round((Math.atan2(dy,dx)*180/Math.PI+360)%360), w:Math.round(r.width)};
    });
    return {chips, active: document.querySelector('.st-chip.active')?.dataset.i};
  });
  console.log('==',name,'== mode:', await p.evaluate(()=>window.radioAudio.mode), '| hud:', await p.locator('#hudName').textContent());
  if(geo && geo.chips.length) console.log('   radii:', geo.chips.map(c=>c.d).join(','), '| first angles:', geo.chips.slice(0,4).map(c=>c.ang).join(','), '| chipW:', geo.chips[0]&&geo.chips[0].w);
  await p.screenshot({path:'_shots/'+name+'.png'});
}
// переключаем станцию на V и меряем, что активная оказалась сверху
await p.goto(BASE+'radio.html?game=v&st=5', {waitUntil:'networkidle'});
await p.evaluate(()=>document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
await p.waitForTimeout(1600);
const top = await p.evaluate(()=>{
  const w=document.querySelector('.wheel').getBoundingClientRect();
  const cx=w.left+w.width/2, cy=w.top+w.height/2;
  const a=(document.querySelector('.st-chip.active .disc')||document.querySelector('.st-chip.active')).getBoundingClientRect();
  const dx=(a.left+a.width/2-cx), dy=(a.top+a.height/2-cy);
  return {ang: Math.round((Math.atan2(dy,dx)*180/Math.PI+360)%360), d: Math.round(Math.hypot(dx,dy)), hud: document.querySelector('#hudName').textContent};
});
console.log('== V st=5: active chip angle from center =', top.ang, '(должно быть ~270 = верх), radius', top.d, '| hud:', top.hud);
await p.screenshot({path:'_shots/v5.png'});

// мобильный вид
const m = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
m.on('pageerror', e=>errs.push('MOBILE PAGEERROR: '+e.message));
await m.goto(BASE+'radio.html?game=v', {waitUntil:'networkidle'});
await m.evaluate(()=>document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
await m.waitForTimeout(1800);
await m.screenshot({path:'_shots/mobile-radio.png'});
await m.goto(BASE+'index.html', {waitUntil:'networkidle'});
await m.screenshot({path:'_shots/mobile-home.png', fullPage:true});

await p.goto(BASE+'editor.html', {waitUntil:'networkidle'});
await p.click('#btnGen');
const outv = await p.locator('#out').inputValue();
const fs = await import('fs'); fs.writeFileSync('/tmp/gen-config.js', outv);
console.log('== editor config bytes:', outv.length, '| helpers:', outv.includes('CFG.stationIcon'));
await p.screenshot({path:'_shots/editor.png'});

console.log('\n== ERRORS ('+errs.length+'):'); [...new Set(errs)].slice(0,15).forEach(e=>console.log('  '+e));
await b.close();
