# NairaVest

Structure:
- index.html — user interface
- admin.html — separate admin interface at `/admin.html`
- css/styles.css
- js/firebase.js
- js/app.js
- js/admin.js
- js/utils.js

Important:
This package preserves the requested demo user interface but does not claim that the investment returns or funding details are real.

The original design used custom Firestore authentication. That is not suitable for production because passwords should not be stored in a client-accessible Firestore collection. For a real financial service, use Firebase Authentication or a secure server-side authentication system and strict Firestore Security Rules.

The supplied Firebase configuration is retained because it was part of the source supplied for restructuring. Replace it with your own Firebase project configuration before deployment.

Admin:
- User interface: `index.html`
- Admin interface: `admin.html`
- The admin page is not linked from the user dashboard.
- A real secure admin system must enforce admin authorization in backend/Firestore Security Rules; hiding the link is not security.

Demo credentials:
The original request mentioned a demo account, but this build intentionally does NOT auto-create a publicly accessible admin demo account. Create an admin user through a secure setup process and set `isAdmin: true` server-side.


## ZIP layout
The ZIP is deliberately "flat": `index.html`, `admin.html`, `css/`, `js/`, and `README.md` are at the ZIP root. There is no enclosing `nairavest/` folder. After extracting, upload the extracted contents directly to the GitHub repository root.
