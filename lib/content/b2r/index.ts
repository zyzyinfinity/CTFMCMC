import { Technique } from "../types";
import { enumerationTechniques } from "./enumeration";
import { webExploitationTechniques } from "./web-exploitation";
import { initialAccessTechniques } from "./initial-access";
import { privescLinuxTechniques } from "./privesc-linux";
import { privescWindowsTechniques } from "./privesc-windows";
import { credentialAttacksTechniques } from "./credential-attacks";
import { otherB2rTechniques } from "./other-b2r";

export const b2rTechniques: Technique[] = [
  ...enumerationTechniques,
  ...webExploitationTechniques,
  ...initialAccessTechniques,
  ...privescLinuxTechniques,
  ...privescWindowsTechniques,
  ...credentialAttacksTechniques,
  ...otherB2rTechniques,
];
