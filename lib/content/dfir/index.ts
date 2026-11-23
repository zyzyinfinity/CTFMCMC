import { Technique } from "../types";
import { fileForensicsTechniques } from "./file-forensics";
import { networkForensicsTechniques } from "./network-forensics";
import { malwareForensicsTechniques } from "./malware-forensics";
import { memoryForensicsTechniques } from "./memory-forensics";
import { diskForensicsTechniques } from "./disk-forensics";
import { emailForensicsTechniques } from "./email-forensics";
import { logForensicsTechniques } from "./log-forensics";
import { incidentResponseTechniques } from "./incident-response";

export const dfirTechniques: Technique[] = [
  ...fileForensicsTechniques,
  ...networkForensicsTechniques,
  ...malwareForensicsTechniques,
  ...memoryForensicsTechniques,
  ...diskForensicsTechniques,
  ...emailForensicsTechniques,
  ...logForensicsTechniques,
  ...incidentResponseTechniques,
];
