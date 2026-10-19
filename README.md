# Clinic website — HTML / CSS / JS

Open `index.html` in a browser. All files must stay in the same folder.

## Pages
| File | Page |
|---|---|
| index.html | Home |
| about.html | About us |
| services.html | All services (with category filter) |
| service-*.html | Single service pages (6 clinic treatments + 6 extra) |
| doctors.html | Doctors (click a card for the profile pop-up) |
| pricing.html | Membership plans (monthly/yearly toggle) + treatment prices |
| blog.html | Blog list (filter + load more + newsletter) |
| blog-post.html | Single blog post (reading bar, contents, share) |
| careers.html | Careers + open roles |
| contact.html | Contact info, map, appointment form |
| terms.html | Terms & conditions |
| privacy.html | Privacy policy |
| 404.html | Page not found |

Folder structure:
```
clinic-website/
├── index.html … (20 pages)
└── assets/
    ├── css/style.css   ← all styling, linked in every page
    ├── js/main.js      ← all animations & interactions, linked in every page
    └── images/         ← one folder per page (home/, about/, service-orthodontics/ …) + shared/
                          each folder's README.md lists the photos that page needs
```

Menu: Home · About · Services (mega menu, 9 services + All services) · Doctors · Blog · Contact · Pages (dropdown listing every page).

## Still to fill in
Search the project for `[FILL` to find every spot that needs real clinic information (doctor names & qualifications, treatment prices in PKR, membership plan amounts, Google rating, patient reviews, clinic history, payment methods). Also confirm the counters on the home and about pages (years, patients, specialists, % recommend).

## Swapping content
- **Images:** drop photos into `assets/images/<page>/` using the file names in that folder's README.md, then replace the matching `https://placehold.co/...` URL with the path, e.g. `assets/images/home/hero.jpg`.
- **Clinic name, phone, address, hours:** search for `Clinic Name`, `(000) 000-0000`, `Street address`, `hello@example.com`.
- **Colors:** edit the variables at the top of `assets/css/style.css` (`--teal`, `--lime`, `--cream`).
- **Menu and footer** are the same on every page — if you change one, change it in all pages.

## Before going live
- **Contact form & newsletter** only show a success message. Connect them to Formspree, Netlify Forms or your backend (marked in `assets/js/main.js`).
- **Map:** replace the map placeholder image in `contact.html` with your Google Maps `<iframe>`.
- **Blog:** every article card links to `blog-post.html`. Copy it per article (or move the blog to a CMS).
- **404:** set `404.html` as the error page on your host.

Libraries (loaded from CDN): GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13. Fonts: DM Sans + Instrument Serif (Google Fonts).
