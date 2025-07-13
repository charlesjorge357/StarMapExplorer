const prefixes = [
  "Xan", "Zor", "Vel", "Kor", "Thal", "Om", "Syl", "Nar", "Kal", "Vyr", "Jov", "Cry", "Ser", "Ery", "Tor", "Vul",
  "Ky", "Ul", "Aer", "Dra", "Or", "Lun", "Ith", "Eli", "Ast", "Gal", "Sol", "Vor", "Ny"
];

const middles = [
  "a", "e", "i", "o", "u", "ar", "er", "ir", "or", "ur", "yth", "el", "on", "an", "os", "is", "en", "yl", "ia", "eth",
  "ax", "ex", "ix", "yx", "ul", "il", "yn", "ur", "or", "oth", "eth", "as"
];

const suffixes = [
  "ion", "is", "os", "ar", "eth", "or", "on", "ix", "ox", "al", "en", "us", "yn", "ir", "ax", "oth",
  "el", "ith", "eon", "eron", "aris", "anth", "oris", "eth", "al"
];

function pick<T>(arr: T[], forbidden: T[]): T {
  let choice: T;
  let attempts = 0;
  do {
    choice = arr[Math.floor(Math.random() * arr.length)];
    attempts++;
    if (attempts > 10) break; // Safety net
  } while (forbidden.includes(choice));
  return choice;
}

export function PlanetNameGenerator(): string {
  const used: string[] = [];

  const prefix = pick(prefixes, used);
  used.push(prefix);

  const includeMiddle = Math.random() > 0.5;
  const middle = includeMiddle ? pick(middles, used) : "";
  if (middle) used.push(middle);

  const suffix = pick(suffixes, used);
  used.push(suffix);

  const name = prefix + middle + suffix;
  return name;
}