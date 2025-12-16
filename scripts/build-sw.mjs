// scripts/build-sw.mjs
import fs from "fs";
import path from "path";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_apiKey,
  authDomain: process.env.NEXT_PUBLIC_authDomain,
  projectId: process.env.NEXT_PUBLIC_projectId,
  storageBucket: process.env.NEXT_PUBLIC_storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_messagingSenderId,
  appId: process.env.NEXT_PUBLIC_appId,
};

const templatePath = path.join(
  process.cwd(),
  "public/firebase-messaging-sw.template.js"
);

const outputPath = path.join(
  process.cwd(),
  "public/firebase-messaging-sw.js"
);

const template = fs.readFileSync(templatePath, "utf8");

const result = template.replace(
  "__FIREBASE_CONFIG__",
  JSON.stringify(firebaseConfig, null, 2)
);

fs.writeFileSync(outputPath, result);

console.log("✅ firebase-messaging-sw.js generated");
