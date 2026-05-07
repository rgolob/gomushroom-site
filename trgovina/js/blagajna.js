// ── GoMushroom Blagajna ───────────────────────────────────

const SB_URL = ‘https://rjscfndegqxuefffsedf.supabase.co’;
const SB_KEY = ‘sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa’;
const SB_HEADERS = {
‘Content-Type’: ‘application/json’,
‘apikey’: SB_KEY,
‘Authorization’: ’Bearer ’ + SB_KEY
};

const GM_IBAN    = ‘LT373250035347139970’;
const GM_NAME    = ‘GoMushroom, Rok Golob s.p.’;
const GM_ADDRESS = ‘Prapreče pri Straži 22’;
const GM_CITY    = ‘8351 Straža’;

// ── Slovenska pošta ───────────────────────────────────────
const SI_POST = {
‘1000’:‘Ljubljana’,
‘1001’:‘Ljubljana’,
‘1210’:‘Ljubljana – Šentvid’,
‘1211’:‘Ljubljana – Šmartno’,
‘1215’:‘Medvode’,
‘1216’:‘Smlednik’,
‘1217’:‘Vodice’,
‘1218’:‘Komenda’,
‘1219’:‘Laze v Tuhinju’,
‘1221’:‘Motnik’,
‘1222’:‘Trojane’,
‘1223’:‘Blagovica’,
‘1225’:‘Lukovica’,
‘1230’:‘Domžale’,
‘1231’:‘Ljubljana – Črnuče’,
‘1233’:‘Dob’,
‘1234’:‘Mengeš’,
‘1235’:‘Radomlje’,
‘1236’:‘Trzin’,
‘1241’:‘Kamnik’,
‘1242’:‘Stahovica’,
‘1251’:‘Moravče’,
‘1252’:‘Vače’,
‘1260’:‘Ljubljana – Polje’,
‘1261’:‘Ljubljana – Dobrunje’,
‘1262’:‘Dol pri Ljubljani’,
‘1270’:‘Litija’,
‘1272’:‘Polšnik’,
‘1273’:‘Dole pri Litiji’,
‘1274’:‘Gabrovka’,
‘1275’:‘Šmartno pri Litiji’,
‘1276’:‘Primskovo’,
‘1281’:‘Kresnice’,
‘1282’:‘Sava’,
‘1290’:‘Grosuplje’,
‘1291’:‘Škofljica’,
‘1292’:‘Ig’,
‘1293’:‘Šmarje – Sap’,
‘1294’:‘Višnja Gora’,
‘1295’:‘Ivančna Gorica’,
‘1296’:‘Šentvid pri Stični’,
‘1301’:‘Krka’,
‘1303’:‘Zagradec’,
‘1310’:‘Ribnica’,
‘1311’:‘Turjak’,
‘1312’:‘Videm – Dobrepolje’,
‘1313’:‘Struge’,
‘1314’:‘Rob’,
‘1315’:‘Velike Lašče’,
‘1316’:‘Ortnek’,
‘1317’:‘Sodražica’,
‘1318’:‘Loški Potok’,
‘1319’:‘Draga’,
‘1330’:‘Kočevje’,
‘1331’:‘Dolenja vas’,
‘1332’:‘Stara Cerkev’,
‘1336’:‘Kostel’,
‘1337’:‘Osilnica’,
‘1338’:‘Kočevska Reka’,
‘1351’:‘Brezovica pri Ljubljani’,
‘1352’:‘Preserje’,
‘1353’:‘Borovnica’,
‘1354’:‘Horjul’,
‘1355’:‘Polhov Gradec’,
‘1356’:‘Dobrova’,
‘1357’:‘Notranje Gorice’,
‘1358’:‘Log pri Brezovici’,
‘1360’:‘Vrhnika’,
‘1370’:‘Logatec’,
‘1371’:‘Logatec’,
‘1372’:‘Hotedršica’,
‘1373’:‘Rovte’,
‘1380’:‘Cerknica’,
‘1381’:‘Rakek’,
‘1382’:‘Begunje pri Cerknici’,
‘1384’:‘Grahovo’,
‘1385’:‘Nova vas’,
‘1386’:‘Stari trg pri Ložu’,
‘1410’:‘Zagorje ob Savi’,
‘1411’:‘Izlake’,
‘1412’:‘Kisovec’,
‘1413’:‘Čemšenik’,
‘1414’:‘Podkum’,
‘1420’:‘Trbovlje’,
‘1423’:‘Dobovec’,
‘1430’:‘Hrastnik’,
‘1431’:‘Dol pri Hrastniku’,
‘1432’:‘Zidani Most’,
‘1433’:‘Radeče’,
‘1434’:‘Loka pri Zidanem Mostu’,
‘2000’:‘Maribor’,
‘2201’:‘Zgornja Kungota’,
‘2204’:‘Miklavž na Dravskem polju’,
‘2205’:‘Starše’,
‘2206’:‘Marjeta na Dravskem polju’,
‘2208’:‘Pohorje’,
‘2211’:‘Pesnica pri Mariboru’,
‘2212’:‘Šentilj v Slovenskih goricah’,
‘2213’:‘Zgornja Velka’,
‘2214’:‘Sladki Vrh’,
‘2215’:‘Ceršak’,
‘2221’:‘Jarenina’,
‘2222’:‘Jakobski Dol’,
‘2223’:‘Jurovski Dol’,
‘2229’:‘Malečnik’,
‘2230’:‘Lenart v Slovenskih goricah’,
‘2231’:‘Pernica’,
‘2232’:‘Voličina’,
‘2233’:‘Sv. Ana v Slovenskih goricah’,
‘2234’:‘Benedikt’,
‘2235’:‘Sv. Trojica v Slovenskih goricah’,
‘2236’:‘Cerkvenjak’,
‘2241’:‘Spodnji Duplek’,
‘2242’:‘Zgornja Korena’,
‘2250’:‘Ptuj’,
‘2252’:‘Dornava’,
‘2253’:‘Destrnik’,
‘2254’:‘Trnovska vas’,
‘2255’:‘Vitomarci’,
‘2256’:‘Juršinc’,
‘2257’:‘Polenšak’,
‘2258’:‘Sveti Tomaž’,
‘2259’:‘Ivanjkovci’,
‘2270’:‘Ormož’,
‘2272’:‘Gorišnica’,
‘2273’:‘Podgorci’,
‘2274’:‘Velika Nedelja’,
‘2275’:‘Miklavž pri Ormožu’,
‘2276’:‘Kog’,
‘2277’:‘Središče ob Dravi’,
‘2281’:‘Markovci’,
‘2282’:‘Cirkulane’,
‘2283’:‘Zavrč’,
‘2284’:‘Videm pri Ptuju’,
‘2285’:‘Zgornji Leskovec’,
‘2286’:‘Podlehnik’,
‘2287’:‘Žetale’,
‘2288’:‘Hajdina’,
‘2289’:‘Stoperce’,
‘2310’:‘Slovenska Bistrica’,
‘2311’:‘Hoče’,
‘2312’:‘Orehova vas’,
‘2313’:‘Fram’,
‘2314’:‘Zgornja Polskava’,
‘2315’:‘Šmartno na Pohorju’,
‘2316’:‘Zgornja Ložnica’,
‘2317’:‘Oplotnica’,
‘2318’:‘Laporje’,
‘2319’:‘Poljčane’,
‘2321’:‘Makole’,
‘2322’:‘Majšperk’,
‘2323’:‘Ptujska Gora’,
‘2324’:‘Lovrenc na Dravskem polju’,
‘2325’:‘Kidričevo’,
‘2326’:‘Cirkovce’,
‘2327’:‘Rače’,
‘2331’:‘Pragersko’,
‘2341’:‘Limbuš’,
‘2342’:‘Ruše’,
‘2343’:‘Fala’,
‘2344’:‘Lovrenc na Pohorju’,
‘2345’:‘Bistrica ob Dravi’,
‘2351’:‘Kamnica’,
‘2352’:‘Selnica ob Dravi’,
‘2353’:‘Sveti Duh na Ostrem Vrhu’,
‘2354’:‘Bresternica’,
‘2360’:‘Radlje ob Dravi’,
‘2361’:‘Ožbalt’,
‘2362’:‘Kapla’,
‘2363’:‘Podvelka’,
‘2364’:‘Ribnica na Pohorju’,
‘2365’:‘Vuhred’,
‘2366’:‘Muta’,
‘2367’:‘Vuzenica’,
‘2370’:‘Dravograd’,
‘2371’:‘Trbonje’,
‘2372’:‘Libeliče’,
‘2373’:‘Šentjanž pri Dravogradu’,
‘2380’:‘Slovenj Gradec’,
‘2381’:‘Podgorje pri Slovenj Gradcu’,
‘2382’:‘Mislinja’,
‘2383’:‘Šmartno pri Slovenj Gradcu’,
‘2390’:‘Ravne na Koroškem’,
‘2391’:‘Prevalje’,
‘2392’:‘Mežica’,
‘2393’:‘Črna na Koroškem’,
‘2394’:‘Kotlje’,
‘3000’:‘Celje’,
‘3201’:‘Šmartno v Rožni dolini’,
‘3202’:‘Ljubečna’,
‘3203’:‘Nova Cerkev’,
‘3205’:‘Vitanje’,
‘3206’:‘Stranice’,
‘3210’:‘Slovenske Konjice’,
‘3211’:‘Škofja vas’,
‘3212’:‘Vojnik’,
‘3213’:‘Frankolovo’,
‘3214’:‘Zreče’,
‘3215’:‘Loče’,
‘3220’:‘Štore’,
‘3221’:‘Teharje’,
‘3222’:‘Dramlje’,
‘3223’:‘Loka pri Žusmu’,
‘3224’:‘Dobje pri Planini’,
‘3225’:‘Planina pri Sevnici’,
‘3230’:‘Šentjur’,
‘3231’:‘Grobelno’,
‘3232’:‘Ponikva’,
‘3233’:‘Kalobje’,
‘3240’:‘Šmarje pri Jelšah’,
‘3241’:‘Podplat’,
‘3250’:‘Rogaška Slatina’,
‘3252’:‘Rogatec’,
‘3253’:‘Pristava pri Mestinju’,
‘3254’:‘Podčetrtek’,
‘3255’:‘Buče’,
‘3256’:‘Bistrica ob Sotli’,
‘3257’:‘Podsreda’,
‘3260’:‘Kozje’,
‘3261’:‘Lesično’,
‘3262’:‘Prevorje’,
‘3263’:‘Gorica pri Slivnici’,
‘3264’:‘Sveti Štefan’,
‘3270’:‘Laško’,
‘3271’:‘Šentrupert’,
‘3272’:‘Rimske Toplice’,
‘3273’:‘Jurklošter’,
‘3301’:‘Petrovče’,
‘3302’:‘Griže’,
‘3303’:‘Gomilsko’,
‘3304’:‘Tabor’,
‘3305’:‘Vransko’,
‘3310’:‘Žalec’,
‘3311’:‘Šempeter v Savinjski dolini’,
‘3312’:‘Prebold’,
‘3313’:‘Polzela’,
‘3314’:‘Braslovče’,
‘3320’:‘Velenje’,
‘3325’:‘Šoštanj’,
‘3326’:‘Topolšica’,
‘3327’:‘Šmartno ob Paki’,
‘3330’:‘Mozirje’,
‘3331’:‘Nazarje’,
‘3332’:‘Rečica ob Savinji’,
‘3333’:‘Ljubno ob Savinji’,
‘3334’:‘Luče’,
‘3335’:‘Solčava’,
‘3341’:‘Šmartno ob Dreti’,
‘3342’:‘Gornji Grad’,
‘4000’:‘Kranj’,
‘4201’:‘Zgornja Besnica’,
‘4202’:‘Naklo’,
‘4203’:‘Duplje’,
‘4204’:‘Golnik’,
‘4205’:‘Preddvor’,
‘4206’:‘Zgornje Jezersko’,
‘4207’:‘Cerklje na Gorenjskem’,
‘4208’:‘Šenčur’,
‘4209’:‘Žabnica’,
‘4210’:‘Brnik – Aerodrom’,
‘4211’:‘Mavčiče’,
‘4212’:‘Visoko’,
‘4220’:‘Škofja Loka’,
‘4223’:‘Poljane nad Škofjo Loko’,
‘4224’:‘Gorenja vas’,
‘4225’:‘Sovodenj’,
‘4226’:‘Žiri’,
‘4227’:‘Selca’,
‘4228’:‘Železniki’,
‘4229’:‘Sorica’,
‘4240’:‘Radovljica’,
‘4243’:‘Brezje’,
‘4244’:‘Podnart’,
‘4245’:‘Kropa’,
‘4246’:‘Kamna Gorica’,
‘4247’:‘Zgornje Gorje’,
‘4248’:‘Lesce’,
‘4260’:‘Bled’,
‘4263’:‘Bohinjska Bela’,
‘4264’:‘Bohinjska Bistrica’,
‘4265’:‘Bohinjsko jezero’,
‘4267’:‘Srednja vas v Bohinju’,
‘4270’:‘Jesenice’,
‘4273’:‘Blejska Dobrava’,
‘4274’:‘Žirovnica’,
‘4275’:‘Begunje na Gorenjskem’,
‘4276’:‘Hrušica’,
‘4280’:‘Kranjska Gora’,
‘4281’:‘Mojstrana’,
‘4282’:‘Gozd Martuljek’,
‘4283’:‘Rateče – Planica’,
‘4290’:‘Tržič’,
‘4294’:‘Križe’,
‘5000’:‘Nova Gorica’,
‘5210’:‘Deskle’,
‘5211’:‘Kojsko’,
‘5212’:‘Dobrovo v Brdih’,
‘5213’:‘Kanal’,
‘5214’:‘Kal nad Kanalom’,
‘5215’:‘Ročinj’,
‘5216’:‘Most na Soči’,
‘5220’:‘Tolmin’,
‘5222’:‘Kobarid’,
‘5223’:‘Breginj’,
‘5224’:‘Srpenica’,
‘5230’:‘Bovec’,
‘5231’:‘Log pod Mangartom’,
‘5232’:‘Soča’,
‘5242’:‘Grahovo ob Bači’,
‘5243’:‘Podbrdo’,
‘5250’:‘Solkan’,
‘5251’:‘Grgar’,
‘5252’:‘Trnovo pri Gorici’,
‘5253’:‘Čepovan’,
‘5261’:‘Šempas’,
‘5262’:‘Črniče’,
‘5263’:‘Dobravlje’,
‘5270’:‘Ajdovščina’,
‘5271’:‘Vipava’,
‘5272’:‘Podnanos’,
‘5273’:‘Col’,
‘5274’:‘Črni Vrh nad Idrijo’,
‘5275’:‘Godovič’,
‘5280’:‘Idrija’,
‘5281’:‘Spodnja Idrija’,
‘5282’:‘Cerkno’,
‘5283’:‘Slap ob Idrijci’,
‘5290’:‘Šempeter pri Gorici’,
‘5291’:‘Miren’,
‘5292’:‘Renče’,
‘5293’:‘Volčja Draga’,
‘5294’:‘Dornberk’,
‘5295’:‘Branik’,
‘5296’:‘Kostanjevica na Krasu’,
‘5297’:‘Prvačina’,
‘6000’:‘Koper’,
‘6210’:‘Sežana’,
‘6215’:‘Divača’,
‘6216’:‘Podgorje’,
‘6217’:‘Vremski Britof’,
‘6219’:‘Lokev’,
‘6221’:‘Dutovlje’,
‘6222’:‘Štanjel’,
‘6223’:‘Komen’,
‘6224’:‘Senožeče’,
‘6225’:‘Hruševje’,
‘6230’:‘Postojna’,
‘6232’:‘Planina’,
‘6240’:‘Kozina’,
‘6242’:‘Materija’,
‘6243’:‘Obrov’,
‘6244’:‘Podgrad’,
‘6250’:‘Ilirska Bistrica’,
‘6251’:‘Ilirska Bistrica-Trnovo’,
‘6253’:‘Knežak’,
‘6254’:‘Jelšane’,
‘6255’:‘Prem’,
‘6256’:‘Košana’,
‘6257’:‘Pivka’,
‘6258’:‘Prestranek’,
‘6271’:‘Dekani’,
‘6272’:‘Gračišče’,
‘6273’:‘Marezige’,
‘6274’:‘Šmarje’,
‘6275’:‘Črni Kal’,
‘6276’:‘Pobegi’,
‘6280’:‘Ankaran’,
‘6281’:‘Škofije’,
‘6310’:‘Izola’,
‘6320’:‘Portorož’,
‘6330’:‘Piran’,
‘6333’:‘Sečovlje’,
‘8000’:‘Novo mesto’,
‘8210’:‘Trebnje’,
‘8211’:‘Dobrnič’,
‘8212’:‘Velika Loka’,
‘8213’:‘Veliki Gaber’,
‘8216’:‘Mirna Peč’,
‘8220’:‘Šmarješke Toplice’,
‘8222’:‘Otočec’,
‘8230’:‘Mokronog’,
‘8231’:‘Trebelno’,
‘8232’:‘Šentrupert’,
‘8233’:‘Mirna’,
‘8250’:‘Brežice’,
‘8251’:‘Čatež ob Savi’,
‘8253’:‘Artiče’,
‘8254’:‘Globoko’,
‘8255’:‘Pišece’,
‘8256’:‘Sromlje’,
‘8257’:‘Dobova’,
‘8258’:‘Kapele’,
‘8259’:‘Bizeljsko’,
‘8261’:‘Jesenice na Dolenjskem’,
‘8262’:‘Krška vas’,
‘8263’:‘Cerklje ob Krki’,
‘8270’:‘Krško’,
‘8272’:‘Zdole’,
‘8273’:‘Leskovec pri Krškem’,
‘8274’:‘Raka’,
‘8275’:‘Škocjan’,
‘8276’:‘Bučka’,
‘8280’:‘Brestanica’,
‘8281’:‘Senovo’,
‘8282’:‘Koprivnica’,
‘8283’:‘Blanca’,
‘8290’:‘Sevnica’,
‘8292’:‘Zabukovje’,
‘8293’:‘Studenec’,
‘8294’:‘Boštanj’,
‘8295’:‘Tržišče’,
‘8296’:‘Krmelj’,
‘8297’:‘Šentjanž’,
‘8310’:‘Šentjernej’,
‘8311’:‘Kostanjevica na Krki’,
‘8312’:‘Podbočje’,
‘8321’:‘Brusnice’,
‘8322’:‘Stopiče’,
‘8323’:‘Uršna sela’,
‘8330’:‘Metlika’,
‘8331’:‘Suhor’,
‘8332’:‘Gradac’,
‘8333’:‘Semič’,
‘8340’:‘Črnomelj’,
‘8341’:‘Adlešiči’,
‘8342’:‘Stari trg ob Kolpi’,
‘8343’:‘Dragatuš’,
‘8344’:‘Vinica’,
‘8350’:‘Dolenjske Toplice’,
‘8351’:‘Straža’,
‘8360’:‘Žužemberk’,
‘8361’:‘Dvor’,
‘8362’:‘Hinje’,
‘9000’:‘Murska Sobota’,
‘9201’:‘Puconci’,
‘9202’:‘Mačkovci’,
‘9203’:‘Petrovci’,
‘9204’:‘Šalovci’,
‘9205’:‘Hodoš’,
‘9206’:‘Križevci’,
‘9207’:‘Prosenjakovci’,
‘9208’:‘Fokovci’,
‘9220’:‘Lendava’,
‘9221’:‘Martjanci’,
‘9222’:‘Bogojina’,
‘9223’:‘Dobrovnik’,
‘9224’:‘Turnišče’,
‘9225’:‘Velika Polana’,
‘9226’:‘Moravske Toplice’,
‘9227’:‘Kobilje’,
‘9231’:‘Beltinci’,
‘9232’:‘Črenšovci’,
‘9233’:‘Odranci’,
‘9240’:‘Ljutomer’,
‘9241’:‘Veržej’,
‘9242’:‘Križevci pri Ljutomeru’,
‘9243’:‘Mala Nedelja’,
‘9244’:‘Sveti Jurij ob Ščavnici’,
‘9245’:‘Spodnji Ivanjci’,
‘9250’:‘Gornja Radgona’,
‘9251’:‘Tišina’,
‘9252’:‘Radenci’,
‘9253’:‘Apače’,
‘9261’:‘Cankova’,
‘9262’:‘Rogašovci’,
‘9263’:‘Kuzma’,
‘9264’:‘Grad’,
‘9265’:‘Bodonci’
};

function getKrajFromPost(post) {
return SI_POST[post.trim()] || ‘’;
}

// Nastavitve
let settings = {
postnina: 3.90,
brezplacnaPosninaOd: 60,
sestevajPopuste: false,
maxPopust: 50,
popusti: [],
casovniPopust: { vrednost: 0, od: ‘’, do: ‘’, aktiven: false }
};

async function loadSettings() {
try {
const r = await fetch(`${SB_URL}/rest/v1/gm_settings?select=*`, { headers: SB_HEADERS });
if (!r.ok) return;
const rows = await r.json();
rows.forEach(row => {
try { settings[row.key] = JSON.parse(row.value); }
catch { settings[row.key] = row.value; }
});
} catch(e) { console.warn(‘Settings fallback’, e); }
}

// ── RF referenca ──────────────────────────────────────────
function generateRF(orderId) {
const ref = String(orderId).replace(/[^A-Z0-9]/gi, ‘’).toUpperCase();
if (!ref) return ‘’;
const moved = ref + ‘RF00’;
const numeric = moved.split(’’).map(c => {
const code = c.charCodeAt(0);
return code >= 65 ? String(code - 55) : c;
}).join(’’);
const remainder = BigInt(numeric) % 97n;
const checkDigits = String(98n - remainder).padStart(2, ‘0’);
return `RF${checkDigits}${ref}`;
}

// ── UPN QR ────────────────────────────────────────────────
function buildUPNString(amount, rf, purpose) {
const pad = (val, len) => String(val || ‘’).substring(0, len).padEnd(len);
const amountStr = Math.round((amount || 0) * 100).toString().padStart(11, ‘0’);
const fields = [
‘UPNQR’, ‘’, ‘’, ‘’, ‘’, ‘’, ‘’,
amountStr, ‘’,
pad(GM_IBAN, 34),
pad(‘GDSV’, 4),
pad(purpose || ‘Placilo’, 42),
pad(rf, 35),
pad(GM_NAME, 33),
pad(GM_ADDRESS, 33),
pad(GM_CITY, 33),
];
const payload = fields.join(’\n’);
const checksum = payload.split(’’).reduce((s, c) => s + c.charCodeAt(0), 0) % 1000;
return payload + ‘\n’ + String(checksum).padStart(3, ‘0’);
}

function qrUrl(amount, rf, purpose, size = 200) {
const upn = buildUPNString(amount, rf, purpose);
return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upn)}`;
}

function fmt(v) {
return Number(v || 0).toLocaleString(‘sl-SI’, {
minimumFractionDigits: 2, maximumFractionDigits: 2
}) + ’ €’;
}

function todayStr() { return new Date().toISOString().split(‘T’)[0]; }

// ── Popusti ───────────────────────────────────────────────
function izracunajPopust(skupaj, kolicina, koda) {
const danes = todayStr();
const ujemajoci = [];
const c = settings.casovniPopust;
if (c?.aktiven && c.vrednost > 0 && (!c.od || danes >= c.od) && (!c.do || danes <= c.do))
ujemajoci.push({ vrednost: c.vrednost, opis: ‘Časovni popust’ });
for (const p of (settings.popusti || []).filter(p => p.aktiven)) {
let ok = false;
if (p.tip === ‘koda’ && koda && p.kod === koda.toUpperCase().trim()) ok = true;
if (p.tip === ‘kolicina’ && kolicina >= (p.min || 0)) ok = true;
if (p.tip === ‘znesek’ && skupaj >= (p.min || 0)) ok = true;
if (ok) ujemajoci.push({ vrednost: p.vrednost, opis: p.tip === ‘koda’ ? `Koda ${p.kod}` : p.tip === ‘kolicina’ ? `${p.min}+ kosov` : `Nad ${p.min} €` });
}
if (!ujemajoci.length) return { pct: 0, ujemajoci: [] };
let pct = settings.sestevajPopuste
? ujemajoci.reduce((s, p) => s + p.vrednost, 0)
: Math.max(…ujemajoci.map(p => p.vrednost));
return { pct: Math.min(pct, settings.maxPopust || 50), ujemajoci };
}

// ── Render povzetka ───────────────────────────────────────
function renderSummary() {
const cart = getCart();
const itemsEl = document.getElementById(‘order-items’);
if (!itemsEl) return;

if (!cart.length) {
window.location.href = ‘/trgovina/kosarica/’;
return;
}

const koda = sessionStorage.getItem(‘gm_kupon’) || ‘’;
const bruto = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
const kolicina = cart.reduce((s, i) => s + i.quantity, 0);
const { pct } = izracunajPopust(bruto, kolicina, koda);
const popustZnesek = bruto * pct / 100;
const zneskPoPopustu = bruto - popustZnesek;
const postnina = zneskPoPopustu >= (settings.brezplacnaPosninaOd || 60) ? 0 : (settings.postnina || 3.90);
const skupaj = zneskPoPopustu + postnina;

itemsEl.innerHTML = cart.map(item => ` <div class="order-item"> <div class="order-item__name">${item.name}<br><small style="color:rgba(43,11,57,.4);font-size:.75rem">${item.variantLabel || ''}</small></div> <div class="order-item__qty">${item.quantity}×</div> <div class="order-item__price">${fmt(Number(item.price) * item.quantity)}</div> </div>`).join(’’);

document.getElementById(‘order-subtotal’).textContent = fmt(bruto);
document.getElementById(‘order-shipping’).textContent = postnina === 0 ? ‘🎁 Brezplačno’ : fmt(postnina);
document.getElementById(‘order-total’).textContent = fmt(skupaj);

const discRow = document.getElementById(‘order-discount-row’);
if (pct > 0) {
discRow.style.display = ‘flex’;
document.getElementById(‘order-discount-label’).textContent = `Popust (${pct}%)`;
document.getElementById(‘order-discount-amt’).textContent = `−${fmt(popustZnesek)}`;
} else {
discRow.style.display = ‘none’;
}

window._orderCalc = { bruto, pct, popustZnesek, zneskPoPopustu, postnina, skupaj, kolicina, koda };
}

// ── Validacija ────────────────────────────────────────────
function validate() {
const fields = [‘c-name’, ‘c-email’, ‘c-street’, ‘c-post’, ‘c-city’];
let ok = true;
fields.forEach(id => {
const el = document.getElementById(id);
if (!el.value.trim()) { el.classList.add(‘error’); ok = false; }
else el.classList.remove(‘error’);
});
const email = document.getElementById(‘c-email’);
if (email.value && !email.value.includes(’@’)) { email.classList.add(‘error’); ok = false; }
return ok;
}

// ── Submit ────────────────────────────────────────────────
async function placeOrder() {
if (!validate()) {
document.querySelector(’.checkout-field input.error’)?.scrollIntoView({ behavior: ‘smooth’, block: ‘center’ });
return;
}

const btn = document.getElementById(‘place-order-btn’);
btn.disabled = true;
btn.textContent = ‘⏳ Pošiljam…’;

const cart = getCart();
const calc = window._orderCalc;
const name = document.getElementById(‘c-name’).value.trim();
const email = document.getElementById(‘c-email’).value.trim();

const orderData = {
name, email,
phone: document.getElementById(‘c-phone’).value.trim() || null,
street: document.getElementById(‘c-street’).value.trim(),
post: document.getElementById(‘c-post’).value.trim(),
city: document.getElementById(‘c-city’).value.trim(),
country: ‘Slovenija’,
note: document.getElementById(‘c-note’).value.trim() || null,
items: cart,
subtotal: calc.bruto,
discount_pct: calc.pct,
discount_amt: calc.popustZnesek,
shipping: calc.postnina,
total: calc.skupaj,
coupon_code: calc.koda || null,
status: ‘pending’,
rf_reference: ‘’,
};

try {
const r = await fetch(`${SB_URL}/rest/v1/gm_orders`, {
method: ‘POST’,
headers: { …SB_HEADERS, ‘Prefer’: ‘return=representation’ },
body: JSON.stringify(orderData)
});
if (!r.ok) throw new Error(’Supabase error: ’ + r.status);
const [order] = await r.json();

```
// RF referenca z order ID
const rf = generateRF(order.id.replace(/-/g,'').substring(0,12).toUpperCase());
await fetch(`${SB_URL}/rest/v1/gm_orders?id=eq.${order.id}`, {
  method: 'PATCH',
  headers: SB_HEADERS,
  body: JSON.stringify({ rf_reference: rf })
});

await sendConfirmationEmail({ ...order, rf_reference: rf }, rf, calc);
showSuccess({ ...order, rf_reference: rf }, rf, calc);
saveCart([]);
sessionStorage.removeItem('gm_kupon');
```

} catch(e) {
console.error(‘Order error:’, e);
btn.disabled = false;
btn.textContent = ‘Naroči in plačaj →’;
alert(‘Prišlo je do napake. Prosimo, poskusite znova ali nas kontaktirajte na info@gomushroom.si’);
}
}

// ── Email ─────────────────────────────────────────────────
async function sendConfirmationEmail(order, rf, calc) {
const ibanFormatted = GM_IBAN.replace(/(.{4})/g,’$1 ‘).trim();
const itemsList = order.items.map(i =>
`<tr><td style="padding:.4rem .5rem;border-bottom:1px solid #f5f0e8">${i.name} — ${i.variantLabel||''}</td><td style="padding:.4rem .5rem;text-align:right;border-bottom:1px solid #f5f0e8">${i.quantity}×</td><td style="padding:.4rem .5rem;text-align:right;border-bottom:1px solid #f5f0e8;font-weight:600">${(Number(i.price)*i.quantity).toFixed(2)} €</td></tr>`
).join(’’);

const qr = qrUrl(calc.skupaj, rf, `Placilo narocila GoMushroom`, 160);

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>

  <body style="margin:0;padding:0;background:#f0ebe3;font-family:Georgia,serif;color:#1a1209">
  <div style="max-width:600px;margin:0 auto;background:#fff">
    <div style="background:#f7f3ee;padding:1.5rem;border-bottom:2px solid #af8455">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:1.4rem;font-weight:300;letter-spacing:.04em">Go<strong style="color:#af8455">Mushroom</strong></div>
          <div style="font-size:.72rem;color:#9a8f82;margin-top:.15rem">Rok Golob s.p. · gomushroom.si</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.9rem;font-weight:500">Predračun</div>
          <div style="font-size:.72rem;color:#9a8f82">${new Date().toLocaleDateString('sl-SI')}</div>
        </div>
      </div>
    </div>
    <div style="padding:1.5rem">
      <p style="margin:0 0 1rem">Spoštovani ${order.name},</p>
      <p style="margin:0 0 1.25rem;color:rgba(26,18,9,.7)">hvala za vaše naročilo. Spodaj najdete podatke za plačilo.</p>
      <table style="width:100%;border-collapse:collapse;font-size:.85rem;margin-bottom:1rem">
        <thead><tr style="background:#f7f3ee">
          <th style="padding:.5rem;text-align:left;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:#9a8f82">Artikel</th>
          <th style="padding:.5rem;text-align:right;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:#9a8f82">Kol.</th>
          <th style="padding:.5rem;text-align:right;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:#9a8f82">Skupaj</th>
        </tr></thead>
        <tbody>${itemsList}</tbody>
      </table>
      ${calc.pct > 0 ? `<div style="color:#3a6b4a;font-size:.85rem;text-align:right;margin-bottom:.35rem">Popust (${calc.pct}%): −${calc.popustZnesek.toFixed(2)} €</div>` : ''}
      <div style="font-size:.85rem;text-align:right;margin-bottom:.35rem;color:rgba(26,18,9,.6)">Poštnina: ${calc.postnina === 0 ? 'Brezplačno' : calc.postnina.toFixed(2) + ' €'}</div>
      <div style="font-size:1.05rem;font-weight:700;text-align:right;padding:.5rem 0;border-top:2px solid #af8455">Skupaj: ${calc.skupaj.toFixed(2)} €</div>

```
  <div style="background:#f7f3ee;border-left:3px solid #af8455;padding:1rem;border-radius:0 8px 8px 0;margin:1.25rem 0;display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:1;min-width:160px;font-size:.82rem;line-height:1.8">
      <div style="font-size:.62rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#9a8f82;margin-bottom:.25rem">Podatki za nakazilo</div>
      Prejemnik: ${GM_NAME}<br>
      IBAN: ${ibanFormatted}<br>
      BIC: HDELSI22<br>
      Referenca: <strong>${rf}</strong><br>
      Znesek: <strong>${calc.skupaj.toFixed(2)} €</strong>
    </div>
    <img src="${qr}" width="120" height="120" alt="UPN QR" style="border-radius:8px;flex-shrink:0">
  </div>

  <p style="font-size:.82rem;color:rgba(26,18,9,.6);margin:0 0 1.25rem">Po prejemu plačila bomo naročilo nemudoma odpremili.</p>
  <p style="margin:0">Lep pozdrav,<br>Rok</p>
</div>
<div style="background:#f7f3ee;padding:1rem 1.5rem;border-top:1px solid rgba(26,18,9,.08);font-size:.7rem;color:#9a8f82">
  GoMushroom, Rok Golob s.p. · Prapreče pri Straži 22, 8351 Straža ·
  <a href="mailto:info@gomushroom.si" style="color:#af8455">info@gomushroom.si</a> ·
  <a href="https://gomushroom.si" style="color:#af8455">gomushroom.si</a>
</div>
```

  </div>
  </body></html>`;

try {
await fetch(’/.netlify/functions/send-email’, {
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({ to: order.email, subject: ‘Potrditev naročila — GoMushroom’, html })
});
await fetch(`${SB_URL}/rest/v1/gm_orders?id=eq.${order.id}`, {
method: ‘PATCH’, headers: SB_HEADERS,
body: JSON.stringify({ confirmation_sent_at: new Date().toISOString() })
});
} catch(e) { console.warn(‘Email failed:’, e); }
}

// ── Uspeh + QR ────────────────────────────────────────────
function showSuccess(order, rf, calc) {
document.getElementById(‘checkout-form-wrap’).style.display = ‘none’;
const successEl = document.getElementById(‘order-success’);
successEl.classList.add(‘visible’);

const qr = qrUrl(calc.skupaj, rf, `Placilo narocila GoMushroom`, 200);
document.getElementById(‘qr-img’).src = qr;

const ibanFormatted = GM_IBAN.replace(/(.{4})/g,’$1 ’).trim();
document.getElementById(‘payment-details’).innerHTML = `<strong>Podatki za nakazilo</strong> Prejemnik: ${GM_NAME}<br> IBAN: ${ibanFormatted}<br> BIC: HDELSI22<br> Referenca: <strong>${rf}</strong><br> Znesek: <strong>${calc.skupaj.toFixed(2)} €</strong>`;

successEl.scrollIntoView({ behavior: ‘smooth’ });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener(‘DOMContentLoaded’, async () => {
await loadSettings();
renderSummary();

document.getElementById(‘place-order-btn’)?.addEventListener(‘click’, placeOrder);

// Avtopolnjenje kraja iz poštne številke
const postInput = document.getElementById(‘c-post’);
const cityInput = document.getElementById(‘c-city’);
postInput?.addEventListener(‘input’, () => {
const kraj = getKrajFromPost(postInput.value);
if (kraj && !cityInput.value) cityInput.value = kraj;
});
postInput?.addEventListener(‘blur’, () => {
const kraj = getKrajFromPost(postInput.value);
if (kraj) cityInput.value = kraj;
});

// Clear errors
document.querySelectorAll(’.checkout-field input’).forEach(input => {
input.addEventListener(‘input’, () => input.classList.remove(‘error’));
});

// Nav
const navToggle = document.getElementById(‘nav-toggle’);
const siteHeader = document.getElementById(‘site-header’);
if (navToggle && siteHeader) {
navToggle.addEventListener(‘click’, () => {
const expanded = navToggle.getAttribute(‘aria-expanded’) === ‘true’;
navToggle.setAttribute(‘aria-expanded’, String(!expanded));
siteHeader.classList.toggle(‘nav-open’);
});
}
});