// Operator CLI: provision a buyer/seller Business. Thin wrapper over the shared
// provisionBusiness() that the panel also uses.
//   pnpm provision-business <email> "<Business Name>" <buyer|seller|both>
import { provisionBusiness } from "../lib/provisioning.ts";

const [email, businessName, type] = process.argv.slice(2);
if (!email || !businessName || !["buyer", "seller", "both"].includes(type)) {
  console.error('usage: pnpm provision-business <email> "<Business Name>" <buyer|seller|both>');
  process.exit(1);
}

const res = await provisionBusiness({ email, businessName, type });
console.log(`provisioned "${businessName}" (${res.orgSlug}) — owner ${email} [${type}]`);
