# North Fits — Static Site Guide

> Ab ye store **SIRF FRONTEND** hai — koi backend/server, koi admin panel nahi.
> Ab **koi bhi hosting** chalegi (jo pehle backend wali thi woh ab nahi zaroori).

---

## ✅ Products kahan se add hote hain?

Products ab `products.js` file mein hain. File kholo, neeche wala format dekho
aur object copy karke apna product likho (naam, price, colors, sizes, photos).
Save karo → website par products aa jayenge.

- Photos ko `uploads/` folder mein dalo, phir `images: ['uploads/naam.jpg']` likho.
- Poora format `products.js` ke top comment mein likha hua hai.

Homepage ka text/cards `index.html` mein seedha edit hota hai.

---

## 🔢 Order numbers (NF0001, NF0002, …)

Har order ko website ek **sequential serial number** deti hai — bilkul
pehle wale system ki tarah, sab devices par ek hi sequence continue hota hai.

- Number ek **free online counter** se aata hai (restful-api.dev par rakha
  counter object) — koi apna backend nahi chalana parta.
- Agar internet/service na chalay, to browser **apna local counter** use
  karta hai — order kabhi atkta nahi.
- Order confirm hote hi customer ka **WhatsApp message** (order number ke
  saath) aapke paas aata hai — aapka record wohi hai.

---

## 🌍 Hosting (free, koi bhi option)

1. **Netlify Drop** (sabse asaan): https://app.netlify.com/drop — poori
   folder drag & drop karo → turant link milega.
2. **GitHub Pages** — repo settings → Pages → main branch.
3. **Vercel** — import karo, koi config nahi chahiye.
4. **File:// se bhi** — `index.html` double click karke browser mein khul jata hai.

Backend wale rules khatam — ab **static hosting kabhi dikkat nahi dega**.

---

## Checklist — deploy ke baad

- [ ] `index.html` khulti hai
- [ ] Products dikh rahe hain (Trousers / Outfits / Collections pages)
- [ ] Cart → Checkout chal raha hai
- [ ] Ek test order karo → order number `NF0001` dikhe aur WhatsApp message aaye
