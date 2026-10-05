import { cleanPrice } from './price';
import { safeHttpUrl } from './url';

export interface Prefill {
  title: string;
  image: string;
  price: string;
  /** ISO 4217 code such as AED; empty when the page did not say. */
  currency: string;
  link: string;
}

const MAX_TITLE = 200;

/**
 * Source of the "Add to Closett" bookmarklet. It runs inside the shop's own page,
 * in the user's real browser (so bot checks such as Zara's pass), reads the product
 * data from the page, and opens Closett with the values in the query string.
 * Single line, no comments, no '#' or '%': it must survive being a bookmark URL.
 */
export function bookmarkletCode(appOrigin: string): string {
  return [
    '(function(){var d=document,APP=', JSON.stringify(appOrigin), ';',
    'function m(s){for(var i=0;i<s.length;i++){var e=d.querySelector(s[i]);if(e){var v=e.getAttribute("content")||e.getAttribute("value")||e.textContent;if(v&&v.trim())return v.trim()}}return""}',
    'function pr(o){if(!o||typeof o!=="object")return"";if(Array.isArray(o)){for(var i=0;i<o.length;i++){var r=pr(o[i]);if(r)return r}return""}',
    'var p=o.price||o.lowPrice;if(p)return String(p);for(var k in o){if(o[k]&&typeof o[k]==="object"){var r2=pr(o[k]);if(r2)return r2}}return""}',
    'function cr(o){if(!o||typeof o!=="object")return"";if(Array.isArray(o)){for(var i=0;i<o.length;i++){var r=cr(o[i]);if(r)return r}return""}',
    'if(typeof o.priceCurrency==="string")return o.priceCurrency;for(var k in o){if(o[k]&&typeof o[k]==="object"){var r2=cr(o[k]);if(r2)return r2}}return""}',
    'var title=m(["meta[property=\\"og:title\\"]","meta[name=\\"twitter:title\\"]","h1"])||d.title||"";',
    'var image=m(["meta[property=\\"og:image\\"]","meta[name=\\"twitter:image\\"]","meta[itemprop=\\"image\\"]"]);',
    'try{image=new URL(image,location.href).href}catch(e){image=""}',
    'if(image.length>1500)image="";',
    'var price=m(["meta[property=\\"product:price:amount\\"]","meta[property=\\"og:price:amount\\"]","meta[itemprop=\\"price\\"]","meta[name=\\"price\\"]"]);',
    'if(!price){var s=d.querySelectorAll("script[type=\\"application/ld+json\\"]");for(var i=0;i<s.length&&!price;i++){try{price=pr(JSON.parse(s[i].textContent))}catch(e){}}}',
    'var cur=m(["meta[property=\\"product:price:currency\\"]","meta[property=\\"og:price:currency\\"]","meta[itemprop=\\"priceCurrency\\"]"]);',
    'if(!cur){var s2=d.querySelectorAll("script[type=\\"application/ld+json\\"]");for(var j=0;j<s2.length&&!cur;j++){try{cur=cr(JSON.parse(s2[j].textContent))}catch(e){}}}',
    'var u=new URL(APP+"/");u.searchParams.set("add","1");u.searchParams.set("t",title.slice(0,', String(MAX_TITLE), '));',
    'u.searchParams.set("i",image);u.searchParams.set("p",price);u.searchParams.set("c",cur);u.searchParams.set("l",location.href.split(String.fromCharCode(35))[0].slice(0,1500));',
    'var w=window.open(u.href,"_blank");if(!w)location.href=u.href})();',
  ].join('');
}

export function bookmarkletHref(appOrigin: string): string {
  return 'javascript:' + bookmarkletCode(appOrigin);
}

/** Product data handed over by the bookmarklet, validated. null when the URL carries none. */
export function parsePrefill(search: string): Prefill | null {
  const q = new URLSearchParams(search);
  if (q.get('add') !== '1') return null;
  return {
    title: (q.get('t') ?? '').trim().slice(0, MAX_TITLE),
    image: safeHttpUrl(q.get('i') ?? '') ?? '',
    price: cleanPrice(q.get('p') ?? ''),
    currency: /^[A-Za-z]{3}$/.test(q.get('c') ?? '') ? q.get('c')!.toUpperCase() : '',
    link: safeHttpUrl(q.get('l') ?? '') ?? '',
  };
}
