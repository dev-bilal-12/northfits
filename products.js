/* =========================================================
   NORTH FITS — Products
   ---------------------------------------------------------
   AB KOI ADMIN PANEL / BACKEND NAHI HAI.
   Apne products YAHIN edit karo — yeh file kholo aur neeche
   objects copy-paste karke apna data likho.

   Ek product aise banta hai:

   {
     name: 'Product ka naam',                    // zaroori
     category: 'Trousers' ya 'Outfit',           // zaroori
     price: 2499,                                // zaroori (Rs.)
     oldPrice: 2999,                             // optional (sale price)
     colors: [ { name: 'Black', hex: '#111111' } ],   // at least 1
     sizes: ['30', '32', '34'],                  // at least 1
     new: false,                                 // true = "New" badge
     desc: 'Chhoti si description',              // optional
     images: ['uploads/trousers-1.jpg'],         // optional, 1-3 photos
     badge: { label: 'Hot', type: 'hot' },       // optional ('new' ya 'hot')
     insta: 'https://www.instagram.com/...',     // optional
     locations: ['trousers']                     // optional — neeche dekho
   }

   images: photo 'uploads/' folder mein dalo aur yeh likho:
           'uploads/aapki-photo.jpg'

   locations (optional): jahan jahan product dikhe.
     ['home']         → home page ki "New Arrivals" wali row
     ['new']          → New Arrivals page
     ['trousers']     → Trousers page
     ['outfits']      → Outfits page
     ['collections']  → Collections page
   Agaz yeh field mat likho to khud decide hoga (new → New Arrivals,
   Trousers → Trousers page, Outfit → Outfits page, Collections → hamesha).
   ========================================================= */

const NF_PRODUCTS = [
  {
    name: "Men's Baggy DryFit Relaxed Trouser",
    category: 'Trousers',
    price: 1700,
    oldPrice: 1900,
    visual: 'visual-fabric',
    colors: [
      { name: 'Beige / Cream', hex: '#C0B0A0' },
      { name: 'Dark Brown', hex: '#411900' },
      { name: 'Black', hex: '#000000' },
      { name: 'Grey', hex: '#c5c6c7' }
    ],
    sizes: ['28', '30', '32', '34', '36', '38'],
    new: true,
    desc: 'Baggy-fit mens trouser in premium dry-fit fabric — lightweight, breathable and quick-drying. Relaxed through the thigh with a straight drape for all-day comfort. Moisture-wicking stretch keeps you cool on the move.',
    locations: ['new', 'trousers', 'collections'],
    images: [
      'uploads/product1-1.jpg',
      'uploads/product1-2.jpg',
      'uploads/product1-3.jpg'
    ]
  }
];