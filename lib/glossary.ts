export type GlossaryLocale = "en" | "es";

export interface GlossaryEntry {
  en: string;
  es: string;
}

export const glossary: Record<string, GlossaryEntry> = {
  escrow: {
    en: "A financial arrangement where a neutral third party holds funds until agreed conditions are met.",
    es: "Un acuerdo financiero donde un tercero neutral retiene fondos hasta que se cumplan las condiciones acordadas.",
  },
  XLM: {
    en: "Stellar Lumens — the native cryptocurrency of the Stellar network used to pay transaction fees.",
    es: "Stellar Lumens: la criptomoneda nativa de la red Stellar utilizada para pagar las comisiones de transacción.",
  },
  Soroban: {
    en: "Stellar's smart contract platform enabling decentralised applications with low fees and fast execution.",
    es: "La plataforma de contratos inteligentes de Stellar que permite aplicaciones descentralizadas con comisiones bajas y ejecución rápida.",
  },
  Freighter: {
    en: "A browser wallet extension for the Stellar network used to sign and submit transactions.",
    es: "Una extensión de billetera para el navegador de la red Stellar utilizada para firmar y enviar transacciones.",
  },
  "gas fee": {
    en: "A small fee paid to process a transaction on a blockchain network.",
    es: "Una pequeña comisión que se paga para procesar una transacción en una red blockchain.",
  },
  "smart contract": {
    en: "Self-executing code stored on a blockchain that automatically enforces the terms of an agreement.",
    es: "Código autoejecutado almacenado en una blockchain que hace cumplir automáticamente los términos de un acuerdo.",
  },
  testnet: {
    en: "A test version of the blockchain where developers experiment without using real funds.",
    es: "Una versión de prueba de la blockchain donde los desarrolladores experimentan sin usar fondos reales.",
  },
};

export function getDefinition(
  term: string,
  locale: GlossaryLocale = "en"
): string | null {
  const entry = glossary[term];
  if (!entry) return null;
  return entry[locale] ?? entry.en;
}
