import { parsePriceInput } from './price';
import { safeHttpUrl } from './url';
import { cleanTitle } from './title';

export interface Prefill {
  title: string;
  /** Candidate photos in order of preference; the app uses the first one that loads. */
  images: string[];
  price: string;
  /** ISO 4217 code such as AED; empty when the page did not say. */
  currency: string;
  link: string;
  /** Product colour as the shop writes it ("Light Beige"); empty when unknown. */
  colorName: string;
}

const MAX_TITLE = 200;

/** The deployed app. Bookmarks must never point at a dev server, which is off most of the time. */
export const LIVE_ORIGIN = 'https://closett-delta.vercel.app';

/** Origin the "Add to Closett" button should open: this site when it is a real https host, otherwise the live site. */
export function bookmarkletOrigin(currentOrigin: string): string {
  try {
    const u = new URL(currentOrigin);
    const h = u.hostname;
    const local = h === 'localhost' || h === '0.0.0.0' || h === '[::1]' || /^127\./.test(h) || h.endsWith('.local');
    return u.protocol === 'https:' && !local ? u.origin : LIVE_ORIGIN;
  } catch {
    return LIVE_ORIGIN;
  }
}

/**
 * Source of the "Add to Closett" bookmarklet. It runs inside the shop's own page, in the user's
 * real browser (so bot checks such as Zara's pass), reads the product data, and opens Closett with
 * the values in the query string. It prefers the page's structured product data (JSON-LD), then
 * meta tags, then the visible price text, because shops differ wildly in which they provide.
 * Single line, no comments, no '#' or '%': it must survive being a bookmark URL.
 */
export function bookmarkletCode(appOrigin: string): string {
  const code = String.raw`(function(){var d=document,APP=${JSON.stringify(appOrigin)};
function t(v){return typeof v==="string"?v.trim():""}
function m(s){for(var i=0;i<s.length;i++){var e=d.querySelector(s[i]);if(e){var v=e.getAttribute("content")||e.getAttribute("value")||e.textContent;if(v&&v.trim())return v.trim()}}return""}
function walk(o,out){if(!o||typeof o!=="object")return out;out.push(o);if(Array.isArray(o)){for(var i=0;i<o.length;i++)walk(o[i],out)}else{for(var k in o){if(o[k]&&typeof o[k]==="object")walk(o[k],out)}}return out}
function sym(sy){return /\u20b9|rs|inr/i.test(sy)?"INR":/aed/i.test(sy)?"AED":/usd|\$/i.test(sy)?"USD":/\u20ac/.test(sy)?"EUR":/\u00a3/.test(sy)?"GBP":""}
function struck(e){for(var n=e,i=0;n&&n.nodeType===1&&i<4;n=n.parentNode,i++){if(/^(DEL|S|STRIKE)$/.test(n.tagName)||/line-through|strike|mrp/i.test(String(n.className||"")))return true;try{if(/line-through/.test(getComputedStyle(n).textDecorationLine||""))return true}catch(e2){}}return false}
var all=[],sc=d.querySelectorAll("script[type=\"application/ld+json\"]");
for(var i=0;i<sc.length;i++){try{walk(JSON.parse(sc[i].textContent),all)}catch(e){}}
var P=null;
for(var j=0;j<all.length&&!P;j++){var ty=all[j]&&all[j]["@type"];if(ty&&String(ty).indexOf("Product")>-1)P=all[j]}
var title=t(P&&P.name)||m(["meta[property=\"og:title\"]","meta[name=\"twitter:title\"]","[id=\"productTitle\"]"]);if(!title){var hs=d.querySelectorAll("h1");for(var hi=0;hi<hs.length&&!title;hi++){var ht=t(hs[hi].textContent).replace(/\s+/g," ");if(ht&&ht.length<=150)title=ht}}if(!title)title=d.title||"";title=title.replace(/\s+/g," ").trim();
var V=[P];if(P&&P.hasVariant)V=V.concat(Array.isArray(P.hasVariant)?P.hasVariant:[P.hasVariant]);
var O=null;
for(var v=0;v<V.length&&!O;v++){var oo=V[v]&&V[v].offers;if(oo&&!Array.isArray(oo)&&oo.offers)oo=oo.offers;if(Array.isArray(oo))oo=oo[0];if(oo&&typeof oo==="object")O=oo}
var price=O?String(O.price||O.lowPrice||""):"";
var cur=O&&typeof O.priceCurrency==="string"?O.priceCurrency:"";
if(!price)price=m(["meta[property=\"product:price:amount\"]","meta[property=\"og:price:amount\"]","meta[itemprop=\"price\"]","meta[name=\"price\"]"]);
if(!cur)cur=m(["meta[property=\"product:price:currency\"]","meta[property=\"og:price:currency\"]","meta[itemprop=\"priceCurrency\"]"]);
if(!price){var pe=d.querySelectorAll("[itemprop=\"price\"],[class*=\"price\"],[id*=\"price\"],[data-price]");var re=/(?:\u20b9|Rs\.?|INR|AED|USD|\$|\u20ac|\u00a3)\s*(\d[\d,]*(?:\.\d+)?)/i;
for(var q=0;q<pe.length&&q<40&&!price;q++){var tx=pe[q].getAttribute("content")||pe[q].getAttribute("data-price")||pe[q].textContent||"";var mm=re.exec(tx);
if(mm){price=mm[1];if(!cur)cur=sym(mm[0])}}}
if(!price){var h1=d.querySelector("h1"),le=d.querySelectorAll("body *"),ra=/^\s*(?:\u20b9|Rs\.?|INR|AED|USD|\$|\u20ac|\u00a3)\s*(\d[\d,]*(?:\.\d+)?)\s*(?:\/-)?\s*$/i,pass,k2;for(pass=0;pass<2&&!price;pass++){for(k2=0;k2<le.length&&k2<6000&&!price;k2++){var le1=le[k2];if(le1.children.length||struck(le1))continue;if(pass===0&&h1&&!(h1.compareDocumentPosition(le1)&4))continue;var m2=ra.exec(le1.textContent||"");if(m2){price=m2[1];if(!cur)cur=sym(m2[0])}}}}
var imgs=[];
function add(u){if(u&&typeof u==="object")u=u.url||u["@id"]||"";u=t(u);if(!u)return;try{u=new URL(u,location.href).href}catch(e){return}if(u.length>1500||imgs.indexOf(u)>-1)return;imgs.push(u)}
for(var w2=0;w2<V.length;w2++){var vi=V[w2]&&V[w2].image;if(!vi)continue;if(Array.isArray(vi)){for(var a=0;a<vi.length;a++)add(vi[a])}else add(vi)}
var ms=["meta[property=\"og:image\"]","meta[property=\"og:image:secure_url\"]","meta[property=\"og:image:url\"]","meta[name=\"twitter:image\"]","meta[name=\"twitter:image:src\"]","meta[itemprop=\"image\"]"];
for(var b=0;b<ms.length;b++)add(m([ms[b]]));
var li=d.querySelector("[id=\"landingImage\"],[id=\"imgBlkFront\"]");if(li)add(li.getAttribute("data-old-hires")||li.currentSrc||li.src);var ls=d.querySelector("link[rel=\"image_src\"]");if(ls)add(ls.getAttribute("href"));
if(imgs.length<3){var di=d.images;for(var c=0;c<di.length&&imgs.length<3;c++){var im=di[c];var iw=im.naturalWidth,ih=im.naturalHeight,isrc=im.currentSrc||im.src;if(iw>=300&&ih>=300&&iw<=ih*3&&ih<=iw*3&&!/sprite/i.test(isrc))add(isrc)}}
var col="";for(var x2=0;x2<V.length&&!col;x2++)col=t(V[x2]&&V[x2].color);
if(!col){try{var sp=new URL(location.href).searchParams;col=sp.get("Color")||sp.get("color")||sp.get("Colour")||sp.get("colour")||""}catch(e){}}
var u=new URL(APP+"/");u.searchParams.set("add","1");u.searchParams.set("t",title.slice(0,${MAX_TITLE}));
u.searchParams.set("i",imgs[0]||"");if(imgs[1])u.searchParams.set("i2",imgs[1]);if(imgs[2])u.searchParams.set("i3",imgs[2]);
u.searchParams.set("p",price);u.searchParams.set("c",cur);u.searchParams.set("k",col);
u.searchParams.set("l",location.href.split(String.fromCharCode(35))[0].slice(0,1500));
var w=window.open(u.href,"_blank");if(!w)location.href=u.href})();`;
  return code.replace(/\s*\n\s*/g, '');
}

export function bookmarkletHref(appOrigin: string): string {
  return 'javascript:' + bookmarkletCode(appOrigin);
}

/** Shopify image urls often carry a thumbnail width; ask for a size worth keeping. */
function upsizeShopifyThumb(url: string): string {
  try {
    const u = new URL(url);
    const w = Number(u.searchParams.get('width'));
    if (u.pathname.includes('/cdn/shop/') && w > 0 && w < 800) {
      u.searchParams.set('width', '1200');
      u.searchParams.delete('height');
      return u.href;
    }
  } catch { /* leave the url as it came */ }
  return url;
}

/** Product data handed over by the bookmarklet, validated. null when the URL carries none. */
export function parsePrefill(search: string): Prefill | null {
  const q = new URLSearchParams(search);
  if (q.get('add') !== '1') return null;

  const link = safeHttpUrl(q.get('l') ?? '') ?? '';
  let host = '';
  try { host = link ? new URL(link).hostname : ''; } catch { /* no host: title is left as is */ }

  const images: string[] = [];
  for (const key of ['i', 'i2', 'i3']) {
    const raw = safeHttpUrl(q.get(key) ?? '');
    const url = raw && upsizeShopifyThumb(raw);
    if (url && !images.includes(url)) images.push(url);
  }

  const price = parsePriceInput(q.get('p') ?? '');
  const color = (q.get('k') ?? '').trim();

  return {
    title: cleanTitle((q.get('t') ?? '').trim().slice(0, MAX_TITLE), host),
    images,
    price: price ? String(price) : '',
    currency: /^[A-Za-z]{3}$/.test(q.get('c') ?? '') ? q.get('c')!.toUpperCase() : '',
    link,
    colorName: /^[A-Za-z][A-Za-z /&-]{0,39}$/.test(color) ? color : '',
  };
}
