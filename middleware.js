const fs = require("fs");
const path = require("path");

module.exports = (req, res, next) => {
  if (
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "DELETE"
  ) {
    res.on("finish", () => {
      setTimeout(() => {
        const dbPath = path.join(__dirname, "db.json");
        // Forcer la lecture du fichier actuel depuis le disque
        try {
          const data = fs.readFileSync(dbPath, "utf8");
          const db = JSON.parse(data);
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
          console.log(`[Middleware] Persisté après ${req.method} ${req.url}`);
        } catch (err) {
          console.error(`[Middleware] Erreur : ${err.message}`);
        }
      }, 50); // Petit délai pour laisser json-server mettre à jour le fichier
    });
  }
  next();
};
